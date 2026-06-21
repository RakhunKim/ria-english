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
    const authHeader = req.headers['authorization'] || '';

    // _vibeRef → director_reference_images 배열로 직접 주입
    const vibeRef = parsed._vibeRef;
    delete parsed._vibeRef;

    if (vibeRef && parsed.parameters) {
      const b64 = vibeRef.startsWith('data:') ? vibeRef.split(',')[1] : vibeRef;
      parsed.parameters.director_reference_images = [b64];
      parsed.parameters.director_reference_descriptions = [{
        caption: { base_caption: 'character&style', char_captions: [] },
        legacy_uc: false
      }];
      parsed.parameters.director_reference_information_extracted = [1];
      parsed.parameters.director_reference_strength_values = [0.65];
      parsed.parameters.director_reference_secondary_strength_values = [0.45];
      console.log('[NAI] 레퍼런스 이미지 주입 완료');
    }

    console.log('[NAI] model:', parsed.model);
    console.log('[NAI] has ref:', !!(parsed.parameters?.director_reference_images?.length));

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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://novelai.net/',
        'Origin': 'https://novelai.net',
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
