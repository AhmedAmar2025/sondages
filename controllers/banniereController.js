
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

exports.ajouterBanniere = async (req, res) => {
   
    const { nom } = req.body;
    const image = req.file ? req.file.filename : null;
  
    if (!nom || !image) {
      return res.status(400).send("Tous les champs sont requis.");
    }
  
    try {
      await db.banniere.create({ nom, image });
      res.redirect("/admin");
    } catch (error) {
      console.error("Erreur lors de l'ajout de la bannière :", error);
      res.status(500).send("Erreur serveur.");
    }
  };
  

exports.deleteBanniere = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le nom de l’image pour la supprimer
    const [rows] = await db.query('SELECT image FROM bannieres WHERE id = ?', [id]);
    if (rows.length > 0 && rows[0].image) {
      const imagePath = path.join(__dirname, '..', 'public', 'uploads', 'bannieres', rows[0].image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await db.query('DELETE FROM bannieres WHERE id = ?', [id]);

    res.redirect('/admin');
  } catch (error) {
    console.error('Erreur lors de la suppression de la bannière :', error);
    res.status(500).send('Erreur serveur');
  }
};
