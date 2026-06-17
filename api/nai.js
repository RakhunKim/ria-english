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
    const authHeader = req.headers['authorization'] || '';

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
    const multipartBody =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="request"; filename="blob"\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      JSON.stringify(parsed) + `\r\n` +
      `--${boundary}--\r\n`;

    const naiRes = await fetch('https://image.novelai.net/ai/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': authHeader,
        'User-Agent':    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer':       'https://novelai.net/',
        'Origin':        'https://novelai.net',
      },
      body: multipartBody,
    });

    console.log('[NAI] status:', naiRes.status);
    const buf = Buffer.from(await naiRes.arrayBuffer());

    if (naiRes.status !== 200) {
      res.status(naiRes.status).send(buf);
      return;
    }

    // PNG 시그니처 직접 검색 (ZIP 헤더 무시)
    const PNG_SIG = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const PNG_END = Buffer.from([0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);

    let pngStart = -1;
    for (let i = 0; i <= buf.length - 8; i++) {
      if (buf.slice(i, i+8).equals(PNG_SIG)) {
        pngStart = i;
        break;
      }
    }

    if (pngStart === -1) {
      console.log('[NAI] PNG 시그니처 없음, ZIP base64 전송');
      res.status(200).json({ zipBase64: buf.toString('base64') });
      return;
    }

    // IEND 청크 찾기
    let pngEnd = buf.length;
    for (let i = pngStart; i <= buf.length - 8; i++) {
      if (buf.slice(i, i+8).equals(PNG_END)) {
        pngEnd = i + 8;
        break;
      }
    }

    const png = buf.slice(pngStart, pngEnd);
    console.log('[NAI] PNG 추출 성공, 크기:', png.length);
    res.status(200).setHeader('Content-Type', 'image/png').send(png);

  } catch(err) {
    console.error('[NAI] exception:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports.config = { api: { bodyParser: false } };
