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

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { image_base64, crop_hint, api_key } = body;

    const apiKey = api_key || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!image_base64) {
      return new Response(JSON.stringify({ error: 'Missing image_base64 parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanBase64 = image_base64.replace(/^data:image\/\w+;base64,/, '');

    const promptText = SYSTEM_PROMPT + (crop_hint ? `\nContext Note: Crop is '${crop_hint}'.` : '');

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let geminiResData = null;
    let lastErr = null;

    for (const model of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptText },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: cleanBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.1,
            },
          }),
        });

        if (res.ok) {
          geminiResData = await res.json();
          break;
        } else {
          const errText = await res.text();
          lastErr = `${model}: ${res.status} ${errText}`;
        }
      } catch (e: any) {
        lastErr = `${model}: ${e.message}`;
      }
    }

    if (!geminiResData) {
      throw new Error(`Gemini API call failed: ${lastErr}`);
    }

    const rawText = geminiResData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    let transactions = JSON.parse(rawText.replace(/```json\s*|\s*```/g, '').trim());

    if (!Array.isArray(transactions)) {
      transactions = [];
    }

    const enrichedTransactions = transactions.map((tx: any, idx: number) => {
      const desc = tx.description || tx.ocr_text || '';
      let cat = tx.category || 'Miscellaneous';
      let subcat = tx.subcategory || null;

      const lower = desc.toLowerCase();
      for (const [key, [c, s]] of Object.entries(TERM_MAPPINGS)) {
        if (lower.includes(key)) {
          cat = c;
          subcat = s;
          break;
        }
      }

      const isIncome = cat === 'Sales' || ['sale', 'विक्री', 'बिक्री', 'sold'].some(w => lower.includes(w));
      const txType = tx.type || (isIncome ? 'Income' : 'Expense');
      const conf = Math.min(Math.max(Number(tx.confidence) || 0.85, 0.5), 0.99);

      return {
        id: `tx-edge-${Date.now()}-${idx}`,
        ocr_text: tx.ocr_text || desc,
        description_en: tx.description_en || desc,
        description: desc,
        raw_date: tx.raw_date || tx.date || null,
        transaction_date: tx.date || new Date().toISOString().split('T')[0],
        category: cat,
        subcategory: subcat,
        crop: tx.crop || crop_hint || 'General',
        type: txType,
        amount: Math.abs(Number(tx.amount)) || 0,
        unit: tx.unit || '₹',
        confidence: conf,
        confidence_level: conf >= 0.8 ? 'High' : conf >= 0.65 ? 'Medium' : 'Low',
        verified: conf >= 0.8,
      };
    });

    const step1_raw_ocr = enrichedTransactions.map((t: any) => ({ ocr_text: t.ocr_text, raw_date: t.raw_date, raw_amount: t.amount }));
    const step2_translations = enrichedTransactions.map((t: any) => ({ before_translation_indic: t.ocr_text, after_translation_english: t.description_en, canonical_description: t.description }));

    return new Response(
      JSON.stringify({
        status: 'Complete',
        total_extracted: enrichedTransactions.length,
        review_required: enrichedTransactions.some((t: any) => !t.verified),
        transactions: enrichedTransactions,
        intermediate_data: {
          step1_raw_ocr,
          step2_translations,
          step3_final_output: enrichedTransactions,
        },
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
    return new Response(JSON.stringify({ error: err.message || 'Edge processing failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
