'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../../db');

function isEmail(s) {
    return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function generateClientId() {
    return 'u_' + crypto.randomBytes(9).toString('hex');
}

async function createUniqueId() {
    for (let i = 0; i < 10; i++) {
        const id = generateClientId();
        const [rows] = await pool.execute('SELECT id FROM clients WHERE id = ? LIMIT 1', [id]);
        if (!rows.length) return id;
    }
    throw new Error('Cannot generate unique id');
}

module.exports = async (req, res) => {
    try {
        const { email, fullname, password, status } = req.body;

        if (!isEmail(email))
            return res.status(400).json({ success: false, message: 'Invalid email' });
        if (!fullname || fullname.trim().length < 2)
            return res.status(400).json({ success: false, message: 'Invalid fullname' });
        if (!password || password.length < 8)
            return res.status(400).json({ success: false, message: 'Password must be 8+ chars' });

        const [[exists]] = await pool.execute(
            'SELECT id FROM clients WHERE email = ? LIMIT 1', [email]
        );
        if (exists)
            return res.status(409).json({ success: false, message: 'Email already exists' });

        const id           = await createUniqueId();
        const passwordHash = await bcrypt.hash(password, 12);
        const finalStatus  = (status === 'Client' || status === 'Visitor') ? status : 'Visitor';

        await pool.execute(
            'INSERT INTO clients (id, email, fullname, password_hash, status) VALUES (?, ?, ?, ?, ?)',
            [id, email, fullname.trim(), passwordHash, finalStatus]
        );

        return res.status(201).json({
            success: true,
            user: { user_id: id, email, fullname: fullname.trim(), status: finalStatus, hud_count: 0, ticket_count: 0, revenue: 0 }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
