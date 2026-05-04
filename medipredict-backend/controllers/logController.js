import AdherenceLog from '../models/AdherenceLog.js';

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