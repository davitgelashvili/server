'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * payload: { userId }
 */
function signAccessToken({ userId, role }) {
    return jwt.sign(
        { userId, role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.ACCESS_TTL || '15m' }
    );
}

/**
 * payload: { userId, role }
 */
function signRefreshToken({ userId, role }) {
    return jwt.sign(
        { userId, role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: `${Number(process.env.REFRESH_TTL_DAYS || 30)}d` }
    );
}

function verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET); // { userId, iat, exp }
}

function verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET); // { userId, iat, exp }
}

function sha256(input) {
    return crypto.createHash('sha256').update(input).digest('hex');
}

function refreshCookieOptions() {
    return {
        httpOnly: true,
        secure: String(process.env.COOKIE_SECURE) === 'true',
        sameSite: process.env.COOKIE_SAMESITE || 'lax',
        path: '/api/auth/refresh',
        maxAge:
            Number(process.env.REFRESH_TTL_DAYS || 30) *
            24 * 60 * 60 * 1000
    };
}

module.exports = {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    sha256,
    refreshCookieOptions
};
