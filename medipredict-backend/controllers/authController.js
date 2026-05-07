import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Request from '../models/Request.js';

export const register = async (req, res) => {
  try {
    // Destructure the extra fields from Phase 1
    const { name, email, password, dob, phoneNumber, gender } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    const patientCode = `MP-${Math.floor(1000 + Math.random() * 9000)}`;

    // Save the full profile to MongoDB Atlas
    const user = new User({ name, email, password, dob, phoneNumber, gender, patientCode, role:null });
    await user.save();

    res.status(201).json({ message: "User registered successfully", patientCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login stays the same as before...
// controllers/authController.js
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // ✅ FIX: Check if user exists BEFORE accessing user.role
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    let initialLinkStatus = 'none';
    if (user.role === 'caregiver') {
      const existingLink = await Request.findOne({ 
        caregiverId: user._id, 
        status: 'accepted' 
      });
      if (existingLink) initialLinkStatus = 'accepted';
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        role: user.role,    
        linkStatus: initialLinkStatus,
        patientCode: user.patientCode, 
        phoneNumber: user.phoneNumber,
        dob: user.dob
      } 
    });
  } catch (error) {
    // This is what sends the 500 error to your console
    res.status(500).json({ error: error.message });
  }
};

// ✅ New Function: Update Role after Selection
// ✅ Corrected: Update Role after Selection
export const selectRole = async (req, res) => {
    try {
      const { role } = req.body;
      
      // ✅ FIX: Use req.user._id (Mongoose style)
      const userId = req.user._id; 

      console.log("Updating role for User ID:", userId, "to:", role); // 🔍 Debug log

      if (!['patient', 'caregiver'].includes(role)) {
        return res.status(400).json({ message: "Invalid role selected" });
      }

      let updateData = { role };

      // Generate code only if needed
      if (role === 'patient' && !req.user.patientCode) {
        updateData.patientCode = `MP-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        updateData, 
        { new: true }
      ).select('-password');

      res.json({
        message: "Profile finalized!",
        user: updatedUser
      });
    } catch (error) {
      console.error("SelectRole Error:", error);
      res.status(500).json({ error: error.message });
    }
};

export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, dob } = req.body;

    // Find the user and update their details
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, phone, dob },
      { new: true, runValidators: true } // 'new: true' returns the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        name: updatedUser.name,
        phone: updatedUser.phone,
        dob: updatedUser.dob
      }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};