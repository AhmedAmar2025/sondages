const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/vote-satisfaction', async (req, res) => {
  console.log('POST /satisfaction/vote-satisfaction reçu');
  console.log('req.body =', req.body);

  const { reponse } = req.body;
  const ip = req.ip;

  if (!['oui', 'non'].includes(reponse)) {
    return res.status(400).json({ message: 'Réponse invalide' });
  }

  try {
    const [existing] = await db.query('SELECT ip FROM satisfaction_votes_raw WHERE ip = ?', [ip]);
    if (existing.length > 0) {
      console.log('⛔ Vote déjà effectué depuis cette IP');
      return res.status(403).json({ message: 'Vous avez déjà voté.' });
    }

    await db.query('INSERT INTO satisfaction (reponse) VALUES (?)', [reponse]);
    await db.query('INSERT INTO satisfaction_votes_raw (ip) VALUES (?)', [ip]);

    const [results] = await db.query('SELECT reponse, COUNT(*) as count FROM satisfaction GROUP BY reponse');
    const stats = {
      oui: results.find(r => r.reponse === 'oui')?.count || 0,
      non: results.find(r => r.reponse === 'non')?.count || 0,
    };

    console.log('✅ Vote enregistré avec succès');

    // On renvoie TOUJOURS JSON
    return res.json({ message: 'Vote enregistré', stats });
  } catch (err) {
    console.error('Erreur vote satisfaction :', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});


// RESET
router.post('/reset-satisfaction', async (req, res) => {
  try {
    await db.query('DELETE FROM satisfaction');
    await db.query('DELETE FROM satisfaction_votes_raw');
    res.redirect('/admin');
  } catch (err) {
    console.error("Erreur reset satisfaction :", err);
    res.status(500).send("Erreur serveur");
  }
});

module.exports = router;


