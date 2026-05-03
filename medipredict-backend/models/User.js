const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // ✅ ADD THESE FIELDS
    dob: { type: Date }, 
    phoneNumber: { type: String },
    gender: { type: String },
    
    role: { 
      type: String, 
      enum: ['patient', 'caregiver', null], 
      default: null
    },
    // ✅ The Patient Code (unique for every patient in Sukkur or elsewhere)
    patientCode: { 
      type: String, 
      unique: true, 
      sparse: true // Allows caregivers to have a null/missing code without errors
    },
    adherenceRate: { type: Number, default: 0 },
    riskLevel: { type: String, default: 'Low' },
    createdAt: { type: Date, default: Date.now }
  });

// ✅ FIX: Removed 'next' parameter. Mongoose handles 'async' automatically.
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', userSchema);