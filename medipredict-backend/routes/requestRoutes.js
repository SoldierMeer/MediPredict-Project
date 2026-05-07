import express from 'express';
import { 
  checkLinkStatus,
  sendRequest, 
  getPendingRequests, 
  updateRequestStatus, 
  getMyPatients,
  getLinkedCaregiver,
  sendReminder,
} from '../controllers/requestController.js';
import auth from '../middleware/authMiddleware.js'; // You are using 'auth' here

const router = express.Router();

router.post('/send', auth, sendRequest); 
router.get('/my-patients', auth, getMyPatients);
router.get('/my-caregiver', auth, getLinkedCaregiver);
router.get('/status/check', auth, checkLinkStatus);
router.get('/:userId', auth, getPendingRequests);
router.patch('/:requestId', auth, updateRequestStatus);

// ✅ FIX: Changed 'protect' to 'auth'
router.post('/send-reminder', auth, sendReminder);

export default router;