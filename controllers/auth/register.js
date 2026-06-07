'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../../db');
const {
    signAccessToken,
    signRefreshToken,
    sha256,
    refreshCookieOptions
} = require('../../utils/tokens');

function isEmail(s) {
    return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function generateClientId() {
    return 'u_' + crypto.randomBytes(9).toString('hex');
}

async function createUniqueClientId() {
    for (let i = 0; i < 10; i++) {
        const id = generateClientId();
        const [rows] = await pool.execute('SELECT id FROM clients WHERE id = ? LIMIT 1', [id]);
        if (!rows.length) return id;
    }
    throw new Error('Cannot generate unique client id');
}

async function register(req, res) {
    try {
        const { email, fullname, password } = req.body;

        if (!isEmail(email))
            return res.status(400).json({ success: false, message: 'Invalid email' });
        if (!fullname || fullname.trim().length < 2)
            return res.status(400).json({ success: false, message: 'Invalid fullname' });
        if (!password || password.length < 8)
            return res.status(400).json({ success: false, message: 'Password must be 8+ chars' });

        const [[exists]] = await pool.execute(
            'SELECT id FROM clients WHERE email = ? LIMIT 1', [email]
        );
        if (exists)
            return res.status(409).json({ success: false, message: 'Email already exists' });

        const id           = await createUniqueClientId();
        const passwordHash = await bcrypt.hash(password, 12);
        const role         = 'Visitor';

        await pool.execute(
            'INSERT INTO clients (id, email, fullname, password_hash, status) VALUES (?, ?, ?, ?, ?)',
            [id, email, fullname.trim(), passwordHash, role]
        );

        const accessToken  = signAccessToken({ userId: id, role });
        const refreshToken = signRefreshToken({ userId: id, role });

        const tokenHash = sha256(refreshToken);
        const expiresAt = new Date(
            Date.now() + Number(process.env.REFRESH_TTL_DAYS || 30) * 24 * 60 * 60 * 1000
        );

        await pool.execute(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
            [id, tokenHash, expiresAt]
        );

        res.cookie('refresh_token', refreshToken, refreshCookieOptions());

        return res.status(201).json({
            success: true,
            accessToken,
            user: { userId: id, email, fullname, role }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = register;
