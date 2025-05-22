const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Ahmed1969',
  database: 'sondage'
});

module.exports = db;





