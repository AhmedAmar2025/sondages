




const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
//const adminController = require('../controllers/adminController');
//const { isAuthenticated } = require('../middlewares/authMiddleware');
const adminController = require("../controllers/adminController");
// Configurer Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });


// Middleware pour vérifier la session
function isAuthenticated(req, res, next) {
    if (req.session.admin && req.session.admin.isAuthenticated) {
      return next();
    }
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
  }

// Routes admin
router.get('/', isAuthenticated, adminController.getAdminPage);
router.post('/ajouter-candidat', isAuthenticated, upload.single('photo'), adminController.addCandidat);
router.post('/supprimer-candidat', isAuthenticated, adminController.deleteCandidat);

router.post('/ajouter-secteur', isAuthenticated, upload.single('logo'), adminController.addSecteur);
router.post('/secteurs/delete/:id', isAuthenticated, adminController.deleteSecteur);

router.post('/ajouter-banniere', isAuthenticated, upload.single('image'), adminController.addBanniere);
router.post('/bannieres/delete/:id', isAuthenticated, adminController.deleteBanniere);

router.post('/reset-votes', isAuthenticated, adminController.resetVotesCandidats);
router.post('/reset-votes-secteurs', isAuthenticated, adminController.resetVotesSecteurs);
//router.post('/reset-satisfaction', isAuthenticated, adminController.resetSatisfaction);
router.post("/reset-satisfaction", adminController.resetSatisfactionVotes);

module.exports = router;