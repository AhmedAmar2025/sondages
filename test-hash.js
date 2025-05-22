
const bcrypt = require('bcrypt');

const plainPassword = 'admin'; // Remplace par le mot de passe que tu veux tester
const hashedPassword = 'Sondage2025'; // ton hash dans la DB

bcrypt.compare(plainPassword, hashedPassword, (err, result) => {
  if (err) {
    console.error("Erreur comparaison :", err);
  } else {
    console.log("Mot de passe correct ?", result);
  }
});