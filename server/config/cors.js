const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://connect2connect.vercel.app',
        // Add your Railway backend URL
        process.env.CLIENT_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = corsOptions;
