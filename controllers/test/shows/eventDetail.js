'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;

        const [[event]] = await pool.query(`
            SELECT
                e.id, e.title AS name, e.description,
                e.start_datetime AS date, e.end_datetime,
                h.id AS showId, h.title AS showName, h.cover AS showCover,
                h.requires_verification AS requiresVerification
            FROM show_event e
            JOIN show_hud h ON h.id = e.hud_id
            WHERE e.id = ? AND e.status = 'published' AND h.status = 'published'
        `, [id]);

        if (!event)
            return res.status(404).json({ success: false, message: 'Event not found' });

        const [ticketTypes] = await pool.query(`
            SELECT
                id, name, price, is_active,
                capacity,
                COALESCE(sold_count, 0) AS sold,
                (capacity - COALESCE(sold_count, 0)) AS available
            FROM show_batch
            WHERE event_id = ?
            ORDER BY price ASC
        `, [id]);

        const result = {
            ...event,
            isSoldOut: ticketTypes.length > 0 && ticketTypes.every(t => t.available <= 0),
            ticketTypes: ticketTypes.map(t => ({
                ...t,
                isSoldOut:  t.available <= 0,
                isInactive: !t.is_active,
            })),
        };

        res.json({ success: true, event: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
