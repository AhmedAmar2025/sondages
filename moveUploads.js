
const fs = require('fs');
const path = require('path');

// Dossiers source et destination
const sourceDir = path.join(__dirname, 'uploads');
const destDir = path.join(__dirname, 'public', 'uploads');

// Vérifie que le dossier source existe
if (!fs.existsSync(sourceDir)) {
  console.error("❌ Le dossier 'uploads/' n'existe pas à la racine.");
  process.exit(1);
}

// Crée le dossier de destination s'il n'existe pas
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.readdir(sourceDir, (err, files) => {
  if (err) {
    console.error("Erreur lors de la lecture du dossier source :", err);
    return;
  }

  if (files.length === 0) {
    console.log("📁 Le dossier 'uploads/' est vide.");
    return;
  }

  files.forEach(file => {
    const srcPath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);

    // Déplacer le fichier
    fs.rename(srcPath, destPath, (err) => {
      if (err) {
        console.error(`Erreur lors du déplacement de ${file} :`, err);
      } else {
        console.log(`✅ ${file} déplacé vers public/uploads`);
      }
    });
  });
});
