const Medication = require('../models/Medication');

// GET /api/medications
exports.getMedications = async (req, res) => {
  try {
    // Only fetch meds belonging to the logged-in user
    const meds = await Medication.find({ userId: req.user.userId, isArchived: false });
    res.json(meds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/medications
exports.addMedication = async (req, res) => {
  try {
    const newMed = new Medication({
      ...req.body,
      userId: req.user.userId
    });
    await newMed.save();
    res.status(201).json(newMed);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};