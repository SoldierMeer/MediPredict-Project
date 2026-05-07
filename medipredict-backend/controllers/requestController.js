import Request from '../models/Request.js';
import User from '../models/User.js';

// 1. Caregiver sends a request using a Patient Code
// POST /api/requests/send
// controllers/requestController.js

export const sendRequest = async (req, res) => {
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
        status: 'pending',
        type: 'link'
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
// export const getLinkedCaregiver = async (req, res) => {
//   try {
//     // Find requests where the current user is the patient and status is 'accepted'
//     const relationship = await Request.find({ 
//       patientId: req.user.id, 
//       status: 'accepted' 
//     }).populate('caregiverId', 'name email phoneNumber role'); // Join with User data

//     // Always send a 200, even if the array is empty
//     res.status(200).json(relationship.map(r => r.caregiverId)); 
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error fetching caregiver info" });
//   }
// };

// 3. Patient accepts or rejects a request
// PATCH /api/requests/:requestId
// backend/controllers/requestController.js



export const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    // 1. Find the request and populate IDs to ensure they exist
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request link not found" });
    }

    // 2. Update the Request status (accepted/rejected)
    request.status = status;
    await request.save();

    // 3. Logic for 'accepted': Link the Patient and Caregiver records
    if (status === 'accepted') {
      // Add Caregiver to Patient's circle
      await User.findByIdAndUpdate(request.patientId, {
        $addToSet: { linkedCaregivers: request.caregiverId } 
      });

      // Add Patient to Caregiver's dashboard
      await User.findByIdAndUpdate(request.caregiverId, {
        $addToSet: { linkedPatients: request.patientId }
      });
    }

    res.status(200).json({ 
      message: `Request ${status} successfully`, 
      request 
    });
  } catch (error) {
    console.error("❌ Update Status Error:", error.message);
    res.status(500).json({ 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
};

// 4. Caregiver fetches their list of accepted patients
// GET /api/requests/my-patients
// GET /api/requests/my-patients
export const getMyPatients = async (req, res) => {
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

// export const selectRole = async (req, res) => {
//     try {
//       const { role } = req.body;
//       const userId = req.user.userId;

//       let updateData = { role };

//       if (role === 'patient') {
//         const user = await User.findById(userId);
//         // ✅ Only generate a code if they don't have one yet
//         if (!user.patientCode) {
//           updateData.patientCode = `MP-${Math.floor(1000 + Math.random() * 9000)}`;
//         }
//       }

//       const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
//       res.json({ message: "Profile finalized!", user: updatedUser });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
// };

// controllers/requestController.js

export const checkLinkStatus = async (req, res) => {
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

  export const getLinkedCaregiver = async (req, res) => {
    try {
      // Find requests where the current user is the patient and status is 'accepted'
      const relationship = await Request.find({ 
        patientId: req.user.id, 
        status: 'accepted' 
      }).populate('caregiverId', 'name email phoneNumber role'); // Join with User data
  
      // Always send a 200, even if the array is empty
      res.status(200).json(relationship.map(r => r.caregiverId)); 
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching caregiver info" });
    }
  };

  export const getPendingRequests = async (req, res) => {
    try {
      const { userId } = req.params;
      
      const requests = await Request.find({ 
        patientId: userId, 
        status: 'pending' 
      }).populate('caregiverId', 'name'); // 👈 CRITICAL: This pulls the caregiver's name!
  
      res.status(200).json(requests);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pending requests" });
    }
  };

// backend/controllers/requestController.js

export const sendReminder = async (req, res) => {
  try {
    const { patientId } = req.body;
    const caregiverId = req.user.id; // From auth middleware

    // 1. Check if a pending reminder already exists to prevent spamming
    const existingReminder = await Request.findOne({
      patientId,
      caregiverId,
      type: 'reminder',
      status: 'pending'
    });

    if (existingReminder) {
      return res.status(400).json({ message: "A reminder is already pending for this patient." });
    }

    // 2. Create the new reminder request
    const newReminder = new Request({
      patientId,
      caregiverId,
      type: 'reminder',
      status: 'pending',
      message: "Please review your medication schedule. Your caregiver is concerned."
    });

    await newReminder.save();

    res.status(201).json({ message: "Reminder sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};