'use strict';

const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middlewares/auth.middleware');
const showCtrl = require('../controllers/show');


// ჩავანაცვლოთ ეს მიდლვეირი ადმინის/მოდერატორის ვალიდაცია დაცულობისთვის 
router.use(requireAuth);


// HUD
router.get('/hud', showCtrl.hud.list);
router.post('/hud', showCtrl.hud.add);
router.get('/hud/:id', showCtrl.hud.getById);
router.put('/hud/:id', showCtrl.hud.update);
router.delete('/hud/:id', showCtrl.hud.delete);

// EVENT
router.get('/hud/:id/event', showCtrl.event.list);
router.post('/event', showCtrl.event.add);
router.get('/event/:id', showCtrl.event.getById);
router.put('/event/:id', showCtrl.event.update);
router.delete('/hud/:hud_id/event/:id', showCtrl.event.delete);

// BATCH
router.get('/event/:event_id/batch', showCtrl.batch.list);
router.post('/batch', showCtrl.batch.add);
router.put('/batch/:id', showCtrl.batch.update);
router.delete('/batch/:id', showCtrl.batch.delete);
router.get('/batch/:id', showCtrl.batch.getById);

// TICKETS
router.get('/ticket', showCtrl.tickets.list);
router.post('/ticket', showCtrl.tickets.add);

// STATS
router.get('/stats', showCtrl.stats.get);

module.exports = router;