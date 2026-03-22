// features/studentProfile/studentProfileModel.js
// all DB queries for student profile management

const { sql, poolPromise } = require('../../config/db');

// get full student profile with skills and ratings
const getStudentProfile = async (userID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('userID', sql.Int, userID)
    .query(`
      select
        u.UserID,
        u.FullName,
        u.Email,
        u.Phone,
        u.University,
        u.ProfilePic,
        u.IsVerified,
        sp.ProfileID,
        sp.Bio,
        sp.Degree,
        sp.GraduationYear,
        sp.CVURL,
        sp.PortfolioURL,
        sp.LinkedInURL,
        sp.IsAvailable,
        sp.UpdatedAt,
        coalesce(avg(cast(r.Rating as float)), 0) as AverageRating,
        count(distinct r.ReviewID)                as TotalReviews,
        count(distinct case when a.Status = 'accepted' then a.ApplicationID end) as CompletedGigs
      from Users u
      join StudentProfiles sp on sp.UserID = u.UserID
      left join Reviews r     on r.RevieweeID = u.UserID
      left join Applications a on a.StudentID = u.UserID
      where u.UserID = @userID
      group by
        u.UserID, u.FullName, u.Email, u.Phone, u.University, u.ProfilePic,
        u.IsVerified, sp.ProfileID, sp.Bio, sp.Degree, sp.GraduationYear,
        sp.CVURL, sp.PortfolioURL, sp.LinkedInURL, sp.IsAvailable, sp.UpdatedAt
    `);
  return result.recordset[0];
};

// get skills for a student
const getStudentSkills = async (userID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('userID', sql.Int, userID)
    .query(`
      select StudentSkillID, SkillName
      from StudentSkills
      where UserID = @userID
      order by SkillName
    `);
  return result.recordset;
};

// update student profile fields
const updateStudentProfile = async (userID, { bio, degree, graduationYear, portfolioURL, linkedInURL, isAvailable }) => {
  const pool = await poolPromise;
  await pool.request()
    .input('userID',         sql.Int,      userID)
    .input('bio',            sql.NVarChar, bio            || null)
    .input('degree',         sql.NVarChar, degree         || null)
    .input('graduationYear', sql.Int,      graduationYear || null)
    .input('portfolioURL',   sql.NVarChar, portfolioURL   || null)
    .input('linkedInURL',    sql.NVarChar, linkedInURL    || null)
    .input('isAvailable',    sql.Bit,      isAvailable !== undefined ? isAvailable : 1)
    .query(`
      update StudentProfiles
      set Bio            = @bio,
          Degree         = @degree,
          GraduationYear = @graduationYear,
          PortfolioURL   = @portfolioURL,
          LinkedInURL    = @linkedInURL,
          IsAvailable    = @isAvailable,
          UpdatedAt      = getdate()
      where UserID = @userID
    `);
};

// update cv url after cloudinary upload
const updateCVURL = async (userID, cvURL) => {
  const pool = await poolPromise;
  await pool.request()
    .input('userID', sql.Int,      userID)
    .input('cvURL',  sql.NVarChar, cvURL)
    .query(`
      update StudentProfiles
      set CVURL     = @cvURL,
          UpdatedAt = getdate()
      where UserID = @userID
    `);
};

// update profile pic url
const updateProfilePic = async (userID, profilePicURL) => {
  const pool = await poolPromise;
  await pool.request()
    .input('userID',       sql.Int,      userID)
    .input('profilePic',   sql.NVarChar, profilePicURL)
    .query(`
      update Users
      set ProfilePic = @profilePic
      where UserID = @userID
    `);
};

// replace all skills for a student (delete + re-insert)
const replaceStudentSkills = async (userID, skills) => {
  const pool = await poolPromise;
  const tx = pool.transaction();
  await tx.begin();
  try {
    await tx.request()
      .input('userID', sql.Int, userID)
      .query(`delete from StudentSkills where UserID = @userID`);

    for (const skill of skills) {
      const trimmed = skill.trim();
      if (!trimmed) continue;
      await tx.request()
        .input('userID',    sql.Int,      userID)
        .input('skillName', sql.NVarChar, trimmed)
        .query(`
          if not exists (select 1 from StudentSkills where UserID = @userID and SkillName = @skillName)
            insert into StudentSkills (UserID, SkillName) values (@userID, @skillName)
        `);
    }
    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }
};

// get student's application history for their dashboard
const getStudentApplications = async (userID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('userID', sql.Int, userID)
    .query(`
      select
        a.ApplicationID,
        a.Status       as ApplicationStatus,
        a.MatchScore,
        a.AppliedAt,
        g.GigID,
        g.Title        as GigTitle,
        g.Budget,
        g.Deadline,
        g.Category,
        g.Status       as GigStatus,
        u.FullName     as ClientName,
        u.ProfilePic   as ClientPic,
        cp.CompanyName
      from Applications a
      join Gigs  g on a.GigID    = g.GigID
      join Users u on g.ClientID = u.UserID
      left join ClientProfiles cp on cp.UserID = u.UserID
      where a.StudentID = @userID
      order by a.AppliedAt desc
    `);
  return result.recordset;
};

// browse all student profiles (for clients)
const getAllStudentProfiles = async () => {
  const pool = await poolPromise;
  const result = await pool.request()
    .query(`
      select
        u.UserID,
        u.FullName,
        u.University,
        u.ProfilePic,
        u.IsVerified,
        sp.Bio,
        sp.Degree,
        sp.GraduationYear,
        sp.IsAvailable,
        coalesce(avg(cast(r.Rating as float)), 0) as AverageRating,
        count(distinct r.ReviewID)                as TotalReviews,
        count(distinct case when a.Status = 'accepted' then a.ApplicationID end) as CompletedGigs
      from Users u
      join StudentProfiles sp on sp.UserID = u.UserID
      left join Reviews r     on r.RevieweeID = u.UserID
      left join Applications a on a.StudentID = u.UserID
      where u.Role = 'student' and u.IsBanned = 0
      group by
        u.UserID, u.FullName, u.University, u.ProfilePic,
        u.IsVerified, sp.Bio, sp.Degree, sp.GraduationYear, sp.IsAvailable
      order by AverageRating desc
    `);
  return result.recordset;
};

module.exports = {
  getStudentProfile,
  getStudentSkills,
  updateStudentProfile,
  updateCVURL,
  updateProfilePic,
  replaceStudentSkills,
  getStudentApplications,
  getAllStudentProfiles,
};