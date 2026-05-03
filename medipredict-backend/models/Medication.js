// Medications.js
const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  // ✅ FIX: Change 'userId' to 'patientId'
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  quantity: { type: String, required: true },
  time: { type: String, required: true },
  category: { type: String, required: true },
  frequency: { type: String, required: true },
  selectedDays: { type: [String], default: [] },
  isTaken: { type: Boolean, default: false },
  status: { type: String, default: 'upcoming' },
  isArchived: { type: Boolean, default: false },
  snoozeUntil: { type: String, default: null },
  snoozeCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Medication', medicationSchema);