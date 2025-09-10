const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🧹 === NETTOYAGE DES DONNÉES D\'ACTIVATION ===\n');

// Chemins des fichiers d'activation
const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'GestionPro');
const activationFilePath = path.join(appDataPath, 'activation.json');

// Fichiers de base de données locales
const localLicenseDb = path.join(__dirname, 'licenses.db');
const localDatabaseDb = path.join(__dirname, 'database.db');

console.log('📁 Chemins vérifiés:');
console.log('   - AppData:', appDataPath);
console.log('   - Activation:', activationFilePath);
console.log('   - License DB:', localLicenseDb);
console.log('   - Database DB:', localDatabaseDb);
console.log('');

let filesDeleted = 0;

// Supprimer le fichier d'activation
if (fs.existsSync(activationFilePath)) {
    try {
        fs.unlinkSync(activationFilePath);
        console.log('✅ Fichier activation.json supprimé');
        filesDeleted++;
    } catch (error) {
        console.log('❌ Erreur suppression activation.json:', error.message);
    }
} else {
    console.log('ℹ️ Fichier activation.json non trouvé');
}

// Supprimer le dossier AppData complet si il existe
if (fs.existsSync(appDataPath)) {
    try {
        fs.rmSync(appDataPath, { recursive: true, force: true });
        console.log('✅ Dossier AppData GestionPro supprimé');
        filesDeleted++;
    } catch (error) {
        console.log('❌ Erreur suppression dossier AppData:', error.message);
    }
} else {
    console.log('ℹ️ Dossier AppData GestionPro non trouvé');
}

// Supprimer la base de données locale de licences
if (fs.existsSync(localLicenseDb)) {
    try {
        fs.unlinkSync(localLicenseDb);
        console.log('✅ Base de données licenses.db supprimée');
        filesDeleted++;
    } catch (error) {
        console.log('❌ Erreur suppression licenses.db:', error.message);
    }
} else {
    console.log('ℹ️ Fichier licenses.db non trouvé');
}

// Supprimer la base de données principale locale
if (fs.existsSync(localDatabaseDb)) {
    try {
        fs.unlinkSync(localDatabaseDb);
        console.log('✅ Base de données database.db supprimée');
        filesDeleted++;
    } catch (error) {
        console.log('❌ Erreur suppression database.db:', error.message);
    }
} else {
    console.log('ℹ️ Fichier database.db non trouvé');
}

console.log('');
console.log(`🎯 Résultat: ${filesDeleted} fichier(s) supprimé(s)`);
console.log('');
console.log('✨ SYSTÈME RÉINITIALISÉ !');
console.log('');
console.log('📋 PROCHAINES ÉTAPES:');
console.log('1. Démarrez le serveur de licences local: cd serveur-licence && node server.js');
console.log('2. Générez une nouvelle clé: cd serveur-licence && node generate-keys.js');
console.log('3. Lancez GestionPro: npm start');
console.log('4. Utilisez la clé générée pour l\'activation');
console.log('');
console.log('🔧 Configuration actuelle: Serveur LOCAL (localhost:3000)');
