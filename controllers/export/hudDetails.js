'use strict';

const { pool } = require('../../db');
const formatForTkt = require('./tkt');

module.exports = async (req, res) => {
    try {
        const { hudId } = req.params;

        /** HUD */
        const [[hud]] = await pool.query(`
            SELECT *
            FROM show_hud
            WHERE id = ? AND is_public = 1
        `, [hudId]);

        if (!hud) {
            return res.status(404).json({
                success: false,
                message: 'HUD not found'
            });
        }

        /** EVENTS (დღეები) */
        const [events] = await pool.query(`
            SELECT *
            FROM show_event
            WHERE hud_id = ?
            ORDER BY start_datetime ASC
        `, [hudId]);

        /** BATCHES (კალათები) */
        const [batches] = await pool.query(`
            SELECT b.*
            FROM show_batch b
            JOIN show_event e ON e.id = b.event_id
            WHERE e.hud_id = ?
            ORDER BY b.price ASC
        `, [hudId]);

        /** TKT FORMAT */
        const response = formatForTkt(hud, events, batches);

        res.json({
            success: true,
            data: response
        });
    } catch (err) {
        console.error('HUD DETAIL EXPORT ERROR:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch hud detail'
        });
    }
};
