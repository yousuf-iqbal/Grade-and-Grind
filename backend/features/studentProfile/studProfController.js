// features/studentProfile/studProfController.js
// handles all student profile operations

const {
  getStudentProfile,
  getStudentSkills,
  getPublicStudentProfile,
  getDraftStudentProfile,
  updateStudentProfile,
  updateUserInfo,
  setPublishStatus,
  updateCVURL,
  addSkill,
  removeSkill,
  replaceSkills,
} = require('./studProfModel');

// ─── GET OWN PROFILE ──────────────────────────────────────────────────────────
// GET /api/profile/me
// student views their own full profile (draft or published)
const getMyProfile = async (req, res) => {
  try {
    const userID = req.user.id;

    const profile = await getStudentProfile(userID);
    if (!profile) {
      return res.status(404).json({ error: 'student profile not found.' });
    }

    const skills = await getStudentSkills(userID);

    res.json({ profile, skills });
  } catch (err) {
    console.error('getMyProfile error:', err.message);
    res.status(500).json({ error: 'something went wrong.' });
  }
};

// ─── GET PUBLIC PROFILE ───────────────────────────────────────────────────────
// GET /api/profile/:userID
// clients (and anyone) view a published student profile
// admins and the student themselves can also see draft profiles
const getProfile = async (req, res) => {
  try {
    const targetID  = parseInt(req.params.userID);
    const requester = req.user; // { id, role }

    const isOwner = requester.id === targetID;
    const isAdmin = requester.role === 'admin';

    let profile;
    if (isOwner || isAdmin) {
      // owner and admin can see draft too
      profile = await getDraftStudentProfile(targetID);
    } else {
      // everyone else only sees published profiles
      profile = await getPublicStudentProfile(targetID);
    }

    if (!profile) {
      return res.status(404).json({ error: 'profile not found or not published.' });
    }

    const skills = await getStudentSkills(targetID);

    res.json({ profile, skills });
  } catch (err) {
    console.error('getProfile error:', err.message);
    res.status(500).json({ error: 'something went wrong.' });
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
// PUT /api/profile/me
// student updates their profile fields + skills in one request
// saves as draft by default unless publish: true is sent
const updateProfile = async (req, res) => {
  try {
    const userID = req.user.id;

    const {
      phone,
      university,
      bio,
      degree,
      graduationYear,
      portfolioURL,
      linkedInURL,
      isAvailable,
      skills,        // array of skill name strings
      publish,       // boolean — true = publish, false = save as draft
    } = req.body;

    // update users table
    await updateUserInfo(userID, { phone, university });

    // update student profiles table
    await updateStudentProfile(userID, {
      bio,
      degree,
      graduationYear: graduationYear ? parseInt(graduationYear) : null,
      portfolioURL,
      linkedInURL,
      isAvailable:    isAvailable !== undefined ? (isAvailable === true || isAvailable === 'true' ? 1 : 0) : 1,
    });

    // replace skills if provided
    if (Array.isArray(skills)) {
      await replaceSkills(userID, skills);
    }

    // set publish status if explicitly sent
    if (publish !== undefined) {
      await setPublishStatus(userID, publish === true || publish === 'true' ? 1 : 0);
    }

    // profile pic via cloudinary if uploaded
    if (req.files?.profilePic?.[0]?.path) {
      const { updateProfilePic } = require('../auth/authModel');
      const email = req.user.email;
      await updateProfilePic(email, req.files.profilePic[0].path);
    }

    // return updated profile
    const profile = await getStudentProfile(userID);
    const updatedSkills = await getStudentSkills(userID);

    res.json({
      message: publish ? 'profile published.' : 'profile saved as draft.',
      profile,
      skills: updatedSkills,
    });
  } catch (err) {
    console.error('updateProfile error:', err.message);
    res.status(500).json({ error: 'something went wrong.' });
  }
};

// ─── PUBLISH / UNPUBLISH ──────────────────────────────────────────────────────
// PATCH /api/profile/me/publish
// toggle publish status separately
const togglePublish = async (req, res) => {
  try {
    const userID    = req.user.id;
    const { publish } = req.body;

    if (publish === undefined) {
      return res.status(400).json({ error: 'publish field required (true or false).' });
    }

    await setPublishStatus(userID, publish ? 1 : 0);

    res.json({
      message: publish ? 'profile is now public.' : 'profile saved as draft.',
    });
  } catch (err) {
    console.error('togglePublish error:', err.message);
    res.status(500).json({ error: 'something went wrong.' });
  }
};

// ─── UPLOAD CV ────────────────────────────────────────────────────────────────
// POST /api/profile/me/cv
// student uploads PDF cv — stored on cloudinary
// validation: pdf only, max 5mb (enforced in routes via multer)
const uploadCV = async (req, res) => {
  try {
    const userID = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'no file uploaded.' });
    }

    const cvURL = req.file.path; // cloudinary url
    await updateCVURL(userID, cvURL);

    res.json({
      message: 'cv uploaded successfully.',
      cvURL,
    });
  } catch (err) {
    console.error('uploadCV error:', err.message);
    res.status(500).json({ error: 'something went wrong.' });
  }
};

// ─── DELETE CV ────────────────────────────────────────────────────────────────
// DELETE /api/profile/me/cv
const deleteCV = async (req, res) => {
  try {
    const userID = req.user.id;
    await updateCVURL(userID, null);
    res.json({ message: 'cv removed.' });
  } catch (err) {
    console.error('deleteCV error:', err.message);
    res.status(500).json({ error: 'something went wrong.' });
  }
};

// ─── ADD SKILL ────────────────────────────────────────────────────────────────
// POST /api/profile/me/skills
const addSkillHandler = async (req, res) => {
  try {
    const userID = req.user.id;
    const { skillName } = req.body;

    if (!skillName || !skillName.trim()) {
      return res.status(400).json({ error: 'skill name is required.' });
    }
    if (skillName.trim().length > 50) {
      return res.status(400).json({ error: 'skill name too long (max 50 chars).' });
    }

    await addSkill(userID, skillName);
    const skills = await getStudentSkills(userID);

    res.json({ message: 'skill added.', skills });
  } catch (err) {
    console.error('addSkill error:', err.message);
    res.status(500).json({ error: 'something went wrong.' });
  }
};

// ─── REMOVE SKILL ─────────────────────────────────────────────────────────────
// DELETE /api/profile/me/skills/:skillName
const removeSkillHandler = async (req, res) => {
  try {
    const userID    = req.user.id;
    const skillName = decodeURIComponent(req.params.skillName);

    await removeSkill(userID, skillName);
    const skills = await getStudentSkills(userID);

    res.json({ message: 'skill removed.', skills });
  } catch (err) {
    console.error('removeSkill error:', err.message);
    res.status(500).json({ error: 'something went wrong.' });
  }
};

module.exports = {
  getMyProfile,
  getProfile,
  updateProfile,
  togglePublish,
  uploadCV,
  deleteCV,
  addSkillHandler,
  removeSkillHandler,
};