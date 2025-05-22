const express = require('express');
const router = express.Router();
const secteurController = require('../controllers/secteurController');

// Route POST pour voter pour un secteur avec vérification IP
router.post('/vote/:id', secteurController.votePourSecteur); // ✅ correct



module.exports = router;
