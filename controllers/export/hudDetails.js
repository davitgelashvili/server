'use strict';

const { pool } = require('../../db');

module.exports = async (req, res) => {
    try {
        const { hudId } = req.params;

        /** HUD */
        const [[hud]] = await pool.query(`
            SELECT 
                id,
                user_id,
                title,
                slug,
                description,
                cover,
                start_datetime,
                end_datetime,
                created_at
            FROM show_hud
            WHERE id = ?
        `, [hudId]);

        if (!hud) {
            return res.status(404).json({
                success: false,
                message: 'HUD not found'
            });
        }

        /** EVENTS */
        const [events] = await pool.query(`
            SELECT
                id,
                hud_id,
                title,
                description,
                start_datetime,
                end_datetime,
                min_price,
                max_price
            FROM show_event
            WHERE hud_id = ?
            ORDER BY start_datetime ASC
        `, [hudId]);

        if (!events.length) {
            return res.json({
                success: true,
                data: {
                    ...hud,
                    events: []
                }
            });
        }

        /** BATCHES */
        const eventIds = events.map(e => e.id);

        const [batches] = await pool.query(`
            SELECT
                id,
                event_id,
                name,
                price,
                capacity,
                sold_count
            FROM show_batch
            WHERE event_id IN (?)
            ORDER BY price ASC
        `, [eventIds]);

        /** attach batches to events */
        const eventsWithBatches = events.map(event => ({
            ...event,
            batches: batches.filter(b => b.event_id === event.id)
        }));

        res.json({
            success: true,
            data: {
                ...hud,
                events: eventsWithBatches
            }
        });
    } catch (err) {
        console.error('HUD DETAIL EXPORT ERROR:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch hud detail'
        });
    }
};
