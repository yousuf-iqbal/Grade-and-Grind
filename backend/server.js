// server.js
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

require('./config/db');

require('./config/mailer');

const authRoutes    = require('./features/auth/authRoutes');
const profileRoutes = require('./features/studentProfile/studProfRoutes');
const gigRoutes     = require('./features/gigs/gigRoutes');
const notifRoutes   = require('./features/notifications/notifRoutes');
const reviewRoutes     = require('./features/reviews/reviewRoutes'); 
const leaderboardRoutes = require('./features/leaderboard/leaderboardRoutes'); 


// future routes uncomment as each feature is built:
// const applicationRoutes = require('./features/applications/applicationRoutes');
// const walletRoutes      = require('./features/wallet/walletRoutes');
// const reviewRoutes      = require('./features/reviews/reviewRoutes');
// const leaderboardRoutes = require('./features/leaderboard/leaderboardRoutes');
// const adminRoutes       = require('./features/admin/adminRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',    authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/gigs',    gigRoutes);
app.use('/api/notifications', notifRoutes);   
app.use('/api/reviews',       reviewRoutes);
app.use('/api/leaderboard',   leaderboardRoutes);


// app.use('/api/applications', applicationRoutes);
// app.use('/api/wallet',       walletRoutes);
// app.use('/api/reviews',      reviewRoutes);
// app.use('/api/leaderboard',  leaderboardRoutes);
// app.use('/api/admin',        adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'grade and grind backend is running' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`server running on port ${PORT}`));

process.on('unhandledRejection', (err) => {
  console.error('unhandled rejection:', err.message)
})

process.on('uncaughtException', (err) => {
  console.error('uncaught exception:', err.message)
})