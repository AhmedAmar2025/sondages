const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Ajouter un secteur
exports.addSecteur = async (req, res) => {
  try {
    const { nom, nom_ar } = req.body;
    const logo = req.file?.filename || null;

    if (!nom || !nom_ar) {
      req.flash('error', 'Tous les champs sont requis.');
      return res.redirect('/admin');
    }

    await db.query(
      'INSERT INTO secteurs (nom, nom_ar, logo, votes_oui, votes_non) VALUES (?, ?, ?, 0, 0)',
      [nom, nom_ar, logo]
    );

    req.flash('success', 'Secteur ajouté avec succès.');
    res.redirect('/admin');
  } catch (err) {
    console.error("Erreur lors de l’ajout du secteur :", err);
    req.flash('error', 'Erreur lors de l’ajout du secteur.');
    res.status(500).redirect('/admin');
  }
};



exports.votePourSecteur = async (req, res) => {
  try {
    const secteurId = req.params.id;
    const { reponse } = req.body;
    const ip = req.ip;

    console.log("Fonction votePourSecteur atteinte !");
    console.log(`Tentative vote secteur ${secteurId} réponse ${reponse} depuis IP ${ip}`);

    // Vérifier si l'utilisateur a déjà voté pour ce secteur avec cette IP
    const [existingVote] = await db.query(
      "SELECT * FROM secteur_votes_raw WHERE secteur_id = ? AND ip = ?",
      [secteurId, ip]
    );

    if (existingVote.length > 0) {
      console.log("⛔ Vote déjà effectué depuis cette IP pour ce secteur");
      return res.status(403).json({ message: "⛔ Vous avez déjà voté pour ce secteur." });
    }

    // Enregistrer le vote
    await db.query(
      "INSERT INTO secteur_votes_raw (secteur_id, ip, reponse) VALUES (?, ?, ?)",
      [secteurId, ip, reponse]
    );

    // Recalculer les nouveaux totaux
    const [[{ count: updatedOuiCount }]] = await db.query(
      "SELECT COUNT(*) as count FROM secteur_votes_raw WHERE secteur_id = ? AND reponse = 'oui'",
      [secteurId]
    );

    const [[{ count: updatedNonCount }]] = await db.query(
      "SELECT COUNT(*) as count FROM secteur_votes_raw WHERE secteur_id = ? AND reponse = 'non'",
      [secteurId]
    );

    console.log("✅ Vote enregistré avec succès");

    res.json({
      message: "✅ Merci pour votre vote",
      oui: updatedOuiCount,
      non: updatedNonCount
    });

  } catch (error) {
    console.error("Erreur votePourSecteur:", error);
    res.status(500).json({ message: "Une erreur est survenue." });
  }
};

