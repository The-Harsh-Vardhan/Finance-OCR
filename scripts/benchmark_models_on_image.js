const fs = require('fs');
const path = require('path');

const imagePath = `C:\\Users\\harsh\\OneDrive - Indian Institute of Information Technology, Nagpur\\IIIT Nagpur\\Summers 2026\\GramIQ Internship\\Task 13 - Image to Farm Finance Feature\\Old Accounting Method\\2.jpg`;

const SYSTEM_PROMPT = `You are an expert AI Document Intelligence system specialized in digitizing handwritten Indian farming notebooks (Bahi-Khata).

Process the notebook image strictly in 3 sequential steps for each entry:
STEP 1 [OCR]: Read and transcribe all handwritten text on the page verbatim in its original script.
STEP 2 [Translate]: Translate the verbatim Indic/local text into clear English.
STEP 3 [Categorize]: Categorize each entry into an agricultural category and extract structured financial attributes.

Return ONLY a raw JSON array of transaction objects for EVERY single transaction item visible in the image:
[
  {
    "ocr_text": "Verbatim OCR text transcribed from image in original Hindi/Marathi/English script",
    "description_en": "English translation or normalized interpretation",
    "description": "Original transcription text",
    "raw_date": "Original date string from image",
    "date": "YYYY-MM-DD or DD/MM/YYYY or null if missing",
    "category": "Fertilizer | Pesticide | Labour | Machinery | Sales | Seeds | Irrigation | Transport | Miscellaneous",
    "subcategory": "Subcategory name or null",
    "crop": "Cotton | Soybean | Sugarcane | Wheat | Gram | Paddy | General",
    "type": "Expense | Income",
    "amount": 0,
    "unit": "kg | bags | acres | days | hours | quintal | packets | null",
    "confidence": 0.95
  }
]`;

// Web Crypto / Node crypto JWT Signer for Service Account
const crypto = require('crypto');

function signJwt(sa) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat, exp,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
  })).toString('base64url');

  const unsigned = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  const signature = sign.sign(sa.private_key, 'base64url');
  return `${unsigned}.${signature}`;
}

async function getVertexToken(sa) {
  const jwt = signJwt(sa);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  return { token: data.access_token, projectId: sa.project_id };
}

function parseResilientJson(text) {
  let cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];

  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1').replace(/\/\/.*/g, '');

  const unwrap = (obj) => {
    if (Array.isArray(obj)) return obj;
    if (obj && typeof obj === 'object') {
      for (const key of ['transactions', 'data', 'items', 'records', 'entries', 'results']) {
        if (Array.isArray(obj[key])) return obj[key];
      }
      if (obj.ocr_text || obj.description || obj.amount) return [obj];
    }
    return [];
  };

  try {
    const parsed = JSON.parse(cleaned);
    const res = unwrap(parsed);
    if (res.length > 0) return res;
  } catch { }

  try {
    let repairedText = cleaned
      .replace(/,?\s*"[^"]*"?\s*:\s*"?[^"]*$/g, '')
      .replace(/,?\s*\{[^}]*$/g, '')
      .replace(/,\s*$/g, '');

    let openBraces = (repairedText.match(/\{/g) || []).length - (repairedText.match(/\}/g) || []).length;
    let openBrackets = (repairedText.match(/\[/g) || []).length - (repairedText.match(/\]/g) || []).length;

    while (openBraces > 0) { repairedText += '}'; openBraces--; }
    while (openBrackets > 0) { repairedText += ']'; openBrackets--; }

    const parsedRepaired = JSON.parse(repairedText);
    const res = unwrap(parsedRepaired);
    if (res.length > 0) return res;
  } catch { }

  try {
    const objects = [];
    const objectMatches = text.match(/\{[^{}]*"amount"[^{}]*\}/g) || [];
    for (const m of objectMatches) {
      try { objects.push(JSON.parse(m)); } catch { }
    }
    return objects;
  } catch {
    return [];
  }
}

