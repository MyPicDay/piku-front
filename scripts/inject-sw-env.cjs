// Generates public/firebase-messaging-sw.js from template with env variables
// Works on Windows/macOS/Linux without extra deps (no dotenv)

const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    const out = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

function loadEnv() {
  const cwd = process.cwd();
  const env = { ...process.env };
  const envPath = path.join(cwd, '.env');
  const envLocalPath = path.join(cwd, '.env.local');
  const envProdPath = path.join(cwd, '.env.production');
  // .env then override with .env.local
  Object.assign(env, parseEnvFile(envPath));
  Object.assign(env, parseEnvFile(envLocalPath));
  Object.assign(env, parseEnvFile(envProdPath));
  return env;
}

function ensure(value, name, { strict }) {
  if (value == null || value === '') {
    console.warn(`[inject-sw-env] 경고: ${name}가 비어 있어 빈 문자열로 대체합니다.`);
    return '';
  }
  return value;
}

function generate() {
  const env = loadEnv();
  const lifecycle = process.env.npm_lifecycle_event || '';
  const strict = lifecycle === 'prebuild';

  const requiredKeys = [
    'NEXT_PUBLIC_FCM_API_KEY',
    'NEXT_PUBLIC_FCM_AUTH_DOMAIN',
    'NEXT_PUBLIC_FCM_PROJECT_ID',
    'NEXT_PUBLIC_FCM_STORAGE_BUCKET',
    'NEXT_PUBLIC_FCM_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FCM_APP_ID',
  ];

  const values = {};
  for (const k of requiredKeys) {
    values[k] = ensure(env[k], k, { strict });
  }

  const templatePath = path.join(process.cwd(), 'public', 'firebase-messaging-sw.template.js');
  const outputPath = path.join(process.cwd(), 'public', 'firebase-messaging-sw.js');

  const template = fs.readFileSync(templatePath, 'utf8');
  const replaced = template
    .replace(/__FIREBASE_API_KEY__/g, values.NEXT_PUBLIC_FCM_API_KEY)
    .replace(/__FIREBASE_AUTH_DOMAIN__/g, values.NEXT_PUBLIC_FCM_AUTH_DOMAIN)
    .replace(/__FIREBASE_PROJECT_ID__/g, values.NEXT_PUBLIC_FCM_PROJECT_ID)
    .replace(/__FIREBASE_STORAGE_BUCKET__/g, values.NEXT_PUBLIC_FCM_STORAGE_BUCKET)
    .replace(/__FIREBASE_MESSAGING_SENDER_ID__/g, values.NEXT_PUBLIC_FCM_MESSAGING_SENDER_ID)
    .replace(/__FIREBASE_APP_ID__/g, values.NEXT_PUBLIC_FCM_APP_ID);

  const banner = '/* This file is generated from firebase-messaging-sw.template.js. Do not edit directly. */\n';
  fs.writeFileSync(outputPath, banner + replaced, 'utf8');

  console.log('Generated public/firebase-messaging-sw.js');
}

try {
  generate();
} catch (err) {
  console.error('[inject-sw-env] 실패:', err.message);
  process.exit(1);
}


