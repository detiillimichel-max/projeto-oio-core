import { createClient } from '@libsql/client';
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

const SESSION_DAYS = 30;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

let client;

function getClient() {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error('TURSO_DATABASE_URL/TURSO_AUTH_TOKEN não configurados na Vercel.');
  }

  client = createClient({ url, authToken });
  return client;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function verifyPassword(password, storedHash) {
  const parts = String(storedHash || '').split('$');

  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return false;
  }

  const [, n, r, p, salt, expectedHex] = parts;
  const N = Number(n);
  const R = Number(r);
  const P = Number(p);

  if (!Number.isInteger(N) || !Number.isInteger(R) || !Number.isInteger(P)) {
    return false;
  }

  if (!salt || !/^[0-9a-f]+$/i.test(expectedHex) || expectedHex.length !== 128) {
    return false;
  }

  try {
    const derivedKey = await scrypt(password, salt, 64, {
      N,
      r: R,
      p: P,
      maxmem: 32 * 1024 * 1024
    });

    const expected = Buffer.from(expectedHex, 'hex');
    const actual = Buffer.from(derivedKey);

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function setSessionCookie(res, token, maxAgeSeconds) {
  res.setHeader(
    'Set-Cookie',
    `oio_session=${encodeURIComponent(token)}; Max-Age=${maxAgeSeconds}; Path=/; HttpOnly; Secure; SameSite=Lax`
  );
}

function getRequestIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || String(req.socket?.remoteAddress || '');
}

function hashIp(ip) {
  if (!ip) return null;
  return createHash('sha256').update(ip).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const email = normalizeEmail(body.email);
    const senha = String(body.senha || '');

    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !senha) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const db = getClient();
    const now = Date.now();

    const result = await db.execute({
      sql: `
        SELECT
          a.id,
          a.email,
          a.status,
          p.display_name,
          c.password_hash,
          c.failed_attempts,
          c.locked_until
        FROM accounts a
        JOIN credentials c ON c.account_id = a.id
        JOIN profiles p ON p.account_id = a.id
        WHERE a.email = ?
        LIMIT 1
      `,
      args: [email]
    });

    const account = result.rows[0];

    // Resposta genérica evita revelar se o e-mail existe.
    if (!account) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    if (String(account.status) !== 'active') {
      return res.status(403).json({ error: 'Esta conta não está disponível para login.' });
    }

    const lockedUntil = Number(account.locked_until || 0);
    if (lockedUntil > now) {
      return res.status(429).json({
        error: 'Muitas tentativas. Tente novamente mais tarde.',
        retry_after_seconds: Math.ceil((lockedUntil - now) / 1000)
      });
    }

    const validPassword = await verifyPassword(senha, account.password_hash);

    if (!validPassword) {
      const failedAttempts = Number(account.failed_attempts || 0) + 1;
      const shouldLock = failedAttempts >= MAX_FAILED_ATTEMPTS;
      const nextLockedUntil = shouldLock ? now + LOCK_MINUTES * 60 * 1000 : null;

      await db.execute({
        sql: `UPDATE credentials SET failed_attempts = ?, locked_until = ? WHERE account_id = ?`,
        args: [shouldLock ? 0 : failedAttempts, nextLockedUntil, account.id]
      });

      await db.execute({
        sql: `INSERT INTO auth_events (account_id, event_type, ip_hash, user_agent, created_at) VALUES (?, 'login_failed', ?, ?, ?)`,
        args: [
          account.id,
          hashIp(getRequestIp(req)),
          String(req.headers['user-agent'] || '').slice(0, 500),
          now
        ]
      });

      if (shouldLock) {
        return res.status(429).json({
          error: 'Muitas tentativas. Tente novamente mais tarde.',
          retry_after_seconds: LOCK_MINUTES * 60
        });
      }

      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const sessionId = randomUUID();
    const sessionToken = randomBytes(32).toString('base64url');
    const tokenHash = hashSessionToken(sessionToken);
    const expiresAt = now + SESSION_DAYS * 24 * 60 * 60 * 1000;
    const userAgent = String(req.headers['user-agent'] || '').slice(0, 500);

    await db.batch([
      {
        sql: `UPDATE credentials SET failed_attempts = 0, locked_until = NULL WHERE account_id = ?`,
        args: [account.id]
      },
      {
        sql: `INSERT INTO sessions (id, account_id, token_hash, user_agent, created_at, expires_at, last_seen_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
        args: [sessionId, account.id, tokenHash, userAgent, now, expiresAt, now]
      },
      {
        sql: `INSERT INTO auth_events (account_id, event_type, ip_hash, user_agent, created_at) VALUES (?, 'login_success', ?, ?, ?)`,
        args: [account.id, hashIp(getRequestIp(req)), userAgent, now]
      }
    ], 'write');

    setSessionCookie(res, sessionToken, SESSION_DAYS * 24 * 60 * 60);

    return res.status(200).json({
      ok: true,
      account: {
        oio_id: account.id,
        email: account.email,
        nome: account.display_name
      }
    });
  } catch (error) {
    console.error('OIO ID login error:', error);
    return res.status(500).json({
      error: 'Não foi possível realizar o login.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
