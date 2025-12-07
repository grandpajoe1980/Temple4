const fs = require('fs');
const crypto = require('crypto');

const SECRETS_FILE = 'secrets.encrypted.json';
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;

function getMaster() {
  try { const env = fs.readFileSync('.env','utf8'); const m = env.match(/SECRETS_MASTER_PASSWORD\s*=\s*\"?([^\"\n]+)\"?/); if (m) return m[1]; } catch (e) {}
  return process.env.SECRETS_MASTER_PASSWORD;
}

function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
}

function encryptValue(value, password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(value, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag();
  return {
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted,
    version: 1,
  };
}

function main(){
  const key = process.argv[2];
  const value = process.argv[3];
  if (!key || !value) { console.error('Usage: node set-secret.js KEY VALUE'); process.exit(1); }
  const pw = getMaster();
  if (!pw) { console.error('SECRETS_MASTER_PASSWORD not found'); process.exit(1); }
  let file = null;
  try { file = JSON.parse(fs.readFileSync(SECRETS_FILE,'utf8')); } catch (e) { file = { version:1, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), secrets:{} }; }
  file.secrets = file.secrets || {};
  file.secrets[key] = encryptValue(value, pw);
  file.updatedAt = new Date().toISOString();
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(file,null,2),'utf8');
  console.log('Stored',key);
}

main();
