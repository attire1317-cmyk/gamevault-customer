// Optional email through Resend (https://resend.com). Without RESEND_API_KEY and MAIL_FROM nothing is sent
// and customers still get the in-app notification bell.
export const mailEnabled = () => !!(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

export async function sendMail({ to, subject, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, text }),
  });
  if (!res.ok) throw new Error(`mail ${res.status}`);
}
