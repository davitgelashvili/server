'use strict';

const { WebSocketServer, OPEN } = require('ws');

let wss = null;

function createWsServer(httpServer) {
    wss = new WebSocketServer({ server: httpServer, path: '/ws' });

    wss.on('error', (err) => console.error('ws server error:', err.message));

    wss.on('connection', (ws, req) => {
        ws.on('error', (err) => console.error('ws client error:', err.message));
        ws.on('close', () => {});
    });

    console.log('✅ WebSocket server ready at /ws');
}

function broadcast(data) {
    if (!wss) return;
    const msg = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === OPEN) client.send(msg);
    });
}

module.exports = { createWsServer, broadcast };
