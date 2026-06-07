'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { search } = req.query;

        // ყველა unique buyer_id tickets-იდან + სტატისტიკა
        const [rows] = await pool.query(`
            SELECT
                t.buyer_id,
                COUNT(t.ticket_id)        AS ticket_count,
                COALESCE(SUM(b.price), 0) AS total_spent,
                MAX(t.sold_at)            AS last_purchase
            FROM tickets t
            JOIN show_batch b ON b.id = t.batch_id
            GROUP BY t.buyer_id
            ORDER BY last_purchase DESC
        `);

        if (!rows.length) return res.json({ success: true, buyers: [] });

        // buyers ცხრილიდან ინფო (registered)
        const allIds   = rows.map(r => r.buyer_id);
        const [bRows]  = await pool.query(
            `SELECT id, name, personal_id, phone, email FROM buyers WHERE id IN (${allIds.map(() => '?').join(',')})`,
            allIds
        );
        const buyerMap = Object.fromEntries(bRows.map(b => [b.id, b]));

        // test_users-იდან ინფო
        const testIds  = allIds.filter(id => id?.startsWith('tu_'));
        let testMap    = {};
        if (testIds.length) {
            const [tRows] = await pool.query(
                `SELECT id, name, personal_id FROM test_users WHERE id IN (${testIds.map(() => '?').join(',')})`,
                testIds
            );
            testMap = Object.fromEntries(tRows.map(u => [u.id, u]));
        }

        let buyers = rows.map(r => {
            const reg  = buyerMap[r.buyer_id];
            const test = testMap[r.buyer_id];
            const info = reg || test;
            return {
                id:           reg?.id || null,
                buyer_id:     r.buyer_id,
                name:         info?.name || r.buyer_id,
                personal_id:  info?.personal_id || null,
                phone:        reg?.phone || null,
                email:        reg?.email || null,
                is_test:      !!test && !reg,
                is_registered: !!reg,
                ticket_count: r.ticket_count,
                total_spent:  r.total_spent,
                last_purchase: r.last_purchase,
            };
        });

        if (search) {
            const q = search.toLowerCase();
            buyers = buyers.filter(b =>
                b.name?.toLowerCase().includes(q) ||
                b.buyer_id?.toLowerCase().includes(q) ||
                b.personal_id?.toLowerCase().includes(q) ||
                b.email?.toLowerCase().includes(q)
            );
        }

        res.json({ success: true, buyers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
