// routes/requestRoutes.js
const express = require('express');
const router = express.Router();
const { 
  checkLinkStatus,
  sendRequest,          // ✅ ADD THIS: Import the send function
  getPendingRequests, 
  updateRequestStatus, 
  getMyPatients ,
  getLinkedCaregiver,
} = require('../controllers/requestController');
const auth = require('../middleware/authMiddleware');

// ✅ ADD THIS: Define the POST route
router.post('/send', auth, sendRequest); 

router.get('/my-patients', auth, getMyPatients);
router.get('/my-caregiver', auth, getLinkedCaregiver);
router.get('/status/check', auth, checkLinkStatus);
router.get('/:userId', auth, getPendingRequests);
router.patch('/:requestId', auth, updateRequestStatus);
// For Patient to see their caregiver info

module.exports = router;