import mongoose from 'mongoose';

/**
 * Request Schema
 * Handles cross-role interactions including caregiver linking, 
 * AI-triggered nudges, and manual caregiver reminders.
 */
const requestSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  caregiverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['link', 'reminder', 'emergency'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'dismissed'], 
    default: 'pending' 
  },
  // Contextual message (e.g., "Your caregiver sent a nudge to take your meds.")
  message: { 
    type: String 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// ✅ Optimized Export: Prevents OverwriteModelError during development reloads
const Request = mongoose.models.Request || mongoose.model('Request', requestSchema);

export default Request;