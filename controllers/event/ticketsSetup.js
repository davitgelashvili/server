// controllers/event/ticketsSetup.js

'use strict';

const { pool } = require('../../db');

function isInt(n) {
    return Number.isInteger(n);
}

function okDate(s) {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

async function ticketsSetup(req, res) {
    const { eventId } = req.params;
    const userId = req.user && req.user.userId;

    const { days, fullPass } = req.body;

    if (!Array.isArray(days) || !days.length) return res.status(400).json({ success: false });
    if (!fullPass || !Array.isArray(fullPass.tiers) || !fullPass.tiers.length) return res.status(400).json({ success: false });

    for (const d of days) {
        if (!okDate(d.date)) return res.status(400).json({ success: false });
        if (!Array.isArray(d.tiers) || !d.tiers.length) return res.status(400).json({ success: false });

        for (const t of d.tiers) {
            const tierNo = Number(t.tierNo);
            const capacity = Number(t.capacity);
            const priceCents = Number(t.priceCents);

            if (!isInt(tierNo) || tierNo < 1) return res.status(400).json({ success: false });
            if (!isInt(capacity) || capacity < 0) return res.status(400).json({ success: false });
            if (!isInt(priceCents) || priceCents < 0) return res.status(400).json({ success: false });
        }
    }

    for (const t of fullPass.tiers) {
        const tierNo = Number(t.tierNo);
        const capacity = Number(t.capacity);
        const priceCents = Number(t.priceCents);

        if (!isInt(tierNo) || tierNo < 1) return res.status(400).json({ success: false });
        if (!isInt(capacity) || capacity < 0) return res.status(400).json({ success: false });
        if (!isInt(priceCents) || priceCents < 0) return res.status(400).json({ success: false });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [ev] = await conn.execute(
            `SELECT event_id, owner_user_id
       FROM events
       WHERE event_id = ?
       LIMIT 1`,
            [eventId]
        );

        if (!ev.length) {
            await conn.rollback();
            return res.status(404).json({ success: false });
        }

        if (!userId || ev[0].owner_user_id !== userId) {
            await conn.rollback();
            return res.status(403).json({ success: false });
        }

        await conn.execute(`DELETE FROM ticket_groups WHERE event_id = ?`, [eventId]);

        // day groups
        for (const d of days) {
            const [g] = await conn.execute(
                `INSERT INTO ticket_groups (event_id, type, day_date, name)
         VALUES (?, 'DAY', ?, ?)`,
                [eventId, d.date, d.name || null]
            );

            const groupId = g.insertId;

            for (const t of d.tiers) {
                const tierNo = Number(t.tierNo);
                const isActive = tierNo === 1 ? 1 : 0;

                await conn.execute(
                    `INSERT INTO ticket_tiers (group_id, tier_no, capacity, price_cents, is_active)
           VALUES (?, ?, ?, ?, ?)`,
                    [groupId, tierNo, Number(t.capacity), Number(t.priceCents), isActive]
                );
            }
        }

        // full pass group (locked by default)
        const [fg] = await conn.execute(
            `INSERT INTO ticket_groups (event_id, type, day_date, name)
       VALUES (?, 'FULL_PASS', NULL, ?)`,
            [eventId, fullPass.name || 'Full Pass']
        );

        const fullGroupId = fg.insertId;

        for (const t of fullPass.tiers) {
            await conn.execute(
                `INSERT INTO ticket_tiers (group_id, tier_no, capacity, price_cents, is_active)
         VALUES (?, ?, ?, ?, 0)`,
                [fullGroupId, Number(t.tierNo), Number(t.capacity), Number(t.priceCents)]
            );
        }

        await conn.commit();
        return res.json({ success: true });
    } catch (e) {
        await conn.rollback();
        return res.status(500).json({ success: false });
    } finally {
        conn.release();
    }
}

module.exports = ticketsSetup;
