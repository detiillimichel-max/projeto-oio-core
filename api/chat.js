import { createClient } from '@libsql/client';

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

async function ensureSchema(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS chat_geral (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      autor TEXT NOT NULL,
      texto TEXT NOT NULL,
      data INTEGER NOT NULL
    )
  `);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const db = getClient();
    await ensureSchema(db);

    if (req.method === 'GET') {
      const limit = Math.min(Math.max(Number(req.query?.limit) || 30, 1), 100);
      const since = Math.max(Number(req.query?.since) || 0, 0);
      const result = since
        ? await db.execute({
            sql: `SELECT id, autor, texto, data FROM chat_geral WHERE id > ? ORDER BY id ASC LIMIT ?`,
            args: [since, limit]
          })
        : await db.execute({
            sql: `SELECT id, autor, texto, data FROM chat_geral ORDER BY id DESC LIMIT ?`,
            args: [limit]
          });

      const rows = result.rows.map(row => ({
        id: Number(row.id),
        autor: String(row.autor),
        texto: String(row.texto),
        data: Number(row.data)
      }));

      if (!since) rows.reverse();
      return res.status(200).json({ messages: rows });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const autor = String(body.autor || '').trim().slice(0, 80);
    const texto = String(body.texto || '').trim().slice(0, 4000);

    if (!autor || !texto) {
      return res.status(400).json({ error: 'autor e texto são obrigatórios.' });
    }

    const data = Date.now();
    const result = await db.execute({
      sql: `INSERT INTO chat_geral (autor, texto, data) VALUES (?, ?, ?)`,
      args: [autor, texto, data]
    });

    return res.status(201).json({
      message: { id: Number(result.lastInsertRowid), autor, texto, data }
    });
  } catch (error) {
    console.error('Turso chat error:', error);
    return res.status(500).json({
      error: 'Falha no banco Turso.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
