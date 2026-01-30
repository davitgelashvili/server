require('dotenv').config()

module.exports = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['X-API-Key'];

    if (apiKey !== process.env.TKT_EXPORT_KEY) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    next();
};
