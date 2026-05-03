// features/gigs/gigController.js
// CHANGES FROM ORIGINAL:
//   1. import notifService at the top
//   2. accept()         → calls notifyApplicationAccepted + notifyApplicationRejected for each rejected student
//   3. withdraw()       → calls notifyApplicationWithdrawn to alert the client
//   4. changeGigStatus() → calls notifyGigCancelled when status = 'cancelled' or 'paused'
//   5. apply()          → calls notifyNewApplication to alert the client
// everything else is identical to your original gigController.js

const {
  getAllOpenGigs, getMatchedGigs, getGigByID, getGigsByClient,
  createGig, updateGig, updateGigStatus, deleteGig,
  getApplicationsByGig, getApplicationsByStudent,
  computeMatchScore, applyToGig, hasApplied,
  acceptApplication, withdrawApplication,
} = require('./gigModel');

const { findUserByEmail } = require('../auth/authModel');
const { admin }           = require('../../config/firebase');

// ─── NEW: notification service ────────────────────────────────────────────────
const {
  notifyApplicationAccepted,
  notifyApplicationRejected,
  notifyGigCancelled,
  notifyNewApplication,
  notifyApplicationWithdrawn,
} = require('../notifications/notifService');

const VALID_CATEGORIES = ['Development', 'Design', 'Writing', 'Data', 'Marketing', 'Video', 'Other'];

// ─── HELPER ───────────────────────────────────────────────────────────────────
const getVerifiedUser = async (req) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];
  if (!token) throw { status: 401, message: 'firebase token required.' };

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch {
    throw { status: 401, message: 'invalid or expired token.' };
  }

  if (!decoded.email_verified) {
    throw { status: 403, message: 'please verify your email first.' };
  }

  const user = await findUserByEmail(decoded.email);
  if (!user)         throw { status: 404, message: 'user not found.' };
  if (user.IsBanned) throw { status: 403, message: 'account suspended.' };
  return user;
};

// ─── GET /api/gigs ─────────────────────────────────────────────────────────────
const listOpenGigs = async (req, res) => {
  try {
    res.json({ gigs: await getAllOpenGigs() });
  } catch (err) {
    console.error('listOpenGigs error:', err.message);
    res.status(500).json({ error: 'could not fetch gigs.' });
  }
};

// ─── GET /api/gigs/matched ─────────────────────────────────────────────────────
const listMatchedGigs = async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (user.Role !== 'student') return res.status(403).json({ error: 'students only.' });
    res.json({ gigs: await getMatchedGigs(user.UserID) });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'could not fetch matched gigs.' });
  }
};

// ─── GET /api/gigs/my ──────────────────────────────────────────────────────────
const listMyGigs = async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (user.Role !== 'client') return res.status(403).json({ error: 'clients only.' });
    res.json({ gigs: await getGigsByClient(user.UserID) });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'could not fetch your gigs.' });
  }
};

// ─── GET /api/gigs/:id ─────────────────────────────────────────────────────────
const getGig = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'invalid gig id.' });
    const gig = await getGigByID(id);
    if (!gig) return res.status(404).json({ error: 'gig not found.' });
    res.json({ gig });
  } catch (err) {
    res.status(500).json({ error: 'could not fetch gig.' });
  }
};

// ─── POST /api/gigs ────────────────────────────────────────────────────────────
const postGig = async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (user.Role !== 'client') return res.status(403).json({ error: 'clients only.' });

    const { title, description, budget, deadline, category, requiredSkills } = req.body;

    if (!title || title.trim().length < 5)
      return res.status(400).json({ error: 'title must be at least 5 characters.' });
    if (!deadline)
      return res.status(400).json({ error: 'deadline is required.' });
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date())
      return res.status(400).json({ error: 'deadline must be a future date.' });
    if (budget !== undefined && budget !== '' && (isNaN(budget) || parseFloat(budget) < 0))
      return res.status(400).json({ error: 'budget must be a positive number.' });
    if (category && !VALID_CATEGORIES.includes(category))
      return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}.` });

    const gigID = await createGig({
      clientID:       user.UserID,
      title:          title.trim(),
      description:    description?.trim() || null,
      budget:         budget ? parseFloat(budget) : null,
      deadline,
      category:       category || null,
      requiredSkills: requiredSkills?.trim() || null,
    });

    res.status(201).json({ message: 'gig posted successfully.', gigID });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'could not post gig.' });
  }
};

// ─── PUT /api/gigs/:id ─────────────────────────────────────────────────────────
const editGig = async (req, res) => {
  try {
    const user  = await getVerifiedUser(req);
    if (user.Role !== 'client') return res.status(403).json({ error: 'clients only.' });

    const gigID = parseInt(req.params.id);
    if (isNaN(gigID)) return res.status(400).json({ error: 'invalid gig id.' });

    const { title, description, budget, deadline, category, requiredSkills } = req.body;

    if (!title || title.trim().length < 5)
      return res.status(400).json({ error: 'title must be at least 5 characters.' });
    if (deadline) {
      const d = new Date(deadline);
      if (isNaN(d.getTime()) || d <= new Date())
        return res.status(400).json({ error: 'deadline must be a future date.' });
    }
    if (budget !== undefined && budget !== '' && (isNaN(budget) || parseFloat(budget) < 0))
      return res.status(400).json({ error: 'budget must be a positive number.' });
    if (category && !VALID_CATEGORIES.includes(category))
      return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}.` });

    const rows = await updateGig(gigID, user.UserID, {
      title: title.trim(), description, budget, deadline, category, requiredSkills,
    });

    if (!rows) return res.status(404).json({ error: 'gig not found, not yours, or cannot be edited.' });
    res.json({ message: 'gig updated.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'could not update gig.' });
  }
};

