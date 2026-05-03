const express = require('express');
const router = express.Router();
// ✅ FIX: Change getMedications to getPatientMedications
const { 
  getPatientMedications, 
  addMedication, 
  updateMedication, 
  deleteMedication 
} = require('../controllers/medicationController');
const AdherenceLog = require('../models/AdherenceLog');
const auth = require('../middleware/authMiddleware');

// ✅ FIX: Use the correct function name and add the missing ID params
router.get('/patient/:patientId', auth, getPatientMedications);
router.post('/', auth, addMedication);
router.patch('/:id', auth, updateMedication);
router.delete('/:id', auth, deleteMedication);

router.get('/adherence-history/:patientId', auth, async (req, res) => {
    try {
      const logs = await AdherenceLog.find({ patientId: req.params.patientId })
        .sort({ actualTakenTime: -1 }) // Show newest logs first
        .limit(100); // Limit to recent 100 for performance
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

module.exports = router;