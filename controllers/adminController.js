const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const multer = require('multer');

// === MULTER ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });
exports.upload = upload;

// === PAGE ADMIN ===
exports.getAdminPage = async (req, res) => {
  console.log("==> Accès à adminController.getAdminPage");
  console.log("Session admin:", req.session.admin);

  try {
    const [candidats] = await db.query("SELECT * FROM candidats");
    const [secteurs] = await db.query("SELECT * FROM secteurs");
    const [bannieres] = await db.query("SELECT * FROM bannieres");
    const [satisfaction] = await db.query("SELECT * FROM satisfaction");

    res.render("admin", {
      candidats,
      secteurs,
      bannieres,
      satisfaction
    });
  } catch (err) {
    console.error("❌ Erreur chargement admin :", err);
    res.status(500).send("Erreur serveur");
  }
};

// === SECTEURS ===
exports.addSecteur = async (req, res) => {
  const { nom } = req.body;
  const logo = req.file ? req.file.filename : null;

  if (!nom) return res.status(400).send("Nom du secteur requis");

  try {
    await db.query('INSERT INTO secteurs (nom, logo) VALUES (?, ?)', [nom, logo]);
    res.redirect('/admin');
  } catch (err) {
    console.error("Erreur ajout secteur :", err);
    res.status(500).send("Erreur serveur");
  }
};

exports.deleteSecteur = async (req, res) => {
  const id = req.params.id;

  try {
    const [rows] = await db.query('SELECT logo FROM secteurs WHERE id = ?', [id]);
    if (rows.length && rows[0].logo) {
      const logoPath = path.join('uploads', rows[0].logo);
      if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
    }
    await db.query('DELETE FROM secteurs WHERE id = ?', [id]);
    res.redirect('/admin');
  } catch (err) {
    console.error("Erreur suppression secteur :", err);
    res.status(500).send("Erreur serveur");
  }
};

exports.resetVotesSecteurs = async (req, res) => {
  try {
    await db.query('UPDATE secteurs SET votes_oui = 0, votes_non = 0');
    res.redirect('/admin');
  } catch (err) {
    console.error("Erreur réinit votes secteurs :", err);
    res.status(500).send("Erreur serveur");
  }
};

// === CANDIDATS ===
exports.addCandidat = async (req, res) => {
  const { nom, parti, fonction, description } = req.body;
  const photo = req.file ? req.file.filename : null;

  if (!nom || !photo) {
    return res.status(400).json({ message: "Nom et photo requis" });
  }

  try {
    await db.query(
      'INSERT INTO candidats (nom, parti, fonction, description, photo) VALUES (?, ?, ?, ?, ?)',
      [nom, parti, fonction, description, photo]
    );
    res.status(200).json({ nom, parti, fonction, description, photo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.deleteCandidat = async (req, res) => {
  const id = req.body.candidatId;
  if (!id) return res.status(400).send("ID candidat requis");

  try {
    const [rows] = await db.query('SELECT photo FROM candidats WHERE id = ?', [id]);
    if (rows.length && rows[0].photo) {
      const photoPath = path.join('uploads', rows[0].photo);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }
    await db.query('DELETE FROM candidats WHERE id = ?', [id]);
    res.redirect('/admin');
  } catch (err) {
    console.error("Erreur suppression candidat :", err);
    res.status(500).send("Erreur serveur");
  }
};

exports.resetVotesCandidats = async (req, res) => {
  try {
    await db.query('UPDATE candidats SET votes = 0');
    res.redirect('/admin');
  } catch (err) {
    console.error("Erreur réinit votes candidats :", err);
    res.status(500).send("Erreur serveur");
  }
};

// === BANNIERES ===
exports.addBanniere = async (req, res) => {
  const { titre, lien } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!titre || !image) {
    return res.status(400).send("Titre et image requis");
  }

  try {
    await db.query('INSERT INTO bannieres (titre, image, lien) VALUES (?, ?, ?)', [titre, image, lien]);
    res.redirect('/admin');
  } catch (err) {
    console.error("❌ Erreur ajout bannière :", err);
    res.status(500).send("Erreur serveur");
  }
};

exports.deleteBanniere = async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).send("ID bannière requis");

  try {
    const [rows] = await db.query('SELECT image FROM bannieres WHERE id = ?', [id]);
    if (rows.length && rows[0].image) {
      const imagePath = path.join('uploads', rows[0].image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    await db.query('DELETE FROM bannieres WHERE id = ?', [id]);
    res.redirect('/admin');
  } catch (err) {
    console.error("Erreur suppression bannière :", err);
    res.status(500).send("Erreur serveur");
  }
};

// === SATISFACTION ===
exports.resetSatisfactionVotes = async (req, res) => {
  try {
    await db.query("UPDATE satisfaction SET votes = 0");
    await db.query("DELETE FROM satisfaction_votes_raw"); // si elle existe
    res.redirect("/admin");
  } catch (err) {
    console.error("Erreur réinitialisation satisfaction :", err);
    res.status(500).send("Erreur serveur");
  }
};



