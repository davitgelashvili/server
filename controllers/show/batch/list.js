'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user;  // userId ტოკენიდან
        const { event_id } = req.params;

        if (!event_id) {
            return res.status(400).json({ success: false, message: 'Event id is required' });
        }

        // ვარწმუნდებით, რომ ივენთი არსებობს (მაგრამ user_id ბაზაში არ არსებობს)
        const [eventRows] = await pool.query(`
            SELECT id, title
            FROM show_event
            WHERE id = ?
        `, [event_id]);

        if (!eventRows.length) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // აქ შეგიძლია გამოიყენო userId ნებისმიერი სხვა ლოგიკისთვის
        // მაგალითად, თუ გინდა ლოგი შემოწმება, რომ current user რაღაც ჩართულ პროცესშია
        console.log("Current userId from token:", userId);

        // ბატჩების წამოღება event-ის მიხედვით
        const [batches] = await pool.query(`
            SELECT *
            FROM show_batch
            WHERE event_id = ?
            ORDER BY name ASC
        `, [event_id]);

        res.json({ success: true, batches });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
