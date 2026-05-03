// config/mailer.js
// sends transactional emails using nodemailer + gmail
// uses the same gmail account you already use for firebase verification
// only needs GMAIL_USER and GMAIL_APP_PASSWORD in .env

const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,         // e.g. gradeandgrind@gmail.com
    pass: process.env.GMAIL_APP_PASSWORD, // 16-char app password from Google
  },
});

// verify connection on startup — logs success or failure
transporter.verify((err) => {
  if (err) {
    console.error('❌ mailer not connected:', err.message);
    console.error('   check GMAIL_USER and GMAIL_APP_PASSWORD in .env');
  } else {
    console.log('✅ mailer connected');
  }
});

module.exports = transporter;