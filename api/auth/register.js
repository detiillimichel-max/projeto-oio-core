import { createClient } from '@libsql/client';
import { randomBytes, randomUUID, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

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

function normalizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 80);
}

function generateOioId() {
  return `oio_${randomBytes(12).toString('hex')}`;
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024
  });

  return `scrypt$16384$8$1$${salt}$${Buffer.from(derivedKey).toString('hex')}`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const nome = normalizeName(body.nome);
    const email = normalizeEmail(body.email);
    const senha = String(body.senha || '');

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório.' });
    }

    if (nome.length < 2) {
      return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres.' });
    }

    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    if (senha.length < 8 || senha.length > 128) {
      return res.status(400).json({ error: 'A senha deve ter entre 8 e 128 caracteres.' });
    }

    const db = getClient();

    // A migration é a fonte oficial do schema. Esta API não cria tabelas automaticamente.
    const schemaCheck = await db.execute(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('accounts', 'credentials', 'profiles', 'auth_events')`);
    const tables = new Set(schemaCheck.rows.map(row => String(row.name)));

    if (tables.size !== 4) {
      return res.status(503).json({ error: 'OIO ID ainda não está preparado no banco Turso.' });
    }

    const accountId = generateOioId();
    const now = Date.now();
    const passwordHash = await hashPassword(senha);

    try {
      await db.batch([
        {
          sql: `INSERT INTO accounts (id, email, status, created_at, updated_at) VALUES (?, ?, 'active', ?, ?)`,
          args: [accountId, email, now, now]
        },
        {
          sql: `INSERT INTO credentials (account_id, password_hash, password_updated_at) VALUES (?, ?, ?)`,
          args: [accountId, passwordHash, now]
        },
        {
          sql: `INSERT INTO profiles (account_id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?)`,
          args: [accountId, nome, now, now]
        },
        {
          sql: `INSERT INTO auth_events (account_id, event_type, user_agent, created_at) VALUES (?, 'register_success', ?, ?)`,
          args: [accountId, String(req.headers['user-agent'] || '').slice(0, 500), now]
        }
      ], 'write');
    } catch (error) {
      if (String(error?.message || '').toLowerCase().includes('unique') || String(error?.message || '').toLowerCase().includes('constraint')) {
        return res.status(409).json({ error: 'Este e-mail já possui um OIO ID.' });
      }
      throw error;
    }

    return res.status(201).json({
      ok: true,
      account: {
        oio_id: accountId,
        email,
        nome
      }
    });
  } catch (error) {
    console.error('OIO ID register error:', error);
    return res.status(500).json({
      error: 'Não foi possível criar o OIO ID.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
