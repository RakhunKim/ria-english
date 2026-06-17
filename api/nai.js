const zlib = require('zlib');

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
    const jsonBlob = JSON.stringify(parsed);
    const multipartBody =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="request"; filename="blob"\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      jsonBlob + `\r\n` +
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
      console.log('[NAI] error:', buf.toString('utf8').slice(0, 300));
      res.status(naiRes.status).send(buf);
      return;
    }

    // ZIP 파일에서 PNG 추출
    const pngBuf = extractPngFromZip(buf);
    if (!pngBuf) {
      console.log('[NAI] ZIP 파싱 실패, 원본 전송');
      res.status(200).setHeader('Content-Type', 'application/zip').send(buf);
      return;
    }

    console.log('[NAI] PNG 추출 성공, 크기:', pngBuf.length);
    res.status(200).setHeader('Content-Type', 'image/png').send(pngBuf);

  } catch(err) {
    console.error('[NAI] exception:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ZIP에서 첫 번째 파일(PNG) 추출
function extractPngFromZip(buf) {
  try {
    // ZIP local file header signature: PK\x03\x04
    let offset = 0;
    while (offset < buf.length - 30) {
      if (buf[offset] === 0x50 && buf[offset+1] === 0x4B &&
          buf[offset+2] === 0x03 && buf[offset+3] === 0x04) {
        const compression = buf.readUInt16LE(offset + 8);
        const compressedSize = buf.readUInt32LE(offset + 18);
        const filenameLen = buf.readUInt16LE(offset + 26);
        const extraLen = buf.readUInt16LE(offset + 28);
        const dataOffset = offset + 30 + filenameLen + extraLen;
        const compressedData = buf.slice(dataOffset, dataOffset + compressedSize);

        if (compression === 0) {
          // 비압축
          return compressedData;
        } else if (compression === 8) {
          // deflate
          return zlib.inflateRawSync(compressedData);
        }
      }
      offset++;
    }
    return null;
  } catch(e) {
    console.error('[NAI] ZIP 파싱 오류:', e.message);
    return null;
  }
}

module.exports.config = { api: { bodyParser: false } };
