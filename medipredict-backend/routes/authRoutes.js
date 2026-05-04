import express from 'express';
const router = express.Router();

// 1. Named imports from your controller
import { register, login, selectRole } from '../controllers/authController.js';

// 2. Default import for your middleware (Ensuring .js extension)
import auth from '../middleware/authMiddleware.js';

router.post('/register', register);
router.post('/login', login);

// 3. Use the specific imported 'selectRole' function instead of 'authController.selectRole'
router.post('/select-role', auth, selectRole);

export default router;