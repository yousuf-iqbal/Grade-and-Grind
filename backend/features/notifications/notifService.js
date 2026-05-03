// features/notifications/notifService.js
// the single file you call from any controller to send a notification
// it does TWO things at once: sends email + saves in-app notification to DB
// if email fails, the in-app notification still saves (graceful degradation)

const transporter          = require('../../config/mailer');
const { createNotification } = require('./notifModel');

const FROM = `"Grade & Grind" <${process.env.GMAIL_USER}>`;
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── INTERNAL HELPER ──────────────────────────────────────────────────────────

const send = async ({ to, subject, html, userID, title, message, type }) => {
  // 1. save in-app notification (always, even if email fails)
  try {
    await createNotification({ userID, title, message, type });
  } catch (dbErr) {
    console.error('notif DB save failed:', dbErr.message);
  }

  // 2. send email (fail silently so it never crashes a controller)
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (mailErr) {
    console.error('email send failed:', mailErr.message);
    // not re-thrown — a failed email should never break the gig workflow
  }
};

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────

const wrap = (body) => `
  <div style="font-family:system-ui,sans-serif;max-width:540px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden">
    <div style="background:#111;padding:18px 28px;display:flex;align-items:center;gap:10px">
      <span style="font-size:18px;font-weight:800;color:#fff">Grade <span style="color:#f59e0b">&</span> Grind</span>
    </div>
    <div style="padding:28px">
      ${body}
    </div>
    <div style="background:#f9f9f9;padding:14px 28px;font-size:12px;color:#888;border-top:1px solid #eee">
      You received this email because you have an account on Grade & Grind. 
      <a href="${BASE_URL}" style="color:#f59e0b">Visit the platform</a>
    </div>
  </div>
`;

const btn = (text, href) =>
  `<a href="${href}" style="display:inline-block;margin-top:18px;padding:11px 22px;background:#f59e0b;color:#000;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px">${text}</a>`;

const pill = (text, color) =>
  `<span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;background:${color}22;color:${color};border:1px solid ${color}44">${text}</span>`;

// ─── EXPORTED NOTIFICATION FUNCTIONS ─────────────────────────────────────────
// Call these directly from gigController.js where the events happen

// ── 1. Application accepted → notify student AND client ───────────────────────
const notifyApplicationAccepted = async ({
  studentEmail, studentName, studentUserID,
  clientEmail,  clientName,  clientUserID,
  gigTitle, gigID,
}) => {
  // to student
  await send({
    to:      studentEmail,
    subject: `🎉 Your application was accepted — ${gigTitle}`,
    html: wrap(`
      <h2 style="margin:0 0 6px;color:#111">Your application was accepted!</h2>
      <p style="color:#555;margin:0 0 16px">Hi ${studentName},</p>
      <p style="color:#555">Your application for the gig <strong>${gigTitle}</strong> has been accepted. 
      The gig is now <strong>in progress</strong>.</p>
      <p style="color:#555">The client will be in touch shortly. You can view the gig details below.</p>
      ${btn('View gig', `${BASE_URL}/gigs/${gigID}`)}
    `),
    userID:  studentUserID,
    title:   'Application Accepted',
    message: `Your application for "${gigTitle}" has been accepted! The gig is now in progress.`,
    type:    'application',
  });

  // to client
  await send({
    to:      clientEmail,
    subject: `✅ You accepted an applicant — ${gigTitle}`,
    html: wrap(`
      <h2 style="margin:0 0 6px;color:#111">Applicant accepted</h2>
      <p style="color:#555;margin:0 0 16px">Hi ${clientName},</p>
      <p style="color:#555">You have accepted <strong>${studentName}</strong> for the gig <strong>${gigTitle}</strong>. 
      The gig status has been updated to <strong>in progress</strong>. 
      All other applicants have been notified.</p>
      ${btn('View gig', `${BASE_URL}/gigs/${gigID}`)}
    `),
    userID:  clientUserID,
    title:   'Applicant Accepted',
    message: `You accepted ${studentName} for "${gigTitle}". The gig is now in progress.`,
    type:    'application',
  });
};

// ── 2. Application rejected → notify the rejected student only ────────────────
const notifyApplicationRejected = async ({
  studentEmail, studentName, studentUserID,
  gigTitle, gigID,
}) => {
  await send({
    to:      studentEmail,
    subject: `Update on your application — ${gigTitle}`,
    html: wrap(`
      <h2 style="margin:0 0 6px;color:#111">Application update</h2>
      <p style="color:#555;margin:0 0 16px">Hi ${studentName},</p>
      <p style="color:#555">Unfortunately your application for <strong>${gigTitle}</strong> was not selected this time.
      Don't be discouraged — keep building your profile and applying to new gigs.</p>
      ${btn('Browse open gigs', `${BASE_URL}/dashboard`)}
    `),
    userID:  studentUserID,
    title:   'Application Not Selected',
    message: `Your application for "${gigTitle}" was not selected. Keep applying!`,
    type:    'application',
  });
};

