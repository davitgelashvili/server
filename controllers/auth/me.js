'use strict';

const { pool } = require('../../db');
const path = require('path')
const fs = require('fs')

async function me(req, res) {
    try {
        const { userId } = req.user;

        const [rows] = await pool.execute(
            `SELECT 
         user_id AS userId,
         email,
         fullname,
         link,
         cover,
         created_at,
         status,
         avatar
       FROM users
       WHERE user_id = ?
       LIMIT 1`,
            [userId]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        let avatarBase64 = null;
        let user = rows[0]

        if(user.avatar){
            avatarBase64 = user.avatar.toString('base64')
        }else {
            const defaultAvatar = path.join(__dirname, '../../public/avatar-default.svg')
            const defaultAvatarBuffer = fs.readFileSync(defaultAvatar)
            avatarBase64  = defaultAvatarBuffer.toString('base64')
        }

        return res.json({
            success: true,
            user: {
                userId: user.userId,
                email: user.email,
                fullname: user.fullname,
                link: user.link,
                cover: user.cover,
                status: user.status,
                avatar: avatarBase64
            }
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = me;
