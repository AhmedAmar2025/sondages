
const bcrypt = require('bcrypt');
const db = require('./config/db');

(async () => {
  const username = 'admin123';
  const newPassword = 'Admin123';

  const hash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE administrateurs SET password = ? WHERE username = ?', [hash, username]);
  console.log(`🔐 Mot de passe mis à jour pour ${username}`);
  process.exit();
})();
