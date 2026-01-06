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

    const groups = req.body; // generic array of { type, name, date?, tiers[] }

    if (!Array.isArray(groups) || !groups.length) {
        return res.status(400).json({ success: false, message: 'Invalid body, expected non-empty array' });
    }

    // validation
    for (const g of groups) {
        if (!g.type || !g.name || !Array.isArray(g.tiers) || !g.tiers.length) {
            return res.status(400).json({ success: false, message: 'Invalid group structure' });
        }

        if (g.type === 'DAY' && !okDate(g.date)) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }

        for (const t of g.tiers) {
            const tierNo = Number(t.tierNo);
            const capacity = Number(t.capacity);
            const priceCents = Number(t.priceCents);

            if (!isInt(tierNo) || tierNo < 1) return res.status(400).json({ success: false, message: 'Invalid tierNo' });
            if (!isInt(capacity) || capacity < 0) return res.status(400).json({ success: false, message: 'Invalid capacity' });
            if (!isInt(priceCents) || priceCents < 0) return res.status(400).json({ success: false, message: 'Invalid priceCents' });
        }
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

        // წაშლის ძველ ყველა ჯგუფს
        await conn.execute(`DELETE FROM ticket_groups WHERE event_id = ?`, [eventId]);

        // iterate over generic groups
        for (const g of groups) {
            const [grp] = await conn.execute(
                `INSERT INTO ticket_groups (event_id, type, day_date, name)
         VALUES (?, ?, ?, ?)`,
                [eventId, g.type, g.date || null, g.name]
            );

            const groupId = grp.insertId;

            for (const t of g.tiers) {
                const tierNo = Number(t.tierNo);
                const isActive = tierNo === 1 ? 1 : 0; // first tier active by default

                await conn.execute(
                    `INSERT INTO ticket_tiers (group_id, tier_no, capacity, price_cents, is_active)
           VALUES (?, ?, ?, ?, ?)`,
                    [groupId, tierNo, Number(t.capacity), Number(t.priceCents), isActive]
                );
            }
        }

        await conn.commit();
        return res.json({ success: true });
    } catch (e) {
        await conn.rollback();
        console.error(e);
        return res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        conn.release();
    }
}

module.exports = ticketsSetup;
