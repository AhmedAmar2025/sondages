
const bcrypt = require('bcrypt');
const password = 'admin123'; // Mot de passe que tu veux utiliser

bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log('Hash généré :', hash);
});