// ── 3. Gig cancelled/stopped by client → notify both parties ─────────────────
const notifyGigCancelled = async ({
  studentEmail, studentName, studentUserID,
  clientEmail,  clientName,  clientUserID,
  gigTitle, gigID,
  reason, // 'cancelled' or 'paused'
}) => {
  const isPaused = reason === 'paused';

  const subjectStudent = isPaused
    ? `Gig paused — ${gigTitle}`
    : `Gig cancelled — ${gigTitle}`;

  const bodyStudent = isPaused
    ? `The gig <strong>${gigTitle}</strong> has been temporarily paused by the client. 
       No action is needed from you right now. You will be notified when it resumes.`
    : `The gig <strong>${gigTitle}</strong> has been closed by the client. 
       We're sorry for the inconvenience. Check out other open gigs on the platform.`;

  const bodyClient = isPaused
    ? `You have paused the gig <strong>${gigTitle}</strong>. Students will not be able to apply while it is paused.`
    : `You have closed the gig <strong>${gigTitle}</strong>. All pending applications have been cancelled.`;

  // to student (only notify if a student was involved — i.e. gig was in_progress or had applications)
  if (studentEmail) {
    await send({
      to:      studentEmail,
      subject: subjectStudent,
      html: wrap(`
        <h2 style="margin:0 0 6px;color:#111">${isPaused ? 'Gig paused' : 'Gig cancelled'}</h2>
        <p style="color:#555;margin:0 0 16px">Hi ${studentName},</p>
        <p style="color:#555">${bodyStudent}</p>
        ${isPaused ? '' : btn('Browse open gigs', `${BASE_URL}/dashboard`)}
      `),
      userID:  studentUserID,
      title:   isPaused ? 'Gig Paused' : 'Gig Cancelled',
      message: isPaused
        ? `The gig "${gigTitle}" has been paused by the client.`
        : `The gig "${gigTitle}" has been cancelled by the client.`,
      type: 'gig',
    });
  }

  // to client
  await send({
    to:      clientEmail,
    subject: isPaused ? `Gig paused — ${gigTitle}` : `Gig closed — ${gigTitle}`,
    html: wrap(`
      <h2 style="margin:0 0 6px;color:#111">${isPaused ? 'Gig paused' : 'Gig closed'}</h2>
      <p style="color:#555;margin:0 0 16px">Hi ${clientName},</p>
      <p style="color:#555">${bodyClient}</p>
      ${btn('View your gigs', `${BASE_URL}/dashboard`)}
    `),
    userID:  clientUserID,
    title:   isPaused ? 'Gig Paused' : 'Gig Closed',
    message: bodyClient.replace(/<[^>]+>/g, ''),
    type:    'gig',
  });
};

// ── 4. New application received → notify client ───────────────────────────────
const notifyNewApplication = async ({
  clientEmail, clientName, clientUserID,
  studentName, gigTitle, gigID,
}) => {
  await send({
    to:      clientEmail,
    subject: `New applicant for your gig — ${gigTitle}`,
    html: wrap(`
      <h2 style="margin:0 0 6px;color:#111">New application received</h2>
      <p style="color:#555;margin:0 0 16px">Hi ${clientName},</p>
      <p style="color:#555"><strong>${studentName}</strong> has applied to your gig <strong>${gigTitle}</strong>.
      Review their application and match score on the platform.</p>
      ${btn('View applicants', `${BASE_URL}/dashboard`)}
    `),
    userID:  clientUserID,
    title:   'New Application',
    message: `${studentName} applied to your gig "${gigTitle}".`,
    type:    'application',
  });
};

// ── 5. Application withdrawn → notify client ──────────────────────────────────
const notifyApplicationWithdrawn = async ({
  clientEmail, clientName, clientUserID,
  studentName, gigTitle,
}) => {
  await send({
    to:      clientEmail,
    subject: `Application withdrawn — ${gigTitle}`,
    html: wrap(`
      <h2 style="margin:0 0 6px;color:#111">Application withdrawn</h2>
      <p style="color:#555;margin:0 0 16px">Hi ${clientName},</p>
      <p style="color:#555"><strong>${studentName}</strong> has withdrawn their application from the gig 
      <strong>${gigTitle}</strong>.</p>
      ${btn('View applicants', `${BASE_URL}/dashboard`)}
    `),
    userID:  clientUserID,
    title:   'Application Withdrawn',
    message: `${studentName} withdrew their application from "${gigTitle}".`,
    type:    'application',
  });
};

module.exports = {
  notifyApplicationAccepted,
  notifyApplicationRejected,
  notifyGigCancelled,
  notifyNewApplication,
  notifyApplicationWithdrawn,
};