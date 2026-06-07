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

        if (!email || !password)
            return res.status(400).json({ success: false, message: 'Missing credentials' });
        if (!isEmail(email))
            return res.status(400).json({ success: false, message: 'Invalid email' });

        // 1. კლიენტების ცხრილი პირველი (კლიენტი არ შეფერხდეს)
        let user = null;
        let role = null;

        const [[client]] = await pool.execute(
            'SELECT id, email, fullname, password_hash, status FROM clients WHERE email = ? LIMIT 1',
            [email]
        );
        if (client) {
            user = client;
            role = client.status; // 'Client' ან 'Visitor'
        }

        // 2. ადმინების ცხრილი
        if (!user) {
            const [[admin]] = await pool.execute(
                'SELECT id, email, fullname, password_hash FROM admins WHERE email = ? LIMIT 1',
                [email]
            );
            if (admin) {
                user = admin;
                role = 'Admin';
            }
        }

        if (!user)
            return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok)
            return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const accessToken  = signAccessToken({ userId: user.id, role });
        const refreshToken = signRefreshToken({ userId: user.id, role });

        const tokenHash = sha256(refreshToken);
        const expiresAt = new Date(
            Date.now() + Number(process.env.REFRESH_TTL_DAYS || 30) * 24 * 60 * 60 * 1000
        );

        await pool.execute(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
            [user.id, tokenHash, expiresAt]
        );

        res.cookie('refresh_token', refreshToken, refreshCookieOptions());

        return res.json({
            success: true,
            accessToken,
            user: {
                userId:   user.id,
                email:    user.email,
                fullname: user.fullname,
                role
            }
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = login;
