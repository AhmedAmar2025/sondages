
const { body, param, validationResult } = require('express-validator');
const db = require('../config/db');

module.exports = {
    // Validation des IDs MongoDB
    validateObjectId: [
        param('id')
            .trim()
            .isLength({ min: 24, max: 24 })
            .withMessage('ID invalide')
            .bail()
            .isHexadecimal()
            .withMessage('Doit être un ID hexadécimal'),
        (req, res, next) => handleValidation(req, res, next)
    ],

    // Validation des candidats
    validateCandidatInput: [
        body('nom')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Le nom doit contenir entre 2 et 50 caractères')
            .bail()
            .matches(/^[a-zA-Z\u00C0-\u017F\s-]+$/)
            .withMessage('Caractères spéciaux non autorisés'),
            
        body('prenom')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
            
        body('secteurId')
            .trim()
            .isLength({ min: 24, max: 24 })
            .withMessage('ID de secteur invalide')
            .bail()
            .custom(async (value) => {
                const [secteur] = await db.query('SELECT id FROM secteurs WHERE id = ?', [value]);
                if (!secteur) throw new Error('Secteur inexistant');
                return true;
            }),
            
        (req, res, next) => handleValidation(req, res, next)
    ],

    // Validation des secteurs
    validateSecteurInput: [
        body('nom')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('2 à 100 caractères requis'),
            
        body('nom_ar')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('2 à 100 caractères requis (arabe)'),
            
        (req, res, next) => handleValidation(req, res, next)
    ],

    // Validation des bannières
    validateBanniereInput: [
        body('titre')
            .trim()
            .isLength({ min: 5, max: 100 })
            .withMessage('5 à 100 caractères requis'),
            
        (req, res, next) => handleValidation(req, res, next)
    ],

    // Validation des confirmations
    validateResetRequest: [
        body('confirm')
            .equals('CONFIRM')
            .withMessage('Confirmation requise'),
            
        (req, res, next) => handleValidation(req, res, next)
    ]
};

// Gestion centralisée des erreurs
function handleValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
}