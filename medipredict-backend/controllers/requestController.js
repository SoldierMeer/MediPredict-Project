const Request = require('../models/Request');
const User = require('../models/User');

// 1. Caregiver sends a request using a Patient Code
// POST /api/requests/send
// controllers/requestController.js

exports.sendRequest = async (req, res) => {
    try {
      const { patientCode } = req.body;
  
      // ✅ FIX 1: Use req.user._id (The Mongoose ID from your middleware)
      const caregiverId = req.user._id; 
      const caregiverName = req.user.name;
  
      if (!patientCode) {
        return res.status(400).json({ message: "Patient code is required" });
      }
  
      const sanitizedCode = patientCode.trim().toUpperCase();
  
      // Find the patient
      const patient = await User.findOne({ 
        patientCode: sanitizedCode, 
        role: 'patient' 
      });
  
      if (!patient) {
        return res.status(404).json({ message: "Invalid Patient Code" });
      }
  
      // Prevent linking to self
      if (patient._id.toString() === caregiverId.toString()) {
        return res.status(400).json({ message: "You cannot link to your own account." });
      }
  
      // Check for existing request
      const existing = await Request.findOne({ 
        patientId: patient._id, 
        caregiverId 
      });
  
      if (existing) {
        return res.status(400).json({ message: "Request already pending or existing" });
      }
  
      // Create the new request
      const newRequest = new Request({
        patientId: patient._id,
        caregiverId,
        caregiverName, 
        status: 'pending'
      });
  
      await newRequest.save();
      res.status(201).json({ message: "Request sent successfully!" });
  
    } catch (error) {
      // ✅ FIX 2: Log the actual error to your terminal so you can see why it failed
      console.error("Critical SendRequest Error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  };

// 2. Patient fetches their pending requests
// GET /api/requests/:userId
exports.getPendingRequests = async (req, res) => {
  try {
    // ✅ FIX: Use req.user._id instead of req.params.userId for security
    const requests = await Request.find({ 
      patientId: req.user._id, 
      status: 'pending' 
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Patient accepts or rejects a request
// PATCH /api/requests/:requestId
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await Request.findByIdAndUpdate(
      req.params.requestId, 
      { status }, 
      { new: true }
    );
    res.json({ message: `Request ${status}`, request });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 4. Caregiver fetches their list of accepted patients
// GET /api/requests/my-patients
// GET /api/requests/my-patients
exports.getMyPatients = async (req, res) => {
  try {
    // ✅ FIX: Consistently use ._id
    const caregiverId = req.user._id; 

    const links = await Request.find({ 
      caregiverId, 
      status: 'accepted' 
    }).populate('patientId', 'name email adherenceRate riskLevel patientCode'); 

    const patients = links.map(l => l.patientId);
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.selectRole = async (req, res) => {
    try {
      const { role } = req.body;
      const userId = req.user.userId;

      let updateData = { role };

      if (role === 'patient') {
        const user = await User.findById(userId);
        // ✅ Only generate a code if they don't have one yet
        if (!user.patientCode) {
          updateData.patientCode = `MP-${Math.floor(1000 + Math.random() * 9000)}`;
        }
      }

      const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
      res.json({ message: "Profile finalized!", user: updatedUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};

// controllers/requestController.js

exports.checkLinkStatus = async (req, res) => {
    try {
      // req.user._id comes from your authMiddleware
      const caregiverId = req.user._id;
  
      // Find the latest request sent by this caregiver
      const latestRequest = await Request.findOne({ caregiverId })
        .sort({ createdAt: -1 });
  
      if (!latestRequest) {
        return res.json({ status: 'none' });
      }
  
      // Return 'pending', 'accepted', or 'rejected'
      res.json({ status: latestRequest.status });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // 5. Patient fetches their linked caregiver's info
  // controllers/requestController.js

exports.getLinkedCaregiver = async (req, res) => {
  try {
    const patientId = req.user._id;

    // ✅ Change findOne to find to get ALL caregivers
    const links = await Request.find({ 
      patientId, 
      status: 'accepted' 
    }).populate('caregiverId', 'name email phoneNumber role'); 

    if (!links || links.length === 0) {
      return res.status(404).json({ message: "No linked caregivers found" });
    }

    // ✅ Map to return an array of caregiver objects
    const caregivers = links.map(link => link.caregiverId);
    res.json(caregivers); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};