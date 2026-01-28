'use strict';

const express = require('express');
const router = express.Router();

const apiKey = require('../middlewares/tktApiKey');

const exportCtrl = require('../controllers/export/tkt');

// 🔐 ყველაფერი ქვემოთ დაცულია
// router.use(apiKey);

router.get('/hud', exportCtrl.hudList);
router.get('/hud/:hudId', exportCtrl.hudDetails);

module.exports = router;