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

// Ticket: t_XXXXX
function generateTicketId() {
    const id = crypto.randomBytes(3).toString('hex');
    return 't_' + id.slice(0, 5);
}

// Buyer: buy_XXXXXXXX
function generateBuyerId() {
    return 'buy_' + crypto.randomBytes(4).toString('hex');
}

module.exports = {
    generateHudId,
    generateEventId,
    generateBatchId,
    generateTicketId,
    generateBuyerId,
};
