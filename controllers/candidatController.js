const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// ✅ Voter pour un candidat (avec IP check)
exports.voterPourCandidat = async (req, res) => {
  console.log("Fonction voterPourCandidat atteinte !");
  try {
    const candidatId = req.params.id;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`Tentative vote candidat ${candidatId} depuis IP ${ip}`);

    // 1. Vérifie si l’IP a déjà voté pour ce candidat
    const [existing] = await db.query(
      'SELECT 1 FROM candidat_votes_raw WHERE ip = ? AND candidat_id = ?',
      [ip, candidatId]
    );

    if (existing.length > 0) {
      console.log("⛔ Vote déjà effectué pour cette IP et ce candidat");
      return res.status(403).json({ message: "Vous avez déjà voté pour ce candidat." });
    }

    // 2. Ajoute 1 au compteur
    await db.query(
      'UPDATE candidats SET votes = votes + 1 WHERE id = ?',
      [candidatId]
    );

    // 3. Enregistre le vote brut
    await db.query(
      'INSERT INTO candidat_votes_raw (ip, candidat_id) VALUES (?, ?)',
      [ip, candidatId]
    );

    res.json({ message: `✅ Vote enregistré pour le candidat ${candidatId}` });
  } catch (err) {
    console.error("Erreur voterPourCandidat:", err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(403).json({ message: "⛔ Vote déjà effectué (conflit IP/candidat)." });
    }
    res.status(500).json({ error: "Erreur serveur" });
  }
};




// Exemple dans candidatController.js ou dans app.js selon ta structure

exports.listerVotes = async (req, res) => {
  try {
    // Récupérer tous les votes bruts
    const [votesBruts] = await db.query('SELECT * FROM candidat_votes_raw');

    // Récupérer les totaux des votes par candidat
    const [totaux] = await db.query('SELECT id, nom, votes FROM candidats');

    res.json({
      votesBruts,
      totaux
    });
  } catch (err) {
    console.error("Erreur listerVotes:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};










// ✅ Ajout via API
exports.ajouterCandidat = async (req, res) => {
  try {
    const { nom, parti, fonction } = req.body;
    const photo = req.file?.filename;

    if (!nom || !parti || !fonction || !photo) {
      return res.status(400).json({ 
        error: 'Champs manquants',
        required: { nom, parti, fonction, photo }
      });
    }

    const [result] = await db.query(
      'INSERT INTO candidats (nom, parti, fonction, photo) VALUES (?, ?, ?, ?)',
      [nom, parti, fonction, photo]
    );

    res.status(201).json({ id: result.insertId, nom, parti, fonction, photo });
  } catch (error) {
    console.error('Erreur ajout candidat:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// ✅ Ajout via formulaire admin
exports.addCandidat = async (req, res) => {
  try {
    const { nom, secteur_id } = req.body;
    const photo = req.file?.filename;

    if (!nom || !secteur_id || !photo) {
      req.flash('error', 'Tous les champs sont requis');
      return res.redirect('/admin');
    }

    await db.query(
      'INSERT INTO candidats (nom, secteur_id, photo) VALUES (?, ?, ?)',
      [nom, secteur_id, photo]
    );

    req.flash('success', 'Candidat ajouté avec succès');
    res.redirect('/admin');
  } catch (error) {
    console.error('Erreur ajout candidat:', error);
    req.flash('error', 'Erreur lors de l\'ajout');
    res.status(500).redirect('/admin');
  }
};

// ✅ Suppression d'un candidat
exports.deleteCandidat = async (req, res) => {
  try {
    const { id } = req.params;

    const [candidat] = await db.query(
      'SELECT photo FROM candidats WHERE id = ?', 
      [id]
    );

    if (candidat.length > 0 && candidat[0].photo) {
      const photoPath = path.join(__dirname, '..', 'public', 'uploads', 'candidats', candidat[0].photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    const [result] = await db.query(
      'DELETE FROM candidats WHERE id = ?', 
      [id]
    );

    if (result.affectedRows === 0) {
      req.flash('error', 'Candidat non trouvé');
    } else {
      req.flash('success', 'Candidat supprimé');
    }

    res.redirect('/admin');
  } catch (error) {
    console.error('Erreur suppression candidat:', error);
    req.flash('error', 'Erreur serveur');
    res.status(500).redirect('/admin');
  }
};

// ✅ Obtenir le top candidat (API)
exports.getTopCandidatPage = async (req, res) => {
  try {
    const [topCandidat] = await db.query(
      `SELECT * FROM candidats ORDER BY votes DESC LIMIT 1`
    );
    
    const [totalVotes] = await db.query(
      `SELECT SUM(votes) AS total FROM candidats`
    );

    res.json({ 
      topCandidat: topCandidat[0] || null,
      totalVotes: totalVotes[0].total || 0
    });
  } catch (error) {
    console.error("Erreur getTopCandidat:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
};

// ✅ Page d’accueil avec tous les éléments
exports.renderAccueil = async (req, res) => {
  try {
    const [candidats] = await db.query('SELECT * FROM candidats');
    const totalVotes = candidats.reduce((acc, c) => acc + c.votes, 0);
    const [secteurs] = await db.query('SELECT * FROM secteurs');
    const secteursAvecPourcentage = secteurs.map(s => {
      const total = s.votes_oui + s.votes_non;
      const pourcentage = total > 0 ? (s.votes_oui / total) * 100 : 0;
      return { ...s, pourcentage };
    });
    const [bannieres] = await db.query('SELECT * FROM bannieres');
    const [[topCandidat]] = await db.query(`
      SELECT * FROM candidats ORDER BY votes DESC LIMIT 1
    `);
    const [[satisfactionStats]] = await db.query(`
      SELECT 
        SUM(CASE WHEN reponse = 'oui' THEN 1 ELSE 0 END) AS oui,
        SUM(CASE WHEN reponse = 'non' THEN 1 ELSE 0 END) AS non
      FROM satisfaction
    `);

    res.render('index', {
      candidats,
      totalVotes,
      topCandidat,
      secteurs: secteursAvecPourcentage,
      bannieres,
      satisfactionStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
};
 
