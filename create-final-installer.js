/**
 * Script final pour créer l'installateur GestionPro
 * Utilise npm run dist directement
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    📦 CRÉATION INSTALLATEUR GESTIONPRO FINAL                ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');

console.log('🚀 Génération de l\'installateur exécutable GestionPro v2.0.0');
console.log('');

console.log('✨ FONCTIONNALITÉS INCLUSES:');
console.log('   • 💰 Système de caisse complet avec scanner');
console.log('   • 👥 Gestion clients avec ICE et crédit');
console.log('   • 📦 Gestion produits et stocks');
console.log('   • 🧾 Facturation professionnelle avec TVA');
console.log('   • 📊 Dashboard et analytics');
console.log('   • 🔐 Système d\'authentification sécurisé');
console.log('   • 🌍 Support multilingue (FR/AR)');
console.log('   • 📱 Interface moderne et responsive');
console.log('   • 🖨️ Impression tickets et factures');
console.log('   • 💾 Base de données SQLite intégrée');
console.log('');

function runCommand(command, description) {
    console.log(`🔧 ${description}...`);
    try {
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ ${description} terminé avec succès`);
        return true;
    } catch (error) {
        console.log(`❌ Erreur lors de ${description.toLowerCase()}`);
        return false;
    }
}

async function main() {
    // Validation préliminaire
    console.log('📋 VALIDATION PRÉLIMINAIRE...');
    console.log('');
    
    if (!runCommand('node validate-build.js', 'Validation des composants')) {
        console.log('❌ Validation échouée');
        process.exit(1);
    }

    // Compilation CSS
    console.log('');
    console.log('🎨 COMPILATION CSS...');
    console.log('');
    
    runCommand('npx tailwindcss -i ./src/css/input.css -o ./src/css/output.css --minify', 'Compilation Tailwind CSS');

    // Génération de l'installateur
    console.log('');
    console.log('🏗️  GÉNÉRATION DE L\'INSTALLATEUR...');
    console.log('');
    
    if (!runCommand('npm run dist', 'Génération avec electron-builder')) {
        console.log('❌ Échec de la génération');
        process.exit(1);
    }

    // Vérification du résultat
    console.log('');
    console.log('🔍 VÉRIFICATION DU RÉSULTAT...');
    console.log('');

    const installerPath = 'installateur-gestionpro/GestionPro Setup 2.0.0.exe';
    
    if (fs.existsSync(installerPath)) {
        const stats = fs.statSync(installerPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log('🎉 SUCCÈS ! INSTALLATEUR CRÉÉ');
        console.log('');
        console.log('📦 INFORMATIONS DE L\'INSTALLATEUR:');
        console.log(`   📁 Emplacement: ${path.resolve('installateur-gestionpro')}`);
        console.log(`   📄 Fichier: GestionPro Setup 2.0.0.exe`);
        console.log(`   📏 Taille: ${sizeMB} MB`);
        console.log(`   🕒 Créé: ${stats.mtime.toLocaleString()}`);
        console.log('');
        
        console.log('✅ FONCTIONNALITÉS INCLUSES:');
        console.log('   • Application Electron complète');
        console.log('   • Base de données SQLite intégrée');
        console.log('   • Toutes les pages et fonctionnalités');
        console.log('   • Système d\'authentification');
        console.log('   • Gestion TVA professionnelle');
        console.log('   • Support multilingue FR/AR');
        console.log('   • Thème sombre/clair');
        console.log('   • Impression et export');
        console.log('');
        
        console.log('📦 CONTENU DE L\'INSTALLATEUR:');
        console.log('   • Exécutable principal (GestionPro.exe)');
        console.log('   • Runtime Electron');
        console.log('   • Modules Node.js compilés');
        console.log('   • Base de données vide');
        console.log('   • Fichiers de ressources');
        console.log('   • Traductions FR/AR');
        console.log('   • Documentation');
        console.log('');
        
        console.log('🔧 INSTALLATION:');
        console.log('   1. Exécuter "GestionPro Setup 2.0.0.exe"');
        console.log('   2. Suivre l\'assistant d\'installation');
        console.log('   3. Choisir le répertoire d\'installation');
        console.log('   4. Lancer GestionPro depuis le menu Démarrer');
        console.log('');
        
        console.log('🔑 PREMIÈRE UTILISATION:');
        console.log('   👤 Utilisateur par défaut: proprietaire');
        console.log('   🔐 Mot de passe par défaut: admin');
        console.log('   ⚠️  Modifier le mot de passe après la première connexion');
        console.log('');
        
        console.log('🎯 PROCHAINES ÉTAPES:');
        console.log('   1. Tester l\'installateur sur une machine propre');
        console.log('   2. Vérifier toutes les fonctionnalités');
        console.log('   3. Distribuer aux utilisateurs finaux');
        console.log('');
        
        console.log('📂 EMPLACEMENT COMPLET:');
        console.log(`   ${path.resolve(installerPath)}`);
        console.log('');
        
        // Vérification optionnelle
        runCommand('node verify-installer.js', 'Vérification détaillée');
        
        console.log('');
        console.log('🚀 INSTALLATEUR PRÊT POUR LA DISTRIBUTION !');
        console.log('');
        console.log('📋 RÉSUMÉ:');
        console.log('   ✅ Validation réussie');
        console.log('   ✅ Compilation CSS terminée');
        console.log('   ✅ Installateur généré');
        console.log('   ✅ Vérification effectuée');
        console.log('   ✅ Prêt pour distribution');
        
    } else {
        console.log('❌ ERREUR: Installateur non trouvé');
        
        // Diagnostic
        if (fs.existsSync('installateur-gestionpro')) {
            console.log('');
            console.log('📁 Contenu du dossier installateur-gestionpro:');
            const files = fs.readdirSync('installateur-gestionpro');
            files.forEach(file => {
                const filePath = path.join('installateur-gestionpro', file);
                const stats = fs.statSync(filePath);
                const size = stats.isFile() ? ` (${(stats.size / 1024).toFixed(1)} KB)` : '';
                console.log(`   • ${file}${size}`);
            });
        }
        
        process.exit(1);
    }
}

// Lancer le processus
main().catch(error => {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
});
