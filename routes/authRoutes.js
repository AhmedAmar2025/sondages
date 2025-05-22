
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

router.use(express.urlencoded({ extended: true }));

// Affiche le formulaire de login
router.get('/login', (req, res) => {
  // Redirige automatiquement si déjà connecté
  if (req.session.admin && req.session.admin.isAuthenticated) {
    return res.redirect('/admin');
  }

  res.render('login', {
    error: null,
    username: ''
  });
});

// Gère la connexion admin
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('login', {
      error: 'Tous les champs sont requis',
      username
    });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM admins WHERE username = ?', 
      [username]
    );

    if (rows.length === 0 || !await bcrypt.compare(password, rows[0].password)) {
      return res.render('login', {
        error: 'Identifiants invalides',
        username
      });
    }

    req.session.admin = {
      id: rows[0].id,
      username: rows[0].username,
      isAuthenticated: true
    };

    const redirectTo = req.session.returnTo || '/admin';
    delete req.session.returnTo;
    res.redirect(redirectTo);

  } catch (err) {
    console.error('Erreur de connexion admin:', err);
    res.render('login', {
      error: 'Erreur serveur',
      username
    });
  }
});

module.exports = router;