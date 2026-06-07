'use strict';

const { pool } = require('../../db');

const SEED_USERS = [
    { id: 'tu_test001', name: 'გიორგი მამალაძე', personal_id: '01234567890', is_valid: 1, coins: 500  },
    { id: 'tu_test002', name: 'ნინო ჭავჭავაძე',  personal_id: '09876543210', is_valid: 1, coins: 1000 },
    { id: 'tu_test003', name: 'დავით კიკნაძე',   personal_id: '05555555550', is_valid: 0, coins: 750  },
    { id: 'tu_test004', name: 'მარიამ ბერიძე',   personal_id: '03333333330', is_valid: 0, coins: 250  },
];

module.exports = async (req, res) => {
    try {
        for (const u of SEED_USERS) {
            await pool.query(
                `INSERT IGNORE INTO test_users (id, name, email, password_hash, personal_id, is_valid, coins)
                 VALUES (?, ?, ?, '', ?, ?, ?)`,
                [u.id, u.name, `${u.id}@test.ge`, u.personal_id, u.is_valid, u.coins]
            );
        }

        const ids = SEED_USERS.map(u => u.id);
        const [users] = await pool.query(
            `SELECT id, name, personal_id, is_valid, coins FROM test_users WHERE id IN (${ids.map(() => '?').join(',')}) ORDER BY id`,
            ids
        );

        res.json({ success: true, users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
