const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: Date },           // Added for your 26th birthday data
  phoneNumber: { type: String }, // Added
  gender: { type: String },      // Added
  patientCode: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

// ✅ FIX: Removed 'next' parameter. Mongoose handles 'async' automatically.
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', userSchema);