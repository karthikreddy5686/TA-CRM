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
    const pass = (process.env.SMTP_PASS || process.env.VITE_SMTP_PASS || '').trim();
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

    const formatInterviewDate = (dateStr) => {
      if (!dateStr) return 'Scheduled Date';
      try {
        const parts = String(dateStr).split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const d = new Date(year, month, day);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
          }
        }
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        }
      } catch (e) {}
      return dateStr;
    };
    const formattedDate = formatInterviewDate(interviewDate);

    const results = [];
    for (const item of scheduledList) {
      const student = item.student || {};
      const recipientEmail = student.email;
      const recipientName = student.name || 'Candidate';
      const slotString = item.slotString || `${item.startFormatted} - ${item.endFormatted}` || 'Assigned Time Slot';
      const candidateJobRole = student.jobRole || jobRole || 'CGA';

      if (!recipientEmail || !recipientEmail.includes('@')) {
        results.push({ email: recipientEmail, name: recipientName, status: 'SKIPPED', reason: 'No valid email address' });
        continue;
      }

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <!-- Header Banner -->
          <div style="background: #154360; color: #ffffff; padding: 20px 24px; text-align: center; border-bottom: 3px solid #FFDB58;">
            <div style="font-size: 11px; font-weight: 700; color: #FFDB58; text-transform: uppercase; letter-spacing: 0.8px;">Campus Recruitment</div>
            <h2 style="margin: 6px 0 0; font-size: 19px; font-weight: 700; color: #ffffff; letter-spacing: -0.2px;">Interview Invitation & Schedule</h2>
            <div style="font-size: 12.5px; color: #cbd5e1; margin-top: 4px;">${driveTitle || 'Campus Placement Drive'}${collegeName ? ' • ' + collegeName : ''}</div>
          </div>

          <!-- Body Content -->
          <div style="padding: 24px; color: #334155; line-height: 1.6;">
            <p style="margin: 0 0 12px; font-size: 14.5px; color: #0f172a;">
              Dear <strong>${recipientName}</strong>${student.rollNumber ? ` (${student.rollNumber})` : ''},
            </p>
            <p style="margin: 0 0 16px; font-size: 13.5px; color: #334155; line-height: 1.6;">
              Following the campus recruitment process, we are pleased to invite you for your Technical Interview for the position of <strong>${candidateJobRole}</strong>.
            </p>

            <!-- Small, Compact Interview Details & Time Slot Table -->
            <table style="width: 100%; border-collapse: separate; border-spacing: 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 16px 0; overflow: hidden; font-size: 13px;">
              <tbody>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; width: 50%;">
                    <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Position</div>
                    <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px;">${candidateJobRole}</div>
                  </td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; width: 50%;">
                    <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Interview Mode</div>
                    <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px;">Google Meet (Video)</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-right: 1px solid #e2e8f0; width: 50%; background: #ffffff;">
                    <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Interview Date</div>
                    <div style="font-size: 13px; font-weight: 700; color: #154360; margin-top: 2px;">${formattedDate}</div>
                  </td>
                  <td style="padding: 10px 14px; width: 50%; background: #ffffff;">
                    <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Allotted Time Slot</div>
                    <div style="font-size: 13.5px; font-weight: 800; color: #0284c7; margin-top: 2px;">${slotString}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 22px 0 16px;">
              <a href="${meetLink}" target="_blank" style="display: inline-block; background: #154360; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 13.5px; padding: 11px 28px; border-radius: 6px; letter-spacing: 0.2px;">
                Join Interview Room
              </a>
              <div style="font-size: 11px; color: #64748b; margin-top: 8px;">
                Direct Link: <a href="${meetLink}" target="_blank" style="color: #0284c7; text-decoration: underline;">${meetLink}</a>
              </div>
            </div>

            <!-- Candidate Protocol & Instructions -->
            <div style="background: #f8fafc; border-left: 3px solid #154360; border-radius: 0 6px 6px 0; padding: 12px 14px; margin-top: 18px; font-size: 12px; color: #475569;">
              <div style="font-weight: 700; color: #154360; margin-bottom: 6px; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.4px;">
                Important Instructions for Candidate:
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.55; color: #334155;">
                <tbody>
                  <tr>
                    <td style="padding: 3px 0; vertical-align: top; width: 14px; color: #154360; font-weight: bold;">•</td>
                    <td style="padding: 3px 0;"><strong>Panelist:</strong> ${interviewer || 'Talent Acquisition Team'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 3px 0; vertical-align: top; width: 14px; color: #154360; font-weight: bold;">•</td>
                    <td style="padding: 3px 0;"><strong>Reporting:</strong> Please join the meeting room <strong>5 minutes prior</strong> to your scheduled slot.</td>
                  </tr>
                  <tr>
                    <td style="padding: 3px 0; vertical-align: top; width: 14px; color: #154360; font-weight: bold;">•</td>
                    <td style="padding: 3px 0;"><strong>Video & Audio:</strong> Keep your camera turned ON in a quiet, well-lit environment.</td>
                  </tr>
                  <tr>
                    <td style="padding: 3px 0; vertical-align: top; width: 14px; color: #154360; font-weight: bold;">•</td>
                    <td style="padding: 3px 0;"><strong>Documents:</strong> Have a digital copy of your resume and project portfolio ready.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Closing -->
            <p style="margin: 20px 0 0; font-size: 13px; color: #334155; line-height: 1.6;">
              We wish you the very best for your interview.<br><br>
              Warm regards,<br>
              <strong>Talent Acquisition Operations</strong><br>
              <span style="font-size: 12px; color: #64748b;">${collegeName ? collegeName + ' Placement Drive' : 'Campus Hiring Division'}</span>
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 12px 20px; text-align: center; font-size: 10.5px; color: #64748b; line-height: 1.4;">
            This is an automated recruitment communication from Talent Acquisition. Please do not reply directly to this email.
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
