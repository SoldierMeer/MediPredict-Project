import express from 'express';
import { createLog } from '../controllers/logController.js';
import auth from '../middleware/authMiddleware.js'; // Our Security Guard

const router = express.Router();

// POST /api/logs - Protected by JWT auth
router.post('/', auth, createLog);

export default router;