import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // ADD THESE FIELDS
  dob: { type: Date },
  phoneNumber: { type: String },
  gender: { type: String },

  role: {
    type: String,
    enum: ['patient', 'caregiver', null],
    default: null
  },

  // Patient Code
  patientCode: {
    type: String,
    unique: true,
    sparse: true
  },

  adherenceScore: { type: Number, default: 0 }, // Changed from adherenceRate
  latestRiskLevel: { type: String, default: 'Stable' }, // Changed from riskLevel
  latestRiskInsight: { type: String, default: 'Optimal management detected.' },

  createdAt: { type: Date, default: Date.now }
});

// Pre-save hook
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

const User = mongoose.model('User', userSchema);

export default User;