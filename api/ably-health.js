export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const apiKey = String(process.env.ABLY_API_KEY || '').trim();

  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      error: 'ABLY_API_KEY não está configurada na Vercel.'
    });
  }

  const separator = apiKey.indexOf(':');
  if (separator <= 0 || separator === apiKey.length - 1) {
    return res.status(500).json({
      ok: false,
      error: 'ABLY_API_KEY está em formato inválido.'
    });
  }

  const keyName = apiKey.slice(0, separator);
  const keySecret = apiKey.slice(separator + 1);
  const capability = JSON.stringify({
    'oio-validation': ['subscribe']
  });
  const timestamp = Date.now();

  try {
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
          ttl: 60000,
          capability,
          timestamp
        })
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error('Ably health check failed:', response.status, detail.slice(0, 500));
      return res.status(502).json({
        ok: false,
        error: 'A Vercel não conseguiu autenticar com a Ably.',
        ably_status: response.status
      });
    }

    const tokenDetails = await response.json();

    return res.status(200).json({
      ok: true,
      service: 'ably',
      key_configured: true,
      key_name: tokenDetails.keyName || keyName,
      token_issued: Boolean(tokenDetails.token),
      expires: tokenDetails.expires || null
    });
  } catch (error) {
    console.error('Ably health check error:', error);
    return res.status(502).json({
      ok: false,
      error: 'Não foi possível alcançar a Ably a partir da Vercel.'
    });
  }
}
