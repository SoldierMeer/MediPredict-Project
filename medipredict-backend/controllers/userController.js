// backend/controllers/userController.js
// top of backend/controllers/userController.js
import User from '../models/User.js';

export const getUserProfile = async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select('-password'); // Exclude password for security
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // Return the fields the frontend is looking for
      res.json({
        userName: user.name,
        adherenceScore: user.adherenceScore || 0,
        latestRiskLevel: user.latestRiskLevel || 'Stable',
        latestRiskInsight: user.latestRiskInsight || 'Optimal management detected.'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };