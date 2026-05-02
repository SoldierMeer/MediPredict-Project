const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    // Destructure the extra fields from Phase 1
    const { name, email, password, dob, phoneNumber, gender } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    const patientCode = `MP-${Math.floor(1000 + Math.random() * 9000)}`;

    // Save the full profile to MongoDB Atlas
    const user = new User({ name, email, password, dob, phoneNumber, gender, patientCode });
    await user.save();

    res.status(201).json({ message: "User registered successfully", patientCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login stays the same as before...
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { id: user._id, name: user.name, patientCode: user.patientCode } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};