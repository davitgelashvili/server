'use strict';

const bcrypt = require('bcryptjs');
const { pool } = require('../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullname, email, password, status } = req.body;

        const [[client]] = await pool.query('SELECT id FROM clients WHERE id = ?', [id]);
        if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

        const finalStatus = (status === 'Client' || status === 'Visitor') ? status : 'Visitor';

        if (password && password.length > 0) {
            const hash = await bcrypt.hash(password, 12);
            await pool.query(
                'UPDATE clients SET fullname=?, email=?, password_hash=?, status=? WHERE id=?',
                [fullname, email, hash, finalStatus, id]
            );
        } else {
            await pool.query(
                'UPDATE clients SET fullname=?, email=?, status=? WHERE id=?',
                [fullname, email, finalStatus, id]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
