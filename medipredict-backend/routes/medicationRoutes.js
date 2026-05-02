const express = require('express');
const router = express.Router();
const { getMedications, addMedication } = require('../controllers/medicationController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, getMedications);
router.post('/', auth, addMedication);

module.exports = router;