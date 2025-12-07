const fs = require('fs');
const crypto = require('crypto');

function readEnvMaster() {
  try {
    const env = fs.readFileSync('.env','utf8');
    const m = env.match(/SECRETS_MASTER_PASSWORD\s*=\s*\"?([^\"\n]+)\"?/);
    if (m) return m[1];
  } catch (e) {}
  return process.env.SECRETS_MASTER_PASSWORD;
}

function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, Buffer.from(salt, 'base64'), 100000, 32, 'sha512');
}

function decrypt(encrypted, password) {
  const salt = Buffer.from(encrypted.salt, 'base64');
  const iv = Buffer.from(encrypted.iv, 'base64');
  const tag = Buffer.from(encrypted.tag, 'base64');
  const key = deriveKey(password, encrypted.salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  let dec = decipher.update(encrypted.data, 'base64', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

function main(){
  const pw = readEnvMaster();
  if (!pw) { console.error('SECRETS_MASTER_PASSWORD not found'); process.exit(1); }
  const file = JSON.parse(fs.readFileSync('secrets.encrypted.json','utf8'));
  const keys = ['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','SMTP_FROM'];
  const out = {};
  for (const k of keys) {
    const entry = file.secrets && file.secrets[k] ? file.secrets[k] : file[k];
    if (!entry) continue;
    try { out[k] = decrypt(entry, pw); } catch (err) { out[k] = '<decrypt error: '+err.message+'>'; }
  }
  console.log(JSON.stringify(out,null,2));
}

main();
