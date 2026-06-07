'use strict';

const { pool } = require('../../db');

module.exports = async (req, res) => {
    try {
        const { eventId } = req.params;

        const [[event]] = await pool.query(`
            SELECT
                e.id,
                e.title            AS name,
                e.description,
                e.start_datetime   AS date,
                e.end_datetime,
                h.id               AS showId,
                h.title            AS showName,
                h.cover            AS showCover,
                h.requires_verification AS requiresVerification
            FROM show_event e
            JOIN show_hud h ON h.id = e.hud_id
            WHERE e.id = ? AND e.status = 'published' AND h.status = 'published'
        `, [eventId]);

        if (!event)
            return res.status(404).json({ success: false, message: 'Event not found' });

        const [batches] = await pool.query(`
            SELECT
                id, name, price,
                capacity,
                COALESCE(sold_count, 0)                    AS sold,
                (capacity - COALESCE(sold_count, 0))       AS available
            FROM show_batch
            WHERE event_id = ?
            ORDER BY price ASC
        `, [eventId]);

        res.json({
            success: true,
            event: {
                ...event,
                isSoldOut:   batches.length > 0 && batches.every(b => b.available <= 0),
                ticketTypes: batches.map(b => ({
                    ...b,
                    isSoldOut: b.available <= 0,
                })),
            },
        });
    } catch (err) {
        console.error('EVENT DETAIL EXPORT ERROR:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
