// features/gigs/gigRoutes.js

const express = require('express');
const router  = express.Router();
const {
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
} = require('./gigController');

// ─── GIG ROUTES ───────────────────────────────────────────────────────────────
// GET  /api/gigs                         → all open gigs (public gig board)
// GET  /api/gigs/matched                 → skill-matched gigs for logged-in student
// GET  /api/gigs/my                      → gigs posted by logged-in client
// GET  /api/gigs/applications/mine       → applications made by logged-in student
// GET  /api/gigs/:id                     → single gig detail
// POST /api/gigs                         → client posts a new gig
// DELETE /api/gigs/:id                   → client deletes their open gig

// GET  /api/gigs/:id/applications        → client views applicants for a gig
// POST /api/gigs/:id/apply               → student applies to a gig

// PATCH /api/gigs/applications/:appID/accept   → client accepts an applicant
// PATCH /api/gigs/applications/:appID/withdraw → student withdraws their application

// NOTE: specific string routes must come before :id param routes
router.get('/matched',                    listMatchedGigs);
router.get('/my',                         listMyGigs);
router.get('/applications/mine',          myApplications);

router.get('/',                           listOpenGigs);
router.get('/:id',                        getGig);
router.post('/',                          postGig);
router.delete('/:id',                     removeGig);

router.get('/:id/applications',           listApplications);
router.post('/:id/apply',                 apply);

router.patch('/applications/:appID/accept',   accept);
router.patch('/applications/:appID/withdraw', withdraw);

module.exports = router;