// features/gigs/gigModel.js
// all database queries for gigs, applications, and gig matching

const { sql, poolPromise } = require('../../config/db');

// ─── GIGS ──────────────────────────────────────────────────────────────────────

// get all open gigs — for the student gig board
const getAllOpenGigs = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    select
      g.GigID, g.Title, g.Description, g.Budget, g.Deadline,
      g.Category, g.RequiredSkills, g.Status, g.CreatedAt,
      u.FullName   as ClientName,
      u.IsVerified as ClientVerified,
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

// get gigs matched to a student's skills (keyword overlap)
const getMatchedGigs = async (userID) => {
  const pool = await poolPromise;

  // fetch student skills first
  const skillsResult = await pool.request()
    .input('userID', sql.Int, userID)
    .query(`select SkillName from StudentSkills where UserID = @userID`);

  const skills = skillsResult.recordset.map(r => r.SkillName);

  if (skills.length === 0) return [];

  // build dynamic LIKE conditions
  const conditions = skills.map((_, i) => `g.RequiredSkills like @skill${i}`).join(' or ');

  const req = pool.request();
  skills.forEach((skill, i) => req.input(`skill${i}`, sql.NVarChar, `%${skill}%`));

  const result = await req.query(`
    select
      g.GigID, g.Title, g.Description, g.Budget, g.Deadline,
      g.Category, g.RequiredSkills, g.Status, g.CreatedAt,
      u.FullName   as ClientName,
      u.IsVerified as ClientVerified,
      cp.CompanyName,
      (select count(*) from Applications a where a.GigID = g.GigID) as ApplicationCount
    from Gigs g
    join Users u on g.ClientID = u.UserID
    left join ClientProfiles cp on cp.UserID = u.UserID
    where g.Status = 'open' and (${conditions})
    order by g.CreatedAt desc
  `);

  // calculate match score per gig
  return result.recordset.map(gig => {
    const required = (gig.RequiredSkills || '').toLowerCase().split(',').map(s => s.trim());
    const matched  = skills.filter(sk => required.some(r => r.includes(sk.toLowerCase())));
    const matchScore = required.length > 0
      ? Math.round((matched.length / required.length) * 100)
      : 0;
    return { ...gig, matchScore };
  });
};

// get a single gig by id
const getGigByID = async (gigID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('gigID', sql.Int, gigID)
    .query(`
      select
        g.GigID, g.Title, g.Description, g.Budget, g.Deadline,
        g.Category, g.RequiredSkills, g.Status, g.CreatedAt,
        u.FullName   as ClientName,
        u.UserID     as ClientID,
        u.IsVerified as ClientVerified,
        u.ProfilePic as ClientPic,
        cp.CompanyName, cp.Industry, cp.WebsiteURL
      from Gigs g
      join Users u on g.ClientID = u.UserID
      left join ClientProfiles cp on cp.UserID = u.UserID
      where g.GigID = @gigID
    `);
  return result.recordset[0];
};

// get gigs posted by a client — for client dashboard
const getGigsByClient = async (clientID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('clientID', sql.Int, clientID)
    .query(`
      select
        g.GigID, g.Title, g.Description, g.Budget, g.Deadline,
        g.Category, g.RequiredSkills, g.Status, g.CreatedAt,
        count(a.ApplicationID)                                          as TotalApplications,
        sum(case when a.Status = 'pending'  then 1 else 0 end)         as PendingCount,
        sum(case when a.Status = 'accepted' then 1 else 0 end)         as AcceptedCount
      from Gigs g
      left join Applications a on a.GigID = g.GigID
      where g.ClientID = @clientID
      group by g.GigID, g.Title, g.Description, g.Budget, g.Deadline,
               g.Category, g.RequiredSkills, g.Status, g.CreatedAt
      order by g.CreatedAt desc
    `);
  return result.recordset;
};

// create a new gig
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

// delete a gig — only if open and owned by client
const deleteGig = async (gigID, clientID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('gigID',    sql.Int, gigID)
    .input('clientID', sql.Int, clientID)
    .query(`
      delete from Gigs
      output deleted.GigID
      where GigID = @gigID and ClientID = @clientID and Status = 'open'
    `);
  return result.recordset[0];
};

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────

// get applications for a gig — for client to review
const getApplicationsByGig = async (gigID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('gigID', sql.Int, gigID)
    .query(`
      select
        a.ApplicationID, a.CoverLetter, a.MatchScore, a.Status, a.AppliedAt,
        u.UserID     as StudentID,
        u.FullName   as StudentName,
        u.University, u.ProfilePic,
        sp.Degree, sp.Bio, sp.CVURL, sp.PortfolioURL,
        coalesce(avg(cast(r.Rating as float)), 0) as AverageRating,
        count(distinct r.ReviewID)                as TotalReviews
      from Applications a
      join Users u          on a.StudentID   = u.UserID
      join StudentProfiles sp on sp.UserID   = u.UserID
      left join Reviews r   on r.RevieweeID  = u.UserID
      where a.GigID = @gigID
      group by
        a.ApplicationID, a.CoverLetter, a.MatchScore, a.Status, a.AppliedAt,
        u.UserID, u.FullName, u.University, u.ProfilePic,
        sp.Degree, sp.Bio, sp.CVURL, sp.PortfolioURL
      order by a.MatchScore desc
    `);
  return result.recordset;
};

// get gigs a student applied to — for student dashboard
const getApplicationsByStudent = async (studentID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('studentID', sql.Int, studentID)
    .query(`
      select
        a.ApplicationID, a.Status as ApplicationStatus, a.AppliedAt, a.MatchScore,
        g.GigID, g.Title as GigTitle, g.Budget, g.Deadline,
        g.Category, g.Status as GigStatus,
        u.FullName as ClientName,
        cp.CompanyName
      from Applications a
      join Gigs  g on a.GigID    = g.GigID
      join Users u on g.ClientID = u.UserID
      left join ClientProfiles cp on cp.UserID = u.UserID
      where a.StudentID = @studentID
      order by a.AppliedAt desc
    `);
  return result.recordset;
};

// apply to a gig — calculates match score automatically
const applyToGig = async ({ gigID, studentID, coverLetter, matchScore }) => {
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
  return !!result.recordset[0];
};

// accept an application — rejects all others for the same gig, sets gig to in_progress
const acceptApplication = async (applicationID, gigID) => {
  const pool   = await poolPromise;
  const txn    = new sql.Transaction(pool);
  await txn.begin();
  try {
    await txn.request()
      .input('appID', sql.Int, applicationID)
      .query(`update Applications set Status = 'accepted' where ApplicationID = @appID`);

    await txn.request()
      .input('gigID', sql.Int, gigID)
      .input('appID', sql.Int, applicationID)
      .query(`
        update Applications set Status = 'rejected'
        where GigID = @gigID and ApplicationID <> @appID and Status = 'pending'
      `);

    await txn.request()
      .input('gigID', sql.Int, gigID)
      .query(`update Gigs set Status = 'in_progress' where GigID = @gigID and Status = 'open'`);

    await txn.commit();
  } catch (err) {
    await txn.rollback();
    throw err;
  }
};

// withdraw an application
const withdrawApplication = async (applicationID, studentID) => {
  const pool = await poolPromise;
  await pool.request()
    .input('appID',     sql.Int, applicationID)
    .input('studentID', sql.Int, studentID)
    .query(`
      update Applications set Status = 'withdrawn'
      where ApplicationID = @appID and StudentID = @studentID and Status = 'pending'
    `);
};

module.exports = {
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
};