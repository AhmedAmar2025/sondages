
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const geoip = require("geoip-lite");
const passport = require('./config/passport');
const app = express();
const port = 3000;
const upload = require('./middlewares/upload');  // Assure-toi que le chemin est correct

// Configuration du moteur de vues
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middlewares globaux
app.use('/uploads', express.static('public/uploads'));
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); 

// Configuration de la session
app.use(session({
  secret: 'monSuperSecret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true,  
    secure: false,   
    maxAge: 24 * 60 * 60 * 1000  
  }
}));

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());

// Logger
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  console.log("Headers:", req.headers["content-type"]);
  console.log("Body:", req.body);
  next();
});

// Connexion à la base de données
const db = require('./config/db');
(async () => {
  try {
    const connection = await db.getConnection();
    console.log('✅ Connecté à la base de données avec l\'ID ' + connection.threadId);
    connection.release();
  } catch (err) {
    console.error('❌ Erreur de connexion à la base de données :', err);
  }
})();

// Définition des middlewares et des routes
const requireAdminAuth = require("./middlewares/requireAdminAuth");
const adminRoutes = require("./routes/admin");
const candidatsRoutes = require("./routes/candidats");
const secteursRoutes = require("./routes/secteurs");
const banniereRoutes = require("./routes/bannieres");

// Page de login
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query(
      "SELECT * FROM administrateurs WHERE username = ? AND password = ?",
      [username, password]
    );

    if (rows.length > 0) {
      const admin = rows[0];
      req.session.admin = { id: admin.id, username: admin.username };
      console.log("✅ Admin connecté :", req.session.admin);
      res.redirect("/admin");
    } else {
      res.render("login", { error: "Identifiants incorrects" });
    }
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.render("login", { error: "Erreur serveur" });
  }
});

// Routes protégées (admin)
app.use("/admin", requireAdminAuth, adminRoutes);

// Routes publiques
app.use("/", candidatsRoutes);
app.use("/", secteursRoutes);
app.use("/", banniereRoutes);

// Route pour ajouter un secteur
app.post('/admin/ajouter-secteur', upload.single('logo'), async (req, res) => {
  try {
    const { nom, nom_ar } = req.body;
    const logo = req.file ? req.file.filename : null; // Récupère le nom du fichier du logo

    // Ajouter le secteur dans la base de données
    await db.query(
      "INSERT INTO secteurs (nom, nom_ar, logo) VALUES (?, ?, ?)", 
      [nom, nom_ar, logo]
    );

    res.redirect('/admin'); // Rediriger vers la page d'administration après l'ajout
  } catch (error) {
    console.error('Erreur lors de l\'ajout du secteur :', error);
    res.status(500).send('Erreur serveur');
  }
});
//==================================
// Route pour supprimer un secteur
//===================================
app.get('/admin/supprimer-secteur/:id', async (req, res) => {
  try {
    const secteurId = req.params.id;

    // Supprimer le secteur de la base de données
    const [secteur] = await db.query('SELECT * FROM secteurs WHERE id = ?', [secteurId]);

    if (secteur) {
      // Supprimer le logo du système de fichiers
      const fs = require('fs');
      const filePath = path.join(__dirname, 'uploads', secteur.logo);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Supprimer le fichier du logo
      }

      // Supprimer le secteur de la base de données
      await db.query('DELETE FROM secteurs WHERE id = ?', [secteurId]);

      res.redirect('/admin'); // Rediriger après suppression
    } else {
      res.status(404).send('Secteur introuvable');
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du secteur :', error);
    res.status(500).send('Erreur serveur');
  }
});


