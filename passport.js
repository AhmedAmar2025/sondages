
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = require('./db'); // Assurez-vous que le chemin d'accès à db.js est correct

// Configuration de la stratégie locale
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const [rows] = await db.query(
        'SELECT * FROM administrateurs WHERE username = ? AND password = ?',
        [username, password]
      );

      if (rows.length > 0) {
        // L'utilisateur existe, retourne les informations de l'administrateur
        return done(null, rows[0]);
      } else {
        // Identifiants incorrects
        return done(null, false, { message: 'Identifiants incorrects' });
      }
    } catch (err) {
      return done(err);
    }
  }
));

// Sérialisation de l'utilisateur dans la session
passport.serializeUser((admin, done) => {
  done(null, admin.id);  // Nous stockons uniquement l'id dans la session
});

// Désérialisation de l'utilisateur à partir de la session
passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await db.query('SELECT * FROM administrateurs WHERE id = ?', [id]);
    done(null, rows[0]);  // Récupère l'utilisateur depuis la base de données
  } catch (err) {
    done(err);
  }
});

module.exports = passport;