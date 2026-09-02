import { createClient } from '@libsql/client';
import crypto from 'node:crypto';

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

async function apagarCloudinaryVideo(publicId) {
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || 'hmnhqfco');
  const apiKey = String(process.env.CLOUDINARY_API_KEY || '');
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || '');

  if (!apiKey || !apiSecret) {
    throw new Error('CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET não configurados na Vercel.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signatureBase = `invalidate=true&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha1').update(signatureBase + apiSecret).digest('hex');

  const formData = new URLSearchParams();
  formData.set('public_id', publicId);
  formData.set('timestamp', String(timestamp));
  formData.set('invalidate', 'true');
  formData.set('api_key', apiKey);
  formData.set('signature', signature);

  const resposta = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/destroy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData
  });

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(dados?.error?.message || `Cloudinary retornou HTTP ${resposta.status}.`);
  }

  if (dados.result !== 'ok' && dados.result !== 'not found') {
    throw new Error('Cloudinary não confirmou a exclusão do vídeo.');
  }

  return dados.result;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
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
      return res.status(401).json({ error: 'Não autorizado para gerenciar vídeos.' });
    }

    if (req.method === 'DELETE') {
      const id = Number(body.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID do vídeo inválido.' });
      }

      const result = await db.execute({
        sql: `SELECT id, public_id FROM videos WHERE id = ? AND status = 'publicado' LIMIT 1`,
        args: [id]
      });
      const video = result.rows[0];

      if (!video) {
        return res.status(404).json({ error: 'Vídeo não encontrado ou já excluído.' });
      }

      const publicId = String(video.public_id || '').trim();
      if (!publicId) {
        return res.status(400).json({ error: 'O vídeo não possui public_id para exclusão segura.' });
      }

      const cloudinaryResult = await apagarCloudinaryVideo(publicId);

      await db.execute({
        sql: `DELETE FROM videos WHERE id = ?`,
        args: [id]
      });

      return res.status(200).json({
        success: true,
        cloudinary_result: cloudinaryResult,
        id
      });
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
      error: 'Falha no gerenciamento de vídeos.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
