'use strict';

const bcrypt = require('bcryptjs');
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

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Missing credentials' });
        }
        if (!isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email' });
        }

        const [rows] = await pool.execute(
            'SELECT user_id, email, fullname, password_hash, link, cover FROM users WHERE email = ? LIMIT 1',
            [email]
        );

        if (!rows.length) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const accessToken = signAccessToken({ userId: user.user_id });
        const refreshToken = signRefreshToken({ userId: user.user_id });

        const tokenHash = sha256(refreshToken);
        const expiresAt = new Date(
            Date.now() + Number(process.env.REFRESH_TTL_DAYS || 30) * 24 * 60 * 60 * 1000
        );

        await pool.execute(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
            [user.user_id, tokenHash, expiresAt]
        );

        res.cookie('refresh_token', refreshToken, refreshCookieOptions());

        return res.json({
            success: true,
            accessToken,
            user: {
                userId: user.user_id,
                email: user.email,
                fullname: user.fullname,
                link: user.link,
                cover: user.cover
            }
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = login;
