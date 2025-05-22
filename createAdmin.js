
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

(async () => {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Ahmed1969',
    database: 'sondage'
  });

  const username = 'admin123';
  const plainPassword = 'Admin123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  await db.query(
    'INSERT INTO administrateurs (username, password) VALUES (?, ?)',
    [username, hashedPassword]
  );

  console.log('Admin créé avec succès');
  db.end();
})();