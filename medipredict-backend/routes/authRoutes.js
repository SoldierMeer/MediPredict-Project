const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const authController = require('../controllers/authController');
// ✅ Add this line to import the middleware
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/select-role', authMiddleware, authController.selectRole);

module.exports = router;