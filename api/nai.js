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

    // ZIP에서 PNG 추출 - 수동 파싱
    const png = extractFirstFileFromZip(buf);
    if (png) {
      console.log('[NAI] PNG 추출 성공, 크기:', png.length);
      res.status(200).setHeader('Content-Type', 'image/png').send(png);
    } else {
      console.log('[NAI] ZIP 파싱 실패, base64로 전송');
      // 클라이언트가 처리할 수 있도록 base64로 감싸서 전송
      res.status(200).setHeader('Content-Type', 'application/json').json({
        zipBase64: buf.toString('base64')
      });
    }

  } catch(err) {
    console.error('[NAI] exception:', err.message);
    res.status(500).json({ error: err.message });
  }
};

function extractFirstFileFromZip(buf) {
  try {
    // ZIP local file header: PK\x03\x04 (50 4B 03 04)
    let i = 0;
    while (i <= buf.length - 30) {
      if (buf[i] === 0x50 && buf[i+1] === 0x4B && buf[i+2] === 0x03 && buf[i+3] === 0x04) {
        const flags          = buf.readUInt16LE(i + 6);
        const compression    = buf.readUInt16LE(i + 8);
        const compressedSize = buf.readUInt32LE(i + 18);
        const filenameLen    = buf.readUInt16LE(i + 26);
        const extraLen       = buf.readUInt16LE(i + 28);
        const dataStart      = i + 30 + filenameLen + extraLen;
        const dataEnd        = dataStart + compressedSize;

        console.log('[ZIP] compression:', compression, 'compressedSize:', compressedSize, 'dataStart:', dataStart, 'bufLen:', buf.length);

        if (dataEnd > buf.length) {
          console.log('[ZIP] data exceeds buffer, trying to read anyway');
        }

        const data = buf.slice(dataStart, Math.min(dataEnd, buf.length));

        if (compression === 0) {
          return data; // stored (no compression)
        } else if (compression === 8) {
          const zlib = require('zlib');
          return zlib.inflateRawSync(data);
        }
        break;
      }
      i++;
    }
    return null;
  } catch(e) {
    console.error('[ZIP] error:', e.message);
    return null;
  }
}

module.exports.config = { api: { bodyParser: false } };
