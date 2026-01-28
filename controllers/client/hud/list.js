'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        // შექმენი client_huds UTF8MB4 safe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS client_huds (
                id INT AUTO_INCREMENT PRIMARY KEY,
                hud_id VARCHAR(32) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
                start_datetime DATETIME DEFAULT NULL,
                end_datetime DATETIME DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_hud_id (hud_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // ჩაწერე ყველა HUD main DB–დან, duplicates გარეშე
        const [result] = await pool.query(`
            INSERT INTO client_huds (
                hud_id,
                title,
                description,
                start_datetime,
                end_datetime,
                created_at,
                updated_at
            )
            SELECT
                id,
                title,
                description,
                start_datetime,
                end_datetime,
                created_at,
                updated_at
            FROM show_hud
            WHERE id NOT IN (SELECT hud_id FROM client_huds);
        `);

        res.json({
            success: true,
            message: `Client HUDs synced successfully`,
            newRecords: result.affectedRows
        });

    } catch (err) {
        console.error('SYNC CLIENT HUDS ERROR:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to sync client HUDs',
            error: err.message
        });
    }
};
