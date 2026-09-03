import webpush from 'web-push';
import { createClient } from '@libsql/client';

let client;
function getClient() {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) throw new Error('TURSO_DATABASE_URL/TURSO_AUTH_TOKEN não configurados.');
  client = createClient({ url, authToken });
  return client;
}

function configureVapid() {
  const subject = process.env.OIO_VAPID_SUBJECT || 'https://projeto-oio-core.vercel.app/';
  const publicKey = process.env.OIO_VAPID_PUBLIC_KEY;
  const privateKey = process.env.OIO_VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error('OIO_VAPID_PUBLIC_KEY/OIO_VAPID_PRIVATE_KEY não configurados.');
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return publicKey;
}

async function ensureSchema(db) {
  await db.execute(`CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    autor TEXT NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    data INTEGER NOT NULL
  )`);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const db = getClient();
    await ensureSchema(db);

    if (req.method === 'GET') {
      return res.status(200).json({ publicKey: configureVapid(db) });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
    configureVapid();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const autor = String(body.autor || '').trim().slice(0, 80);
    const subscription = body.subscription || {};
    const endpoint = String(subscription.endpoint || '').trim().slice(0, 2000);
    const p256dh = String(subscription.keys?.p256dh || '').trim();
    const auth = String(subscription.keys?.auth || '').trim();
    if (!autor || !endpoint || !p256dh || !auth) return res.status(400).json({ error: 'Assinatura inválida.' });

    await db.execute({
      sql: `INSERT INTO push_subscriptions (autor, endpoint, p256dh, auth, data) VALUES (?, ?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET autor=excluded.autor, p256dh=excluded.p256dh, auth=excluded.auth, data=excluded.data`,
      args: [autor, endpoint, p256dh, auth, Date.now()]
    });
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error('OIO push error:', error);
    return res.status(500).json({ error: 'Falha ao configurar notificações.' });
  }
}

export { getClient, ensureSchema, configureVapid };
