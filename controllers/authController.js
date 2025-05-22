const db = require('../config/db');
const bcrypt = require('bcrypt');

// Gère la connexion de l'administrateur
exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).render('login', {
      error: 'Tous les champs sont requis',
      username
    });
  }

  try {
    // Rechercher l'utilisateur dans la base MySQL
    const [rows] = await db.query(
      'SELECT * FROM admins WHERE username = ?', 
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).render('login', {
        error: 'Identifiants incorrects',
        username
      });
    }

    const admin = rows[0];

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).render('login', {
        error: 'Identifiants incorrects',
        username
      });
    }

    req.session.admin = {
      id: admin.id,
      username: admin.username,
      isAuthenticated: true
    };

    const redirectTo = req.session.returnTo || '/admin';
    delete req.session.returnTo;
    res.redirect(redirectTo);

  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).render('login', {
      error: 'Erreur du serveur. Veuillez réessayer.',
      username
    });
  }
};
