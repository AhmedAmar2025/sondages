
// =============================================
// IMPORTS & CONFIGURATION
// =============================================
// Core modules
const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");

// Importer passport après l'initialisation de l'app
const passport = require('passport'); // ✅ importer le vrai module passport
require('./config/passeport')(passport); // ✅ charger ta config de stratégie
const path = require("path");
const db = require('./config/db');

// Initialiser Express app
const app = express();
app.set('trust proxy', true);
const port = process.env.PORT || 3000;

// Load environment variables
dotenv.config({ path: process.env.ENV_PATH || './secret.env' });

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static('public')); // Permet d'accéder aux fichiers dans le dossier public
app.use(express.static(path.join(__dirname, 'public')));  // Permet de servir les fichiers statiques (CSS, JS, images)

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Body parsing middleware (uniquement Express suffisant)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
  secret: "votre_clé_secrète_complexe", // Changez ceci par une chaîne aléatoire
  resave: false,
  saveUninitialized: false,
  cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 heures en millisecondes
      httpOnly: true,
      secure: false, // Mettez à true si vous utilisez HTTPS
      path: '/'
  }
}));

app.use((req, res, next) => {
  // Simule une IP différente à chaque fois (à désactiver en production)
  req.ip = req.headers['x-forwarded-for'] || '127.0.0.' + Math.floor(Math.random() * 255);
  next();
});
// Passport
app.use(passport.initialize());
app.use(passport.session());

// =============================================
// ROUTE IMPORTS
// =============================================
const loginRoutes = require('./routes/login');
const authRoutes = require('./routes/auth');
const satisfactionRoutes = require('./routes/satisfaction');
const banniereRoutes = require("./routes/bannieres");
const publicRoutes = require('./routes/publicRoutes');

// Controller imports
const candidatController = require('./controllers/candidatController');

// Middleware imports
const upload = require('./middlewares/upload');
const requireAdminAuth = require('./middlewares/requireAdminAuth');
const adminRoutes = require('./routes/admin');
const candidatsRoutes = require('./routes/candidats');
const secteursRoutes = require('./routes/secteurs');
app.use('/', secteursRoutes);
app.use('/', candidatsRoutes);
app.use('/', require('./routes/candidats'));



const candidatsRouter = require('./routes/candidats');
const satisfactionRouter = require('./routes/satisfaction');

app.use('/candidats', candidatsRouter);
app.use('/satisfaction', satisfactionRouter);




// =============================================
// ROUTE DEFINITIONS
// =============================================
// Authentication routes
app.use('/admin', adminRoutes);
app.use('/login', loginRoutes);
// Admin routes (protected)
app.use('/admin', requireAdminAuth, adminRoutes);
app.use('/banniere', banniereRoutes);
app.use('/', satisfactionRoutes);
app.use('/public', publicRoutes);
app.use('/', require('./routes/satisfaction'));

// =============================================
// CORE APPLICATION ROUTES
// =============================================
app.get("/", async (req, res) => {
  try {
    const [candidats] = await db.query(
      "SELECT * FROM candidats ORDER BY votes DESC"
    );
    const [secteurs] = await db.query("SELECT * FROM secteurs");
    const [bannieres] = await db.query("SELECT * FROM bannieres"); // Ajouté

    const [stats] = await db.query(`
      SELECT 
        SUM(reponse = 'oui') AS oui,
        SUM(reponse = 'non') AS non
      FROM satisfaction
    `);

    // Calcul du total global
    const totalGlobalVotes = secteurs.reduce((total, secteur) => {
      return total + secteur.votes_oui + secteur.votes_non;
    }, 0);

    const totalVotes = candidats.reduce((sum, c) => sum + c.votes, 0);
    const topCandidat = candidats[0];
    const totalSuffragesGlobaux = secteurs.reduce(
      (sum, s) => sum + s.votes_oui + s.votes_non,
      0
    );

    secteurs.forEach((secteur) => {
      secteur.pourcentage =
        totalSuffragesGlobaux > 0
          ? (secteur.votes_oui * 100) / totalSuffragesGlobaux
          : 0;
    });

    res.render("index", {
      candidats,
      totalVotes,
      topCandidat,
      secteurs,
      totalGlobalVotes,
      totalVotesSecteurs: totalSuffragesGlobaux,
      totalSuffragesGlobaux,
      satisfactionStats: stats[0],
      bannieres, // ← passer aussi ici
    });
  } catch (err) {
    console.error("Erreur dans la route / :", err);
    res.status(500).send("Erreur serveur");
  }
});


//===================================
 // Vote for a candidate endpoint
 //==================================
