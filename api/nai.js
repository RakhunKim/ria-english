module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST')    { res.status(405).end('Method Not Allowed'); return; }

  try {
    let bodyText = '';
    await new Promise((resolve, reject) => {
      req.on('data', chunk => bodyText += chunk);
      req.on('end', resolve);
      req.on('error', reject);
    });

    const parsed = JSON.parse(bodyText);
    // 전체 파라미터 로그
    console.log('[NAI] model:', parsed.model);
    console.log('[NAI] params:', JSON.stringify(parsed.parameters));

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
    if (naiRes.status !== 200) {
      console.log('[NAI] error body:', buf.toString('utf8').slice(0, 300));
    }

    res.status(naiRes.status);
    res.setHeader('Content-Type', naiRes.headers.get('content-type') || 'application/octet-stream');
    res.send(buf);

  } catch(err) {
    console.error('[NAI] exception:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports.config = { api: { bodyParser: false } };
