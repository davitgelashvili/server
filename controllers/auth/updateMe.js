'use strict';

const bcrypt = require('bcryptjs');
const { pool } = require('../../db');

module.exports = async (req, res) => {
    try {
        const { userId, role } = req.user;
        const { fullname, email, password } = req.body;

        const table = role === 'Admin' ? 'admins' : 'clients';

        if (password && password.length > 0) {
            const hash = await bcrypt.hash(password, 12);
            await pool.query(
                `UPDATE ${table} SET fullname=?, email=?, password_hash=? WHERE id=?`,
                [fullname, email, hash, userId]
            );
        } else {
            await pool.query(
                `UPDATE ${table} SET fullname=?, email=? WHERE id=?`,
                [fullname, email, userId]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
