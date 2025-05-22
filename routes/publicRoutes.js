const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Route principale redirigeant vers l'accueil
router.get('/', async (req, res) => {
  try {
    const [candidats] = await db.query("SELECT * FROM candidats ORDER BY votes DESC");
    const [secteurs] = await db.query("SELECT * FROM secteurs");
    const [bannieres] = await db.query("SELECT * FROM bannieres");
    const [stats] = await db.query(`
      SELECT 
        SUM(reponse = 'oui') AS oui,
        SUM(reponse = 'non') AS non
      FROM satisfaction
    `);

    const totalSuffragesGlobaux = secteurs.reduce((sum, s) => sum + s.votes_oui + s.votes_non, 0);
    const totalVotes = candidats.reduce((sum, c) => sum + c.votes, 0);
    const topCandidat = candidats[0];

    secteurs.forEach((secteur) => {
      secteur.pourcentage = totalSuffragesGlobaux > 0
        ? (secteur.votes_oui * 100) / totalSuffragesGlobaux
        : 0;
    });

    res.render("index", {
      candidats,
      totalVotes,
      topCandidat,
      secteurs,
      totalGlobalVotes: totalSuffragesGlobaux,
      totalVotesSecteurs: totalSuffragesGlobaux,
      totalSuffragesGlobaux,
      satisfactionStats: stats[0],
      bannieres
    });

  } catch (err) {
    console.error("Erreur route publique '/' :", err);
    res.status(500).send("Erreur serveur");
  }
});

module.exports = router;

