const fs = require('fs');
const crypto = require('crypto');

const f = JSON.parse(fs.readFileSync('secrets.encrypted.json', 'utf8'));
const envContent = fs.readFileSync('.env', 'utf8');
const pwMatch = envContent.match(/SECRETS_MASTER_PASSWORD\s*=\s*"([^"]+)"/);
if (!pwMatch) {
  console.error('Could not find SECRETS_MASTER_PASSWORD in .env');
  process.exit(1);
}
const pw = pwMatch[1];

const e = f.secrets.DATABASE_URL;
if (!e) {
  console.error('DATABASE_URL not found in secrets');
  process.exit(1);
}

const salt = Buffer.from(e.salt, 'base64');
const iv = Buffer.from(e.iv, 'base64');
const tag = Buffer.from(e.tag, 'base64');
const key = crypto.pbkdf2Sync(pw, salt, 100000, 32, 'sha512');
const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
d.setAuthTag(tag);
let out = d.update(e.data, 'base64', 'utf8');
out += d.final('utf8');
console.log('Stored DATABASE_URL:', out);
