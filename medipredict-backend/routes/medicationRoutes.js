const express = require('express');
const router = express.Router();
// ✅ FIX: Change getMedications to getPatientMedications
const { 
  getPatientMedications, 
  addMedication, 
  updateMedication, 
  deleteMedication 
} = require('../controllers/medicationController');
const auth = require('../middleware/authMiddleware');

// ✅ FIX: Use the correct function name and add the missing ID params
router.get('/patient/:patientId', auth, getPatientMedications);
router.post('/', auth, addMedication);
router.patch('/:id', auth, updateMedication);
router.delete('/:id', auth, deleteMedication);

module.exports = router;