'use strict';

const { pool } = require('../db');

/**
 * Checks verification + max tickets limit before a purchase.
 * Returns { ok: true } or { ok: false, status: 4xx, message: '...' }
 */
module.exports = async function checkBuyerEligibility(buyer_id, hud_id) {
    const [[hud]] = await pool.query(
        'SELECT requires_verification, max_tickets_per_buyer FROM show_hud WHERE id = ?',
        [hud_id]
    );
    if (!hud) return { ok: false, status: 404, message: 'HUD ვერ მოიძებნა' };

    // 1. ვერიფიკაციის შემოწმება
    if (hud.requires_verification) {
        const [[ver]] = await pool.query(
            'SELECT status FROM verifications WHERE buyer_id = ? AND hud_id = ?',
            [buyer_id, hud_id]
        );
        if (!ver)
            return { ok: false, status: 403, message: 'ვერიფიკაციის მოთხოვნა არ გამოგზავნილა' };
        if (ver.status === 'pending')
            return { ok: false, status: 403, message: 'ვერიფიკაციის მოთხოვნა განხილვაშია' };
        if (ver.status === 'rejected')
            return { ok: false, status: 403, message: 'ვერიფიკაციაზე უარი გეთქვათ' };
    }

    // 2. მაქს. ბილეთების შემოწმება
    if (hud.max_tickets_per_buyer) {
        const [[{ bought }]] = await pool.query(`
            SELECT COUNT(*) AS bought
            FROM tickets t
            JOIN show_batch  b ON b.id = t.batch_id
            JOIN show_event  e ON e.id = b.event_id
            WHERE e.hud_id = ? AND t.buyer_id = ?
        `, [hud_id, buyer_id]);

        if (bought >= hud.max_tickets_per_buyer)
            return {
                ok: false, status: 400,
                message: `ამ შოუზე მაქსიმუმ ${hud.max_tickets_per_buyer} ბილეთის შეძენა შეიძლება`
            };
    }

    return { ok: true };
};
