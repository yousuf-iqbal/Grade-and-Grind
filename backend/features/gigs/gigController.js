

// features/gigs/gigController.js

const {
  createGig,
  getAllOpenGigs,
  getGigById,
  getClientGigs,
  updateGig,
  deleteGig,
  getGigApplications,
  applyToGig,
  hasApplied,
  computeMatchScore,
} = require('./gigModel');

const VALID_CATEGORIES = ['Development', 'Design', 'Writing', 'Data', 'Marketing', 'Video', 'Other'];

// ─── POST GIG (client only) ────────────────────────────────────────────────────
// POST /api/gigs
const postGig = async (req, res) => {
  try {
    const clientID = req.user.UserID;
    const { title, description, budget, deadline, category, requiredSkills } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'gig title is required.' });
    }
    if (title.trim().length < 10) {
      return res.status(400).json({ error: 'title must be at least 10 characters.' });
    }
    if (budget && (isNaN(budget) || parseFloat(budget) < 0)) {
      return res.status(400).json({ error: 'budget must be a positive number.' });
    }
    if (deadline) {
      const d = new Date(deadline);
      if (isNaN(d.getTime()) || d <= new Date()) {
        return res.status(400).json({ error: 'deadline must be a future date.' });
      }
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}.` });
    }

    const gigID = await createGig({
      clientID,
      title:          title.trim(),
      description:    description?.trim() || null,
      budget:         budget    ? parseFloat(budget)    : null,
      deadline:       deadline  || null,
      category:       category  || null,
      requiredSkills: requiredSkills?.trim() || null,
    });

    res.status(201).json({ message: 'gig posted successfully.', gigID });
  } catch (err) {
    console.error('postGig error:', err.message);
    res.status(500).json({ error: 'something went wrong. please try again.' });
  }
};

// ─── GET ALL OPEN GIGS ─────────────────────────────────────────────────────────
// GET /api/gigs
const listOpenGigs = async (req, res) => {
  try {
    const gigs = await getAllOpenGigs();
    res.json({ gigs });
  } catch (err) {
    console.error('listOpenGigs error:', err.message);
    res.status(500).json({ error: 'something went wrong. please try again.' });
  }
};

// ─── GET SINGLE GIG ────────────────────────────────────────────────────────────
// GET /api/gigs/:id
const getGig = async (req, res) => {
  try {
    const gigID = parseInt(req.params.id);
    if (isNaN(gigID)) return res.status(400).json({ error: 'invalid gig id.' });

    const gig = await getGigById(gigID);
    if (!gig) return res.status(404).json({ error: 'gig not found.' });

    res.json({ gig });
  } catch (err) {
    console.error('getGig error:', err.message);
    res.status(500).json({ error: 'something went wrong. please try again.' });
  }
};

// ─── GET CLIENT'S OWN GIGS (client dashboard) ─────────────────────────────────
// GET /api/gigs/my
const getMyGigs = async (req, res) => {
  try {
    const clientID = req.user.UserID;
    const gigs = await getClientGigs(clientID);
    res.json({ gigs });
  } catch (err) {
    console.error('getMyGigs error:', err.message);
    res.status(500).json({ error: 'something went wrong. please try again.' });
  }
};

// ─── UPDATE GIG (client only, open gigs only) ──────────────────────────────────
// PUT /api/gigs/:id
const editGig = async (req, res) => {
  try {
    const clientID = req.user.UserID;
    const gigID    = parseInt(req.params.id);
    if (isNaN(gigID)) return res.status(400).json({ error: 'invalid gig id.' });

    const { title, description, budget, deadline, category, requiredSkills } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'gig title is required.' });
    }
    if (budget && (isNaN(budget) || parseFloat(budget) < 0)) {
      return res.status(400).json({ error: 'budget must be a positive number.' });
    }
    if (deadline) {
      const d = new Date(deadline);
      if (isNaN(d.getTime()) || d <= new Date()) {
        return res.status(400).json({ error: 'deadline must be a future date.' });
      }
    }

    const rows = await updateGig(gigID, clientID, {
      title: title.trim(), description, budget, deadline, category, requiredSkills,
    });

    if (!rows) {
      return res.status(404).json({ error: 'gig not found, not yours, or not editable.' });
    }

    res.json({ message: 'gig updated successfully.' });
  } catch (err) {
    console.error('editGig error:', err.message);
    res.status(500).json({ error: 'something went wrong. please try again.' });
  }
};

// ─── DELETE GIG (client only, open gigs only) ─────────────────────────────────
// DELETE /api/gigs/:id
const removeGig = async (req, res) => {
  try {
    const clientID = req.user.UserID;
    const gigID    = parseInt(req.params.id);
    if (isNaN(gigID)) return res.status(400).json({ error: 'invalid gig id.' });

    const rows = await deleteGig(gigID, clientID);
    if (!rows) {
      return res.status(404).json({ error: 'gig not found, not yours, or already active/completed.' });
    }

    res.json({ message: 'gig deleted successfully.' });
  } catch (err) {
    console.error('removeGig error:', err.message);
    res.status(500).json({ error: 'something went wrong. please try again.' });
  }
};

// ─── GET APPLICATIONS FOR A GIG (client only) ─────────────────────────────────
// GET /api/gigs/:id/applications
const viewApplications = async (req, res) => {
  try {
    const clientID = req.user.UserID;
    const gigID    = parseInt(req.params.id);
    if (isNaN(gigID)) return res.status(400).json({ error: 'invalid gig id.' });

    const applications = await getGigApplications(gigID, clientID);
    res.json({ applications });
  } catch (err) {
    console.error('viewApplications error:', err.message);
    res.status(500).json({ error: 'something went wrong. please try again.' });
  }
};

// ─── APPLY TO GIG (student only) ──────────────────────────────────────────────
// POST /api/gigs/:id/apply
const applyForGig = async (req, res) => {
  try {
    const studentID   = req.user.UserID;
    const gigID       = parseInt(req.params.id);
    if (isNaN(gigID)) return res.status(400).json({ error: 'invalid gig id.' });

    const { coverLetter } = req.body;

    // check gig exists and is open
    const gig = await getGigById(gigID);
    if (!gig)               return res.status(404).json({ error: 'gig not found.' });
    if (gig.Status !== 'open') return res.status(400).json({ error: 'this gig is no longer accepting applications.' });

    // check not already applied
    const alreadyApplied = await hasApplied(gigID, studentID);
    if (alreadyApplied) return res.status(409).json({ error: 'you have already applied to this gig.' });

    // compute match score automatically
    const matchScore = await computeMatchScore(gigID, studentID);

    const applicationID = await applyToGig(gigID, studentID, coverLetter, matchScore);

    res.status(201).json({
      message:       'application submitted successfully.',
      applicationID,
      matchScore,
    });
  } catch (err) {
    console.error('applyForGig error:', err.message);
    res.status(500).json({ error: 'something went wrong. please try again.' });
  }
};

module.exports = {
  postGig,
  listOpenGigs,
  getGig,
  getMyGigs,
  editGig,
  removeGig,
  viewApplications,
  applyForGig,
};