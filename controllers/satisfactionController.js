
const db = require('../config/db');

exports.vote = async (req, res) => {
  console.log("✅ Requête reçue pour voter SATISFACTION");
  const { id } = req.body;
  try {
    await db.query('UPDATE satisfaction SET votes = votes + 1 WHERE id = ?', [id]);
    res.redirect('/merci'); // à adapter selon ta structure
  } catch (error) {
    console.error('Erreur lors du vote satisfaction:', error);
    res.status(500).send('Erreur serveur');
  }
};

exports.voterSatisfaction = async (req, res) => {
  try {
    const { reponse } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`Tentative de vote satisfaction depuis IP ${ip} avec réponse ${reponse}`);

    // Vérifie si l'IP a déjà voté
    const [verif] = await db.query('SELECT * FROM satisfaction_votes_raw WHERE ip = ?', [ip]);
    if (verif.length > 0) {
      console.log('⛔ Vote satisfaction déjà effectué pour cette IP');
      return res.json({ success: false, message: 'Vous avez déjà voté.' });
    }

    // Insère le vote
    await db.query('INSERT INTO satisfaction_votes_raw (ip, reponse) VALUES (?, ?)', [ip, reponse]);

    // Récupère le nouveau total
    const [result] = await db.query('SELECT COUNT(*) AS total FROM satisfaction_votes_raw WHERE reponse = ?', [reponse]);

    res.json({ success: true, nouveauTotal: result[0].total });
  } catch (err) {
    console.error('Erreur lors du vote satisfaction :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};



exports.resetVotes = async (req, res) => {
  try {
    await db.query('UPDATE satisfaction SET votes = 0');
    res.redirect('/admin');
  } catch (error) {
    console.error('Erreur remise à zéro satisfaction:', error);
    res.status(500).send('Erreur serveur');
  }
};


exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM satisfaction');
    res.render('admin', { satisfactionVotes: rows }); // à adapter selon ton rendu
  } catch (error) {
    console.error('Erreur récupération satisfaction:', error);
    res.status(500).send('Erreur serveur');
  }
};
