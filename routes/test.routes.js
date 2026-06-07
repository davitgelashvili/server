'use strict';

const express = require('express');
const router  = express.Router();

const showsList   = require('../controllers/test/shows/list');
const showDetail  = require('../controllers/test/shows/detail');
const eventDetail = require('../controllers/test/shows/eventDetail');
const users       = require('../controllers/test/users');
const buy         = require('../controllers/test/buy');
const tickets             = require('../controllers/test/tickets');
const verificationStatus  = require('../controllers/test/verificationStatus');

router.get('/shows',               showsList);
router.get('/show/:id',            showDetail);
router.get('/event/:id',           eventDetail);
router.get('/users',               users);
router.post('/buy',                buy);
router.get('/tickets/:userId',          tickets);
router.get('/verification-status',      verificationStatus);

module.exports = router;
