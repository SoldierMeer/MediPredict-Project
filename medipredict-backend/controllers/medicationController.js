import Medication from '../models/Medication.js';
import MedicationLog from '../models/MedicationLog.js';
import { calculateRiskLevel } from '../utils/aiEngine.js'; 
import axios from 'axios';
import User from '../models/User.js';

const getLocalToday = () => new Date().toLocaleDateString('en-CA'); 

/**
 * ✅ GET PATIENT MEDICATIONS
 */
export const getPatientMedications = async (req, res) => {
  try {
    const rawId = req.params.patientId;
    const sanitizedId = rawId ? rawId.replace(/[^a-fA-F0-9]/g, '').trim() : null;

    if (!sanitizedId || sanitizedId.length !== 24) {
      return res.status(400).json({ error: "Invalid Patient ID format" });
    }

    const meds = await Medication.find({ patientId: sanitizedId });
    const today = getLocalToday();

    const processedMeds = meds.map(med => {
      const medObj = med.toObject();
      if (medObj.lastTakenDate !== today) {
        medObj.isTaken = false;
        medObj.status = 'upcoming';
        medObj.snoozeCount = 0;
      }
      return { ...medObj, id: medObj._id };
    });

    res.json(processedMeds);
  } catch (error) {
    console.error("🔴 getPatientMedications Crash:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ ADD MEDICATION
 */
export const addMedication = async (req, res) => {
  try {
    const newMed = new Medication(req.body); 
    await newMed.save();
    res.status(201).json(newMed);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * ✅ UPDATE MEDICATION STATUS
 * Implements severe latency detection and immediate AI sync
 */
export const updateMedicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    const today = getLocalToday();
    const now = new Date();

    const med = await Medication.findById(id);
    if (!med) return res.status(404).json({ message: "Medication not found" });

    // 1. ROBUST LATENCY CALCULATION
    let latency = 0;
    if (status === 'taken' && med.time) {
        // ✅ Safer Regex: Handles "8:00AM", "08:00 AM", "8:00 PM", etc.
        const timeMatch = med.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        
        if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const modifier = timeMatch[3].toUpperCase();

            if (modifier === 'PM' && hours !== 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;

            const scheduledDate = new Date();
            scheduledDate.setHours(hours, minutes, 0, 0);

            // Latency in minutes
            latency = Math.round((now - scheduledDate) / (1000 * 60));

            // Cross-day fix: Adjust for doses meant for yesterday/early morning
            if (latency < -600) latency += 1440; 
        }
    }
    // 2. STATUS ENFORCEMENT
    let finalStatus = status;
    if (status === 'taken' && latency > 30) {
        finalStatus = 'late';
    }

    // 3. PERSIST TO MAIN SCHEDULE
    med.status = finalStatus;
    med.isTaken = (status === 'taken');
    med.lastTakenDate = today;
    await med.save();

    // 4. PERSIST TO BEHAVIORAL LOG
    await MedicationLog.findOneAndUpdate(
      { medicationId: id, dateString: today },
      {
        patientId: med.patientId,
        medicationId: id,
        name: med.name,
        dosage: med.dosage,
        status: finalStatus,
        timestamp: now,
        dateString: today,
        latencyMinutes: latency 
      },
      { upsert: true, new: true }
    );

    // 5. SAFETY-AWARE AI CALCULATION
    // Limit to 15 logs to ensure the AI reacts immediately to recent bad behavior
    const recentLogs = await MedicationLog.find({ patientId: med.patientId })
      .sort({ timestamp: -1 })
      .limit(15);

    const aiAnalysis = calculateRiskLevel(recentLogs);

    // 6. SYNC TO USER DOCUMENT
    await User.findByIdAndUpdate(med.patientId, {
      adherenceScore: aiAnalysis.score,
      latestRiskLevel: aiAnalysis.level,
      latestRiskInsight: aiAnalysis.insight
    });

    res.status(200).json({ updatedMedication: med, aiAnalysis });
  } catch (error) {
    console.error("🔴 updateMedicationStatus Crash:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ GET AI INSIGHTS
 * Implements the SAFETY OVERRIDE logic for the demo
 */
export const getAIInsights = async (req, res) => {
  try {
    const rawId = req.params.patientId;
    const sanitizedId = rawId ? rawId.replace(/[^a-fA-F0-9]/g, '').trim() : null;

    if (!sanitizedId || sanitizedId.length !== 24) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    // Fetch logs - limit to 15 logs to catch "Toxicity" events
    const recentLogs = await MedicationLog.find({ patientId: sanitizedId })
      .sort({ timestamp: -1 }) 
      .limit(15);

    if (!recentLogs.length) {
      return res.json({ level: 'Stable', confidence: 100, insight: 'No logs.', score: 100 });
    }

    // 1. Feature Engineering for Python
    const missed = recentLogs.filter(log => log.status === 'missed').length;
    const late = recentLogs.filter(log => log.status === 'late').length;
    const latencyList = recentLogs.filter(log => log.status !== 'missed').map(log => log.latencyMinutes || 0);
    // ✅ PASS MAX LATENCY so Python can see the severe gaps
    const avgLatency = latencyList.length > 0 ? Math.max(...latencyList) : 0; 

    // 2. Call Python ML Microservice
    const mlResponse = await axios.post('http://127.0.0.1:8000/predict-risk', {
      avg_latency_minutes: avgLatency,
      missed_doses_last_7_days: missed,
      late_doses_last_7_days: late
    }).catch(() => null);

    // 3. Local Engine (Safety Rules)
    const localAnalysis = calculateRiskLevel(recentLogs);

    // 4. ✅ SAFETY OVERRIDE LOGIC
    // If Local Rules detect Critical/Toxicity, they ALWAYS win over the Python ML model.
    let finalLevel = localAnalysis.level;
    let finalInsight = localAnalysis.insight;

    if (localAnalysis.level !== 'Critical' && mlResponse) {
        finalLevel = mlResponse.data.level;
        finalInsight = mlResponse.data.insight;
    }

    const finalScore = localAnalysis.score;

    // 5. Sync results to User profile
    await User.findByIdAndUpdate(sanitizedId, {
      adherenceScore: finalScore,
      latestRiskLevel: finalLevel,
      latestRiskInsight: finalInsight
    });

    res.json({
      level: finalLevel,
      insight: finalInsight,
      score: finalScore,
      confidence: mlResponse ? Math.round(mlResponse.data.confidence) : 50
    });

  } catch (err) {
    console.error("🔴 getAIInsights Crash:", err.message);
    res.status(200).json({ level: 'Stable', insight: 'Syncing...', score: 0 });
  }
};

/**
 * ✅ GET HISTORY BY DATE
 */
export const getHistoryByDate = async (req, res) => {
  try {
    const { patientId, date } = req.query; 
    const sanitizedId = patientId.replace(/[^a-fA-F0-9]/g, '');
    
    const logs = await MedicationLog.find({
      patientId: sanitizedId,
      dateString: date
    }).sort({ timestamp: -1 });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ DELETE MEDICATION
 */
export const deleteMedication = async (req, res) => {
  try {
    await Medication.findByIdAndDelete(req.params.id);
    res.json({ message: "Medication removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};