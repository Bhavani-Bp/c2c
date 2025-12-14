const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Connect To Connect API',
            version: '1.0.0',
            description: 'API documentation for Connect To Connect - A synchronized media playing application with real-time chat and room features',
            contact: {
                name: 'API Support',
                email: 'support@c2c.com'
            },
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Development server',
            },
            {
                url: 'https://thorough-victory-production.up.railway.app',
                description: 'Production server (Railway)',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token from login/signup response',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'User ID',
                        },
                        name: {
                            type: 'string',
                            description: 'User full name',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                        },
                        isVerified: {
                            type: 'boolean',
                            description: 'Email verification status',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Account creation timestamp',
                        },
                    },
                },
                Room: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Room ID',
                        },
                        name: {
                            type: 'string',
                            description: 'Room name',
                        },
                        createdBy: {
                            type: 'string',
                            description: 'User ID of room creator',
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Room active status',
                        },
                        lastActivity: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last activity timestamp',
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        error: {
                            type: 'string',
                            description: 'Error message',
                        },
                    },
                },
            },
        },
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication endpoints',
            },
            {
                name: 'Users',
                description: 'User management endpoints',
            },
            {
                name: 'Rooms',
                description: 'Room management and search endpoints',
            },
        ],
    },
    apis: ['./routes/*.js', './controllers/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
