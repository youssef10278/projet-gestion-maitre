// Configuration pour le système de licences GestionPro
module.exports = {
    // URL du serveur de licences (RAILWAY PRODUCTION)
    LICENSE_SERVER_URL: 'https://gestionpro-license-server-production-e0b2.up.railway.app',
    
    // Paramètres de validation
    VALIDATION_INTERVAL: 4 * 60 * 60 * 1000, // 4 heures (non utilisé dans le système professionnel)
    
    // Paramètres de sécurité
    MAX_VALIDATION_RETRIES: 3,
    OFFLINE_GRACE_PERIOD: 24 * 60 * 60 * 1000, // 24 heures (non utilisé dans le système professionnel)
    
    // Paramètres de connexion
    REQUEST_TIMEOUT: 10000, // 10 secondes
    
    // Informations de l'application
    APP_NAME: 'GestionPro',
    APP_VERSION: '2.0.0'
};
