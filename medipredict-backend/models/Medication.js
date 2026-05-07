import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
  // ✅ Linked to the User model for relationship queries
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }, 
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  quantity: { type: String, required: true },
  time: { type: String, required: true },
  category: { type: String, required: true },
  frequency: { type: String, required: true },
  selectedDays: { type: [String], default: [] },
  isTaken: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['upcoming', 'taken', 'missed', 'late', 'snoozed'], 
    default: 'upcoming' 
  },
  isArchived: { type: Boolean, default: false },
  snoozeUntil: { type: String, default: null },
  snoozeCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastTakenDate: {
    type: String, // Format: YYYY-MM-DD
    default: null
  }
});

// ✅ Use ES Module export for consistency with your controllers
const Medication = mongoose.model('Medication', medicationSchema);
export default Medication;