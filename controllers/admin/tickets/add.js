'use strict';

const { pool } = require('../../../db');
const { generateTicketId } = require('../../../utils/generateId');
const checkBuyerEligibility = require('../../../utils/checkBuyerEligibility');
const activateNextBatch     = require('../../../utils/activateNextBatch');
// const sendEmail             = require('../../../utils/sendEmail');
const { broadcast }         = require('../../../utils/ws');

module.exports = async (req, res) => {
    try {
        const { buyer_name, status, buyer_id, batch_id, event_id, hud_id } = req.body;
        const amount = Math.max(1, Math.min(10, parseInt(req.body.amount) || 1));

        if (!buyer_name || !status || !buyer_id || !batch_id || !event_id || !hud_id) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        const [batchRows] = await pool.query(`
            SELECT b.id, b.capacity, b.sold_count, b.is_active
            FROM show_batch b
            JOIN show_event e ON b.event_id = e.id
            JOIN show_hud h ON e.hud_id = h.id
            WHERE b.id = ? AND e.id = ? AND h.id = ?
        `, [batch_id, event_id, hud_id]);

        if (!batchRows.length) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }
        if (!batchRows[0].is_active) {
            return res.status(400).json({ success: false, message: 'ეს კალათა არ არის აქტიური' });
        }
        if (batchRows[0].sold_count + amount > batchRows[0].capacity) {
            return res.status(400).json({ success: false, message: `არ არის საკმარისი ბილეთი (ხელმისაწვდომია: ${batchRows[0].capacity - batchRows[0].sold_count})` });
        }

        const eligibility = await checkBuyerEligibility(buyer_id, hud_id);
        if (!eligibility.ok)
            return res.status(eligibility.status).json({ success: false, message: eligibility.message });

        const soldAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const ticketIds = [];

        for (let i = 0; i < amount; i++) {
            const ticketId = generateTicketId();
            ticketIds.push(ticketId);
            await pool.query(`
                INSERT INTO tickets (ticket_id, event_id, buyer_id, status, amount, sold_at, platform, batch_id)
                VALUES (?, ?, ?, ?, 1, ?, 'manual', ?)
            `, [ticketId, event_id, buyer_id, status, soldAt, batch_id]);
        }

        await pool.query('UPDATE show_batch SET sold_count = sold_count + ? WHERE id = ?', [amount, batch_id]);

        const newSold = batchRows[0].sold_count + amount;
        broadcast({ type: 'batch_update', batch_id, sold_count: newSold, capacity: batchRows[0].capacity });

        await activateNextBatch(batch_id);

        // email buyer-ზე — დროებით გამორთულია
        // (async () => {
        //     try {
        //         const [[buyer]] = await pool.query('SELECT name, email FROM buyers WHERE id = ?', [buyer_id]);
        //         if (buyer?.email) {
        //             const [[info]] = await pool.query(`
        //                 SELECT b.name AS batch_name, b.price, e.title AS event_title,
        //                        e.start_datetime, h.title AS hud_title
        //                 FROM show_batch b
        //                 JOIN show_event e ON e.id = b.event_id
        //                 JOIN show_hud h ON h.id = e.hud_id
        //                 WHERE b.id = ?
        //             `, [batch_id]);
        //             const idsHtml = ticketIds.map(id => `<li style="font-family:monospace">${id}</li>`).join('');
        //             await sendEmail({
        //                 to: buyer.email,
        //                 subject: `ბილეთ${amount > 1 ? 'ები' : 'ი'}: ${info.hud_title}`,
        //                 html: `...`,
        //             });
        //         }
        //     } catch (e) { console.error('email error:', e.message); }
        // })();

        res.json({ success: true, ticket_ids: ticketIds, ticket_id: ticketIds[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
