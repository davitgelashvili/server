'use strict';

const { pool } = require('../../db');

module.exports = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                h.id,
                h.title        AS name,
                h.slug,
                h.description,
                h.cover,
                h.start_datetime AS fromDate,
                h.end_datetime   AS toDate,
                COALESCE(MIN(b.price), 0)                            AS minPrice,
                COALESCE(MAX(b.price), 0)                            AS maxPrice,
                COUNT(DISTINCT e.id)                                  AS eventCount,
                COALESCE(SUM(b.capacity - COALESCE(b.sold_count,0)), 0) AS availableSeats
            FROM show_hud h
            LEFT JOIN show_event e ON e.hud_id   = h.id AND e.status = 'published'
            LEFT JOIN show_batch b ON b.event_id = e.id
            WHERE h.status = 'published'
            GROUP BY h.id
            ORDER BY h.start_datetime ASC
        `);

        const data = rows.map(r => ({
            ...r,
            isSoldOut: Number(r.availableSeats) === 0 && Number(r.eventCount) > 0,
        }));

        res.json({ success: true, data });
    } catch (err) {
        console.error('HUD LIST EXPORT ERROR:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
