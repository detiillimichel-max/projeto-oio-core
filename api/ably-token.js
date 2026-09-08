import { createClient } from '@libsql/client';
import { createHash } from 'node:crypto';

let client;

const TOKEN_TTL_MS = 10 * 60 * 1000;
const CHANNEL_PREFIX = 'oio:typing:';

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
    if (rawName === 'oio_session') {
      return decodeURIComponent(rawValue.join('='));
    }
  }

  return null;
}

function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function getAuthenticatedAccount(req) {
  const sessionToken = getSessionToken(req);
  if (!sessionToken) return null;

  const db = getClient();
  const tokenHash = hashSessionToken(sessionToken);
  const now = Date.now();

  const result = await db.execute({
    sql: `
      SELECT
        s.account_id,
        s.expires_at,
        s.revoked_at,
        a.status
      FROM sessions s
      JOIN accounts a ON a.id = s.account_id
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
    return null;
  }

  return String(session.account_id);
}

function sanitizeId(value) {
  return String(value || '').trim().slice(0, 128);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const apiKey = String(process.env.ABLY_API_KEY || '').trim();

    if (!apiKey) {
      return res.status(500).json({
        error: 'ABLY_API_KEY não está configurada na Vercel.'
      });
    }

    const myOioId = await getAuthenticatedAccount(req);

    if (!myOioId) {
      return res.status(401).json({
        authenticated: false,
        error: 'Sessão OIO ID inválida ou expirada.'
      });
    }

    const recipientOioId = sanitizeId(req.query?.recipient);

    if (!recipientOioId) {
      return res.status(400).json({
        error: 'recipient é obrigatório.'
      });
    }

    if (recipientOioId === myOioId) {
      return res.status(400).json({
        error: 'O destinatário precisa ser diferente do remetente.'
      });
    }

    const separator = apiKey.indexOf(':');
    if (separator <= 0 || separator === apiKey.length - 1) {
      return res.status(500).json({
        error: 'ABLY_API_KEY está em formato inválido.'
      });
    }

    const keyName = apiKey.slice(0, separator);
    const keySecret = apiKey.slice(separator + 1);

    // Cada usuário recebe um canal de entrada privado para eventos de digitação.
    // O cliente atual pode PUBLICAR somente no canal do destinatário informado
    // e pode ASSINAR somente no próprio canal de entrada.
    const ownChannel = `${CHANNEL_PREFIX}${myOioId}`;
    const recipientChannel = `${CHANNEL_PREFIX}${recipientOioId}`;
    const capability = JSON.stringify({
      [ownChannel]: ['subscribe'],
      [recipientChannel]: ['publish']
    });

    const timestamp = Date.now();
    const nonce = `${timestamp}-${crypto.randomUUID()}`;

    const response = await fetch(
      `https://main.realtime.ably.net/keys/${encodeURIComponent(keyName)}/requestToken`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyName}:${keySecret}`).toString('base64')}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          keyName,
          ttl: TOKEN_TTL_MS,
          capability,
          clientId: myOioId,
          timestamp,
          nonce
        })
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error('Ably token request failed:', response.status, detail.slice(0, 500));
      return res.status(502).json({
        error: 'A Vercel não conseguiu emitir o token Ably.',
        ably_status: response.status
      });
    }

    const tokenDetails = await response.json();

    return res.status(200).json({
      token: tokenDetails.token,
      clientId: myOioId,
      expires: tokenDetails.expires,
      channel: recipientChannel,
      subscribeChannel: ownChannel
    });
  } catch (error) {
    console.error('Ably token error:', error);
    return res.status(500).json({
      error: 'Não foi possível emitir o token Ably.'
    });
  }
}
