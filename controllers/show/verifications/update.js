'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user;
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!['verified', 'rejected', 'pending'].includes(status))
            return res.status(400).json({ success: false, message: 'Invalid status' });

        // მხოლოდ საკუთარი HUD-ის verification-ს ცვლის
        const [result] = await pool.query(`
            UPDATE verifications v
            JOIN show_hud h ON h.id = v.hud_id
            SET v.status = ?, v.notes = ?
            WHERE v.id = ? AND h.user_id = ?
        `, [status, notes || null, id, userId]);

        if (!result.affectedRows)
            return res.status(404).json({ success: false, message: 'Not found' });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
