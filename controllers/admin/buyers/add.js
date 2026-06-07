'use strict';

const { pool } = require('../../../db');
const { generateBuyerId } = require('../../../utils/generateId');

module.exports = async (req, res) => {
    try {
        const { name, personal_id, phone, email, notes } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'სახელი სავალდებულოა' });

        if (personal_id) {
            const [[exists]] = await pool.query('SELECT id FROM buyers WHERE personal_id = ?', [personal_id]);
            if (exists) return res.status(400).json({ success: false, message: 'ეს პირადი ნომერი უკვე რეგისტრირებულია' });
        }

        const id = generateBuyerId();
        await pool.query(
            'INSERT INTO buyers (id, name, personal_id, phone, email, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, personal_id || null, phone || null, email || null, notes || null]
        );

        res.json({ success: true, id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
