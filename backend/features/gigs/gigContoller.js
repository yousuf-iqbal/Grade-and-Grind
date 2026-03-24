// features/gigs/gigController.js
// handles all gig and application related requests

const {
  getAllOpenGigs,
  getMatchedGigs,
  getGigByID,
  getGigsByClient,
  createGig,
  deleteGig,
  getApplicationsByGig,
  getApplicationsByStudent,
  applyToGig,
  hasApplied,
  acceptApplication,
  withdrawApplication,
} = require('./gigModel');

const { findUserByEmail } = require('../auth/authModel');
const { admin }           = require('../../config/firebase');

// ─── HELPER: verify firebase token and return db user ──────────────────────────
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

  const user = await findUserByEmail(decoded.email);
  if (!user)      throw { status: 404, message: 'user not found.' };
  if (user.IsBanned) throw { status: 403, message: 'account suspended.' };
  return user;
};

// ─── GET /api/gigs ─────────────────────────────────────────────────────────────
// all open gigs — student gig board
const listOpenGigs = async (req, res) => {
  try {
    const gigs = await getAllOpenGigs();
    res.json({ gigs });
  } catch (err) {
    console.error('listOpenGigs error:', err.message);
    res.status(500).json({ error: 'could not fetch gigs.' });
  }
};

// ─── GET /api/gigs/matched ─────────────────────────────────────────────────────
// skill-matched gigs for the logged-in student
const listMatchedGigs = async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (user.Role !== 'student') return res.status(403).json({ error: 'students only.' });

    const gigs = await getMatchedGigs(user.UserID);
    res.json({ gigs });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('listMatchedGigs error:', err.message);
    res.status(500).json({ error: 'could not fetch matched gigs.' });
  }
};

// ─── GET /api/gigs/my ─────────────────────────────────────────────────────────
// gigs posted by the logged-in client
const listMyGigs = async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (user.Role !== 'client') return res.status(403).json({ error: 'clients only.' });

    const gigs = await getGigsByClient(user.UserID);
    res.json({ gigs });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('listMyGigs error:', err.message);
    res.status(500).json({ error: 'could not fetch your gigs.' });
  }
};

// ─── GET /api/gigs/:id ─────────────────────────────────────────────────────────
const getGig = async (req, res) => {
  try {
    const gig = await getGigByID(parseInt(req.params.id));
    if (!gig) return res.status(404).json({ error: 'gig not found.' });
    res.json({ gig });
  } catch (err) {
    console.error('getGig error:', err.message);
    res.status(500).json({ error: 'could not fetch gig.' });
  }
};

// ─── POST /api/gigs ────────────────────────────────────────────────────────────
// client posts a new gig
const postGig = async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (user.Role !== 'client') return res.status(403).json({ error: 'clients only.' });

    const { title, description, budget, deadline, category, requiredSkills } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required.' });

    const gigID = await createGig({
      clientID: user.UserID,
      title, description, budget, deadline, category, requiredSkills,
    });

    res.status(201).json({ message: 'gig posted successfully.', gigID });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('postGig error:', err.message);
    res.status(500).json({ error: 'could not post gig.' });
  }
};

// ─── DELETE /api/gigs/:id ──────────────────────────────────────────────────────
const removeGig = async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (user.Role !== 'client') return res.status(403).json({ error: 'clients only.' });

    const deleted = await deleteGig(parseInt(req.params.id), user.UserID);
    if (!deleted) return res.status(404).json({ error: 'gig not found or cannot be deleted.' });

    res.json({ message: 'gig deleted.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('removeGig error:', err.message);
    res.status(500).json({ error: 'could not delete gig.' });
  }
};

// ─── GET /api/gigs/:id/applications ───────────────────────────────────────────
// client views applicants for their gig
const listApplications = async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (user.Role !== 'client') return res.status(403).json({ error: 'clients only.' });

    const gig = await getGigByID(parseInt(req.params.id));
    if (!gig) return res.status(404).json({ error: 'gig not found.' });
    if (gig.ClientID !== user.UserID) return res.status(403).json({ error: 'not your gig.' });

    const applications = await getApplicationsByGig(parseInt(req.params.id));
    res.json({ applications });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('listApplications error:', err.message);
    res.status(500).json({ error: 'could not fetch applications.' });
  }
};

// ─── GET /api/gigs/applications/mine ──────────────────────────────────────────
// student views their own applications
const myApplications = async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (user.Role !== 'student') return res.status(403).json({ error: 'students only.' });

    const applications = await getApplicationsByStudent(user.UserID);
    res.json({ applications });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('myApplications error:', err.message);
    res.status(500).json({ error: 'could not fetch your applications.' });
  }
};

// ─── POST /api/gigs/:id/apply ─────────────────────────────────────────────────
const apply = async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (user.Role !== 'student') return res.status(403).json({ error: 'students only.' });

    const gigID = parseInt(req.params.id);
    const gig   = await getGigByID(gigID);
    if (!gig)               return res.status(404).json({ error: 'gig not found.' });
    if (gig.Status !== 'open') return res.status(400).json({ error: 'this gig is no longer open.' });

    const alreadyApplied = await hasApplied(gigID, user.UserID);
    if (alreadyApplied) return res.status(409).json({ error: 'you already applied to this gig.' });

    const { coverLetter, matchScore } = req.body;

    const applicationID = await applyToGig({
      gigID,
      studentID:   user.UserID,
      coverLetter,
      matchScore:  matchScore || 0,
    });

    res.status(201).json({ message: 'application submitted.', applicationID });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('apply error:', err.message);
    res.status(500).json({ error: 'could not submit application.' });
  }
};

// ─── PATCH /api/gigs/applications/:appID/accept ───────────────────────────────
const accept = async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (user.Role !== 'client') return res.status(403).json({ error: 'clients only.' });

    const { gigID } = req.body;
    if (!gigID) return res.status(400).json({ error: 'gigID is required.' });

    await acceptApplication(parseInt(req.params.appID), parseInt(gigID));
    res.json({ message: 'application accepted. gig is now in progress.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('accept error:', err.message);
    res.status(500).json({ error: 'could not accept application.' });
  }
};

// ─── PATCH /api/gigs/applications/:appID/withdraw ─────────────────────────────
const withdraw = async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (user.Role !== 'student') return res.status(403).json({ error: 'students only.' });

    await withdrawApplication(parseInt(req.params.appID), user.UserID);
    res.json({ message: 'application withdrawn.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('withdraw error:', err.message);
    res.status(500).json({ error: 'could not withdraw application.' });
  }
};

module.exports = {
  listOpenGigs,
  listMatchedGigs,
  listMyGigs,
  getGig,
  postGig,
  removeGig,
  listApplications,
  myApplications,
  apply,
  accept,
  withdraw,
};