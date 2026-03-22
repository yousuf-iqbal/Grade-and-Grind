// features/gigs/gigModel.js
// all DB queries for gig management

const { sql, poolPromise } = require('../../config/db');

// ─── CREATE GIG ────────────────────────────────────────────────────────────────
const createGig = async ({ clientID, title, description, budget, deadline, category, requiredSkills }) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('clientID',       sql.Int,        clientID)
    .input('title',          sql.NVarChar,   title)
    .input('description',    sql.NVarChar,   description    || null)
    .input('budget',         sql.Decimal,    budget         || null)
    .input('deadline',       sql.Date,       deadline       || null)
    .input('category',       sql.NVarChar,   category       || null)
    .input('requiredSkills', sql.NVarChar,   requiredSkills || null)
    .query(`
      insert into Gigs (ClientID, Title, Description, Budget, Deadline, Category, RequiredSkills)
      output inserted.GigID
      values (@clientID, @title, @description, @budget, @deadline, @category, @requiredSkills)
    `);
  return result.recordset[0].GigID;
};

// ─── GET ALL OPEN GIGS (for student browse) ────────────────────────────────────
const getAllOpenGigs = async () => {
  const pool = await poolPromise;
  const result = await pool.request()
    .query(`
      select
        g.GigID,
        g.Title,
        g.Description,
        g.Budget,
        g.Deadline,
        g.Category,
        g.RequiredSkills,
        g.Status,
        g.CreatedAt,
        u.FullName     as ClientName,
        u.IsVerified   as ClientVerified,
        u.ProfilePic   as ClientPic,
        cp.CompanyName,
        (select count(*) from Applications a where a.GigID = g.GigID) as ApplicationCount
      from Gigs g
      join Users u on g.ClientID = u.UserID
      left join ClientProfiles cp on cp.UserID = u.UserID
      where g.Status = 'open'
      order by g.CreatedAt desc
    `);
  return result.recordset;
};

// ─── GET GIG BY ID ─────────────────────────────────────────────────────────────
const getGigById = async (gigID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('gigID', sql.Int, gigID)
    .query(`
      select
        g.GigID,
        g.Title,
        g.Description,
        g.Budget,
        g.Deadline,
        g.Category,
        g.RequiredSkills,
        g.Status,
        g.CreatedAt,
        g.ClientID,
        u.FullName     as ClientName,
        u.IsVerified   as ClientVerified,
        u.ProfilePic   as ClientPic,
        cp.CompanyName,
        cp.Industry,
        cp.WebsiteURL,
        (select count(*) from Applications a where a.GigID = g.GigID) as ApplicationCount
      from Gigs g
      join Users u on g.ClientID = u.UserID
      left join ClientProfiles cp on cp.UserID = u.UserID
      where g.GigID = @gigID
    `);
  return result.recordset[0];
};

// ─── GET CLIENT'S OWN GIGS (for client dashboard) ─────────────────────────────
const getClientGigs = async (clientID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('clientID', sql.Int, clientID)
    .query(`
      select
        g.GigID,
        g.Title,
        g.Budget,
        g.Deadline,
        g.Category,
        g.RequiredSkills,
        g.Status,
        g.CreatedAt,
        count(a.ApplicationID)                                          as TotalApplications,
        sum(case when a.Status = 'pending'  then 1 else 0 end)         as PendingCount,
        sum(case when a.Status = 'accepted' then 1 else 0 end)         as AcceptedCount
      from Gigs g
      left join Applications a on a.GigID = g.GigID
      where g.ClientID = @clientID
      group by g.GigID, g.Title, g.Budget, g.Deadline, g.Category,
               g.RequiredSkills, g.Status, g.CreatedAt
      order by g.CreatedAt desc
    `);
  return result.recordset;
};

