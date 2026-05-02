const express = require('express');
const router = express.Router();
const { createLog } = require('../controllers/logController');
const auth = require('../middleware/authMiddleware'); // Our Security Guard

// POST /api/logs - Protected by JWT auth
router.post('/', auth, createLog);

module.exports = router;