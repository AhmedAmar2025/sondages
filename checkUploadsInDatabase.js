
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise'); // Assure-toi d'utiliser mysql2/promise

// Configuration de ta base de données
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Ahmed1969',
  database: 'sondage'
};

// Répertoire des images
const uploadsDir = path.join(__dirname, 'public', 'uploads');

async function checkUploadedFiles() {
  try {
    const connection = await mysql.createConnection(dbConfig);

    // 📌 Extrait les noms de fichiers depuis la table des candidats (ajuste si nécessaire)
    const [rows] = await connection.execute('SELECT nom, photo FROM candidats');

    console.log(`🔍 Vérification de ${rows.length} candidats...\n`);

    let missing = 0;

    for (const row of rows) {
      const filePath = path.join(uploadsDir, row.photo);
      if (!fs.existsSync(filePath)) {
        console.log(`❌ Fichier manquant : ${row.photo} (Candidat : ${row.nom})`);
        missing++;
      }
    }

    if (missing === 0) {
      console.log('✅ Tous les fichiers sont présents !');
    } else {
      console.log(`⚠️ ${missing} fichier(s) manquant(s).`);
    }

    await connection.end();
  } catch (error) {
    console.error('Erreur lors de la vérification :', error.message);
  }
}

checkUploadedFiles();