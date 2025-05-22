
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // adapte le chemin si nécessaire
const upload = require('../config/multer');  // Importer la configuration Multer

// Ajouter une bannière
router.post('/admin/ajouter-banniere', async (req, res) => {
  const { titre, image } = req.body;
  try {
    await db.query(
      'INSERT INTO banniere_pub (titre, image) VALUES (?, ?)',
      [titre, image]
    );
    res.redirect('/admin');
  } catch (err) {
    console.error("Erreur ajout bannière:", err);
    res.status(500).send("Erreur serveur");
  }
});




// Route pour afficher la page d'accueil avec les bannières
router.get('/index', (req, res) => {
  // Récupère les bannières depuis la base de données
  db.query('SELECT * FROM bannieres', (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Erreur de base de données');
    }

    // Envoie les données à la vue
    res.render('index', {
      bannieres: results // Envoie les bannières à la vue
    });
  });
});








// Supprimer une bannière
router.get('/admin/supprimer-banniere/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM banniere_pub WHERE id = ?', [req.params.id]);
    res.redirect('/admin');
  } catch (err) {
    console.error("Erreur suppression bannière:", err);
    res.status(500).send("Erreur serveur");
  }
});

module.exports = router;