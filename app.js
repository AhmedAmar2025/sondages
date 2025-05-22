// =============================================
// IMPORTS & CONFIGURATION
// =============================================

const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");
const passport = require("passport");
const db = require('./config/db');


process.on('uncaughtException', (err) => {
  console.error('Erreur non capturée:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('Promesse rejetée non gérée:', err);
});


// Load environment variables
dotenv.config({ path: process.env.ENV_PATH || './secret.env' });

// Initialiser Express app
const app = express();
app.set('trust proxy', true);
const port = process.env.PORT || 3000;

// Configure passport
require('./config/passeport')(passport);

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // obligatoire pour parser les requêtes POST JSON


// Session
app.use(session({
  secret: "votre_clé_secrète_complexe",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false,
    path: '/'
  }
}));

// Simuler IP (à désactiver en prod)
app.use((req, res, next) => {
  req.ip = req.headers['x-forwarded-for'] || '127.0.0.' + Math.floor(Math.random() * 255);
  next();
});

// Passport
app.use(passport.initialize());
app.use(passport.session());

// =============================================
// IMPORTS ROUTES & MIDDLEWARES
// =============================================
const loginRoutes = require('./routes/login');
const authRoutes = require('./routes/auth');
const satisfactionRoutes = require('./routes/satisfaction');
const banniereRoutes = require("./routes/bannieres");
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/admin');
const candidatsRoutes = require('./routes/candidats');
const secteursRoutes = require('./routes/secteurs');
const requireAdminAuth = require('./middlewares/requireAdminAuth');
const candidatController = require('./controllers/candidatController');
app.get('/admin/lister-votes', candidatController.listerVotes);
app.post('/vote-candidat/:id', candidatController.voterPourCandidat);



// =============================================
// UTILISATION DES ROUTES
// =============================================
// Auth & login
app.use('/login', loginRoutes);
app.use('/auth', authRoutes);

// Routes publiques
app.use('/', publicRoutes);
app.use('/', satisfactionRoutes);
app.use('/', candidatsRoutes);
app.use('/', secteursRoutes);
app.use('/banniere', banniereRoutes);
app.use('/secteurs', secteursRoutes);
app.use('/satisfaction', satisfactionRoutes);

// Routes protégées admin
app.use('/admin', requireAdminAuth, adminRoutes);

// =============================================
// ROUTE INDEX (Page d'accueil)
// =============================================
app.get("/", async (req, res) => {
  try {
    const [candidats] = await db.query("SELECT * FROM candidats ORDER BY votes DESC");
    const [secteurs] = await db.query("SELECT * FROM secteurs");
    const [bannieres] = await db.query("SELECT * FROM bannieres");
    const [stats] = await db.query(`
      SELECT 
        SUM(reponse = 'oui') AS oui,
        SUM(reponse = 'non') AS non
      FROM satisfaction
    `);

    const totalSuffragesGlobaux = secteurs.reduce((sum, s) => sum + s.votes_oui + s.votes_non, 0);
    const totalVotes = candidats.reduce((sum, c) => sum + c.votes, 0);
    const topCandidat = candidats[0];

    secteurs.forEach((secteur) => {
      secteur.pourcentage = totalSuffragesGlobaux > 0
        ? (secteur.votes_oui * 100) / totalSuffragesGlobaux
        : 0;
    });

    res.render("index", {
      candidats,
      totalVotes,
      topCandidat,
      secteurs,
      totalGlobalVotes: totalSuffragesGlobaux,
      totalVotesSecteurs: totalSuffragesGlobaux,
      totalSuffragesGlobaux,
      satisfactionStats: stats[0],
      bannieres
    });

  } catch (err) {
    console.error("Erreur dans la route / :", err);
    res.status(500).send("Erreur serveur");
  }
});

