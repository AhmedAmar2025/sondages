const express = require("express");
const router = express.Router();
const db = require('../config/db');

// Récupérer tous les candidats
router.get("/candidats", (req, res) => {
  connection.query("SELECT * FROM candidats", (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des candidats :", err);
      return res
        .status(500)
        .json({ error: "Erreur lors de la récupération des candidats" });
    }
    res.json(results);
  });
});

// Ajouter un nouveau candidat
router.post("/candidats", (req, res) => {
  const { nom, parti } = req.body;

  if (!nom || !parti) {
    return res.status(400).json({ error: "Nom et parti sont nécessaires" });
  }

  const query = "INSERT INTO candidats (nom, parti, votes) VALUES (?, ?, ?)";
  connection.query(query, [nom, parti, 0], (err, result) => {
    if (err) {
      console.error("Erreur lors de l'ajout du candidat :", err);
      return res
        .status(500)
        .json({ error: "Erreur lors de l'ajout du candidat" });
    }
    res.json({
      message: "Candidat ajouté avec succès",
      candidateId: result.insertId,
    });
  });
});

// Enregistrer un vote pour un candidat
router.post("/vote", (req, res) => {
  const { candidate_id, ipAddress } = req.body;

  if (!candidate_id || !ipAddress) {
    return res.status(400).json({ error: "Données manquantes" });
  }

  connection.query(
    "INSERT INTO votes (candidate_id, ipAddress) VALUES (?, ?)",
    [candidate_id, ipAddress],
    (err) => {
      if (err) {
        console.error("Erreur lors de l'enregistrement du vote :", err);
        return res
          .status(500)
          .json({ error: "Erreur lors de l'enregistrement du vote" });
      }

      connection.query(
        "UPDATE candidats SET votes = votes + 1 WHERE id = ?",
        [candidate_id],
        (err) => {
          if (err) {
            console.error("Erreur lors de l'incrémentation des votes :", err);
            return res
              .status(500)
              .json({ error: "Erreur lors de l'incrémentation des votes" });
          }
          res.json({ message: "Vote enregistré avec succès" });
        },
      );
    },
  );
});

module.exports = router;
