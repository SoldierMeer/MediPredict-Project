import express from 'express';
import { 
  checkLinkStatus,
  sendRequest, 
  getPendingRequests, 
  updateRequestStatus, 
  getMyPatients,
  getLinkedCaregiver
} from '../controllers/requestController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ ADD THIS: Define the POST route
router.post('/send', auth, sendRequest); 

router.get('/my-patients', auth, getMyPatients);
router.get('/my-caregiver', auth, getLinkedCaregiver);
router.get('/status/check', auth, checkLinkStatus);
router.get('/:userId', auth, getPendingRequests);
router.patch('/:requestId', auth, updateRequestStatus);
// For Patient to see their caregiver info

export default router;