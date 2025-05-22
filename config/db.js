/*const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Ahmed1969',
  database: 'sondage'
});

module.exports = db;*/


// db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER ? '***' : '(vide)');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : '(vide)');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);



const isProd = process.env.NODE_ENV === 'production';

const db = mysql.createPool({
  host: isProd ? process.env.DB_HOST : process.env.DB_HOST_LOCAL,
  user: isProd ? process.env.DB_USER : process.env.DB_USER_LOCAL,
  password: isProd ? process.env.DB_PASSWORD : process.env.DB_PASSWORD_LOCAL,
  database: isProd ? process.env.DB_NAME : process.env.DB_NAME_LOCAL,
  port: isProd ? process.env.DB_PORT : process.env.DB_PORT_LOCAL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log(`[DB] Mode = ${isProd ? 'PROD (Railway)' : 'DEV (localhost)'}`);
console.log(`[DB] Host = ${isProd ? process.env.DB_HOST : process.env.DB_HOST_LOCAL}`);

module.exports = db;



