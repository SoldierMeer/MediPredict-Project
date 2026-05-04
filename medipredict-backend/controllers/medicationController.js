import Medication from '../models/Medication.js';
import AdherenceLog from '../models/AdherenceLog.js';
import { calculateRiskLevel } from '../utils/aiEngine.js';
import User from '../models/User.js';

// Get all meds for a specific patient
export const getPatientMedications = async (req, res) => {
  try {
    const meds = await Medication.find({ patientId: req.params.patientId });
    
    // Get current server date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    const processedMeds = meds.map(med => {
      // If the date the user last clicked "Taken" is not TODAY...
      if (med.lastTakenDate !== today) {
        // ...then for the purposes of today's UI, it is NOT taken yet.
        med.isTaken = false;
        med.status = 'upcoming';
        med.snoozeCount = 0;
      }
      return med;
    });

    res.json(processedMeds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a new medication (Used by Caregivers)
// medicationController.js
export const addMedication = async (req, res) => {
  try {
    // The frontend already sends 'patientId' in the body
    const newMed = new Medication(req.body); 
    await newMed.save();
    res.status(201).json(newMed);
  } catch (error) {
    // This will now show the actual Mongoose validation error if it fails
    console.error("Save Error:", error.message);
    res.status(400).json({ error: error.message });
  }
};

// Update medication (Mark as taken or edit details)
export const updateMedication = async (req, res) => {
  try {
    const { isTaken, status: incomingStatus } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch the old record for state comparison
    const oldMed = await Medication.findById(req.params.id);
    if (!oldMed) {
      return res.status(404).json({ error: "Medication not found" });
    }

    // 2. Prepare update data with Date-Verified stamp
    // This ensures adherence is tracked for the specific calendar day
    let updateData = { ...req.body };
    if (isTaken !== undefined) {
      updateData.lastTakenDate = isTaken ? today : null;
    }

    // 3. Update the medication record in MongoDB using the enhanced updateData
    const updatedMed = await Medication.findByIdAndUpdate(
      req.params.id,
      updateData, 
      { new: true }
    );

    // 4. Adherence Logging Logic
    const wasJustTaken = isTaken && !oldMed.isTaken;
    const wasJustMissed = incomingStatus === 'missed' && oldMed.status !== 'missed';

    if (wasJustTaken || wasJustMissed) {
      const now = new Date();
      
      // Calculate scheduled time as a Date object for latency math
      const [time, modifier] = updatedMed.time.split(' ');
      let [hours, minutes] = time.split(':');
      if (hours === '12') hours = '00';
      if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();

      const scheduledDate = new Date();
      scheduledDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      const latency = Math.round((now - scheduledDate) / (1000 * 60));
      
      // Logic: If explicitly 'missed' via snooze, keep it. Otherwise, check 30-min window.
      const finalStatus = wasJustMissed ? 'missed' : (latency > 30 ? 'late' : 'taken');

      const log = new AdherenceLog({
        patientId: updatedMed.patientId,
        medicationId: updatedMed._id,
        medicationName: updatedMed.name,
        scheduledTime: updatedMed.time,
        actualTakenTime: now,
        latencyMinutes: latency,
        status: finalStatus,
        snoozeCount: updatedMed.snoozeCount || 0,
        date: today
      });

      await log.save();

      // --- 🧠 REAL-TIME AI RISK CALCULATION ---
      // Fetch recent logs (including the one just saved) to perform background inference
      const logs = await AdherenceLog.find({ patientId: updatedMed.patientId })
        .sort({ createdAt: -1 })
        .limit(30);

      const aiAnalysis = calculateRiskLevel(logs);

      // Persist the AI findings to the User profile for Caregiver monitoring
      await User.findByIdAndUpdate(updatedMed.patientId, {
        latestRiskLevel: aiAnalysis.level,
        latestRiskInsight: aiAnalysis.insight,
        adherenceScore: aiAnalysis.score
      });

      // Return both the updated med and the fresh AI analysis for instant UI updates
      return res.json({ 
        updatedMed, 
        aiAnalysis 
      });
    }

    // 5. Default response for non-loggable events (e.g., simple detail edits)
    res.json({ updatedMed });

  } catch (error) {
    console.error("Update Error:", error.message);
    res.status(400).json({ error: error.message });
  }
};
// Delete medication
export const deleteMedication = async (req, res) => {
  try {
    await Medication.findByIdAndDelete(req.params.id);
    res.json({ message: "Medication removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};