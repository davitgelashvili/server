const crypto = require('crypto');

/**
 * Generates short unique IDs
 */

// HUD: h_XXXXX
function generateHudId() {
    const id = crypto.randomBytes(3).toString('hex'); // 6 hex chars
    return 'h_' + id.slice(0, 5); // 5 სიმბოლო
}

// Event: e_XXXXX
function generateEventId() {
    const id = crypto.randomBytes(3).toString('hex');
    return 'e_' + id.slice(0, 5);
}

// Batch: b_XXXXX
function generateBatchId() {
    const id = crypto.randomBytes(3).toString('hex');
    return 'b_' + id.slice(0, 5);
}

module.exports = {
    generateHudId,
    generateEventId,
    generateBatchId,
};
