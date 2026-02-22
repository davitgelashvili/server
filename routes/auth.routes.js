'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../controllers/auth');
const { requireAuth } = require('../middlewares/auth.middleware');


const multer = require('multer')
// const upload = multer({dest : '/uploads'})

// Public
// router.post('/register', upload.single('avatar'), auth.register);
router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);

// Protected
router.get('/me', requireAuth, auth.me);

module.exports = router;