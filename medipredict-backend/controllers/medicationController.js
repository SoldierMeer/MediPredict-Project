const Medication = require('../models/Medication');
const AdherenceLog = require('../models/AdherenceLog');

// Get all meds for a specific patient
exports.getPatientMedications = async (req, res) => {
  try {
    const meds = await Medication.find({ patientId: req.params.patientId });
    res.json(meds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a new medication (Used by Caregivers)
// medicationController.js
exports.addMedication = async (req, res) => {
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
exports.updateMedication = async (req, res) => {
  try {
    // 1. Destructure isTaken to prevent ReferenceError
    const { isTaken } = req.body; 

    // 2. Fetch the old record for state comparison
    const oldMed = await Medication.findById(req.params.id);
    if (!oldMed) {
      return res.status(404).json({ error: "Medication not found" });
    }

    // 3. Update the medication record in MongoDB
    const updatedMed = await Medication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // 4. Adherence Logic: Only log if the dose was just marked as taken
    if (isTaken && !oldMed.isTaken) {
      const now = new Date();
      
      // Calculate scheduled time as a Date object
      const [time, modifier] = updatedMed.time.split(' ');
      let [hours, minutes] = time.split(':');
      
      if (hours === '12') hours = '00';
      if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();

      const scheduledDate = new Date();
      scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Calculate Latency: $T_{actual} - T_{scheduled}$
      const latency = Math.round((now - scheduledDate) / (1000 * 60));

      // Determine status based on your 30-min window
      const status = latency > 30 ? 'late' : 'taken';

      const log = new AdherenceLog({
        patientId: updatedMed.patientId,
        medicationId: updatedMed._id,
        medicationName: updatedMed.name,
        scheduledTime: updatedMed.time,
        actualTakenTime: now,
        latencyMinutes: latency,
        status: status,
        snoozeCount: updatedMed.snoozeCount || 0,
        date: now.toISOString().split('T')[0]
      });

      await log.save();
    }

    // 5. Send back the updated medication to the frontend
    res.json(updatedMed);

  } catch (error) {
    console.error("Update Error:", error.message);
    res.status(400).json({ error: error.message });
  }
};

// Delete medication
exports.deleteMedication = async (req, res) => {
  try {
    await Medication.findByIdAndDelete(req.params.id);
    res.json({ message: "Medication removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};