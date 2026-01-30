const axios = require('axios');

const api = axios.create({
    baseURL: process.env.MAIN_API_URL || 'http://localhost:5001',
    headers: {
        'x-api-key': process.env.TKT_EXPORT_KEY
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
