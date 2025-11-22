const nodemailer = require('nodemailer');

async function main() {
  // Create a test account on Ethereal
  const testAccount = await nodemailer.createTestAccount();

  console.log('Ethereal test account created.');
  console.log('User:', testAccount.user);

  // Create a SMTP transporter object
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const to = process.argv[2] || process.env.TO || 'recipient@example.com';

  const info = await transporter.sendMail({
    from: 'Ethereal Test <no-reply@example.com>',
    to,
    subject: 'Ethereal test message from Temple',
    text: 'This is a test email sent using Ethereal (nodemailer).',
    html: '<p>This is a test email sent using <strong>Ethereal</strong> (nodemailer).</p>',
  });

  console.log('Message sent. Message ID:', info.messageId);

  // Preview URL (Ethereal)
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('Preview URL:', previewUrl);
  } else {
    console.log('No preview URL available.');
  }
}

main().catch((err) => {
  console.error('Error sending ethereal test:', err && err.message ? err.message : err);
  process.exit(1);
});
