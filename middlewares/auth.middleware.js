'use strict';

const { verifyAccessToken } = require('../utils/tokens');

function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : null;

        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const decoded = verifyAccessToken(token); // { userId, iat, exp }

        if (!decoded?.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        //统一 source of truth
        req.user = { userId: decoded.userId };

        next();
    } catch (e) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}

module.exports = { requireAuth };
