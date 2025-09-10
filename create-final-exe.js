/**
 * Script final pour créer l'installateur .exe avec nouveau dossier de sortie
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    🎯 CRÉATION INSTALLATEUR .EXE FINAL                      ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');

function main() {
    console.log('🚀 Création de l\'installateur .exe GestionPro v2.0.0');
    console.log('');
    
    console.log('📋 Configuration:');
    console.log('   • Dossier de sortie: gestionpro-installer-final');
    console.log('   • Type: NSIS Installer (.exe)');
    console.log('   • Plateforme: Windows x64');
    console.log('');
    
    // Nettoyer le nouveau dossier de sortie
    const outputDir = 'gestionpro-installer-final';
    if (fs.existsSync(outputDir)) {
        console.log('🧹 Nettoyage du dossier de sortie...');
        try {
            fs.rmSync(outputDir, { recursive: true, force: true });
            console.log('✅ Dossier nettoyé');
        } catch (error) {
            console.log('⚠️  Nettoyage partiel - continuons');
        }
    }
    
    console.log('');
    console.log('📦 GÉNÉRATION DE L\'INSTALLATEUR...');
    console.log('');
    
    try {
        // Lancer electron-builder
        execSync('npm run dist', {
            stdio: 'inherit',
            timeout: 600000 // 10 minutes
        });
        
        console.log('');
        console.log('🔍 VÉRIFICATION DU RÉSULTAT...');
        console.log('');
        
        // Chercher l'installateur
        const possiblePaths = [
            'gestionpro-installer-final/GestionPro Setup 2.0.0.exe',
            'gestionpro-installer-final/GestionPro-2.0.0-Setup.exe'
        ];
        
        let installerFound = false;
        
        for (const installerPath of possiblePaths) {
            if (fs.existsSync(installerPath)) {
                const stats = fs.statSync(installerPath);
                const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                
                console.log('🎉 INSTALLATEUR .EXE CRÉÉ AVEC SUCCÈS !');
                console.log('');
                console.log('📦 INFORMATIONS DE L\'INSTALLATEUR:');
                console.log(`   📁 Emplacement: ${path.resolve(installerPath)}`);
                console.log(`   📄 Nom du fichier: ${path.basename(installerPath)}`);
                console.log(`   📏 Taille: ${sizeMB} MB`);
                console.log(`   🕒 Date de création: ${stats.mtime.toLocaleString()}`);
                console.log('');
                
                console.log('✅ CARACTÉRISTIQUES DE L\'INSTALLATEUR:');
                console.log('   • Type: NSIS Installer Windows (.exe)');
                console.log('   • Architecture: x64 (64-bit)');
                console.log('   • Installation: Assistant graphique complet');
                console.log('   • Désinstallation: Automatique via Panneau de configuration');
                console.log('   • Raccourcis: Bureau + Menu Démarrer');
                console.log('   • Permissions: Installation utilisateur standard');
                console.log('');
                
                console.log('🔧 INSTRUCTIONS D\'INSTALLATION:');
                console.log('   1. Double-cliquez sur le fichier .exe');
                console.log('   2. Suivez l\'assistant d\'installation');
                console.log('   3. Choisissez le répertoire d\'installation (optionnel)');
                console.log('   4. Attendez la fin de l\'installation');
                console.log('   5. Lancez GestionPro depuis le menu Démarrer ou le Bureau');
                console.log('');
                
                console.log('🔑 PREMIÈRE CONNEXION:');
                console.log('   👤 Nom d\'utilisateur: proprietaire');
                console.log('   🔐 Mot de passe: admin');
                console.log('   ⚠️  IMPORTANT: Changez ce mot de passe après la première connexion !');
                console.log('');
                
                console.log('✨ FONCTIONNALITÉS INCLUSES:');
                console.log('   • 💰 Système de caisse complet avec scanner codes-barres');
                console.log('   • 👥 Gestion clients avec numéro ICE et suivi crédit');
                console.log('   • 📦 Gestion produits et stocks avec alertes');
                console.log('   • 🧾 Facturation professionnelle avec TVA (0%, 10%, 20%)');
                console.log('   • 📊 Dashboard et analytics en temps réel');
                console.log('   • 🔐 Système d\'authentification sécurisé');
                console.log('   • 🌍 Support multilingue (Français/Arabe)');
                console.log('   • 🖨️ Impression tickets et factures');
                console.log('   • 💾 Base de données SQLite intégrée');
                console.log('   • 📱 Interface moderne et responsive');
                console.log('');
                
                console.log('🎯 PRÊT POUR LA DISTRIBUTION !');
                console.log('');
                console.log('📋 PROCHAINES ÉTAPES:');
                console.log('   1. Testez l\'installateur sur une machine propre');
                console.log('   2. Vérifiez toutes les fonctionnalités après installation');
                console.log('   3. Distribuez aux utilisateurs finaux');
                console.log('   4. Fournissez les identifiants de connexion par défaut');
                console.log('');
                
                console.log('📂 EMPLACEMENT FINAL:');
                console.log(`   ${path.resolve(installerPath)}`);
                
                installerFound = true;
                break;
            }
        }
        
        if (!installerFound) {
            console.log('❌ Aucun installateur .exe trouvé');
            console.log('');
            console.log('🔍 DIAGNOSTIC:');
            
            if (fs.existsSync(outputDir)) {
                console.log(`📁 Contenu de ${outputDir}:`);
                const files = fs.readdirSync(outputDir);
                files.forEach(file => {
                    const filePath = path.join(outputDir, file);
                    const stats = fs.statSync(filePath);
                    const size = stats.isFile() ? ` (${(stats.size / 1024).toFixed(1)} KB)` : '';
                    console.log(`   • ${file}${size}`);
                });
            } else {
                console.log(`❌ Le dossier ${outputDir} n'existe pas`);
            }
            
            process.exit(1);
        }
        
    } catch (error) {
        console.log('❌ ERREUR LORS DE LA GÉNÉRATION');
        console.log('');
        console.log('🔧 SOLUTIONS POSSIBLES:');
        console.log('   1. Redémarrez votre ordinateur pour libérer les fichiers verrouillés');
        console.log('   2. Fermez tous les antivirus temporairement');
        console.log('   3. Exécutez cette commande en tant qu\'administrateur');
        console.log('   4. Vérifiez que vous avez suffisamment d\'espace disque (minimum 1 GB)');
        console.log('   5. Assurez-vous qu\'aucune instance de GestionPro n\'est en cours d\'exécution');
        console.log('');
        console.log('💡 Si le problème persiste, utilisez la version portable créée précédemment');
        console.log('   Elle se trouve dans le dossier: GestionPro-Portable-v2.0.0');
        
        process.exit(1);
    }
}

// Lancer la création
main();
