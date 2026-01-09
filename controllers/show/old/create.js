'use strict';

const crypto = require('crypto');
const { pool } = require('../../../db');

function generateEventId() {
    return 'e_' + crypto.randomBytes(9).toString('hex');
}

async function createUniqueEventId() {
    for (let i = 0; i < 10; i++) {
        const eventId = generateEventId();
        const [rows] = await pool.execute(
            'SELECT event_id FROM events WHERE event_id = ? LIMIT 1',
            [eventId]
        );
        if (!rows.length) return eventId;
    }
    throw new Error('Cannot generate unique eventId');
}

function isNonEmpty(s, min = 3) {
    return typeof s === 'string' && s.trim().length >= min;
}

async function create(req, res) {
    console.log(req)
    try {
        const ownerUserId = req.user.userId;

        const { title, description, location, startAt, endAt, cover, status } = req.body;

        if (!isNonEmpty(title, 3) || title.trim().length > 160) {
            return res.status(400).json({ success: false, message: 'Invalid title' });
        }
        if (!startAt) {
            return res.status(400).json({ success: false, message: 'startAt is required' });
        }

        const start = new Date(startAt);
        if (Number.isNaN(start.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid startAt' });
        }

        let end = null;
        if (endAt) {
            const d = new Date(endAt);
            if (Number.isNaN(d.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid endAt' });
            }
            if (d.getTime() < start.getTime()) {
                return res.status(400).json({ success: false, message: 'endAt must be >= startAt' });
            }
            end = d;
        }

        const safeStatus = (status === 'published' || status === 'cancelled') ? status : 'draft';

        const eventId = await createUniqueEventId();

        await pool.execute(
            `INSERT INTO events
        (event_id, owner_user_id, title, description, location, start_at, end_at, cover, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                eventId,
                ownerUserId,
                title.trim(),
                description || null,
                location || null,
                start,
                end,
                cover || null,
                safeStatus
            ]
        );

        return res.status(201).json({
            success: true,
            event: {
                eventId,
                ownerUserId,
                title: title.trim(),
                description: description || null,
                location: location || null,
                startAt: start,
                endAt: end,
                cover: cover || null,
                status: safeStatus
            }
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = create;
