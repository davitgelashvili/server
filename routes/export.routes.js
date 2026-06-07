'use strict';

const express = require('express');
const router = express.Router();

const tktApiKey = require('../middlewares/tktApiKey'); //აპი გასაღების ვალიოდატორი

const exportCtrl = require('../controllers/export/tkt');

// 🔐 ყველაფერი ქვემოთ დაცულია
router.use(tktApiKey); 

router.get('/hud',            exportCtrl.hudList);
router.get('/hud/:hudId',     exportCtrl.hudDetails);
router.get('/event/:eventId', exportCtrl.eventDetail);


module.exports = router;    