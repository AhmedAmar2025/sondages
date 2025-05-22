const express = require("express");
const router = express.Router();
const db = require("../config/db"); // adapte le chemin selon ton projet
const bcrypt = require("bcrypt");   // si tu as hashé les mots de passe

// Affichage du formulaire de connexion
router.get("/", (req, res) => {
  res.render("login");
});

// Traitement de la connexion
router.post("/", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM admins WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.render("login", { error: "Nom d'utilisateur incorrect." });
    }

    const admin = rows[0];

    // Si tu as stocké des mots de passe hashés avec bcrypt :
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.render("login", { error: "Mot de passe incorrect." });
    }

    // Authentification réussie : stocker dans la session
    req.session.admin = {
      id: admin.id,
      username: admin.username,
      isAuthenticated: true
    };

    console.log("Session après login :", req.session); // debug

    res.redirect("/admin");
  } catch (err) {
    console.error("Erreur login :", err);
    res.status(500).send("Erreur serveur");
  }
});

module.exports = router;