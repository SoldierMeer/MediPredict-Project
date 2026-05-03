const Medication = require('../models/Medication');

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
    const updated = await Medication.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    res.json(updated);
  } catch (error) {
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