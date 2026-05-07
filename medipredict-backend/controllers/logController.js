import AdherenceLog from '../models/AdherenceLog.js';
import MedicationLog from '../models/MedicationLog.js'; // Check your model name!

export const createLog = async (req, res) => {
  try {
    const { medicationName, scheduledTime, actualTakenTime, snoozeCount, status } = req.body;

    // 1. Directly create Date objects from ISO strings
    const scheduledDate = new Date(scheduledTime);
    const actualDate = new Date(actualTakenTime);

    // 2. Calculate latency in minutes
    // (Actual - Scheduled) / 60,000 milliseconds
    const diffMs = actualDate - scheduledDate;
    const latencyMinutes = Math.floor(diffMs / (1000 * 60));

    // 3. Save the log with standardized data
    const log = new AdherenceLog({
      userId: req.user.userId,
      medicationName,
      scheduledTime: scheduledDate.toISOString(), // Store as ISO for AI consistency
      actualTakenTime: actualDate.toISOString(),
      snoozeCount,
      status,
      latencyMinutes
    });

    await log.save();
    res.status(201).json({ message: "Behavioral log saved successfully", log });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// controllers/logController.js

export const getRecentLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await MedicationLog.find({ patientId: id })
      .sort({ timestamp: -1 })
      .limit(5);

    const alerts = logs.map(log => ({
      _id: log._id,
      // ✅ Use a fallback ('Unknown Medication') so it never shows "undefined"
      title: log.status === 'missed' 
        ? `Missed: ${log.medicationName || log.name || 'Medication'}` 
        : `Taken: ${log.medicationName || log.name || 'Medication'}`,
      message: log.status === 'missed' 
        ? `${log.dose || 'Dose'} was not logged.` 
        : `${log.dose || 'Dose'} was successfully recorded.`,
      // ✅ Ensure the timestamp is a valid ISO string
      timestamp: log.timestamp || log.createdAt || new Date().toISOString()
    }));

    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching logs" });
  }
};