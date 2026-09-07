import { createClient } from '@libsql/client';
import { createHash } from 'node:crypto';

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

function getSessionToken(req) {
  const cookieHeader = String(req.headers.cookie || '');
  const cookies = cookieHeader.split(';');

  for (const item of cookies) {
    const [rawName, ...rawValue] = item.trim().split('=');
    if (rawName === 'oio_session') {
      return decodeURIComponent(rawValue.join('='));
    }
  }

  return null;
}

function hasForceLoginCookie(req) {
  const cookieHeader = String(req.headers.cookie || '');
  return cookieHeader.split(';').some(item => item.trim().startsWith('oio_force_login='));
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    'oio_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax'
  );
}

function clearForceLoginCookie(res) {
  res.setHeader(
    'Set-Cookie',
    'oio_force_login=; Max-Age=0; Path=/; Secure; SameSite=Lax'
  );
}

function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    if (hasForceLoginCookie(req)) {
      clearForceLoginCookie(res);
      return res.status(401).json({ authenticated: false, reason: 'login_required' });
    }

    const sessionToken = getSessionToken(req);

    if (!sessionToken) {
      return res.status(401).json({ authenticated: false });
    }

    const tokenHash = hashSessionToken(sessionToken);
    const now = Date.now();
    const db = getClient();

    const result = await db.execute({
      sql: `
        SELECT
          s.id AS session_id,
          s.account_id,
          s.expires_at,
          s.revoked_at,
          a.email,
          a.status,
          p.display_name,
          p.avatar_url,
          p.avatar_public_id
        FROM sessions s
        JOIN accounts a ON a.id = s.account_id
        JOIN profiles p ON p.account_id = a.id
        WHERE s.token_hash = ?
        LIMIT 1
      `,
      args: [tokenHash]
    });

    const session = result.rows[0];

    if (
      !session ||
      session.revoked_at !== null ||
      Number(session.expires_at) <= now ||
      String(session.status) !== 'active'
    ) {
      clearSessionCookie(res);
      return res.status(401).json({ authenticated: false });
    }

    await db.execute({
      sql: `UPDATE sessions SET last_seen_at = ? WHERE id = ?`,
      args: [now, session.session_id]
    });

    return res.status(200).json({
      authenticated: true,
      account: {
        oio_id: session.account_id,
        email: session.email,
        nome: session.display_name,
        avatar_url: session.avatar_url || null,
        avatar_public_id: session.avatar_public_id || null
      },
      session: {
        expires_at: Number(session.expires_at)
      }
    });
  } catch (error) {
    console.error('OIO ID session error:', error);
    return res.status(500).json({
      error: 'Não foi possível verificar a sessão.'
    });
  }
}
