'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, personal_id, phone, email, notes } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'სახელი სავალდებულოა' });

        if (personal_id) {
            const [[exists]] = await pool.query(
                'SELECT id FROM buyers WHERE personal_id = ? AND id != ?',
                [personal_id, id]
            );
            if (exists) return res.status(400).json({ success: false, message: 'ეს პირადი ნომერი სხვას ეკუთვნის' });
        }

        const [result] = await pool.query(
            'UPDATE buyers SET name=?, personal_id=?, phone=?, email=?, notes=? WHERE id=?',
            [name, personal_id || null, phone || null, email || null, notes || null, id]
        );
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Buyer not found' });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
