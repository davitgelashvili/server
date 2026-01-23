'use strict';

const express = require('express');
const router = express.Router();

const clientCtrl = require('../controllers/client');

router.get('/hud', clientCtrl.hud.list);
router.get('/hud/:slug', clientCtrl.hud.detail);

module.exports = router;