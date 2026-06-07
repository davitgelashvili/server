'use strict';

const { pool } = require('../db');
// const sendEmail = require('./sendEmail');

/**
 * თუ batch გაიყიდა — შემდეგი (ფასით/id-ით) ჩაირთოს.
 * conn — transaction connection (optional), pool-ს იყენებს თუ არ გადაეცა
 */
module.exports = async function activateNextBatch(batchId, conn) {
    const db = conn || pool;

    const [[sold]] = await db.query(
        'SELECT id, name, event_id, price, capacity, sold_count FROM show_batch WHERE id = ?',
        [batchId]
    );
    if (!sold) return;

    // გაიყიდა?
    if (sold.sold_count < sold.capacity) return;

    // ორგანიზატორს email — დროებით გამორთულია
    // (async () => {
    //     try {
    //         const [[info]] = await pool.query(`...`, [batchId]);
    //         if (info?.email) await sendEmail({ to: info.email, subject: `...`, html: `...` });
    //     } catch (emailErr) { console.error('sold-out email error:', emailErr.message); }
    // })();

    // ამ event-ის შემდეგი inactive batch (ფასით ↑, შემდეგ id-ით)
    const [[next]] = await db.query(
        `SELECT id FROM show_batch
         WHERE event_id = ? AND is_active = 0 AND id != ?
         ORDER BY price ASC, id ASC
         LIMIT 1`,
        [sold.event_id, batchId]
    );
    if (!next) return;

    await db.query('UPDATE show_batch SET is_active = 1 WHERE id = ?', [next.id]);
};
