export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const activeUser = process.env.SMTP_USER || process.env.VITE_SMTP_USER || 'admin@geonixa.com';
  const activePass = process.env.SMTP_PASS || process.env.VITE_SMTP_PASS || '';
  const host = process.env.SMTP_HOST || '';
  const port = process.env.SMTP_PORT || '465';

  return res.status(200).json({
    senderEmail: activeUser,
    senderName: 'Talent Acquisition Team',
    service: host ? 'custom' : 'gmail',
    host,
    port,
    configured: Boolean(activePass && activeUser)
  });
}
