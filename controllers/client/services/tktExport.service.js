const axios = require('axios');

const api = axios.create({
    baseURL: process.env.MAIN_API_URL || 'http://localhost:5001', //დავამათოთ MAIN_API_URL .env ფაილში + გამოვიყენოთ ეეს ენვ ცვალი მთავარ index.js ში ბექენდის url-სთვის
    headers: {
        // 'x-api-key': process.env.TKT_EXPORT_KEY uncommenct გავუკეთოთ ამ კოდს და ვალიდაციაში გავატაროთ  (tktApiKey.js middleware-თი) 
        'x-api-key': 'super_secret_key'
    },
    timeout: 5000
});

exports.getHuds = async () => {
    const { data } = await api.get('/api/export/hud');
    return data.huds;
};

exports.getHudDetail = async (slug) => {
    const { data } = await api.get(`/api/export/hud/${slug}`);
    return data;
};