async function benchmark() {
  console.log('====================================================');
  console.log('🧪 BENCHMARKING GEMINI MODELS ON IMAGE 2.JPG');
  console.log('====================================================\n');

  if (!fs.existsSync(imagePath)) {
    console.error(`❌ Image file not found: ${imagePath}`);
    return;
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  console.log(`📸 Image Loaded: 2.jpg (${(imageBuffer.length / 1024).toFixed(1)} KB)\n`);

  // Read .env
  const envContent = fs.readFileSync('.env', 'utf8');
  let saJsonStr = '';
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('GCP_SERVICE_ACCOUNT_JSON=')) {
      saJsonStr = trimmed.slice('GCP_SERVICE_ACCOUNT_JSON='.length);
      break;
    }
  }

  let vertexAuth = null;
  if (saJsonStr) {
    try {
      const sa = JSON.parse(saJsonStr.startsWith('{') ? saJsonStr : Buffer.from(saJsonStr, 'base64').toString('utf8'));
      vertexAuth = await getVertexToken(sa);
      console.log(`🔑 GCP Vertex AI Authenticated (Project: ${vertexAuth.projectId})\n`);
    } catch (e) {
      console.error(`⚠️ SA Auth Error: ${e.message}`);
    }
  }

  const modelsToTest = [
    { engine: 'Vertex AI', name: 'gemini-2.5-flash', url: (p) => `https://aiplatform.googleapis.com/v1/projects/${p}/locations/global/publishers/google/models/gemini-2.5-flash:generateContent` },
    { engine: 'Vertex AI', name: 'gemini-2.5-pro', url: (p) => `https://aiplatform.googleapis.com/v1/projects/${p}/locations/global/publishers/google/models/gemini-2.5-pro:generateContent` },
    { engine: 'Vertex AI', name: 'gemini-3.6-flash', url: (p) => `https://aiplatform.googleapis.com/v1/projects/${p}/locations/global/publishers/google/models/gemini-3.6-flash:generateContent` },
    { engine: 'Vertex AI', name: 'gemini-3.5-flash', url: (p) => `https://aiplatform.googleapis.com/v1/projects/${p}/locations/global/publishers/google/models/gemini-3.5-flash:generateContent` },
    { engine: 'Vertex AI', name: 'gemini-2.0-flash-001', url: (p) => `https://aiplatform.googleapis.com/v1/projects/${p}/locations/global/publishers/google/models/gemini-2.0-flash-001:generateContent` }
  ];

  const results = [];

  for (const item of modelsToTest) {
    console.log(`⏳ Testing ${item.engine} (${item.name})...`);
    const start = Date.now();
    try {
      const url = item.url(vertexAuth.projectId);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vertexAuth.token}`,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: SYSTEM_PROMPT },
                { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 8192
          }
        })
      });

      const elapsed = ((Date.now() - start) / 1000).toFixed(2);

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const records = parseResilientJson(text);
        console.log(`   ✅ Status: 200 OK | Records Extracted: ${records.length} | Latency: ${elapsed}s`);
        results.push({
          model: item.name,
          engine: item.engine,
          status: 'SUCCESS',
          count: records.length,
          time: elapsed,
          sample: records.slice(0, 3)
        });
      } else {
        const errText = await res.text();
        console.log(`   ❌ Status: ${res.status} | Latency: ${elapsed}s | Error: ${errText.substring(0, 100)}`);
        results.push({
          model: item.name,
          engine: item.engine,
          status: `HTTP ${res.status}`,
          count: 0,
          time: elapsed,
          error: errText.substring(0, 150)
        });
      }
    } catch (err) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      console.log(`   ❌ Exception: ${err.message} | Latency: ${elapsed}s`);
      results.push({
        model: item.name,
        engine: item.engine,
        status: 'EXCEPTION',
        count: 0,
        time: elapsed,
        error: err.message
      });
    }
    console.log('----------------------------------------------------');
  }

  console.log('\n📊 BENCHMARK SUMMARY TABLE:');
  console.table(results.map(r => ({ Model: r.model, Engine: r.engine, Status: r.status, 'Records Found': r.count, 'Latency (s)': r.time })));
}

benchmark();
