// controllers/event/ticketsBuy.js

'use strict';

const { pool } = require('../../../db');

function isInt(n) {
    return Number.isInteger(n);
}

function okDate(s) {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

async function activateNextTier(conn, groupId) {
    const [active] = await conn.execute(
        `SELECT id, tier_no, capacity, sold
     FROM ticket_tiers
     WHERE group_id = ? AND is_active = 1
     ORDER BY tier_no ASC
     LIMIT 1
     FOR UPDATE`,
        [groupId]
    );

    if (!active.length) return;

    const cur = active[0];
    if (cur.sold < cur.capacity) return;

    await conn.execute(
        `UPDATE ticket_tiers
     SET is_active = 0
     WHERE id = ?`,
        [cur.id]
    );

    await conn.execute(
        `UPDATE ticket_tiers
     SET is_active = 1
     WHERE group_id = ? AND tier_no = ?
     LIMIT 1`,
        [groupId, cur.tier_no + 1]
    );
}

async function unlockFullPassIfReady(conn, eventId) {
    const [dayGroups] = await conn.execute(
        `SELECT id
     FROM ticket_groups
     WHERE event_id = ? AND type = 'DAY'`,
        [eventId]
    );

    if (!dayGroups.length) return;

    for (const g of dayGroups) {
        const [t1] = await conn.execute(
            `SELECT capacity, sold
       FROM ticket_tiers
       WHERE group_id = ? AND tier_no = 1
       LIMIT 1
       FOR UPDATE`,
            [g.id]
        );

        if (!t1.length) return;
        if (t1[0].sold < t1[0].capacity) return;
    }

    const [full] = await conn.execute(
        `SELECT id
     FROM ticket_groups
     WHERE event_id = ? AND type = 'FULL_PASS'
     LIMIT 1`,
        [eventId]
    );

    if (!full.length) return;

    const fullGroupId = full[0].id;

    const [active] = await conn.execute(
        `SELECT id FROM ticket_tiers
     WHERE group_id = ? AND is_active = 1
     LIMIT 1
     FOR UPDATE`,
        [fullGroupId]
    );

    if (active.length) return;

    await conn.execute(
        `UPDATE ticket_tiers
     SET is_active = 1
     WHERE group_id = ? AND tier_no = 1
     LIMIT 1`,
        [fullGroupId]
    );
}

async function ticketsBuy(req, res) {
    const { eventId } = req.params;
    const { type, date, qty } = req.body;

    const q = Number(qty);

    if (type !== 'DAY' && type !== 'FULL_PASS') return res.status(400).json({ success: false });
    if (!isInt(q) || q < 1) return res.status(400).json({ success: false });
    if (type === 'DAY' && !okDate(date)) return res.status(400).json({ success: false });

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [groups] = await conn.execute(
            `SELECT id, type, day_date
       FROM ticket_groups
       WHERE event_id = ? AND type = ? AND (day_date = ? OR ? IS NULL)
       LIMIT 1
       FOR UPDATE`,
            [eventId, type, type === 'DAY' ? date : null, type === 'DAY' ? null : null]
        );

        if (!groups.length) {
            await conn.rollback();
            return res.status(404).json({ success: false });
        }

        const groupId = groups[0].id;

        const [tierRows] = await conn.execute(
            `SELECT id, tier_no, capacity, sold, price_cents
       FROM ticket_tiers
       WHERE group_id = ? AND is_active = 1
       ORDER BY tier_no ASC
       LIMIT 1
       FOR UPDATE`,
            [groupId]
        );

        if (!tierRows.length) {
            await conn.rollback();
            return res.status(403).json({ success: false }); // locked (ex: full pass not opened)
        }

        const tier = tierRows[0];
        if (tier.sold + q > tier.capacity) {
            await conn.rollback();
            return res.status(409).json({ success: false });
        }

        await conn.execute(
            `UPDATE ticket_tiers
       SET sold = sold + ?
       WHERE id = ?`,
            [q, tier.id]
        );

        await activateNextTier(conn, groupId);

        if (type === 'DAY') {
            await unlockFullPassIfReady(conn, eventId);
        }

        await conn.commit();

        return res.json({
            success: true,
            tier: tier.tier_no,
            qty: q,
            priceCents: tier.price_cents,
            totalCents: tier.price_cents * q,
        });
    } catch (e) {
        await conn.rollback();
        return res.status(500).json({ success: false });
    } finally {
        conn.release();
    }
}

module.exports = ticketsBuy;
