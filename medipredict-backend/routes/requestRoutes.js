const express = require('express');
const router = express.Router();
const { getPendingRequests, updateRequestStatus } = require('../controllers/requestController');
const auth = require('../middleware/authMiddleware');

router.get('/:userId', auth, getPendingRequests);
router.patch('/:requestId', auth, updateRequestStatus);

module.exports = router;