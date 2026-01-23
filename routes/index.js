'use strict';

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const eventRoutes = require('./event.routes');
const exportRoutes = require('./export.routes');
const clientRoutes = require('./client.routes');


//login api
router.use('/auth', authRoutes);
//dashboard api
router.use('/v1', eventRoutes);
// export api
router.use('/export', exportRoutes);
// second site (client) api
router.use('/client', clientRoutes);

module.exports = router;