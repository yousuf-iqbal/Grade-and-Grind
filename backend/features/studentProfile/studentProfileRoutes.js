// features/studentProfile/studentProfileRoutes.js

const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary }        = require('../../config/cloudinary');
const { verifyToken }       = require('../../middleware/verifyToken');
const { roleGuard }         = require('../../middleware/roleGaurd');
const {
  getMyProfile,
  updateMyProfile,
  getMyApplications,
  browseStudents,
  getStudentById,
} = require('./studentProfileController');

// cloudinary storage — profile pic goes to profiles/, cv goes to cvs/
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'gradeandgrind/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 300, height: 300, crop: 'fill' }],
  },
});

const cvStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'gradeandgrind/cvs',
    allowed_formats: ['pdf'],
    resource_type:   'raw',
  },
});

// multer with both fields
const upload = multer({
  storage: multer.diskStorage({}), // temp; overridden per field
});

// custom upload handler: each field uses its own cloudinary folder
const { Readable } = require('stream');

// simpler: use two separate multer instances merged via fields()
const uploadFields = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      if (file.fieldname === 'cv') {
        return {
          folder:        'gradeandgrind/cvs',
          resource_type: 'raw',
          allowed_formats: ['pdf'],
        };
      }
      return {
        folder:          'gradeandgrind/profiles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation:  [{ width: 300, height: 300, crop: 'fill' }],
      };
    },
  }),
});

// ── routes ────────────────────────────────────────────────────────────────────

// student's own profile
router.get('/profile',      verifyToken, roleGuard('student'), getMyProfile);
router.put('/profile',
  verifyToken,
  roleGuard('student'),
  uploadFields.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'cv',         maxCount: 1 },
  ]),
  updateMyProfile
);

// student's own applications (for dashboard)
router.get('/applications', verifyToken, roleGuard('student'), getMyApplications);

// public — clients can browse all students
router.get('/browse',       verifyToken, browseStudents);

// public — anyone can view a student profile by id
router.get('/:id',          verifyToken, getStudentById);

module.exports = router;