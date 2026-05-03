const mongoose = require('mongoose');

const adherenceLogSchema = new mongoose.Schema({
    // ✅ Change userId to patientId to match the controller and medication model
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medication', required: true },
    medicationName: String,
    scheduledTime: String,
    actualTakenTime: { type: Date, default: Date.now },
    snoozeCount: { type: Number, default: 0 },
    status: { type: String, enum: ['taken', 'late', 'missed'] },
    latencyMinutes: Number,
    date: { type: String, required: true } 
});

module.exports = mongoose.model('AdherenceLog', adherenceLogSchema);