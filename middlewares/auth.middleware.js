'use strict';

const { verifyAccessToken } = require('../utils/tokens');
const { pool } = require('../db');

function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : null;

        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const decoded = verifyAccessToken(token);

        if (!decoded?.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        req.user = { userId: decoded.userId, role: decoded.role || null };

        next();
    } catch (e) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}

// ტოკენში role შეიძლება ძველ ტოკენებში არ იყოს — DB-ით ვამოწმებთ
async function requireAdmin(req, res, next) {
    try {
        if (req.user?.role === 'Admin') return next();

        // fallback: DB-ში შევამოწმოთ
        const [[user]] = await pool.query(
            'SELECT status FROM users WHERE user_id = ? LIMIT 1',
            [req.user.userId]
        );

        if (user?.status === 'Admin') {
            req.user.role = 'Admin';
            return next();
        }

        return res.status(403).json({ success: false, message: 'Forbidden' });
    } catch {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
}

module.exports = { requireAuth, requireAdmin };
