/**
 * Vérificateur d'encodage UTF-8 pour tous les fichiers du projet
 * Analyse l'encodage des fichiers sources et détecte les problèmes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 === VÉRIFICATION ENCODAGE UTF-8 ===\n');

// Configuration
const projectRoot = __dirname;
const filesToCheck = [
    // Fichiers HTML
    'src/index.html',
    'src/caisse.html',
    'src/products.html',
    'src/clients.html',
    'src/settings.html',
    'src/backup.html',
    
    // Fichiers JavaScript
    'src/js/caisse.js',
    'src/js/products.js',
    'src/js/backup.js',
    'src/js/layout.js',
    'src/js/i18n.js',
    'main.js',
    'preload.js',
    'database.js',
    
    // Fichiers de traduction
    'src/locales/fr.json',
    'src/locales/ar.json',
    
    // Fichiers de configuration
    'package.json',
    '.gitignore',
    
    // Fichiers CSS
    'src/css/input.css',
    'src/css/styles.css'
];

// Fonction pour détecter l'encodage d'un fichier
function detectEncoding(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return { encoding: 'FILE_NOT_FOUND', isUTF8: false, error: 'Fichier non trouvé' };
        }

        // Lire le fichier en tant que buffer
        const buffer = fs.readFileSync(filePath);
        
        // Vérifier le BOM UTF-8
        const hasBOM = buffer.length >= 3 && 
                      buffer[0] === 0xEF && 
                      buffer[1] === 0xBB && 
                      buffer[2] === 0xBF;

        // Essayer de décoder en UTF-8
        let content;
        try {
            content = buffer.toString('utf8');
        } catch (error) {
            return { encoding: 'INVALID_UTF8', isUTF8: false, error: 'Impossible de décoder en UTF-8' };
        }

        // Vérifier si le contenu re-encodé en UTF-8 donne le même buffer
        const reencoded = Buffer.from(content, 'utf8');
        const isValidUTF8 = buffer.equals(reencoded);

        // Analyser le contenu
        const stats = {
            size: buffer.length,
            lines: content.split('\n').length,
            hasAccents: /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(content),
            hasSpecialChars: /[^\x00-\x7F]/.test(content),
            hasBOM: hasBOM
        };

        return {
            encoding: isValidUTF8 ? 'UTF-8' : 'UNKNOWN',
            isUTF8: isValidUTF8,
            stats: stats,
            content: content.substring(0, 200) // Aperçu
        };

    } catch (error) {
        return { encoding: 'ERROR', isUTF8: false, error: error.message };
    }
}

// Fonction pour vérifier un fichier spécifique
function checkFile(relativePath) {
    const fullPath = path.join(projectRoot, relativePath);
    const result = detectEncoding(fullPath);
    
    console.log(`📄 ${relativePath}`);
    console.log(`   Chemin: ${fullPath}`);
    
    if (result.error) {
        console.log(`   ❌ Erreur: ${result.error}`);
        return false;
    }
    
    console.log(`   Encodage: ${result.encoding}`);
    console.log(`   UTF-8 valide: ${result.isUTF8 ? '✅ OUI' : '❌ NON'}`);
    
    if (result.stats) {
        console.log(`   Taille: ${result.stats.size} bytes`);
        console.log(`   Lignes: ${result.stats.lines}`);
        console.log(`   BOM UTF-8: ${result.stats.hasBOM ? '✅ OUI' : '❌ NON'}`);
        console.log(`   Caractères accentués: ${result.stats.hasAccents ? '✅ OUI' : '❌ NON'}`);
        console.log(`   Caractères spéciaux: ${result.stats.hasSpecialChars ? '✅ OUI' : '❌ NON'}`);
        
        if (result.content) {
            const preview = result.content.replace(/\n/g, '\\n').substring(0, 100);
            console.log(`   Aperçu: "${preview}..."`);
        }
    }
    
    console.log('');
    return result.isUTF8;
}

// Vérification des fichiers de traduction (critique)
function checkTranslationFiles() {
    console.log('🌐 === VÉRIFICATION FICHIERS DE TRADUCTION ===\n');
    
    const translationFiles = ['src/locales/fr.json', 'src/locales/ar.json'];
    let allValid = true;
    
    translationFiles.forEach(file => {
        const fullPath = path.join(projectRoot, file);
        
        if (!fs.existsSync(fullPath)) {
            console.log(`❌ ${file}: Fichier non trouvé`);
            allValid = false;
            return;
        }
        
        try {
            // Lire et parser le JSON
            const content = fs.readFileSync(fullPath, 'utf8');
            const json = JSON.parse(content);
            
            console.log(`✅ ${file}:`);
            console.log(`   Taille: ${content.length} caractères`);
            console.log(`   Clés: ${Object.keys(json).length}`);
            
            // Vérifier quelques clés avec accents
            const testKeys = ['main_menu_products', 'backup_restore_title', 'export_description'];
            testKeys.forEach(key => {
                if (json[key]) {
                    console.log(`   "${key}": "${json[key].substring(0, 50)}..."`);
                }
            });
            
        } catch (error) {
            console.log(`❌ ${file}: Erreur - ${error.message}`);
            allValid = false;
        }
        
        console.log('');
    });
    
    return allValid;
}

// Vérification des fichiers JavaScript avec caractères spéciaux
function checkJavaScriptFiles() {
    console.log('📜 === VÉRIFICATION FICHIERS JAVASCRIPT ===\n');
    
    const jsFiles = [
        'src/js/caisse.js',
        'src/js/products.js',
        'src/js/backup.js',
        'main.js',
        'database.js'
    ];
    
    let allValid = true;
    
    jsFiles.forEach(file => {
        const result = checkFile(file);
        if (!result) allValid = false;
    });
    
    return allValid;
}

// Vérification des fichiers HTML
function checkHTMLFiles() {
    console.log('🌐 === VÉRIFICATION FICHIERS HTML ===\n');
    
    const htmlFiles = [
        'src/index.html',
        'src/caisse.html',
        'src/backup.html'
    ];
    
    let allValid = true;
    
    htmlFiles.forEach(file => {
        const result = checkFile(file);
        if (!result) allValid = false;
    });
    
    return allValid;
}

// Test de caractères spéciaux
function testSpecialCharacters() {
    console.log('🔤 === TEST CARACTÈRES SPÉCIAUX ===\n');
    
    const testStrings = [
        'Français: éàçùôî',
        'Arabe: العربية',
        'Symboles: €£¥©®™',
        'Codes-barres: CODE:xyz789',
        'Accents: café, naïve, coûter'
    ];
    
    testStrings.forEach(testStr => {
        console.log(`Test: "${testStr}"`);
        
        // Encoder en UTF-8
        const buffer = Buffer.from(testStr, 'utf8');
        console.log(`   UTF-8 bytes: [${Array.from(buffer).map(b => '0x' + b.toString(16).toUpperCase()).join(', ')}]`);
        
        // Décoder et vérifier
        const decoded = buffer.toString('utf8');
        const isIdentical = testStr === decoded;
        console.log(`   Décodage: "${decoded}"`);
        console.log(`   Identique: ${isIdentical ? '✅ OUI' : '❌ NON'}`);
        console.log('');
    });
}

// Vérification de l'environnement système
function checkSystemEnvironment() {
    console.log('💻 === ENVIRONNEMENT SYSTÈME ===\n');
    
    console.log(`Node.js version: ${process.version}`);
    console.log(`Plateforme: ${process.platform}`);
    console.log(`Architecture: ${process.arch}`);
    console.log(`Encodage par défaut: ${process.stdout.encoding || 'utf8'}`);
    
    // Variables d'environnement liées à l'encodage
    const envVars = ['LANG', 'LC_ALL', 'LC_CTYPE', 'CHCP'];
    envVars.forEach(varName => {
        const value = process.env[varName];
        console.log(`${varName}: ${value || 'Non définie'}`);
    });
    
    console.log('');
}

// Fonction principale
function main() {
    console.log('🎯 Vérification de l\'encodage UTF-8 de tous les fichiers du projet\n');
    
    // Vérifier l'environnement
    checkSystemEnvironment();
    
    // Test des caractères spéciaux
    testSpecialCharacters();
    
    // Vérifier les fichiers par catégorie
    const translationsOK = checkTranslationFiles();
    const jsFilesOK = checkJavaScriptFiles();
    const htmlFilesOK = checkHTMLFiles();
    
    // Vérification complète de tous les fichiers
    console.log('📋 === VÉRIFICATION COMPLÈTE ===\n');
    
    let totalFiles = 0;
    let validFiles = 0;
    
    filesToCheck.forEach(file => {
        totalFiles++;
        const isValid = checkFile(file);
        if (isValid) validFiles++;
    });
    
    // Résumé final
    console.log('📊 === RÉSUMÉ FINAL ===\n');
    
    console.log(`Fichiers vérifiés: ${totalFiles}`);
    console.log(`Fichiers UTF-8 valides: ${validFiles}`);
    console.log(`Taux de réussite: ${Math.round((validFiles / totalFiles) * 100)}%`);
    console.log('');
    
    if (validFiles === totalFiles) {
        console.log('🎉 TOUS LES FICHIERS SONT EN UTF-8 VALIDE !');
        console.log('✅ Votre projet est correctement encodé');
        console.log('✅ Les caractères spéciaux s\'afficheront correctement');
        console.log('✅ Les traductions françaises et arabes fonctionneront');
    } else {
        console.log('⚠️ CERTAINS FICHIERS ONT DES PROBLÈMES D\'ENCODAGE');
        console.log(`❌ ${totalFiles - validFiles} fichier(s) problématique(s)`);
        console.log('🔧 Recommandations:');
        console.log('   • Ouvrir les fichiers problématiques dans un éditeur UTF-8');
        console.log('   • Sauvegarder explicitement en UTF-8');
        console.log('   • Vérifier les paramètres de votre éditeur');
    }
    
    console.log('');
    console.log('💡 Pour tester avec des codes-barres réels:');
    console.log('   • Ouvrir test-encodage-codes-barres.html');
    console.log('   • Scanner des codes avec votre appareil');
    console.log('   • Vérifier que tout s\'affiche correctement');
}

// Exécution
main();
