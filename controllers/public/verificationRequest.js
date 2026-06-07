'use strict';

const { pool } = require('../../db');
const { generateBuyerId } = require('../../utils/generateId');
const { broadcast } = require('../../utils/ws');

module.exports = async (req, res) => {
    try {
        const { buyer_id, hud_id } = req.body;

        if (!buyer_id || !hud_id)
            return res.status(400).json({ success: false, message: 'buyer_id და hud_id სავალდებულოა' });

        // HUD არსებობს და verification სჭირდება?
        const [[hud]] = await pool.query(
            'SELECT id, requires_verification FROM show_hud WHERE id = ?',
            [hud_id]
        );
        if (!hud)
            return res.status(404).json({ success: false, message: 'HUD ვერ მოიძებნა' });
        if (!hud.requires_verification)
            return res.status(400).json({ success: false, message: 'ეს HUD ვერიფიკაციას არ საჭიროებს' });

        // Buyer არსებობს? (buyers ან test_users)
        const [[buyer]]    = await pool.query('SELECT id FROM buyers WHERE id = ?', [buyer_id]);
        const [[testUser]] = buyer ? [[null]] : await pool.query('SELECT id FROM test_users WHERE id = ?', [buyer_id]);
        if (!buyer && !testUser)
            return res.status(404).json({ success: false, message: 'მყიდველი ვერ მოიძებნა' });

        // უკვე არსებობს request?
        const [[existing]] = await pool.query(
            'SELECT id, status FROM verifications WHERE buyer_id = ? AND hud_id = ?',
            [buyer_id, hud_id]
        );
        if (existing)
            return res.json({ success: true, status: existing.status, existing: true });

        // ახალი ID
        const id = 'ver_' + require('crypto').randomBytes(6).toString('hex');

        await pool.query(
            'INSERT INTO verifications (id, hud_id, buyer_id, status) VALUES (?, ?, ?, ?)',
            [id, hud_id, buyer_id, 'pending']
        );

        // real-time notification to all connected admins/clients
        const [[detail]] = await pool.query(`
            SELECT b.name AS buyer_name, b.phone AS buyer_phone, h.title AS hud_title
            FROM verifications v
            LEFT JOIN buyers   b ON b.id = v.buyer_id
            LEFT JOIN show_hud h ON h.id = v.hud_id
            WHERE v.id = ?
        `, [id]);

        broadcast({
            type: 'verification_new',
            verification: {
                id,
                hud_id,
                buyer_id,
                status: 'pending',
                buyer_name:  detail?.buyer_name  || buyer_id,
                buyer_phone: detail?.buyer_phone || null,
                hud_title:   detail?.hud_title   || hud_id,
                created_at:  new Date().toISOString(),
            },
        });

        res.json({ success: true, id, status: 'pending' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
