config/db.js
// config/db.js - connects to SQL Server
// everyone imports this - never touch it again after setup
 
const sql = require('mssql')
require('dotenv').config()
 
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: { trustServerCertificate: true }
}
 
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => { console.log('connected to sql server'); return pool })
  .catch(err => console.log('connection failed:', err.message))
 
module.exports = { sql, poolPromise }


