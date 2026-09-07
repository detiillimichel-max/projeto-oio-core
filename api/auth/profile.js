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
  for (const item of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = item.trim().split('=');
    if (rawName === 'oio_session') return decodeURIComponent(rawValue.join('='));
  }
  return null;
}

function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function getAuthenticatedAccount(db, req) {
  const token = getSessionToken(req);
  if (!token) return null;

  const result = await db.execute({
    sql: `
      SELECT s.id AS session_id, s.account_id, s.expires_at, s.revoked_at,
             a.status
      FROM sessions s
      JOIN accounts a ON a.id = s.account_id
      WHERE s.token_hash = ?
      LIMIT 1
    `,
    args: [hashSessionToken(token)]
  });

  const session = result.rows[0];
  const now = Date.now();

  if (
    !session ||
    session.revoked_at !== null ||
    Number(session.expires_at) <= now ||
    String(session.status) !== 'active'
  ) {
    return null;
  }

  await db.execute({
    sql: `UPDATE sessions SET last_seen_at = ? WHERE id = ?`,
    args: [now, session.session_id]
  });

  return String(session.account_id);
}

function isAllowedCloudinaryUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'res.cloudinary.com' &&
      url.pathname.startsWith('/hmnhqfco/image/upload/')
    );
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const db = getClient();
    const accountId = await getAuthenticatedAccount(db, req);

    if (!accountId) {
      return res.status(401).json({ error: 'Sessão OIO ID inválida ou expirada.' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const avatarUrl = String(body.avatar_url || '').trim().slice(0, 2000);
    const avatarPublicId = String(body.avatar_public_id || '').trim().slice(0, 500);

    if (!avatarUrl || !avatarPublicId) {
      return res.status(400).json({ error: 'avatar_url e avatar_public_id são obrigatórios.' });
    }

    if (!isAllowedCloudinaryUrl(avatarUrl)) {
      return res.status(400).json({ error: 'A imagem precisa estar no Cloudinary oficial do OIO Core.' });
    }

    const now = Date.now();
    await db.execute({
      sql: `
        UPDATE profiles
        SET avatar_url = ?, avatar_public_id = ?, updated_at = ?
        WHERE account_id = ?
      `,
      args: [avatarUrl, avatarPublicId, now, accountId]
    });

    const result = await db.execute({
      sql: `SELECT display_name, avatar_url, avatar_public_id FROM profiles WHERE account_id = ? LIMIT 1`,
      args: [accountId]
    });

    const profile = result.rows[0];
    if (!profile) {
      return res.status(404).json({ error: 'Perfil OIO ID não encontrado.' });
    }

    return res.status(200).json({
      success: true,
      profile: {
        nome: String(profile.display_name),
        avatar_url: profile.avatar_url ? String(profile.avatar_url) : null,
        avatar_public_id: profile.avatar_public_id ? String(profile.avatar_public_id) : null
      }
    });
  } catch (error) {
    console.error('OIO ID profile error:', error);
    return res.status(500).json({ error: 'Não foi possível salvar o perfil.' });
  }
}