// ─── UPDATE GIG ────────────────────────────────────────────────────────────────
const updateGig = async (gigID, clientID, { title, description, budget, deadline, category, requiredSkills }) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('gigID',          sql.Int,      gigID)
    .input('clientID',       sql.Int,      clientID)
    .input('title',          sql.NVarChar, title)
    .input('description',    sql.NVarChar, description    || null)
    .input('budget',         sql.Decimal,  budget         || null)
    .input('deadline',       sql.Date,     deadline       || null)
    .input('category',       sql.NVarChar, category       || null)
    .input('requiredSkills', sql.NVarChar, requiredSkills || null)
    .query(`
      update Gigs
      set Title          = @title,
          Description    = @description,
          Budget         = @budget,
          Deadline       = @deadline,
          Category       = @category,
          RequiredSkills = @requiredSkills
      where GigID = @gigID and ClientID = @clientID and Status = 'open'
    `);
  return result.rowsAffected[0];
};

// ─── DELETE GIG (only open gigs) ───────────────────────────────────────────────
const deleteGig = async (gigID, clientID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('gigID',    sql.Int, gigID)
    .input('clientID', sql.Int, clientID)
    .query(`
      delete from Gigs
      where GigID = @gigID and ClientID = @clientID and Status = 'open'
    `);
  return result.rowsAffected[0];
};

// ─── GET APPLICATIONS FOR A GIG (client views applicants) ─────────────────────
const getGigApplications = async (gigID, clientID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('gigID',    sql.Int, gigID)
    .input('clientID', sql.Int, clientID)
    .query(`
      select
        a.ApplicationID,
        a.CoverLetter,
        a.MatchScore,
        a.Status,
        a.AppliedAt,
        u.UserID       as StudentID,
        u.FullName     as StudentName,
        u.University,
        u.ProfilePic,
        sp.Degree,
        sp.Bio,
        sp.IsAvailable,
        coalesce(avg(cast(r.Rating as float)), 0) as StudentRating,
        count(distinct r.ReviewID)                as TotalReviews
      from Applications a
      join Users           u  on a.StudentID   = u.UserID
      join StudentProfiles sp on sp.UserID     = u.UserID
      left join Reviews    r  on r.RevieweeID  = u.UserID
      where a.GigID = @gigID
        and exists (select 1 from Gigs g where g.GigID = @gigID and g.ClientID = @clientID)
      group by
        a.ApplicationID, a.CoverLetter, a.MatchScore, a.Status, a.AppliedAt,
        u.UserID, u.FullName, u.University, u.ProfilePic,
        sp.Degree, sp.Bio, sp.IsAvailable
      order by a.MatchScore desc
    `);
  return result.recordset;
};

// ─── APPLY TO GIG (student) ────────────────────────────────────────────────────
const applyToGig = async (gigID, studentID, coverLetter, matchScore) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('gigID',       sql.Int,      gigID)
    .input('studentID',   sql.Int,      studentID)
    .input('coverLetter', sql.NVarChar, coverLetter || null)
    .input('matchScore',  sql.Int,      matchScore  || 0)
    .query(`
      insert into Applications (GigID, StudentID, CoverLetter, MatchScore)
      output inserted.ApplicationID
      values (@gigID, @studentID, @coverLetter, @matchScore)
    `);
  return result.recordset[0].ApplicationID;
};

// check if student already applied
const hasApplied = async (gigID, studentID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('gigID',     sql.Int, gigID)
    .input('studentID', sql.Int, studentID)
    .query(`
      select ApplicationID from Applications
      where GigID = @gigID and StudentID = @studentID
    `);
  return result.recordset.length > 0;
};

// ─── COMPUTE MATCH SCORE ───────────────────────────────────────────────────────
// simple keyword matching between student skills and gig required skills
const computeMatchScore = async (gigID, studentID) => {
  const pool = await poolPromise;

  const gigResult = await pool.request()
    .input('gigID', sql.Int, gigID)
    .query(`select RequiredSkills from Gigs where GigID = @gigID`);

  const skillResult = await pool.request()
    .input('studentID', sql.Int, studentID)
    .query(`select SkillName from StudentSkills where UserID = @studentID`);

  const requiredRaw = gigResult.recordset[0]?.RequiredSkills || '';
  const required    = requiredRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const studentSkills = skillResult.recordset.map(s => s.SkillName.toLowerCase());

  if (!required.length) return 0;

  const matches = required.filter(r => studentSkills.some(s => s.includes(r) || r.includes(s)));
  return Math.round((matches.length / required.length) * 100);
};

module.exports = {
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
};