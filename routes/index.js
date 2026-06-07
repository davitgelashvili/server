'use strict';

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const panelRoutes = require('./panel.routes');
const dashboardRoutes = require('./dashboard.routes');
const exportRoutes = require('./export.routes');
const testRoutes   = require('./test.routes');

// auth
router.use('/auth', authRoutes);

// client panel — authenticated user sees their own data
router.use('/panel', panelRoutes);

// admin dashboard — admin only, sees all users' data
router.use('/dashboard', dashboardRoutes);

// export api
router.use('/export', exportRoutes);

// test site
router.use('/test', testRoutes);

// public — no auth required (third-party calls)
router.post('/verification/request', require('../controllers/public/verificationRequest'));

module.exports = router;