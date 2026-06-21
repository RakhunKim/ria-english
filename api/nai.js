const AdmZip = require('adm-zip');

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

    // 레퍼런스 이미지 추출 (별도 multipart field로 보내야 함)
    const refImages = parsed.parameters?.reference_image_multiple || [];
    const refPartNames = [];

    // parameters에서 reference_image_multiple 제거 (별도 field로 대체)
    if (parsed.parameters?.reference_image_multiple) {
      // 각 이미지에 form part 이름 부여
      refImages.forEach((_, i) => {
        refPartNames.push(`reference_image_${i}`);
      });
      parsed.parameters.reference_image_multiple = refPartNames;
    }

    console.log('[NAI] model:', parsed.model);
    console.log('[NAI] ref count:', refImages.length);

    const authHeader = req.headers['authorization'] || '';
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);

    // multipart body 구성
    let multipartParts = '';

    // 1. request JSON
    multipartParts += `--${boundary}\r\n`;
    multipartParts += `Content-Disposition: form-data; name="request"; filename="blob"\r\n`;
    multipartParts += `Content-Type: application/json\r\n\r\n`;
    multipartParts += JSON.stringify(parsed) + '\r\n';

    // 2. 레퍼런스 이미지들 (각각 별도 field)
    const binaryParts = [];
    for (let i = 0; i < refImages.length; i++) {
      const b64 = refImages[i].startsWith('data:')
        ? refImages[i].split(',')[1]
        : refImages[i];
      const imgBuf = Buffer.from(b64, 'base64');

      binaryParts.push({
        header: `--${boundary}\r\nContent-Disposition: form-data; name="${refPartNames[i]}"; filename="blob"\r\nContent-Type: image/png\r\n\r\n`,
        data: imgBuf,
      });
    }

    // 최종 body를 Buffer로 합치기
    const textBuf = Buffer.from(multipartParts, 'utf8');
    const closeBuf = Buffer.from(`--${boundary}--\r\n`, 'utf8');

    const parts = [textBuf];
    for (const part of binaryParts) {
      parts.push(Buffer.from(part.header, 'utf8'));
      parts.push(part.data);
      parts.push(Buffer.from('\r\n', 'utf8'));
    }
    parts.push(closeBuf);

    const finalBody = Buffer.concat(parts);

    const naiRes = await fetch('https://image.novelai.net/ai/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': authHeader,
        'User-Agent':    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer':       'https://novelai.net/',
        'Origin':        'https://novelai.net',
      },
      body: finalBody,
    });

    console.log('[NAI] status:', naiRes.status);
    const buf = Buffer.from(await naiRes.arrayBuffer());

    if (naiRes.status !== 200) {
      console.log('[NAI] error:', buf.toString('utf8').slice(0, 300));
      res.status(naiRes.status).send(buf);
      return;
    }

    const zip = new AdmZip(buf);
    const entries = zip.getEntries();
    const pngEntry = entries.find(e => e.entryName.endsWith('.png')) || entries[0];
    if (!pngEntry) throw new Error('ZIP에 파일 없음');

    const png = zip.readFile(pngEntry);
    console.log('[NAI] PNG 성공, 크기:', png.length);
    res.status(200).setHeader('Content-Type', 'image/png').send(png);

  } catch(err) {
    console.error('[NAI] exception:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports.config = { api: { bodyParser: false } };
