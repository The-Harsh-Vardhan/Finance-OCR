const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

async function testSaJsonDirect() {
  console.log('====================================================');
  console.log('🧪 TESTING SERVICE ACCOUNT JSON KEY DIRECTLY');
  console.log('====================================================\n');

  const jsonPath = 'c:\\D Drive\\Projects\\Summers 2026\\GramIQ Internship\\Finance OCR\\Ledger - OCR - Socials.harsh project-e308ba2a-3330-4ec4-b16-be70e2698f36.json';

  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Could not find JSON key file at:', jsonPath);
    return;
  }

  const sa = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log('🔑 Client Email:', sa.client_email);
  console.log('📁 Project ID:', sa.project_id);

  // Generate OAuth2 access token using Service Account JWT assertion
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat,
    exp,
    scope: 'https://www.googleapis.com/auth/cloud-platform'
  };

  const base64UrlEncode = (str) => Buffer.from(str).toString('base64url');

  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const signature = signer.sign(sa.private_key, 'base64url');

  const jwt = `${unsignedToken}.${signature}`;

  // Exchange JWT for OAuth Access Token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!tokenRes.ok) {
    console.error('❌ OAuth token exchange failed:', tokenRes.status, await tokenRes.text());
    return;
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  console.log('✅ Generated GCP Access Token:', accessToken.substring(0, 20) + '...\n');

  // Test Vertex AI Gemini Models
  const candidateModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-001'];
  const locations = ['global', 'us-central1'];

  for (const m of candidateModels) {
    for (const loc of locations) {
      const url = `https://${loc === 'global' ? 'aiplatform.googleapis.com' : loc + '-aiplatform.googleapis.com'}/v1/projects/${sa.project_id}/locations/${loc}/publishers/google/models/${m}:generateContent`;
      const startTime = Date.now();

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
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
          console.log(`✅ [200 OK]  ${m.padEnd(20)} @ ${loc.padEnd(11)} | Time: ${elapsed}ms | Output: "${text.substring(0, 35)}"`);
        } else {
          const errText = await res.text();
          let shortErr = errText;
          try { shortErr = JSON.parse(errText).error?.message || errText; } catch {}
          console.log(`❌ [${res.status}]   ${m.padEnd(20)} @ ${loc.padEnd(11)} | Error: ${shortErr.substring(0, 60)}`);
        }
      } catch (err) {
        console.log(`❌ [ERROR]  ${m.padEnd(20)} @ ${loc.padEnd(11)} | ${err.message}`);
      }
    }
  }

  console.log('\n====================================================');
}

testSaJsonDirect();
