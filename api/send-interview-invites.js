import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      driveTitle,
      collegeName,
      jobRole,
      interviewDate,
      meetLink,
      interviewer,
      scheduledList
    } = req.body || {};

    if (!Array.isArray(scheduledList) || scheduledList.length === 0) {
      return res.status(400).json({ error: 'No candidates provided in scheduledList' });
    }

    const user = (process.env.SMTP_USER || process.env.VITE_SMTP_USER || 'admin@geonixa.com').trim();
    const pass = (process.env.SMTP_PASS || process.env.VITE_SMTP_PASS || 'idug jfit skya kwla').trim();
    const cleanPass = pass.replace(/\s+/g, '');
    const senderName = process.env.SMTP_SENDER_NAME || 'Talent Acquisition Team';

    const host = (process.env.SMTP_HOST || '').trim();
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const secure = process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === 'true'
      : (port === 465);

    let transporter = null;
    if (cleanPass && user) {
      if (host) {
        transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass: cleanPass },
          tls: { rejectUnauthorized: false }
        });
      } else {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user, pass: cleanPass }
        });
      }
    }

    const results = [];
    for (const item of scheduledList) {
      const student = item.student || {};
      const recipientEmail = student.email;
      const recipientName = student.name || 'Candidate';
      const slotString = item.slotString || `${item.startFormatted} - ${item.endFormatted}` || 'Assigned Time Slot';

      if (!recipientEmail || !recipientEmail.includes('@')) {
        results.push({ email: recipientEmail, name: recipientName, status: 'SKIPPED', reason: 'No valid email address' });
        continue;
      }

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          <div style="background: #154360; color: #ffffff; padding: 22px 24px; text-align: center; border-bottom: 4px solid #FFDB58;">
            <span style="background: #FFDB58; color: #154360; font-weight: 800; font-size: 11px; padding: 3px 10px; border-radius: 12px; text-transform: uppercase;">Campus Recruitment</span>
            <h2 style="margin: 8px 0 0; font-size: 20px; font-weight: 800; color: #ffffff;">Google Meet Interview Invitation</h2>
            <div style="font-size: 13px; color: #e2e8f0; margin-top: 4px;">${driveTitle || 'Campus Placement Drive'} • ${collegeName || ''}</div>
          </div>

          <div style="padding: 24px; color: #334155; line-height: 1.5;">
            <p style="font-size: 15px; margin-top: 0;">Dear <strong>${recipientName}</strong> (${student.rollNumber || 'Candidate'}),</p>
            <p style="font-size: 14px;">We are pleased to invite you for your Campus Placement Interview for <strong>${jobRole || 'Engineering & Operations'}</strong>.</p>

            <div style="background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 10px; padding: 18px; margin: 20px 0; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Your Allotted Interview Slot</div>
              <div style="font-size: 24px; font-weight: 800; color: #15803d; margin: 6px 0;">⏰ ${slotString}</div>
              <div style="font-size: 13px; font-weight: 600; color: #14532d;">📅 Date: ${interviewDate}</div>
            </div>

            <div style="text-align: center; margin: 24px 0 16px;">
              <a href="${meetLink}" target="_blank" style="display: inline-block; background: #154360; color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 8px rgba(21, 67, 96, 0.25);">
                🎥 Join Google Meet Interview Room
              </a>
              <div style="font-size: 11px; color: #64748b; margin-top: 8px;">
                Direct Link: <a href="${meetLink}" style="color: #0284c7;">${meetLink}</a>
              </div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-top: 20px; font-size: 12px; color: #475569;">
              <div style="font-weight: 700; color: #154360; margin-bottom: 4px;">📋 Important Candidate Guidelines:</div>
              <ul style="margin: 0; padding-left: 18px;">
                <li>Interviewer / Panel: <strong>${interviewer || 'Talent Acquisition Team'}</strong></li>
                <li>Join the Google Meet at least <strong>5 minutes before</strong> your designated slot.</li>
                <li>Keep your camera turned ON and microphone muted until requested.</li>
                <li>Have your resume and project documentation handy.</li>
              </ul>
            </div>
          </div>

          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 20px; text-align: center; font-size: 11px; color: #94a3b8;">
            Sent via TalentConnect TA CRM • Talent Acquisition Operations
          </div>
        </div>
      `;

      if (transporter) {
        try {
          await transporter.sendMail({
            from: `"${senderName}" <${user}>`,
            to: recipientEmail,
            subject: `Interview Invitation: ${driveTitle || 'Campus Drive'} - ${recipientName} (${slotString})`,
            html: htmlContent
          });
          results.push({ email: recipientEmail, name: recipientName, status: 'SENT' });
        } catch (sendErr) {
          results.push({ email: recipientEmail, name: recipientName, status: 'FAILED', error: sendErr.message });
        }
      } else {
        results.push({
          email: recipientEmail,
          name: recipientName,
          status: 'QUEUED_NO_SMTP',
          message: 'SMTP credentials missing or incomplete'
        });
      }
    }

    return res.status(200).json({
      success: true,
      senderEmail: user,
      total: scheduledList.length,
      sentCount: results.filter(r => r.status === 'SENT').length,
      failedCount: results.filter(r => r.status === 'FAILED').length,
      results
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
