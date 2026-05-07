import express from 'express';
import { createLog } from '../controllers/logController.js';
import auth from '../middleware/authMiddleware.js'; // Our Security Guard
import { getRecentLogs } from '../controllers/logController.js';

const router = express.Router();

// POST /api/logs - Protected by JWT auth
router.post('/', auth, createLog);
router.get('/recent/:id', auth, getRecentLogs); // For the "Recent Alerts" card

export default router;