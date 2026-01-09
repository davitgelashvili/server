'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { event_id } = req.query;

        let sql = 'SELECT * FROM show_batch';
        let params = [];

        if (event_id) {
            sql += ' WHERE event_id = ?';
            params.push(event_id);
        }

        sql += ' ORDER BY name ASC';

        const [rows] = await pool.query(sql, params);

        res.json({ success: true, batches: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};
