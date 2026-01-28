module.exports = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    // if (apiKey !== process.env.TKT_EXPORT_KEY) {
    //     return res.status(403).json({ message: 'Forbidden' });
    // } uncommnet გავუკეთოთ ამ სტეიტმენტს + დავამატოთ TKT_EXPORT_KEY .env - ში 
    // თავიდან შევამოწმოთ მთლიანი ჰედერი და შმედეგ headers['x-api-key']
    if (apiKey !== 'super_secret_key') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
};