app.post('/voter-candidat', async (req, res) => {
  const { candidatId } = req.body;
  try {
    // 1. Increment vote count
    await db.query('UPDATE candidats SET votes = votes + 1 WHERE id = ?', [candidatId]);
    // 2. Get updated candidate data
    const [candidatRows] = await db.query('SELECT * FROM candidats WHERE id = ?', [candidatId]);
    const candidat = candidatRows[0];
    if (!candidat) {
      return res.status(404).json({ 
        success: false, 
        message: 'Candidate not found after update' 
      });
    }

    // 3. Get all candidates for stats
    const [allCandidats] = await db.query('SELECT * FROM candidats ORDER BY votes DESC');
    
    // 4. Calculate statistics
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
    console.error('Error in /voter-candidat:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      details: err.message 
    });
  }
});

//===================================
//Vote for a sector endpoint
//=====================================
app.post('/voter-secteur', async (req, res) => {
  const { secteurId, reponse } = req.body;
 
  try {
    console.log(`Received vote for sector: ${secteurId} with response: ${reponse}`);

    // Validate response
    if (!['oui', 'non'].includes(reponse)) {
      return res.status(400).json({ success: false, message: 'Invalid response.' });
    }

    // Determine field to increment
    const field = reponse === 'oui' ? 'votes_oui' : 'votes_non';

    // 1. Increment vote count in sectors table
    const [updateVote] = await db.query(
      `UPDATE secteurs SET ${field} = ${field} + 1 WHERE id = ?`, 
      [secteurId]
    );

    if (updateVote.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Sector not found.' });
    }
   
    // 2. Get updated vote counts
    const [secteurRows] = await db.query(
      'SELECT votes_oui, votes_non FROM secteurs WHERE id = ?', 
      [secteurId]
    );
    const updatedVotesOui = secteurRows[0].votes_oui;
    const updatedVotesNon = secteurRows[0].votes_non;

    // 3. Update global voter count
    await db.query('UPDATE global_stats SET total_votants = total_votants + 1 WHERE id = 1');

    // 4. Get total voters
    const [globalRows] = await db.query('SELECT total_votants FROM global_stats WHERE id = 1');
    const totalVotants = globalRows[0].total_votants;

    // 5. Calculate satisfaction percentage
    const satisfactionFixe = (updatedVotesOui * 100) / totalVotants;

    res.json({
      success: true,
      updatedVotesOui,
      updatedVotesNon,
      totalVotants,
      satisfactionFixe: satisfactionFixe.toFixed(2)
    });

  } catch (err) {
    console.error('Error updating vote:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


//==========================================
//get admin
//=====================================
app.get("/admin", async (req, res) => {
  console.log("Session admin :", req.session.admin);

  console.log("==> Accès à /admin");
  console.log("Session actuelle :", req.session);

  if (!req.session.admin || !req.session.admin.isAuthenticated) {
    console.log("🔒 Redirection vers /login car admin non connecté");
    return res.redirect("/admin");
  }

  try {
    const [candidats] = await db.query("SELECT * FROM candidats");
    const [secteurs] = await db.query("SELECT * FROM secteurs");
    const [bannieres] = await db.query("SELECT * FROM bannieres");

    console.log("✅ Données récupérées pour admin :", {
      candidats: candidats.length,
      secteurs: secteurs.length,
      bannieres: bannieres.length
    });

    res.render("admin", {
      candidats,
      secteurs,
      bannieres
    });
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des données :", err);
    res.status(500).send("Erreur serveur");
  }
});

//===========================
 //Login route
 //=========================
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log('Tentative de connexion:', { username });

  if (!username || !password) {
    console.log('Champs manquants');
    return res.status(400).render("login", {
      error: "Tous les champs sont requis",
      username
    });
  }

  try {
    const [rows] = await db.query(
      "SELECT id, username, password FROM administrateurs WHERE username = ?", 
      [username]
    );

    if (rows.length === 0) {
      console.log('Utilisateur non trouvé');
      return res.status(401).render("login", {
        error: "Identifiants incorrects",
        username
      });
    }

    const admin = rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password);
    console.log(">>> Résultat comparaison mot de passe :", passwordMatch);

    if (!passwordMatch) {
      console.log('Mot de passe incorrect');
      return res.status(401).render("login", {
        error: "Identifiants incorrects",
        username
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error('Erreur de session:', err);
        return res.status(500).render("login", {
          error: "Erreur technique"
        });
      }

      // Ajouter isAuthenticated dans la session
      req.session.admin = {
        id: admin.id,
        username: admin.username,
        ip: req.ip,
        loggedInAt: new Date().toISOString(),
        isAuthenticated: true
      };

      console.log(">>> admin dans session AVANT save:", req.session.admin);
      console.log(">>> session complète AVANT save:", req.session);

      req.session.save((err) => {
        if (err) {
          console.error('Erreur sauvegarde session:', err);
          return res.status(500).render("login", {
            error: "Erreur technique"
          });
        }

        console.log(">>> Session enregistrée avec succès:", req.session.admin);
        console.log(">>> session complète APRÈS save:", req.session);
        res.redirect("/admin");
      });
    });

  } catch (error) {
    console.error('Erreur serveur:', error);
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
// SERVER STARTUP
// =============================================
app.listen(3000, '0.0.0.0', () => {
  console.log('✅ Server running at http://0.0.0.0:3000');
});









