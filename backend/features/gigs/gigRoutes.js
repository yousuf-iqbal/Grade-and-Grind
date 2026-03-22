// features/gigs/gigRoutes.js

const express     = require('express');
const router      = express.Router();
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard }   = require('../../middleware/roleGaurd');
const {
  postGig,
  listOpenGigs,
  getGig,
  getMyGigs,
  editGig,
  removeGig,
  viewApplications,
  applyForGig,
} = require('./gigController');

// ── public (any logged-in user) ───────────────────────────────────────────────
router.get('/',          verifyToken, listOpenGigs);       // all open gigs
router.get('/my',        verifyToken, roleGuard('client'), getMyGigs);  // client's own gigs
router.get('/:id',       verifyToken, getGig);             // single gig detail

// ── client only ───────────────────────────────────────────────────────────────
router.post('/',         verifyToken, roleGuard('client'), postGig);
router.put('/:id',       verifyToken, roleGuard('client'), editGig);
router.delete('/:id',    verifyToken, roleGuard('client'), removeGig);
router.get('/:id/applications', verifyToken, roleGuard('client'), viewApplications);

// ── student only ──────────────────────────────────────────────────────────────
router.post('/:id/apply', verifyToken, roleGuard('student'), applyForGig);

module.exports = router;