// ─── PATCH /api/gigs/:id/status ────────────────────────────────────────────────
// CHANGE: added notification calls for 'paused' and 'cancelled' transitions
const changeGigStatus = async (req, res) => {
  try {
    const user  = await getVerifiedUser(req);
    if (user.Role !== 'client') return res.status(403).json({ error: 'clients only.' });

    const gigID = parseInt(req.params.id);
    if (isNaN(gigID)) return res.status(400).json({ error: 'invalid gig id.' });

    const { status } = req.body;
    const allowed = ['paused', 'open', 'cancelled'];
    if (!status || !allowed.includes(status))
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}.` });

    const gig = await getGigByID(gigID);
    if (!gig)                         return res.status(404).json({ error: 'gig not found.' });
    if (gig.ClientID !== user.UserID) return res.status(403).json({ error: 'not your gig.' });

    if (status === 'paused'    && gig.Status !== 'open')
      return res.status(400).json({ error: 'only open gigs can be paused.' });
    if (status === 'open'      && gig.Status !== 'paused')
      return res.status(400).json({ error: 'only paused gigs can be resumed.' });
    if (status === 'cancelled' && ['completed', 'cancelled'].includes(gig.Status))
      return res.status(400).json({ error: 'this gig cannot be closed.' });

    const rows = await updateGigStatus(gigID, user.UserID, status);
    if (!rows) return res.status(404).json({ error: 'could not update gig status.' });

    // ── NOTIFICATION: send email to client + any accepted/applied student ──────
    if (status === 'paused' || status === 'cancelled') {
      try {
        // find if there's an accepted student (gig in_progress) or pending applications
        const applications = await getApplicationsByGig(gigID);
        const accepted     = applications.find(a => a.Status === 'accepted');
        const pending      = applications.filter(a => a.Status === 'pending');

        // notify the accepted student (in_progress gig) or all pending applicants
        const studentsToNotify = accepted ? [accepted] : pending;

        for (const app of studentsToNotify) {
          // get full user info for the student
          const { findUserByEmail: findUser } = require('../auth/authModel');
          const { poolPromise, sql } = require('../../config/db');
          const pool = await poolPromise;
          const studentResult = await pool.request()
            .input('studentID', sql.Int, app.StudentID)
            .query(`select Email, FullName from Users where UserID = @studentID`);
          const student = studentResult.recordset[0];

          if (student) {
            await notifyGigCancelled({
              studentEmail:  student.Email,
              studentName:   student.FullName,
              studentUserID: app.StudentID,
              clientEmail:   user.Email,
              clientName:    user.FullName,
              clientUserID:  user.UserID,
              gigTitle:      gig.Title,
              gigID,
              reason:        status, // 'paused' or 'cancelled'
            });
          }
        }

        // if no students — still notify client only (no student arg passed)
        if (studentsToNotify.length === 0) {
          await notifyGigCancelled({
            studentEmail:  null,
            studentName:   null,
            studentUserID: null,
            clientEmail:   user.Email,
            clientName:    user.FullName,
            clientUserID:  user.UserID,
            gigTitle:      gig.Title,
            gigID,
            reason:        status,
          });
        }
      } catch (notifErr) {
        // never crash the status update because a notification failed
        console.error('notification error (changeGigStatus):', notifErr.message);
      }
    }

    const messages = {
      paused:    'gig paused. it is now hidden from students.',
      open:      'gig resumed. students can apply again.',
      cancelled: 'gig closed permanently.',
    };
    res.json({ message: messages[status] });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'could not update gig status.' });
  }
};

// ─── DELETE /api/gigs/:id ──────────────────────────────────────────────────────
const removeGig = async (req, res) => {
  try {
    const user  = await getVerifiedUser(req);
    if (user.Role !== 'client') return res.status(403).json({ error: 'clients only.' });

    const gigID = parseInt(req.params.id);
    if (isNaN(gigID)) return res.status(400).json({ error: 'invalid gig id.' });

    const gig = await getGigByID(gigID);
    if (!gig)                         return res.status(404).json({ error: 'gig not found.' });
    if (gig.ClientID !== user.UserID) return res.status(403).json({ error: 'not your gig.' });

    if (!['open', 'paused'].includes(gig.Status))
      return res.status(400).json({ error: 'only open or paused gigs can be permanently deleted.' });

    const deleted = await deleteGig(gigID, user.UserID);
    if (!deleted)
      return res.status(400).json({ error: 'cannot delete a gig that already has an accepted applicant.' });

    res.json({ message: 'gig permanently deleted.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'could not delete gig.' });
  }
};

// ─── GET /api/gigs/:id/applications ───────────────────────────────────────────
const listApplications = async (req, res) => {
  try {
    const user  = await getVerifiedUser(req);
    if (user.Role !== 'client') return res.status(403).json({ error: 'clients only.' });

    const gigID = parseInt(req.params.id);
    if (isNaN(gigID)) return res.status(400).json({ error: 'invalid gig id.' });

    const gig = await getGigByID(gigID);
    if (!gig)                         return res.status(404).json({ error: 'gig not found.' });
    if (gig.ClientID !== user.UserID) return res.status(403).json({ error: 'not your gig.' });

    res.json({ applications: await getApplicationsByGig(gigID) });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'could not fetch applications.' });
  }
};

// ─── GET /api/gigs/applications/mine ──────────────────────────────────────────
const myApplications = async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (user.Role !== 'student') return res.status(403).json({ error: 'students only.' });
    res.json({ applications: await getApplicationsByStudent(user.UserID) });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'could not fetch your applications.' });
  }
};

// ─── POST /api/gigs/:id/apply ─────────────────────────────────────────────────
// CHANGE: added notifyNewApplication after successful insert
const apply = async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (user.Role !== 'student') return res.status(403).json({ error: 'students only.' });

    const gigID = parseInt(req.params.id);
    if (isNaN(gigID)) return res.status(400).json({ error: 'invalid gig id.' });

    const gig = await getGigByID(gigID);
    if (!gig)                  return res.status(404).json({ error: 'gig not found.' });
    if (gig.Status !== 'open') return res.status(400).json({ error: 'this gig is no longer accepting applications.' });

    if (await hasApplied(gigID, user.UserID))
      return res.status(409).json({ error: 'you already applied to this gig.' });

    const { coverLetter } = req.body;
    const matchScore      = await computeMatchScore(gigID, user.UserID);

    const applicationID = await applyToGig({
      gigID,
      studentID:   user.UserID,
      coverLetter: coverLetter || null,
      matchScore,
    });

    // ── NOTIFICATION: tell the client someone applied ──────────────────────────
    try {
      const { poolPromise, sql } = require('../../config/db');
      const pool = await poolPromise;
      const clientResult = await pool.request()
        .input('clientID', sql.Int, gig.ClientID)
        .query(`select Email, FullName, UserID from Users where UserID = @clientID`);
      const client = clientResult.recordset[0];

      if (client) {
        await notifyNewApplication({
          clientEmail:   client.Email,
          clientName:    client.FullName,
          clientUserID:  client.UserID,
          studentName:   user.FullName,
          gigTitle:      gig.Title,
          gigID,
        });
      }
    } catch (notifErr) {
      console.error('notification error (apply):', notifErr.message);
    }

    res.status(201).json({ message: 'application submitted.', applicationID, matchScore });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'could not submit application.' });
  }
};

// ─── PATCH /api/gigs/applications/:appID/accept ───────────────────────────────
// CHANGE: added notifyApplicationAccepted (for accepted student) and
//         notifyApplicationRejected (for each rejected student)
const accept = async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (user.Role !== 'client') return res.status(403).json({ error: 'clients only.' });

    const { gigID } = req.body;
    if (!gigID) return res.status(400).json({ error: 'gigID is required.' });

    const gig = await getGigByID(parseInt(gigID));
    if (!gig)                         return res.status(404).json({ error: 'gig not found.' });
    if (gig.ClientID !== user.UserID) return res.status(403).json({ error: 'not your gig.' });
    if (gig.Status !== 'open')        return res.status(400).json({ error: 'gig is no longer open.' });

    const appID = parseInt(req.params.appID);

    // get all applications BEFORE accepting (so we can email all parties)
    const applications = await getApplicationsByGig(parseInt(gigID));
    const acceptedApp  = applications.find(a => a.ApplicationID === appID);
    const rejectedApps = applications.filter(a => a.ApplicationID !== appID && a.Status === 'pending');

    // run the acceptance transaction
    await acceptApplication(appID, parseInt(gigID));

    // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
    try {
      const { poolPromise, sql } = require('../../config/db');
      const pool = await poolPromise;

      // get accepted student email
      if (acceptedApp) {
        const acceptedStudentResult = await pool.request()
          .input('studentID', sql.Int, acceptedApp.StudentID)
          .query(`select Email, FullName from Users where UserID = @studentID`);
        const acceptedStudent = acceptedStudentResult.recordset[0];

        if (acceptedStudent) {
          await notifyApplicationAccepted({
            studentEmail:  acceptedStudent.Email,
            studentName:   acceptedStudent.FullName,
            studentUserID: acceptedApp.StudentID,
            clientEmail:   user.Email,
            clientName:    user.FullName,
            clientUserID:  user.UserID,
            gigTitle:      gig.Title,
            gigID:         parseInt(gigID),
          });
        }
      }

      // email all rejected students
      for (const app of rejectedApps) {
        const rejectedStudentResult = await pool.request()
          .input('studentID', sql.Int, app.StudentID)
          .query(`select Email, FullName from Users where UserID = @studentID`);
        const rejectedStudent = rejectedStudentResult.recordset[0];

        if (rejectedStudent) {
          await notifyApplicationRejected({
            studentEmail:  rejectedStudent.Email,
            studentName:   rejectedStudent.FullName,
            studentUserID: app.StudentID,
            gigTitle:      gig.Title,
            gigID:         parseInt(gigID),
          });
        }
      }
    } catch (notifErr) {
      // never block the accept response because notifications failed
      console.error('notification error (accept):', notifErr.message);
    }

    res.json({ message: 'application accepted. gig is now in progress.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'could not accept application.' });
  }
};

// ─── PATCH /api/gigs/applications/:appID/withdraw ─────────────────────────────
// CHANGE: added notifyApplicationWithdrawn to alert the client
const withdraw = async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (user.Role !== 'student') return res.status(403).json({ error: 'students only.' });

    const appID = parseInt(req.params.appID);

    // get application details before withdrawing (to notify client)
    const { poolPromise, sql } = require('../../config/db');
    const pool = await poolPromise;
    const appResult = await pool.request()
      .input('appID', sql.Int, appID)
      .query(`
        select a.GigID, g.Title, g.ClientID, u.Email as ClientEmail, u.FullName as ClientName, u.UserID as ClientUserID
        from Applications a
        join Gigs  g on a.GigID    = g.GigID
        join Users u on g.ClientID = u.UserID
        where a.ApplicationID = @appID and a.StudentID = @studentID
      `);
    // re-query with studentID bound
    const appResult2 = await pool.request()
      .input('appID',     sql.Int, appID)
      .input('studentID', sql.Int, user.UserID)
      .query(`
        select a.GigID, g.Title, g.ClientID, u.Email as ClientEmail, u.FullName as ClientName, u.UserID as ClientUserID
        from Applications a
        join Gigs  g on a.GigID    = g.GigID
        join Users u on g.ClientID = u.UserID
        where a.ApplicationID = @appID and a.StudentID = @studentID
      `);
    const appInfo = appResult2.recordset[0];

    await withdrawApplication(appID, user.UserID);

    // ── NOTIFICATION: tell the client ─────────────────────────────────────────
    if (appInfo) {
      try {
        await notifyApplicationWithdrawn({
          clientEmail:   appInfo.ClientEmail,
          clientName:    appInfo.ClientName,
          clientUserID:  appInfo.ClientUserID,
          studentName:   user.FullName,
          gigTitle:      appInfo.Title,
        });
      } catch (notifErr) {
        console.error('notification error (withdraw):', notifErr.message);
      }
    }

    res.json({ message: 'application withdrawn.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'could not withdraw application.' });
  }
};

module.exports = {
  listOpenGigs, listMatchedGigs, listMyGigs, getGig,
  postGig, editGig, changeGigStatus, removeGig,
  listApplications, myApplications,
  apply, accept, withdraw,
};