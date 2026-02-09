'use strict';

const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middlewares/auth.middleware');
const showCtrl = require('../controllers/show');

// 🔐 ყველაფერი ქვემოთ დაცულია
router.use(requireAuth);

// HUD
router.get('/hud', showCtrl.hud.list);
router.get('/hud/:id', showCtrl.hud.getById);

// EVENT
router.get('/hud/:id/event', showCtrl.event.list);
router.get('/event/:id', showCtrl.event.getById);

// BATCH
router.get('/event/:event_id/batch', showCtrl.batch.list);

// TICKETS
router.post('/event/:event_id/buy_ticket' , showCtrl.tickets.add)
// router.delete('/event/:event_id/refund_ticket' , showCtrl.tickets.delete)
module.exports = router;