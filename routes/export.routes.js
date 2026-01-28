'use strict';

const express = require('express');
const router = express.Router();

const apiKey = require('../middlewares/tktApiKey'); //აპი გასაღების ვალიოდატორი

const exportCtrl = require('../controllers/export/tkt');

// 🔐 ყველაფერი ქვემოთ დაცულია
// router.use(apiKey); uncomment გავუკეთოთ როცა tktApiKey .env ცვლადებს შეცვლიტ

router.get('/hud', exportCtrl.hudList);
router.get('/hud/:hudId', exportCtrl.hudDetails);

//მოვათავსოთ რაუტერის შიგნით მონაცემები try/catch ბლოკში და გავუკეთოთ სტატუსების დაბრუნება

module.exports = router;