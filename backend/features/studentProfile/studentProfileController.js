// features/studentProfile/studentProfileController.js
// handles getting and updating the student's own profile
// also exposes public student listing for clients

const {
  getStudentProfile,
  getStudentSkills,
  updateStudentProfile,
  updateCVURL,
  updateProfilePic,
  replaceStudentSkills,
  getStudentApplications,
  getAllStudentProfiles,
} = require('./studentProfileModel');

// ─── GET MY PROFILE ────────────────────────────────────────────────────────────
// GET /api/student/profile
// returns the logged-in student's full profile + skills

const getMyProfile = async (req, res) => {
  try {
    const userID = req.user.UserID;

    const profile = await getStudentProfile(userID);
    if (!profile) {
      return res.status(404).json({ error: 'student profile not found.' });
    }

    const skills = await getStudentSkills(userID);
    profile.skills = skills.map(s => s.SkillName);

    res.json({ profile });
  } catch (err) {
    console.error('getMyProfile error:', err.message);
    res.status(500).json({ error: 'something went wrong. please try again.' });
  }
};

// ─── UPDATE MY PROFILE ─────────────────────────────────────────────────────────
// PUT /api/student/profile
// updates bio, degree, graduation year, portfolio, linkedin, availability, skills

const updateMyProfile = async (req, res) => {
  try {
    const userID = req.user.UserID;
    const { bio, degree, graduationYear, portfolioURL, linkedInURL, isAvailable, skills } = req.body;

    // validate graduation year if provided
    if (graduationYear) {
      const year = parseInt(graduationYear);
      if (isNaN(year) || year < 2020 || year > 2035) {
        return res.status(400).json({ error: 'graduation year must be between 2020 and 2035.' });
      }
    }

    // validate urls if provided
    const urlRegex = /^https?:\/\/.+/;
    if (portfolioURL && !urlRegex.test(portfolioURL)) {
      return res.status(400).json({ error: 'portfolio url must start with http:// or https://' });
    }
    if (linkedInURL && !urlRegex.test(linkedInURL)) {
      return res.status(400).json({ error: 'linkedin url must start with http:// or https://' });
    }

    await updateStudentProfile(userID, {
      bio,
      degree,
      graduationYear: graduationYear ? parseInt(graduationYear) : null,
      portfolioURL,
      linkedInURL,
      isAvailable: isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true ? 1 : 0) : 1,
    });

    // update skills if provided
    if (skills) {
      const skillsArray = Array.isArray(skills)
        ? skills
        : skills.split(',').map(s => s.trim()).filter(Boolean);

      if (skillsArray.length > 20) {
        return res.status(400).json({ error: 'maximum 20 skills allowed.' });
      }

      await replaceStudentSkills(userID, skillsArray);
    }

    // handle profile pic upload
    if (req.files?.profilePic?.[0]?.path) {
      await updateProfilePic(userID, req.files.profilePic[0].path);
    }

    // handle cv upload
    if (req.files?.cv?.[0]?.path) {
      await updateCVURL(userID, req.files.cv[0].path);
    }

    const updatedProfile = await getStudentProfile(userID);
    const updatedSkills  = await getStudentSkills(userID);
    updatedProfile.skills = updatedSkills.map(s => s.SkillName);

    res.json({ message: 'profile updated successfully.', profile: updatedProfile });
  } catch (err) {
    console.error('updateMyProfile error:', err.message);
    res.status(500).json({ error: 'something went wrong. please try again.' });
  }
};

// ─── GET MY APPLICATIONS ───────────────────────────────────────────────────────
// GET /api/student/applications
// returns all gigs this student has applied to

const getMyApplications = async (req, res) => {
  try {
    const userID = req.user.UserID;
    const applications = await getStudentApplications(userID);
    res.json({ applications });
  } catch (err) {
    console.error('getMyApplications error:', err.message);
    res.status(500).json({ error: 'something went wrong. please try again.' });
  }
};

// ─── GET ALL STUDENTS (public, for clients) ────────────────────────────────────
// GET /api/student/browse
// returns all student profiles for clients to browse

const browseStudents = async (req, res) => {
  try {
    const students = await getAllStudentProfiles();

    // attach skills to each student
    const enriched = await Promise.all(
      students.map(async (s) => {
        const skills = await getStudentSkills(s.UserID);
        return { ...s, skills: skills.map(sk => sk.SkillName) };
      })
    );

    res.json({ students: enriched });
  } catch (err) {
    console.error('browseStudents error:', err.message);
    res.status(500).json({ error: 'something went wrong. please try again.' });
  }
};

// ─── GET ONE STUDENT (public) ──────────────────────────────────────────────────
// GET /api/student/:id
// returns a single student profile by ID

const getStudentById = async (req, res) => {
  try {
    const userID = parseInt(req.params.id);
    if (isNaN(userID)) return res.status(400).json({ error: 'invalid student id.' });

    const profile = await getStudentProfile(userID);
    if (!profile) return res.status(404).json({ error: 'student not found.' });

    const skills = await getStudentSkills(userID);
    profile.skills = skills.map(s => s.SkillName);

    res.json({ profile });
  } catch (err) {
    console.error('getStudentById error:', err.message);
    res.status(500).json({ error: 'something went wrong. please try again.' });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getMyApplications,
  browseStudents,
  getStudentById,
};