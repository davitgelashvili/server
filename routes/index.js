'use strict';

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const eventRoutes = require('./event.routes');
const dashboardRoutes = require('./dashboard.routes')
const exportRoutes = require('./export.routes');
const clientRoutes = require('./client.routes');


//login api
router.use('/auth', authRoutes);


//dashboard apis
router.use('/v1', eventRoutes); //API ტიკეტები ან ბილეთები ჯისთვის
// (დავამატოთ ვ2 ვერსია აქ მეორე საიტისტვის (tkt.ge || biletebi.ge-სთვის მორგებული))
router.use('/dashboard', dashboardRoutes) //API ჩვენი პლატფორმისთვის


// export api
router.use('/export', exportRoutes);

// second site (client) api
router.use('/client', clientRoutes);

module.exports = router;