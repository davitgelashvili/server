'use strict';

const { pool } = require('../../db');
const { generateTicketId } = require('../../utils/generateId');
const checkBuyerEligibility = require('../../utils/checkBuyerEligibility');
const activateNextBatch     = require('../../utils/activateNextBatch');

module.exports = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { batchId, userId } = req.body;
        if (!batchId || !userId)
            return res.status(400).json({ success: false, message: 'batchId and userId required' });

        await conn.beginTransaction();

        const [[batch]] = await conn.query(
            `SELECT b.*, e.id AS eventId, e.title AS eventName, e.start_datetime AS eventDate,
                    h.id AS hudId, h.title AS showName
             FROM show_batch b
             JOIN show_event e ON e.id = b.event_id
             JOIN show_hud   h ON h.id = e.hud_id
             WHERE b.id = ? FOR UPDATE`,
            [batchId]
        );
        if (!batch) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'Ticket type not found' });
        }

        if (!batch.is_active) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'ეს კალათა არ არის აქტიური' });
        }

        const available = batch.capacity - (batch.sold_count || 0);
        if (available <= 0) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'Sold out' });
        }

        const [[user]] = await conn.query(
            'SELECT id, name, personal_id, coins FROM test_users WHERE id = ? FOR UPDATE',
            [userId]
        );
        if (!user) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.coins < batch.price) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'Not enough coins' });
        }

        const eligibility = await checkBuyerEligibility(userId, batch.hudId);
        if (!eligibility.ok) {
            await conn.rollback();
            return res.status(eligibility.status).json({ success: false, message: eligibility.message });
        }

        const ticketId = generateTicketId();

        await conn.query(
            `INSERT INTO tickets (ticket_id, event_id, batch_id, buyer_id, status, amount, sold_at, platform)
             VALUES (?, ?, ?, ?, 'active', ?, NOW(), 'test')`,
            [ticketId, batch.eventId, batchId, userId, batch.price]
        );
        await conn.query('UPDATE show_batch SET sold_count = sold_count + 1 WHERE id = ?', [batchId]);
        await conn.query('UPDATE test_users SET coins = coins - ? WHERE id = ?', [batch.price, userId]);

        await conn.commit();

        // test user-ის ინფო buyers ცხრილში ჩაიწეროს (პირველი ყიდვისას)
        await pool.query(
            `INSERT IGNORE INTO buyers (id, name, personal_id) VALUES (?, ?, ?)`,
            [user.id, user.name, user.personal_id || null]
        );

        // თუ batch გაიყიდა — შემდეგი ჩაირთოს
        await activateNextBatch(batchId);

        const [[updated]] = await pool.query('SELECT coins FROM test_users WHERE id = ?', [userId]);

        res.json({
            success: true,
            ticket: {
                ticketId, batchId,
                batchName: batch.name,
                eventId:   batch.eventId,
                eventName: batch.eventName,
                eventDate: batch.eventDate,
                showName:  batch.showName,
                price:     batch.price,
                userName:  user.name,
                status:    'active',
            },
            coins: updated.coins,
        });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        conn.release();
    }
};
