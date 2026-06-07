'use strict';

const express = require('express');
const router = express.Router();

const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

const adminStats      = require('../controllers/admin/stats');
const adminUserStats  = require('../controllers/admin/userStats');
const adminUsers      = require('../controllers/admin/users');
const adminCreateUser = require('../controllers/admin/createUser');
const adminDeleteUser = require('../controllers/admin/deleteUser');
const adminUpdateUser = require('../controllers/admin/updateUser');

const adminHudList      = require('../controllers/admin/hud/list');
const adminHudAdd       = require('../controllers/admin/hud/add');
const adminHudGet       = require('../controllers/admin/hud/getById');
const adminHudUpdate    = require('../controllers/admin/hud/update');
const adminHudDelete    = require('../controllers/admin/hud/delete');
const adminHudSetStatus = require('../controllers/admin/hud/setStatus');

const adminEventList      = require('../controllers/admin/event/list');
const adminEventAdd       = require('../controllers/show/event/add');
const adminEventGet       = require('../controllers/admin/event/getById');
const adminEventUpdate    = require('../controllers/admin/event/update');
const adminEventDelete    = require('../controllers/admin/event/delete');
const adminEventSetStatus = require('../controllers/admin/event/setStatus');

const adminBatchList   = require('../controllers/show/batch/list');  // no ownership check, reuse
const adminBatchAdd    = require('../controllers/admin/batch/add');
const adminBatchGet    = require('../controllers/admin/batch/getById');
const adminBatchUpdate = require('../controllers/admin/batch/update');
const adminBatchDelete = require('../controllers/admin/batch/delete');

const adminTickets            = require('../controllers/admin/tickets/list');
const adminTicketAdd          = require('../controllers/admin/tickets/add');
const adminTicketUpdate       = require('../controllers/admin/tickets/update');
const adminTicketDelete       = require('../controllers/admin/tickets/delete');
const adminTicketValidate     = require('../controllers/admin/tickets/validate');
const adminTicketBulkUpdate   = require('../controllers/admin/tickets/bulkUpdate');
const adminTicketsByEvent     = require('../controllers/admin/tickets/byEvent');

const adminBuyersList   = require('../controllers/admin/buyers/list');
const adminBuyerGet     = require('../controllers/admin/buyers/getById');
const adminBuyerAdd     = require('../controllers/admin/buyers/add');
const adminBuyerUpdate  = require('../controllers/admin/buyers/update');
const adminBuyerDelete  = require('../controllers/admin/buyers/delete');

router.use(requireAuth);
router.use(requireAdmin);

// STATS + USERS
router.get('/stats', adminStats);
router.get('/users', adminUsers);
router.get('/user/:id/stats', adminUserStats);
router.post('/user', adminCreateUser);
router.delete('/user/:id', adminDeleteUser);
router.put('/user/:id', adminUpdateUser);

// HUD
router.get('/hud',                adminHudList);
router.post('/hud',               adminHudAdd);
router.get('/hud/:id',            adminHudGet);
router.put('/hud/:id',            adminHudUpdate);
router.delete('/hud/:id',         adminHudDelete);
router.patch('/hud/:id/status',   adminHudSetStatus);

// EVENT
router.get('/hud/:id/event',              adminEventList);
router.post('/event',                     adminEventAdd);
router.get('/event/:id',                  adminEventGet);
router.put('/event/:id',                  adminEventUpdate);
router.delete('/hud/:hud_id/event/:id',   adminEventDelete);
router.patch('/event/:id/status',         adminEventSetStatus);

// BATCH
router.get('/event/:event_id/batch', adminBatchList);
router.post('/batch',                adminBatchAdd);
router.get('/batch/:id',             adminBatchGet);
router.put('/batch/:id',             adminBatchUpdate);
router.delete('/batch/:id',          adminBatchDelete);

// VERIFICATIONS
router.get('/verifications',        require('../controllers/admin/verifications/list'));
router.put('/verification/:id',     require('../controllers/admin/verifications/update'));

// BUYERS
router.get('/buyers',         adminBuyersList);
router.post('/buyer',         adminBuyerAdd);
router.get('/buyer/:id',      adminBuyerGet);
router.put('/buyer/:id',      adminBuyerUpdate);
router.delete('/buyer/:id',   adminBuyerDelete);

// TICKETS
router.get('/ticket',                 adminTickets);
router.post('/ticket',                adminTicketAdd);
router.put('/ticket/bulk',            adminTicketBulkUpdate);
router.put('/ticket/:id',             adminTicketUpdate);
router.delete('/ticket/:id',          adminTicketDelete);
router.post('/ticket/:id/validate',   adminTicketValidate);
router.get('/event/:event_id/tickets', adminTicketsByEvent);

module.exports = router;
