import { createClient } from '@libsql/client';
import webpush from 'web-push';

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
      texto TEXT NOT NULL DEFAULT '',
      data INTEGER NOT NULL,
      media_url TEXT,
      media_public_id TEXT,
      media_type TEXT,
      media_duration REAL
    )
  `);

  const columns = await db.execute(`PRAGMA table_info(chat_geral)`);
  const existing = new Set(columns.rows.map(row => String(row.name)));

  const additions = [
    ['media_url', 'TEXT'],
    ['media_public_id', 'TEXT'],
    ['media_type', 'TEXT'],
    ['media_duration', 'REAL']
  ];

  for (const [name, type] of additions) {
    if (!existing.has(name)) {
      await db.execute(`ALTER TABLE chat_geral ADD COLUMN ${name} ${type}`);
    }
  }

  await db.execute(`CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    autor TEXT NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    data INTEGER NOT NULL
  )`);
}

function pushConfigured() {
  return Boolean(process.env.OIO_VAPID_PUBLIC_KEY && process.env.OIO_VAPID_PRIVATE_KEY);
}

async function enviarNotificacoesPush(db, message) {
  if (!pushConfigured()) return;
  try {
    webpush.setVapidDetails(
      process.env.OIO_VAPID_SUBJECT || 'https://projeto-oio-core.vercel.app/',
      process.env.OIO_VAPID_PUBLIC_KEY,
      process.env.OIO_VAPID_PRIVATE_KEY
    );

    const result = await db.execute(`SELECT id, autor, endpoint, p256dh, auth FROM push_subscriptions WHERE autor != ?`, [message.autor]);
    const bodyText = message.texto || (String(message.media_type || '').startsWith('image/') ? '📷 Foto recebida' : '🎙️ Áudio recebido');
    const payload = JSON.stringify({
      title: `OIO • ${message.autor}`,
      body: bodyText.slice(0, 180),
      messageId: message.id,
      url: 'teste.html'
    });

    await Promise.all(result.rows.map(async row => {
      const subscription = {
        endpoint: String(row.endpoint),
        keys: { p256dh: String(row.p256dh), auth: String(row.auth) }
      };
      try {
        await webpush.sendNotification(subscription, payload, { TTL: 60 * 60 * 24 });
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await db.execute(`DELETE FROM push_subscriptions WHERE id = ?`, [Number(row.id)]);
        } else {
          console.error('OIO push delivery error:', error.statusCode || error.message);
        }
      }
    }));
  } catch (error) {
    console.error('OIO push setup error:', error.message);
  }
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
            sql: `SELECT c.id, c.autor, c.texto, c.data, c.media_url, c.media_public_id, c.media_type, c.media_duration, p.avatar_url AS autor_avatar_url FROM chat_geral c LEFT JOIN profiles p ON p.display_name = c.autor WHERE c.id > ? ORDER BY c.id ASC LIMIT ?`,
            args: [since, limit]
          })
        : await db.execute({
            sql: `SELECT c.id, c.autor, c.texto, c.data, c.media_url, c.media_public_id, c.media_type, c.media_duration, p.avatar_url AS autor_avatar_url FROM chat_geral c LEFT JOIN profiles p ON p.display_name = c.autor ORDER BY c.id DESC LIMIT ?`,
            args: [limit]
          });

      const rows = result.rows.map(row => ({
        id: Number(row.id),
        autor: String(row.autor),
        texto: String(row.texto || ''),
        data: Number(row.data),
        media_url: row.media_url ? String(row.media_url) : null,
        media_public_id: row.media_public_id ? String(row.media_public_id) : null,
        media_type: row.media_type ? String(row.media_type) : null,
        media_duration: row.media_duration == null ? null : Number(row.media_duration),
        autor_avatar_url: row.autor_avatar_url ? String(row.autor_avatar_url) : null
      }));

      if (!since) rows.reverse();
      return res.status(200).json({ messages: rows });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const autor = String(body.autor || '').trim().slice(0, 80);
    const texto = String(body.texto || '').trim().slice(0, 4000);
    const mediaUrl = String(body.media_url || '').trim().slice(0, 2000);
    const mediaPublicId = String(body.media_public_id || '').trim().slice(0, 500);
    const mediaType = String(body.media_type || '').trim().slice(0, 80);
    const mediaDuration = Number(body.media_duration);

    if (!autor || (!texto && !mediaUrl)) {
      return res.status(400).json({ error: 'autor e texto ou áudio são obrigatórios.' });
    }

    const data = Date.now();
    const result = await db.execute({
      sql: `INSERT INTO chat_geral (autor, texto, data, media_url, media_public_id, media_type, media_duration) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        autor,
        texto,
        data,
        mediaUrl || null,
        mediaPublicId || null,
        mediaType || null,
        Number.isFinite(mediaDuration) ? mediaDuration : null
      ]
    });

    const message = {
      id: Number(result.lastInsertRowid),
      autor,
      texto,
      data,
      media_url: mediaUrl || null,
      media_public_id: mediaPublicId || null,
      media_type: mediaType || null,
      media_duration: Number.isFinite(mediaDuration) ? mediaDuration : null
    };

    await enviarNotificacoesPush(db, message);
    return res.status(201).json({ message });
  } catch (error) {
    console.error('Turso chat error:', error);
    return res.status(500).json({
      error: 'Falha no banco Turso.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
