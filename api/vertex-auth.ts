export interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  private_key_id?: string;
  token_uri?: string;
}

export interface AuthResolution {
  token: string;
  source: 'service-account' | 'vercel-wif' | 'static-token' | 'none';
  error?: string;
}

let cachedServiceAccountToken: string | null = null;
let cachedServiceAccountExpiry = 0;
let cachedWifToken: string | null = null;
let cachedWifTokenExpiry = 0;

export function getDefaultVertexLocation(rawLocation?: string): string {
  const normalized = String(rawLocation || '').trim();
  return normalized || 'global';
}

export function buildVertexEndpoint({
  projectId,
  location,
  modelName
}: {
  projectId: string;
  location?: string;
  modelName: string;
}): string {
  const cleanProjectId = String(projectId || process.env.GCP_PROJECT_ID || 'project-e308ba2a-3330-4ec4-b16').trim();
  const normalizedLocation = getDefaultVertexLocation(location);
  const baseUrl =
    normalizedLocation === 'global'
      ? 'https://aiplatform.googleapis.com'
      : `https://${normalizedLocation}-aiplatform.googleapis.com`;

  return `${baseUrl}/v1/projects/${cleanProjectId}/locations/${normalizedLocation}/publishers/google/models/${modelName}:generateContent`;
}

function decodeBase64Json(rawValue?: string): any {
  if (!rawValue) return null;
  try {
    const decodedStr = typeof atob === 'function' ? atob(rawValue) : Buffer.from(rawValue, 'base64').toString('utf8');
    return JSON.parse(decodedStr);
  } catch {
    return null;
  }
}

function normalizePrivateKey(rawValue?: string): string {
  return String(rawValue || '').replace(/\\n/g, '\n').trim();
}

export function getServiceAccountCredentials(): ServiceAccountCredentials | null {
  const inlineJson =
    process.env.GCP_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    process.env.VERTEX_SERVICE_ACCOUNT_JSON;

  if (inlineJson) {
    try {
      const parsed = JSON.parse(inlineJson);
      if (parsed.client_email && parsed.private_key) return parsed;
    } catch {
      // Fall through
    }
  }

  const base64Json =
    process.env.GCP_SERVICE_ACCOUNT_JSON_BASE64 ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 ||
    process.env.VERTEX_SERVICE_ACCOUNT_JSON_BASE64;

  const decoded = decodeBase64Json(base64Json);
  if (decoded?.client_email && decoded?.private_key) {
    return decoded;
  }

  const clientEmail =
    process.env.GCP_CLIENT_EMAIL ||
    process.env.GOOGLE_CLIENT_EMAIL ||
    process.env.VERTEX_CLIENT_EMAIL;

  const privateKey =
    normalizePrivateKey(process.env.GCP_PRIVATE_KEY) ||
    normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY) ||
    normalizePrivateKey(process.env.VERTEX_PRIVATE_KEY);

  const privateKeyId =
    process.env.GCP_PRIVATE_KEY_ID ||
    process.env.GOOGLE_PRIVATE_KEY_ID ||
    process.env.VERTEX_PRIVATE_KEY_ID;

  const tokenUri =
    process.env.GCP_TOKEN_URI ||
    process.env.GOOGLE_TOKEN_URI ||
    process.env.VERTEX_TOKEN_URI ||
    'https://oauth2.googleapis.com/token';

  if (clientEmail && privateKey) {
    return {
      client_email: clientEmail,
      private_key: privateKey,
      private_key_id: privateKeyId || undefined,
      token_uri: tokenUri
    };
  }

  return null;
}

function base64UrlEncode(str: string): string {
  const base64 = typeof btoa === 'function' ? btoa(str) : Buffer.from(str).toString('base64');
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function pemToBinary(pem: string): ArrayBuffer {
  const lines = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const binary = typeof atob === 'function' ? atob(lines) : Buffer.from(lines, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function createJwtAssertion(serviceAccount: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    ...(serviceAccount.private_key_id ? { kid: serviceAccount.private_key_id } : {})
  };

  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: serviceAccount.token_uri || 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    iat: now,
    exp: now + 3600
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const keyBuffer = pemToBinary(serviceAccount.private_key);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureBytes = new Uint8Array(signature);
  let binarySign = '';
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    binarySign += String.fromCharCode(signatureBytes[i]);
  }
  const encodedSignature = base64UrlEncode(binarySign);

  return `${unsignedToken}.${encodedSignature}`;
}

export async function getAccessTokenViaServiceAccount(
  serviceAccount: ServiceAccountCredentials
): Promise<string> {
  if (cachedServiceAccountToken && Date.now() < cachedServiceAccountExpiry - 60_000) {
    return cachedServiceAccountToken;
  }

  const assertion = await createJwtAssertion(serviceAccount);
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  });

  const response = await fetch(serviceAccount.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!response.ok) {
    throw new Error(`Service account token exchange failed: ${await response.text()}`);
  }

  const data = await response.json();
  cachedServiceAccountToken = data.access_token;
  cachedServiceAccountExpiry = Date.now() + (data.expires_in ?? 3600) * 1000;
  return cachedServiceAccountToken;
}

