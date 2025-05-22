const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.render('login', { error: "Nom d'utilisateur incorrect." });
    }

    const admin = rows[0];

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.render('login', { error: 'Mot de passe incorrect.' });
    }

    req.session.admin = {
      id: admin.id,
      username: admin.username,
      isAuthenticated: true
    };

    const redirectTo = req.session.returnTo || '/admin';
    delete req.session.returnTo;
    res.redirect(redirectTo);

  } catch (err) {
    console.error("Erreur lors de la connexion :", err);
    res.status(500).send("Erreur serveur");
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};