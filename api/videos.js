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
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      public_id TEXT NOT NULL,
      descricao TEXT NOT NULL DEFAULT '',
      autor TEXT NOT NULL DEFAULT 'Michel',
      duracao REAL NOT NULL,
      tamanho INTEGER NOT NULL,
      formato TEXT,
      status TEXT NOT NULL DEFAULT 'publicado',
      created_at INTEGER NOT NULL
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_videos_status_created_at
    ON videos (status, created_at DESC)
  `);
}

function getAdminPassword(req, body = {}) {
  const headerPassword = req.headers['x-oio-video-admin'];
  return String(headerPassword || body.admin_password || '');
}

function isAuthorized(req, body) {
  const configured = String(process.env.OIO_VIDEO_ADMIN_PASSWORD || '');
  if (!configured) return false;
  return getAdminPassword(req, body) === configured;
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
      const result = await db.execute(`
        SELECT id, url, public_id, descricao, autor, duracao, tamanho, formato, status, created_at
        FROM videos
        WHERE status = 'publicado'
        ORDER BY created_at DESC
        LIMIT 10
      `);

      const videos = result.rows.map(row => ({
        id: Number(row.id),
        url: String(row.url),
        public_id: String(row.public_id),
        descricao: String(row.descricao || ''),
        autor: String(row.autor || 'Michel'),
        duracao: Number(row.duracao),
        tamanho: Number(row.tamanho),
        formato: row.formato ? String(row.formato) : null,
        status: String(row.status),
        created_at: Number(row.created_at)
      }));

      return res.status(200).json({ videos });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    if (!isAuthorized(req, body)) {
      return res.status(401).json({ error: 'Não autorizado para publicar vídeos.' });
    }

    const countResult = await db.execute(`
      SELECT COUNT(*) AS total FROM videos WHERE status = 'publicado'
    `);
    const total = Number(countResult.rows[0]?.total || 0);

    if (total >= 10) {
      return res.status(409).json({ error: 'O limite de 10 vídeos publicados já foi atingido.' });
    }

    const url = String(body.url || '').trim().slice(0, 2000);
    const publicId = String(body.public_id || '').trim().slice(0, 500);
    const descricao = String(body.descricao || '').trim().slice(0, 100);
    const autor = String(body.autor || 'Michel').trim().slice(0, 80) || 'Michel';
    const duracao = Number(body.duracao);
    const tamanho = Number(body.tamanho);
    const formato = String(body.formato || '').trim().slice(0, 30);

    if (!url || !publicId) {
      return res.status(400).json({ error: 'url e public_id são obrigatórios.' });
    }
    if (!Number.isFinite(duracao) || duracao <= 0 || duracao > 30) {
      return res.status(400).json({ error: 'A duração deve ser maior que 0 e no máximo 30 segundos.' });
    }
    if (!Number.isFinite(tamanho) || tamanho <= 0 || tamanho > 30 * 1024 * 1024) {
      return res.status(400).json({ error: 'O vídeo deve ter no máximo 30 MB.' });
    }

    const createdAt = Date.now();
    const result = await db.execute({
      sql: `
        INSERT INTO videos
          (url, public_id, descricao, autor, duracao, tamanho, formato, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'publicado', ?)
      `,
      args: [url, publicId, descricao, autor, duracao, Math.round(tamanho), formato || null, createdAt]
    });

    return res.status(201).json({
      video: {
        id: Number(result.lastInsertRowid),
        url,
        public_id: publicId,
        descricao,
        autor,
        duracao,
        tamanho: Math.round(tamanho),
        formato: formato || null,
        status: 'publicado',
        created_at: createdAt
      }
    });
  } catch (error) {
    console.error('Turso videos error:', error);
    return res.status(500).json({
      error: 'Falha no banco Turso.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
