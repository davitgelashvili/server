'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const [shows] = await pool.query(`
            SELECT
                h.id,
                h.title   AS name,
                h.slug,
                h.description,
                h.cover,
                h.start_datetime AS fromDate,
                h.end_datetime   AS toDate,
                COALESCE(MIN(b.price), 0) AS minPrice,
                COALESCE(MAX(b.price), 0) AS maxPrice,
                COUNT(DISTINCT e.id) AS eventCount,
                COALESCE(SUM(b.capacity - COALESCE(b.sold_count,0)), 0) AS availableSeats
            FROM show_hud h
            LEFT JOIN show_event e  ON e.hud_id  = h.id
            LEFT JOIN show_batch b  ON b.event_id = e.id
            WHERE h.status = 'published'
            GROUP BY h.id
            ORDER BY h.start_datetime ASC
        `);

        const [eventDates] = await pool.query(`
            SELECT e.hud_id, e.start_datetime AS eventDate
            FROM show_event e
            JOIN show_hud h ON h.id = e.hud_id
            WHERE h.status = 'published' AND e.status = 'published'
            ORDER BY e.start_datetime ASC
        `);

        const datesByHud = {};
        for (const row of eventDates) {
            if (!datesByHud[row.hud_id]) datesByHud[row.hud_id] = [];
            datesByHud[row.hud_id].push(row.eventDate);
        }

        const result = shows.map(s => ({
            ...s,
            isSoldOut: s.availableSeats === 0 && s.eventCount > 0,
            eventDates: datesByHud[s.id] || [],
        }));

        res.json({ success: true, shows: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
