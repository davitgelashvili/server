'use strict';

const { pool } = require('../../db');
const { sha256, refreshCookieOptions } = require('../../utils/tokens');

async function logout(req, res) {
    try {
        const refreshToken = req.cookies.refresh_token;

        if (refreshToken) {
            const tokenHash = sha256(refreshToken);
            await pool.execute('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?', [tokenHash]);
        }

        res.clearCookie('refresh_token', { ...refreshCookieOptions(), maxAge: 0 });
        return res.json({ success: true });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = logout;
