const fs = require('fs');
const path = require('path');

async function testAllGeminiModels() {
  console.log('====================================================');
  console.log('🧪 EMPIRICAL GEMINI MODEL AVAILABILITY TEST SUITE');
  console.log('====================================================\n');

  let apiKey = process.env.GEMINI_API_KEY || '';

  const envPaths = [
    'c:\\D Drive\\Projects\\Summers 2026\\GramIQ Internship\\Finance OCR\\.env',
    'c:\\D Drive\\Projects\\Summers 2026\\GramIQ Internship\\Finance OCR\\backend\\.env',
    'c:\\D Drive\\Projects\\Summers 2026\\GramIQ Internship\\Finance OCR\\frontend\\.env'
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('GEMINI_API_KEY=') || trimmed.startsWith('VITE_GEMINI_API_KEY=')) {
          const val = trimmed.split('=')[1].replace(/["']/g, '').trim();
          if (val) {
            apiKey = val;
            console.log(`🔑 Loaded API Key from: ${envPath}`);
            break;
          }
        }
      }
    }
    if (apiKey) break;
  }

  if (!apiKey) {
    console.error('❌ ERROR: Could not find GEMINI_API_KEY in .env files.');
    return;
  }

  console.log(`🔑 Testing API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}\n`);

  // 1. Fetch official list of models from Google AI Studio REST API
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (listRes.ok) {
      const listData = await listRes.json();
      const modelsList = (listData.models || [])
        .map(m => m.name.replace('models/', ''))
        .filter(m => m.includes('gemini'));
      console.log(`📋 Official Available Gemini Models (${modelsList.length} models):`);
      console.log(modelsList.join(', '));
      console.log('\n----------------------------------------------------\n');
    } else {
      console.log(`⚠️ List models warning: ${listRes.status} ${await listRes.text()}\n`);
    }
  } catch (err) {
    console.log(`⚠️ List models request failed: ${err.message}\n`);
  }

  // 2. Actively test inference against candidate Gemini models
  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  console.log('🚀 Testing Inference Capabilities Across Models:\n');

  const results = [];

  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const startTime = Date.now();

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: 'Respond with "OPERATIONAL" if active.' }]
          }]
        })
      });

      const elapsed = Date.now() - startTime;

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No text';
        console.log(`✅ [200 OK]  ${model.padEnd(25)} | Time: ${elapsed}ms | Output: "${text.substring(0, 40)}"`);
        results.push({ model, status: '200 OK', elapsed, output: text });
      } else {
        const errText = await res.text();
        let shortErr = errText;
        try {
          const parsed = JSON.parse(errText);
          shortErr = parsed.error?.message || errText;
        } catch {}
        console.log(`❌ [${res.status}]   ${model.padEnd(25)} | Time: ${elapsed}ms | Error: ${shortErr.substring(0, 60)}`);
        results.push({ model, status: res.status, elapsed, error: shortErr });
      }
    } catch (err) {
      console.log(`❌ [ERROR]    ${model.padEnd(25)} | Message: ${err.message}`);
      results.push({ model, status: 'ERROR', error: err.message });
    }
  }

  console.log('\n====================================================');
  const operational = results.filter(r => r.status === '200 OK');
  console.log(`🎯 RESULT: ${operational.length} out of ${candidateModels.length} models are OPERATIONAL!`);
  console.log('====================================================');
}

testAllGeminiModels();
