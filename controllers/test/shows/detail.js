'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;

        const [[show]] = await pool.query(`
            SELECT id, title AS name, slug, description, cover,
                   start_datetime AS fromDate, end_datetime AS toDate
            FROM show_hud WHERE id = ? AND status = 'published'
        `, [id]);

        if (!show)
            return res.status(404).json({ success: false, message: 'Show not found' });

        const [events] = await pool.query(`
            SELECT
                e.id,
                e.title AS name,
                e.start_datetime AS date,
                e.end_datetime,
                MIN(b.price) AS minPrice,
                MAX(b.price) AS maxPrice,
                COALESCE(SUM(b.capacity - COALESCE(b.sold_count,0)), 0) AS availableSeats
            FROM show_event e
            LEFT JOIN show_batch b ON b.event_id = e.id
            WHERE e.hud_id = ? AND e.status = 'published'
            GROUP BY e.id
            ORDER BY e.start_datetime ASC
        `, [id]);

        const eventsWithSoldOut = events.map(e => ({
            ...e,
            isSoldOut: Number(e.availableSeats) === 0,
        }));

        res.json({ success: true, show: { ...show, events: eventsWithSoldOut } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
