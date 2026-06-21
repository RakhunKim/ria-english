const FormData = require('form-data');
const AdmZip = require('adm-zip');
const sharp = require('sharp');

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
    const vibeRef = parsed._vibeRef;
    delete parsed._vibeRef;

    const FORM_PART_NAME = 'ref_img_0';

    if (vibeRef && parsed.parameters) {
      parsed.parameters.director_reference_images = [FORM_PART_NAME];
      parsed.parameters.director_reference_descriptions = [{
        caption: { base_caption: 'character&style', char_captions: [] },
        legacy_uc: false
      }];
      parsed.parameters.director_reference_information_extracted = [1];
      parsed.parameters.director_reference_strength_values = [0.65];
      parsed.parameters.director_reference_secondary_strength_values = [0.45];
      console.log('[NAI] 레퍼런스 설정 완료');
    }

    console.log('[NAI] model:', parsed.model);

    const form = new FormData();
    form.append('request', JSON.stringify(parsed), {
      contentType: 'application/json',
      filename: 'blob'
    });

    if (vibeRef) {
      const b64 = vibeRef.startsWith('data:') ? vibeRef.split(',')[1] : vibeRef;
      const rawBuf = Buffer.from(b64, 'base64');

      // 알파채널 제거 + 흰배경 합성 + 512x512 (64배수) JPEG
      const resizedBuf = await sharp(rawBuf)
        .flatten({ background: { r: 255, g: 255, b: 255 } })  // 투명→흰배경
        .resize(512, 768, { fit: 'cover' })                   // 64의 배수
        .jpeg({ quality: 90 })
        .toBuffer();

      console.log('[NAI] 레퍼런스 처리 완료 (알파제거+512x768), 크기:', resizedBuf.length);

      form.append(FORM_PART_NAME, resizedBuf, {
        contentType: 'image/jpeg',
        filename: 'reference.jpg'
      });
    }

    const naiRes = await fetch('https://image.novelai.net/ai/generate-image', {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': authHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://novelai.net/',
        'Origin': 'https://novelai.net',
      },
      body: form.getBuffer(),
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
