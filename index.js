'use strict';


const http    = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const path   = require('path');
const fs     = require('fs');
const routes = require('./routes');
const { createWsServer } = require('./utils/ws');

const htaccess = path.join(__dirname, '../.htaccess');
const htaccessContent = `# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "/home/ophossdi/evn.ge/server"
PassengerBaseURI "/"
PassengerNodejs "/home/ophossdi/nodevenv/evn.ge/server/22/bin/node"
PassengerAppType node
PassengerStartupFile index.js
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END
`;
fs.writeFileSync(htaccess, htaccessContent, 'utf8');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'production';

const allowedOrigins = [
  'https://evn.ge',
  'https://www.evn.ge',
  'http://localhost:3000',
  'http://localhost:3001',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.set('trust proxy', 1);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.use((req, res, next) => {
  const accept = req.headers['accept'] || '';
  const isApiCall = req.path.startsWith('/api') || req.path === '/health';
  if (!isApiCall && accept.includes('text/html')) {
    return res.status(403).send('Forbidden');
  }
  next();
});

app.use('/api', cors(corsOptions), routes);
app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'API endpoint not found' }));
app.options('/api/*path', cors(corsOptions));


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
