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

