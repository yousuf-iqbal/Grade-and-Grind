// features/studentProfile/studProfRoutes.js

const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary }        = require('../../config/cloudinary');
const { verifyToken }       = require('../../middleware/verifyTokens');
const { roleGuard }         = require('../../middleware/roleGaurd');

const {
  getMyProfile,
  getProfile,
  updateProfile,
  togglePublish,
  uploadCV,
  deleteCV,
  addSkillHandler,
  removeSkillHandler,
} = require('./studProfController');

// ─── CLOUDINARY STORAGE ───────────────────────────────────────────────────────

// profile picture storage
const profilePicStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'gradeandgrind/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 300, height: 300, crop: 'fill' }],
  },
});

// cv storage — pdf only, raw delivery so it downloads properly
const cvStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:        'gradeandgrind/cvs',
    allowed_formats: ['pdf'],
    resource_type: 'raw',
    format:        'pdf',
  },
});

const uploadProfilePic = multer({ storage: profilePicStorage });
const uploadCVFile     = multer({
  storage: cvStorage,
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5mb max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('only pdf files are allowed.'), false);
    }
  },
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// GET /api/profile/me — student views own profile (must be logged in)
router.get('/me', verifyToken, getMyProfile);

// GET /api/profile/:userID — view a student profile
// clients see published only, owner+admin see draft too
router.get('/:userID', verifyToken, getProfile);

// PUT /api/profile/me — update profile + skills (student only)
router.put('/me',
  verifyToken,
  roleGuard('student'),
  uploadProfilePic.fields([{ name: 'profilePic', maxCount: 1 }]),
  updateProfile
);

// PATCH /api/profile/me/publish — publish or unpublish (student only)
router.patch('/me/publish', verifyToken, roleGuard('student'), togglePublish);

// POST /api/profile/me/cv — upload cv pdf (student only)
router.post('/me/cv',
  verifyToken,
  roleGuard('student'),
  (req, res, next) => {
    uploadCVFile.single('cv')(req, res, (err) => {
      if (err) {
        // handle multer errors (file type, size)
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  uploadCV
);

// DELETE /api/profile/me/cv — remove cv (student only)
router.delete('/me/cv', verifyToken, roleGuard('student'), deleteCV);

// POST /api/profile/me/skills — add a skill (student only)
router.post('/me/skills', verifyToken, roleGuard('student'), addSkillHandler);

// DELETE /api/profile/me/skills/:skillName — remove a skill (student only)
router.delete('/me/skills/:skillName', verifyToken, roleGuard('student'), removeSkillHandler);

module.exports = router;