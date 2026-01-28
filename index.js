'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ✅ React origins (dev + prod)
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  // 'https://yourdomain.com' // prod domain (დამატებ მერე)
]; //გადავიტანოთ .env ფაილში პარამეტრები

// ✅ CORS options
const corsOptions = {
  origin: function (origin, cb) {
    // allow tools like Postman/no-origin requests
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(helmet());
app.use(compression());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.use(cors(corsOptions));

app.options(/.*/, cors(corsOptions));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev')); //შევცვალოთ როცა ბექენდის urls გადავიტტანთ .env ფაილში

app.get('/health', (req, res) => res.json({ status: 'OK' }));
app.use('/api', routes);

app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'CORS blocked' });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: 'Server error' });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.listen(PORT, () => console.log(`✅ API running on :${PORT} [${NODE_ENV}]`));
