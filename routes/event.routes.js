// routes/event.routes.js

'use strict';

const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middlewares/auth.middleware');
const event = require('../controllers/event');

router.get('/', event.list);
router.get('/user/:userId', requireAuth, event.listByUser);
router.get('/:eventId', event.view);

router.post('/', requireAuth, event.create);

router.post('/:eventId/tickets/setup', requireAuth, event.ticketsSetup);
router.get('/:eventId/tickets', event.ticketsList);
router.post('/:eventId/tickets/buy', requireAuth, event.ticketsBuy);

module.exports = router;
