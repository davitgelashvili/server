'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { id: hudId } = req.params;

        if (!hudId) return res.status(400).json({ success: false, message: 'HUD id is required' });

        const [rows] = await pool.query(`
            SELECT e.*,
                COUNT(DISTINCT b.id)  AS batch_count,
                MIN(b.price)          AS min_price,
                MAX(b.price)          AS max_price
            FROM show_event e
            LEFT JOIN show_batch b ON b.event_id = e.id
            WHERE e.hud_id = ?
            GROUP BY e.id
            ORDER BY e.start_datetime ASC
        `, [hudId]);

        res.json({ success: true, events: rows.map(r => ({ ...r, description: r.description || '' })) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
