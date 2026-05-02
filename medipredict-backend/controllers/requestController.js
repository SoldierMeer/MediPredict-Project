const Request = require('../models/Request');

// GET /api/requests/:userId
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await Request.find({ 
      patientId: req.params.userId, 
      status: 'pending' 
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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