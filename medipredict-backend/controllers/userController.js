// backend/controllers/userController.js
// top of backend/controllers/userController.js
import MedicationLog from '../models/MedicationLog.js';
import User from '../models/User.js';

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ FIX: Use 'name' to match what CaregiverDashboard.tsx:30 expects
    res.json({
      name: user.name, 
      adherenceScore: user.adherenceScore || 0,
      latestRiskLevel: user.latestRiskLevel || 'Stable',
      latestRiskInsight: user.latestRiskInsight || 'Optimal management detected.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// controllers/userController.js

// backend/controllers/userController.js

// backend/controllers/userController.js

export const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    const sanitizedId = id.replace(/[^a-fA-F0-9]/g, '').trim();
    
    const user = await User.findById(sanitizedId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ FIX: Query history to count actual "missed" entries
    const missedCount = await MedicationLog.countDocuments({ 
      patientId: sanitizedId, 
      status: 'missed' 
    });

    res.status(200).json({
      adherenceScore: user.adherenceScore || 0,
      riskLevel: user.latestRiskLevel || 'Stable',
      insight: user.latestRiskInsight || 'Pattern analysis complete.',
      missedDoses: missedCount, // Now pulls real count from logs
      trend: user.adherenceScore >= 85 ? +4 : -2
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user stats" });
  }
};


export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // ✅ FIX: Use 'name' instead of 'userName' to match the frontend expectation
    res.status(200).json(user); 
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};