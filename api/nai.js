/**
 * Vercel API Route — NAI 프록시
 * POST /api/nai
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST')    { res.status(405).end('Method Not Allowed'); return; }

  try {
    // body를 텍스트로 읽어서 파싱 후 다시 stringify
    const bodyText = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    // 파싱해서 model 확인
    const parsed = JSON.parse(bodyText);
    console.log('[NAI] model:', parsed.model);
    console.log('[NAI] action:', parsed.action);

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
      body: bodyText,
    });

    const buf = Buffer.from(await naiRes.arrayBuffer());
    console.log('[NAI] status:', naiRes.status);

    res.status(naiRes.status);
    res.setHeader('Content-Type', naiRes.headers.get('content-type') || 'application/octet-stream');
    res.send(buf);

  } catch(err) {
    console.error('[NAI] error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports.config = { api: { bodyParser: false } };
