import mongoose from 'mongoose';

const medicationLogSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  medicationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Medication', 
    required: true 
  },
  name: { type: String, required: true },
  dosage: { type: String },
  
  // ✅ STATUS: Added 'late' to ensure validation passes during updateMedicationStatus
  status: { 
    type: String, 
    enum: ['taken', 'missed', 'late', 'upcoming'], 
    required: true 
  },

  // ✅ LATENCY: Crucial for the AI Engine to detect 12-hour gaps and calculate risk
  latencyMinutes: { 
    type: Number, 
    default: 0 
  },

  // Format: YYYY-MM-DD for precise filtering in your History calendar
  dateString: { 
    type: String, 
    // Default to local time YYYY-MM-DD
    default: () => new Date().toLocaleDateString('en-CA') 
  },

  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// Prevent model overwrite error during hot-reloads
const MedicationLog = mongoose.models.MedicationLog || mongoose.model('MedicationLog', medicationLogSchema);

export default MedicationLog;