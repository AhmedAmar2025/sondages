const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = require('./db');

module.exports = function(passport) {
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const [rows] = await db.query(
          'SELECT * FROM administrateurs WHERE username = ? AND password = ?',
          [username, password]
        );
        if (rows.length > 0) {
          return done(null, rows[0]); // Utilisateur trouvé
        } else {
          return done(null, false, { message: 'Identifiants incorrects' }); // Identifiants invalides
        }
      } catch (err) {
        return done(err); // Gestion des erreurs
      }
    }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user.id); // Enregistrer l'ID dans la session
  });

  passport.deserializeUser(async function(id, done) {
    try {
      const [user] = await db.query('SELECT * FROM administrateurs WHERE id = ?', [id]); // Correcte la table ici
      if (user) {
        done(null, user); // Si utilisateur trouvé
      } else {
        done(null, false); // Si utilisateur non trouvé
      }
    } catch (err) {
      done(err); // Gestion des erreurs
    }
  });

  return passport;
};



module.exports = function(passport) {
  // Configuration de la stratégie locale pour l'authentification
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const [rows] = await db.query(
          'SELECT * FROM administrateurs WHERE username = ?',
          [username]
        );
        if (rows.length > 0) {
          const user = rows[0];
          // Vérifie si le mot de passe correspond
          const match = await bcrypt.compare(password, user.password);
          if (match) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Identifiants incorrects' });
          }
        } else {
          return done(null, false, { message: 'Identifiants incorrects' });
        }
      } catch (err) {
        return done(err);
      }
    }
  ));

  // Sérialiser l'utilisateur dans la session
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  // Désérialiser l'utilisateur depuis la session
  passport.deserializeUser(async function(id, done) {
    try {
      const [user] = await db.query('SELECT * FROM administrateurs WHERE id = ?', [id]);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};