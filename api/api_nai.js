/**
 * Vercel API Route — NAI 프록시
 * POST /api/nai
 */

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST')    { res.status(405).end('Method Not Allowed'); return; }

  // body 수동 읽기 (bodyParser: false)
  const body = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end',  () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  const authHeader = req.headers['authorization'] || '';

  const naiRes = await fetch('https://api.novelai.net/ai/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': authHeader,
      'User-Agent':    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer':       'https://novelai.net/',
      'Origin':        'https://novelai.net',
    },
    body,
  });

  const buf = Buffer.from(await naiRes.arrayBuffer());
  res.status(naiRes.status);
  res.setHeader('Content-Type', naiRes.headers.get('content-type') || 'application/octet-stream');
  res.send(buf);
}
