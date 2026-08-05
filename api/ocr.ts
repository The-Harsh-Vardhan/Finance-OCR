export const config = {
  runtime: 'edge',
};

const SYSTEM_PROMPT = `You are an expert AI Document Intelligence system specialized in digitizing handwritten Indian farming notebooks (Bahi-Khata).

Process the notebook image strictly in 3 sequential steps for each entry:
STEP 1 [OCR]: Read and transcribe all handwritten text on the page verbatim in its original script.
STEP 2 [Translate]: Translate the verbatim Indic/local text into clear English.
STEP 3 [Categorize]: Categorize each entry into an agricultural category and extract structured financial attributes.

Return ONLY a raw JSON array of transaction objects:
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

const TERM_MAPPINGS: Record<string, [string, string]> = {
  "मजुरी": ["Labour", "Daily Wage"],
  "मजदुरी": ["Labour", "Daily Wage"],
  "निंदणी": ["Labour", "Weeding"],
  "खुरपणी": ["Labour", "Weeding"],
  "कापणी": ["Labour", "Harvesting"],
  "लागवड": ["Labour", "Sowing/Planting"],
  "मजूर": ["Labour", "Manual Labour"],
  "labour": ["Labour", "General Labour"],
  "labor": ["Labour", "General Labour"],
  "dap": ["Fertilizer", "Di-Ammonium Phosphate"],
  "डीएपी": ["Fertilizer", "Di-Ammonium Phosphate"],
  "urea": ["Fertilizer", "Urea"],
  "युरिया": ["Fertilizer", "Urea"],
  "यूरिया": ["Fertilizer", "Urea"],
  "खात": ["Fertilizer", "Manure/Fertilizer"],
  "खाद": ["Fertilizer", "Fertilizer"],
  "फवारणी": ["Pesticide", "Spraying"],
  "कीटकनाशक": ["Pesticide", "Insecticide"],
  "कीटनाशक": ["Pesticide", "Insecticide"],
  "बियाणे": ["Seeds", "Seeds"],
  "बीज": ["Seeds", "Seeds"],
  "ट्रॅक्टर": ["Machinery", "Tractor Service"],
  "ट्रैक्टर": ["Machinery", "Tractor Service"],
  "tractor": ["Machinery", "Tractor Service"],
  "विक्री": ["Sales", "Crop Sale"],
  "बिक्री": ["Sales", "Crop Sale"],
  "sale": ["Sales", "Produce Sale"]
};

// Web Crypto helper to sign Service Account JWT on Vercel Edge Runtime
async function getAccessTokenFromServiceAccount(saJsonStr: string): Promise<{ token: string; projectId: string }> {
  // Support raw JSON or Base64 encoded JSON
  const trimmed = saJsonStr.trim();
  const decodedStr = trimmed.startsWith('{') ? trimmed : atob(trimmed);
  const sa = JSON.parse(decodedStr);
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const base64Url = (str: string) =>
    btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      iss: sa.client_email,
      sub: sa.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat,
      exp,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
    })
  );

  const unsignedToken = `${header}.${payload}`;

  // Format PEM to binary PKCS8 cleanly handling any escaped \n or spaces in Vercel env
  const rawKey = String(sa.private_key || '')
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');

  const binaryDerString = atob(rawKey);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  const importedKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    importedKey,
    encoder.encode(unsignedToken)
  );

  const signatureBase64Url = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${unsignedToken}.${signatureBase64Url}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(4000),
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`GCP OAuth Token Exchange Failed [${tokenRes.status}]: ${errText}`);
  }

  const tokenData = await tokenRes.json();
  return { token: tokenData.access_token, projectId: sa.project_id };
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'online',
        service: 'GramIQ Finance OCR API',
        usage: 'Send HTTP POST request with image_base64 and optional crop_hint payload',
        endpoint: '/api/ocr',
        supported_methods: ['POST', 'OPTIONS', 'GET'],
        primary_engine: 'GCP Vertex AI (gemini-2.5-flash)',
        fallback_engine: 'Google AI Studio Free Tier'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const body = await req.json();
    const { image_base64, crop_hint, api_key } = body;

    const apiKey = api_key || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const saJsonRaw = process.env.GCP_SERVICE_ACCOUNT_JSON;

    if (!apiKey && !saJsonRaw) {
      return new Response(
        JSON.stringify({ error: 'No GEMINI_API_KEY or GCP_SERVICE_ACCOUNT_JSON configured in Vercel environment.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!image_base64) {
      return new Response(JSON.stringify({ error: 'Missing image_base64 parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanBase64 = image_base64.split(',').pop() || image_base64;
    const promptText = SYSTEM_PROMPT + (crop_hint ? `\nContext Note: Crop is '${crop_hint}'.` : '');

    const endpointsToTry: Array<{ name: string; url: string; headers: Record<string, string> }> = [];

    // 1. If Service Account JSON is set, use Vertex AI with $300 GCP Credits + 100% Privacy Guarantee
    let saAuthError: string | null = null;
    if (saJsonRaw) {
      try {
        const { token, projectId } = await getAccessTokenFromServiceAccount(saJsonRaw);
        const vertexModels = ['gemini-2.5-flash'];
        for (const vm of vertexModels) {
          endpointsToTry.push({
            name: `Vertex AI (${vm})`,
            url: `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${vm}:generateContent`,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
        }
      } catch (saErr: any) {
        saAuthError = saErr.message;
        console.error('Service Account JSON Auth Error:', saErr.message);
      }
    }

    // 2. Fallback to AI Studio if API Key is set
    if (apiKey) {
      const aiStudioModels = ['gemini-2.5-flash'];
      for (const m of aiStudioModels) {
        endpointsToTry.push({
          name: `AI Studio (${m})`,
          url: `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey.trim() },
        });
      }
    }

    let geminiResData = null;
    let lastErr = null;
    let fulfilledEndpoint: { name: string; url: string } | null = null;
    const startTime = Date.now();

    for (const ep of endpointsToTry) {
      const elapsed = Date.now() - startTime;
      if (elapsed > 16000) break; // Don't start a new request if less than 2s left in Edge limit

      const isVertex = ep.name.startsWith('Vertex');

      try {
        const remainingBudget = Math.max(3000, 18000 - elapsed);
        const res = await fetch(ep.url, {
          method: 'POST',
          headers: ep.headers,
          signal: AbortSignal.timeout(remainingBudget),
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: promptText },
                  isVertex
                    ? { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
                    : { inline_data: { mime_type: 'image/jpeg', data: cleanBase64 } },
                ],
              },
            ],
            generationConfig: isVertex
              ? { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 4096 }
              : { response_mime_type: 'application/json', temperature: 0.1, max_output_tokens: 4096 },
          }),
        });

        if (res.ok) {
          geminiResData = await res.json();
          fulfilledEndpoint = ep;
          break;
        } else {
          lastErr = `${ep.name}: ${res.status} ${await res.text()}`;
        }
      } catch (epErr: any) {
        lastErr = `${ep.name}: ${epErr.message}`;
      }
    }

    if (!geminiResData) {
      const saHint = saAuthError ? ` | Vertex SA Auth Error: ${saAuthError}` : '';
      throw new Error(`AI Vision OCR failed: ${lastErr || 'No response from AI models.'}${saHint}`);
    }

    const rawText = geminiResData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    // Robust JSON cleaning & truncated output recovery helper
    const parseResilientJson = (text: string): any[] => {
      let cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
      const jsonMatch = cleaned.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) cleaned = jsonMatch[0];

      // Sanitize common LLM JSON syntax quirks (trailing commas, comments)
      cleaned = cleaned
        .replace(/,\s*([\]}])/g, '$1')
        .replace(/\/\/.*/g, '');

      const unwrap = (obj: any): any[] => {
        if (Array.isArray(obj)) return obj;
        if (obj && typeof obj === 'object') {
          for (const key of ['transactions', 'data', 'items', 'records', 'entries', 'results']) {
            if (Array.isArray(obj[key])) return obj[key];
          }
          // If single transaction object, wrap in array
          if (obj.ocr_text || obj.description || obj.amount) return [obj];
        }
        return [];
      };

      try {
        const parsed = JSON.parse(cleaned);
        const res = unwrap(parsed);
        if (res.length > 0) return res;
      } catch {}

      // Fallback: Attempt truncated JSON repair by closing unclosed brackets/braces
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
      } catch {}

      // Final fallback: Regex extract all individual JSON objects from text
      try {
        const objects: any[] = [];
        const objectMatches = text.match(/\{[^{}]*"amount"[^{}]*\}/g) || [];
        for (const m of objectMatches) {
          try { objects.push(JSON.parse(m)); } catch {}
        }
        return objects;
      } catch {
        return [];
      }
    };

    let transactions = parseResilientJson(rawText);

    // Post-process normalization
    transactions = transactions.map((item: any) => {
      const key = (item.description || item.ocr_text || '').toLowerCase().trim();
      for (const [term, [cat, subcat]] of Object.entries(TERM_MAPPINGS)) {
        if (key.includes(term)) {
          item.category = cat;
          item.subcategory = subcat;
          break;
        }
      }
      return item;
    });

    return new Response(
      JSON.stringify({
        success: true,
        engine: fulfilledEndpoint?.name || 'Gemini Vision',
        count: transactions.length,
        data: transactions,
        transactions: transactions,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    console.error('OCR Processing Error:', err.message);
    return new Response(
      JSON.stringify({
        error: err.message || 'Internal server error during OCR processing',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
