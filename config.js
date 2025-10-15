// Configuration du serveur EF Travel
module.exports = {
    // Port du serveur
    port: process.env.PORT || 3000,
    
    // Environnement
    environment: process.env.NODE_ENV || 'development',
    
    // Configuration Socket.io
    socket: {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    },
    
    // Configuration des sessions
    session: {
        timeout: 10 * 60 * 1000, // 10 minutes
        playerTimeout: 5 * 60 * 1000, // 5 minutes
        cleanupInterval: 60 * 1000 // 1 minute
    },
    
    // Configuration des logs
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableConsole: true
    }
};
