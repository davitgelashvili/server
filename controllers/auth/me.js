'use strict';

const { pool } = require('../../db');
const path = require('path');
const fs   = require('fs');

async function me(req, res) {
    try {
        const { userId, role } = req.user;

        let user;

        if (role === 'Admin') {
            const [[row]] = await pool.execute(
                'SELECT id, email, fullname, created_at FROM admins WHERE id = ? LIMIT 1',
                [userId]
            );
            user = row;
        } else {
            const [[row]] = await pool.execute(
                'SELECT id, email, fullname, status, created_at FROM clients WHERE id = ? LIMIT 1',
                [userId]
            );
            user = row;
        }

        if (!user)
            return res.status(404).json({ success: false, message: 'Not found' });

        const defaultAvatar = path.join(__dirname, '../../public/avatar-default.svg');
        const avatarBase64  = fs.readFileSync(defaultAvatar).toString('base64');

        return res.json({
            success: true,
            user: {
                userId:   user.id,
                email:    user.email,
                fullname: user.fullname,
                status:   user.status || role,
                avatar:   avatarBase64
            }
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = me;
