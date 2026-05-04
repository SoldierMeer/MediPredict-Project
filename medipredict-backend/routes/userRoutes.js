// backend/routes/userRoutes.js
import express from 'express';
const router = express.Router();
import { getUserProfile } from '../controllers/userController.js';
import auth from '../middleware/authMiddleware.js';

// This maps to GET /api/users/profile/:id
router.get('/profile/:id', auth, getUserProfile);

export default router;