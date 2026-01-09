'use strict';

const { pool } = require('../../../db');
const { formatForBiletebi } = require('../../../utils/exportFormat');

module.exports = async (req, res) => {
    try {
        const { hud_id } = req.query;
        if (!hud_id) return res.status(400).json({ success: false, error: 'hud_id is required' });

        // HUD
        const [hudRows] = await pool.query('SELECT * FROM show_hud WHERE id = ?', [hud_id]);
        if (!hudRows.length) return res.status(404).json({ success: false, error: 'HUD not found' });
        const hud = hudRows[0];

        // Events
        const [events] = await pool.query('SELECT * FROM show_event WHERE hud_id = ?', [hud_id]);

        // Batches
        const [batches] = await pool.query(
            'SELECT * FROM show_batch WHERE event_id IN (?)',
            [events.map(ev => ev.id)]
        );

        res.json({ success: true, data: formatForBiletebi(hud, events, batches) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};
