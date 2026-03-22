//change comments
// server.js - the main entry point
// only add new route files here as features are built
 
//change comments 
const express = require('express')
const cors = require('cors')
require('dotenv').config()
 
const authRoutes = require('./routes/authRoutes') 
// this auth route feature is for first login/signup functionality, we will add more routes as we build more features
// add more routes here as each person finishes their feature:
// const studentProfileRoutes = require('./routes/requestRoutes')
// const clientGigPostingRoutes   = require('./routes/offerRoutes')
 
const app = express()
app.use(cors())
app.use(express.json())
 
app.use('/api/auth',     authRoutes)
// app.use('/api/requests', requestRoutes)
// app.use('/api/offers',   offerRoutes)
 
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log('server running on port', PORT))

<<<<<<< Updated upstream
=======
const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const authRoutes           = require('./features/auth/authRoutes');
const studentProfileRoutes = require('./features/studentProfile/studentProfileRoutes');
const gigRoutes            = require('./features/gigs/gigRoutes');
// future routes — uncomment as each feature is built:
// const gigRoutes         = require('./features/gigs/gigRoutes');
// const applicationRoutes = require('./features/applications/applicationRoutes');
// const profileRoutes     = require('./features/profile/profileRoutes');
// const walletRoutes      = require('./features/wallet/walletRoutes');
// const reviewRoutes      = require('./features/reviews/reviewRoutes');
// const leaderboardRoutes = require('./features/leaderboard/leaderboardRoutes');
// const adminRoutes       = require('./features/admin/adminRoutes');

// app.use('/api/gigs',         gigRoutes);
// app.use('/api/applications', applicationRoutes);
// app.use('/api/profile',      profileRoutes);
// app.use('/api/wallet',       walletRoutes);
// app.use('/api/reviews',      reviewRoutes);
// app.use('/api/leaderboard',  leaderboardRoutes);
// app.use('/api/admin',        adminRoutes);
app.use('/api/auth',    authRoutes);
app.use('/api/student', studentProfileRoutes);
app.use('/api/gigs',    gigRoutes);

// ── health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'grade & grind api is running.' });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `route ${req.method} ${req.path} not found.` });
});

// ── global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('unhandled error:', err.message);
  res.status(500).json({ error: 'something went wrong.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`grade & grind server running on port ${PORT}`);
});
>>>>>>> Stashed changes
