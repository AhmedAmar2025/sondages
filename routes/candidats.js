
const express = require('express');
const router = express.Router();
const candidatController = require('../controllers/candidatController');

// Route POST pour voter pour un candidat (avec contrôle IP)
router.post('/vote-candidat/:id', candidatController.voterPourCandidat);

module.exports = router;
