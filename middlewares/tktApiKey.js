module.exports = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    // if (apiKey !== process.env.TKT_EXPORT_KEY) {
    //     return res.status(403).json({ message: 'Forbidden' });
    // }
    if (apiKey !== 'super_secret_key') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
};
