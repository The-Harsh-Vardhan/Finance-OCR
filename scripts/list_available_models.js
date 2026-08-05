const fs = require('fs');

async function listModels() {
  const envContent = fs.readFileSync('.env', 'utf8');
  let apiKey = '';

  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('GEMINI_API_KEY=')) {
      apiKey = trimmed.slice('GEMINI_API_KEY='.length).replace(/["']/g, '');
    } else if (!apiKey && trimmed.startsWith('VITE_GEMINI_API_KEY=')) {
      apiKey = trimmed.slice('VITE_GEMINI_API_KEY='.length).replace(/["']/g, '');
    }
  }

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  const models = data.models || [];

  const visionModels = [];
  const textModels = [];
  const specializedModels = [];

  for (const m of models) {
    const id = m.name.replace('models/', '');
    const item = {
      id,
      displayName: m.displayName,
      inputLimit: m.inputTokenLimit,
      outputLimit: m.outputTokenLimit,
      methods: m.supportedGenerationMethods,
    };

    if (m.supportedGenerationMethods?.includes('generateContent')) {
      if (id.includes('imagen') || id.includes('veo') || id.includes('lyria') || id.includes('embedding') || id.includes('aqa')) {
        specializedModels.push(item);
      } else {
        visionModels.push(item);
      }
    } else {
      specializedModels.push(item);
    }
  }

  console.log('=== VISION / MULTIMODAL MODELS ===');
  console.log(JSON.stringify(visionModels, null, 2));

  console.log('\n=== OTHER SPECIALIZED MODELS ===');
  console.log(JSON.stringify(specializedModels, null, 2));
}

listModels();
