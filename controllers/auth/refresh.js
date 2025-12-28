'use strict';

const { pool } = require('../../db');
const {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    sha256,
    refreshCookieOptions
} = require('../../utils/tokens');

async function refresh(req, res) {
    try {
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken); // { userId, iat, exp }
        } catch {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const tokenHash = sha256(refreshToken);

        const [rows] = await pool.execute(
            'SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = ? LIMIT 1',
            [tokenHash]
        );

        if (!rows.length) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const rt = rows[0];

        if (rt.revoked_at) return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (new Date(rt.expires_at).getTime() < Date.now()) return res.status(401).json({ success: false, message: 'Unauthorized' });

        // დამატებითი დაცვა: token-ში userId და DB-ში user_id დაემთხვეს
        if (!decoded?.userId || decoded.userId !== rt.user_id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Rotation: revoke old, issue new
        await pool.execute('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?', [rt.id]);

        // user არსებობს?
        const [userRows] = await pool.execute(
            'SELECT user_id FROM users WHERE user_id = ? LIMIT 1',
            [rt.user_id]
        );
        if (!userRows.length) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const userId = rt.user_id;

        const newAccess = signAccessToken({ userId });
        const newRefresh = signRefreshToken({ userId });

        const newHash = sha256(newRefresh);
        const newExpiresAt = new Date(
            Date.now() + Number(process.env.REFRESH_TTL_DAYS || 30) * 24 * 60 * 60 * 1000
        );

        await pool.execute(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
            [userId, newHash, newExpiresAt]
        );

        res.cookie('refresh_token', newRefresh, refreshCookieOptions());

        return res.json({ success: true, accessToken: newAccess });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = refresh;
