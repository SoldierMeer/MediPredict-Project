const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  quantity: { type: String, required: true }, // Added
  time: { type: String, required: true },
  category: { type: String, required: true },
  frequency: { type: String, required: true },
  selectedDays: { type: [String], default: [] }, // ✅ Added for ["Mon", "Wed"]
  isTaken: { type: Boolean, default: false }, // Added
  status: { type: String, default: 'upcoming' }, // Added
  isArchived: { type: Boolean, default: false },
  snoozeUntil: { type: String, default: null }, // Added
  snoozeCount: { type: Number, default: 0 }, // Added
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Medication', medicationSchema);