export async function getAccessTokenViaWIF(
  oidcToken: string,
  projectNumber: string,
  poolId: string,
  providerId: string
): Promise<string> {
  if (cachedWifToken && Date.now() < cachedWifTokenExpiry - 60_000) return cachedWifToken;

  const cleanProjectNum = String(projectNumber || '').trim();
  const cleanPoolId = String(poolId || '').trim();
  const cleanProviderId = String(providerId || '').trim();
  const cleanOidcToken = String(oidcToken || '').trim();

  const audience = `//iam.googleapis.com/projects/${cleanProjectNum}/locations/global/workloadIdentityPools/${cleanPoolId}/providers/${cleanProviderId}`;

  const response = await fetch('https://sts.googleapis.com/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audience,
      grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
      requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      subjectTokenType: 'urn:ietf:params:oauth:token-type:id_token',
      subjectToken: cleanOidcToken
    })
  });

  if (!response.ok) {
    throw new Error(`WIF STS exchange failed: ${await response.text()}`);
  }

  const data = await response.json();
  const federatedToken = data.access_token;

  const saEmail = (process.env.GCP_SERVICE_ACCOUNT_EMAIL || 'gramiq-vercel-sa@project-e308ba2a-3330-4ec4-b16.iam.gserviceaccount.com').trim();
  if (saEmail) {
    try {
      const impRes = await fetch(
        `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${saEmail}:generateAccessToken`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${federatedToken}`
          },
          body: JSON.stringify({
            scope: ['https://www.googleapis.com/auth/cloud-platform']
          })
        }
      );
      if (impRes.ok) {
        const impData = await impRes.json();
        if (impData.accessToken) {
          cachedWifToken = impData.accessToken;
          cachedWifTokenExpiry = Date.now() + 3500 * 1000;
          return cachedWifToken;
        }
      }
    } catch {
      // Fall through to federatedToken if impersonation fails
    }
  }

  cachedWifToken = federatedToken;
  cachedWifTokenExpiry = Date.now() + (data.expires_in ?? 3600) * 1000;
  return cachedWifToken;
}

export async function resolveVertexAccessToken(req?: Request): Promise<AuthResolution> {
  const serviceAccount = getServiceAccountCredentials();
  const staticToken = process.env.GCP_ACCESS_TOKEN || process.env.VERTEX_ACCESS_TOKEN;

  if (serviceAccount) {
    try {
      const token = await getAccessTokenViaServiceAccount(serviceAccount);
      return { token, source: 'service-account' };
    } catch (error: any) {
      if (!staticToken) {
        return { token: '', source: 'none', error: `Service Account auth failed: ${error.message}` };
      }
    }
  }

  const oidcHeader = req?.headers?.get('x-vercel-oidc-token');
  const oidcToken = oidcHeader || process.env.VERCEL_OIDC_TOKEN || '';
  const projectNumber = process.env.GCP_PROJECT_NUMBER || '533162648452';
  const poolId = process.env.GCP_WIF_POOL_ID || 'gramiq-vercel-pool';
  const providerId = process.env.GCP_WIF_PROVIDER_ID || 'gramiq-vercel-provider';

  if (oidcToken && projectNumber) {
    try {
      const token = await getAccessTokenViaWIF(oidcToken, projectNumber, poolId, providerId);
      return { token, source: 'vercel-wif' };
    } catch (error: any) {
      if (!staticToken) {
        return { token: '', source: 'none', error: `WIF auth failed: ${error.message}` };
      }
    }
  }

  if (staticToken) {
    return { token: staticToken, source: 'static-token' };
  }

  return { token: '', source: 'none' };
}
