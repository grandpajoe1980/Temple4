const nodemailer = require('nodemailer');

async function main() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `${user}`;
  const to = process.argv[2] || process.env.TO || 'joe.skaggs@la.gov';

  if (!host || !user || !pass) {
    console.error('Missing SMTP env vars. Set SMTP_HOST, SMTP_USER, SMTP_PASS.');
    process.exit(1);
  }

  console.log('Using SMTP host', host, 'to send to', to);

  const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Test email from Temple (nodemailer) ',
      text: 'This is a one-off test email sent by the local send-test-email script.',
    });

    console.log('Message sent:', info.messageId || info.response);
    process.exit(0);
  } catch (err) {
    console.error('Failed to send email:', err && err.message ? err.message : err);
    process.exit(2);
  }
}

main();
