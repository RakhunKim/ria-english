/**
 * Vercel API Route — remove.bg 프록시
 * POST /api/rmbg
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST')    { res.status(405).end('Method Not Allowed'); return; }

  const body = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end',  () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  const apiKey = req.headers['x-api-key'] || '';
  const ct     = req.headers['content-type'] || '';

  const rmbgRes = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'Content-Type': ct,
      'X-Api-Key':    apiKey,
    },
    body,
  });

  const buf = Buffer.from(await rmbgRes.arrayBuffer());
  res.status(rmbgRes.status);
  res.setHeader('Content-Type', rmbgRes.headers.get('content-type') || 'image/png');
  res.send(buf);
}
