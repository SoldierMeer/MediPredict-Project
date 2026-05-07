import express from 'express';
const router = express.Router();
import auth from '../middleware/authMiddleware.js';
import MedicationLog from '../models/MedicationLog.js'; // ✅ Unified source of truth

// ✅ Importing all controllers
import {
    getPatientMedications,
    addMedication,
    updateMedicationStatus,
    deleteMedication,
    getAIInsights 
} from '../controllers/medicationController.js';

// ---------------------------------------------------------
// 💊 MEDICATION MANAGEMENT ROUTES
// ---------------------------------------------------------

// Get all meds for a specific patient
router.get('/patient/:patientId', auth, getPatientMedications);

// Add, Update, and Delete
router.post('/', auth, addMedication);
router.patch('/:id', auth, updateMedicationStatus);
router.delete('/:id', auth, deleteMedication);

// ---------------------------------------------------------
// 🧠 AI & ANALYTICS ROUTES
// ---------------------------------------------------------

/**
 * @route   GET /api/medications/ai-insights/:patientId
 * @desc    Calls the Python ML microservice for behavioral risk prediction
 * @access  Private (Patient/Caregiver)
 */
router.get('/ai-insights/:patientId', auth, getAIInsights);

/**
 * @route   GET /api/medications/adherence-history/:patientId
 * @desc    Fetches raw logs for the History tab and trend charts
 * @access  Private
 */
router.get('/adherence-history/:patientId', auth, async (req, res) => {
    try {
        const rawId = req.params.patientId;
        
        // ✅ 1. SANITIZE ID: Remove trailing underscores or non-hex characters
        // This prevents the CastError/500 crash during the IBA demo.
        const sanitizedId = rawId ? rawId.replace(/[^a-fA-F0-9]/g, '').trim() : null;

        if (!sanitizedId || sanitizedId.length !== 24) {
            console.error(`⚠️ History Route: Malformed ID received: "${rawId}"`);
            return res.status(400).json({ error: "Invalid Patient ID format" });
        }

        // ✅ 2. FETCH FROM MedicationLog: Ensure it matches the updateMedicationStatus source
        const logs = await MedicationLog.find({ patientId: sanitizedId })
            .sort({ timestamp: -1 }) 
            .limit(100); 

        res.json(logs);
    } catch (err) {
        console.error("🔴 Adherence History Crash:", err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;