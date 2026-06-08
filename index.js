'use strict';

require('dotenv').config();

const http    = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const path   = require('path');
const routes = require('./routes');
const { createWsServer } = require('./utils/ws');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'production';

// React origins (dev + prod)

const corsOptions = {
  origin: true,
  credentials: true,
};

app.set('trust proxy', 1);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

const DIST = path.join(__dirname, '../front/dist');

app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.use('/api', cors(corsOptions), routes);
app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'API endpoint not found' }));
app.options('/api/*path', cors(corsOptions));

app.use(express.static(DIST));
app.use((req, res) => res.sendFile(path.join(DIST, 'index.html')));

app.use((err, req, res, next) => {
  console.error(err);
  return res.status(500).json({ success: false, message: 'Server error' });
});

const server = http.createServer(app);
createWsServer(server);

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} already in use. Run: lsof -ti :${PORT} | xargs kill -9`);
    } else {
        console.error('HTTP server error:', err.message);
    }
    process.exit(1);
});

server.listen(PORT, () => console.log(`✅ API running on :${PORT} [${NODE_ENV}]`));