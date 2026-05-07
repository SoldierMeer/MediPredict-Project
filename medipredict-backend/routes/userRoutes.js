// backend/routes/userRoutes.js
import express from 'express';
const router = express.Router();
import { getUserById, getUserProfile, getUserStats } from '../controllers/userController.js';
import auth from '../middleware/authMiddleware.js';

// 1. Specific sub-routes first
router.get('/stats/:id', auth, getUserStats);
router.get('/profile/:id', auth, getUserProfile);

// 2. Base ID route (Matches: GET /api/users/69f6cd1)
// This will now handle the call from CaregiverDashboard.tsx:30
router.get('/:id', auth, getUserById); 

export default router;