// =============================================
// VOTE CANDIDAT
// =============================================
app.post('/voter-candidat', async (req, res) => {
  const { candidatId } = req.body;
  try {
    await db.query('UPDATE candidats SET votes = votes + 1 WHERE id = ?', [candidatId]);
    const [candidatRows] = await db.query('SELECT * FROM candidats WHERE id = ?', [candidatId]);
    const candidat = candidatRows[0];
    if (!candidat) return res.status(404).json({ success: false, message: 'Candidat introuvable' });

    const [allCandidats] = await db.query('SELECT * FROM candidats ORDER BY votes DESC');
    const totalVotes = allCandidats.reduce((sum, c) => sum + (c?.votes || 0), 0);
    const topCandidat = allCandidats[0] || null;

    const calculatePercentage = (votes) =>
      totalVotes > 0 ? Math.round((votes / totalVotes) * 100 * 100) / 100 : 0;

    res.json({
      success: true,
      updatedVotes: candidat.votes,
      pourcentage: calculatePercentage(candidat.votes),
      totalVotes,
      topCandidat,
      topPourcentage: topCandidat ? calculatePercentage(topCandidat.votes) : 0,
    });

  } catch (err) {
    console.error('Erreur /voter-candidat:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', details: err.message });
  }
});

// =============================================
// VOTE SECTEUR
// =============================================
app.post('/voter-secteur', async (req, res) => {
  const { secteurId, reponse } = req.body;

  try {
    if (!['oui', 'non'].includes(reponse)) {
      return res.status(400).json({ success: false, message: 'Réponse invalide' });
    }

    const field = reponse === 'oui' ? 'votes_oui' : 'votes_non';
    const [updateVote] = await db.query(`UPDATE secteurs SET ${field} = ${field} + 1 WHERE id = ?`, [secteurId]);

    if (updateVote.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Secteur non trouvé' });
    }

    const [secteurRows] = await db.query('SELECT votes_oui, votes_non FROM secteurs WHERE id = ?', [secteurId]);
    const updatedVotesOui = secteurRows[0].votes_oui;
    const updatedVotesNon = secteurRows[0].votes_non;

    await db.query('UPDATE global_stats SET total_votants = total_votants + 1 WHERE id = 1');
    const [globalRows] = await db.query('SELECT total_votants FROM global_stats WHERE id = 1');
    const totalVotants = globalRows[0].total_votants;

    const satisfactionFixe = (updatedVotesOui * 100) / totalVotants;

    res.json({
      success: true,
      updatedVotesOui,
      updatedVotesNon,
      totalVotants,
      satisfactionFixe: satisfactionFixe.toFixed(2)
    });

  } catch (err) {
    console.error('Erreur /voter-secteur:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// =============================================
// ROUTE LOGIN (POST)
// =============================================
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log('Tentative de connexion:', { username });

  if (!username || !password) {
    return res.status(400).render("login", {
      error: "Tous les champs sont requis",
      username
    });
  }

  try {
    const [rows] = await db.query("SELECT id, username, password FROM administrateurs WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.status(401).render("login", {
        error: "Identifiants incorrects",
        username
      });
    }

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return res.status(401).render("login", {
        error: "Mot de passe incorrect",
        username
      });
    }

    req.session.admin = {
      isAuthenticated: true,
      id: admin.id,
      username: admin.username
    };

    res.redirect("/admin");

  } catch (err) {
    console.error('Erreur /login:', err);
    res.status(500).render("login", {
      error: "Erreur serveur",
      username
    });
  }
});


// =============================================
// ERROR HANDLING
// =============================================

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Application error:', err);
  res.status(500).send('Server error');
});

// =============================================
// DATABASE CONNECTION TEST
// =============================================
(async () => {
  try {
    const connection = await db.getConnection();
    console.log('✅ Database connection established');
    connection.release();
  } catch (err) {
    console.error('❌ Database connection error:', err);
  }
})();

// =============================================
// LANCEMENT DU SERVEUR
// =============================================
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});


