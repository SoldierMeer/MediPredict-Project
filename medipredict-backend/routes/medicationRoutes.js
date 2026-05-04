import express from 'express'
const router = express.Router();
import AdherenceLog from '../models/AdherenceLog.js'; // Check if file exists in models/
import { calculateRiskLevel } from '../utils/aiEngine.js';
import auth from '../middleware/authMiddleware.js';
// ✅ FIX: Change getMedications to getPatientMedications
import {
    getPatientMedications,
    addMedication,
    updateMedication,
    deleteMedication
  } from '../controllers/medicationController.js';


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

// In backend/routes/medicationRoutes.js
router.get('/ai-insights/:patientId', async (req, res) => {
    try {
      const { patientId } = req.params;
      
      // Fetch logs to analyze
      const logs = await AdherenceLog.find({ patientId })
        .sort({ createdAt: -1 })
        .limit(50);
      
      // Run the logic
      const analysis = calculateRiskLevel(logs);
      
      res.json(analysis);
    } catch (error) {
      // 3. This will help you see the EXACT error in your terminal
      console.error("AI Insight Route Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

export default router;