const mongoose = require('mongoose');
const adherenceLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medicationName: String,
    scheduledTime: String,
    actualTakenTime: Date,
    snoozeCount: { type: Number, default: 0 },
    status: { type: String, enum: ['taken', 'missed'] },
    latencyMinutes: Number // Calculated as $T_{actual} - T_{scheduled}$
  });

module.exports = mongoose.model('AdherenceLog', adherenceLogSchema);