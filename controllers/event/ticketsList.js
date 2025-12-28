// controllers/event/ticketsList.js

'use strict';

const { pool } = require('../../db');

async function ticketsList(req, res) {
    try {
        const { eventId } = req.params;

        const [groups] = await pool.execute(
            `SELECT id, type, day_date, name
       FROM ticket_groups
       WHERE event_id = ?
       ORDER BY
         CASE WHEN type='DAY' THEN 0 ELSE 1 END,
         day_date ASC`,
            [eventId]
        );

        const out = [];

        for (const g of groups) {
            const [tiers] = await pool.execute(
                `SELECT tier_no, capacity, sold, price_cents, is_active
         FROM ticket_tiers
         WHERE group_id = ?
         ORDER BY tier_no ASC`,
                [g.id]
            );

            out.push({
                type: g.type,
                date: g.day_date,
                name: g.name,
                tiers,
            });
        }

        return res.json({ success: true, tickets: out });
    } catch (e) {
        return res.status(500).json({ success: false });
    }
}

module.exports = ticketsList;
