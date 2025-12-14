const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const roomRoutes = require('./room.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/rooms', roomRoutes);

// Legacy root-level endpoints (for backward compatibility)
router.use('/', roomRoutes); // Handles /api/create-room and /api/join-room

module.exports = router;
