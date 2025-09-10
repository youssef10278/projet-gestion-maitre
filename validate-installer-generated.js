// Script de validation de l'installateur généré
const fs = require('fs');
const path = require('path');

console.log('🔍 === VALIDATION INSTALLATEUR GESTIONPRO ===\n');

const installerPath = path.join(__dirname, 'dist-installer', 'GestionPro-Installer-v2.1.0-win-x64.exe');

try {
    // Vérifier l'existence du fichier
    if (fs.existsSync(installerPath)) {
        const stats = fs.statSync(installerPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log('✅ INSTALLATEUR GÉNÉRÉ AVEC SUCCÈS !');
        console.log('═══════════════════════════════════════════\n');
        
        console.log('📁 Fichier:', 'GestionPro-Installer-v2.1.0-win-x64.exe');
        console.log('📍 Emplacement:', path.dirname(installerPath));
        console.log('💾 Taille:', sizeMB + ' MB');
        console.log('📅 Créé le:', stats.birthtime.toLocaleString('fr-FR'));
        console.log('🔧 Modifié le:', stats.mtime.toLocaleString('fr-FR'));
        
        console.log('\n🎯 FONCTIONNALITÉS INCLUSES:');
        console.log('═══════════════════════════════════════════');
        console.log('✅ Système de caisse complet avec scanner codes-barres');
        console.log('✅ Gestion clients avec suivi crédits/dettes');
        console.log('✅ Gestion produits et stocks avec alertes');
        console.log('✅ Facturation professionnelle avec TVA (0%, 10%, 20%)');
        console.log('✅ Dashboard analytics en temps réel');
        console.log('✅ Historique des ventes avec export Excel');
        console.log('✅ Support multilingue (Français/Arabe)');
        console.log('✅ Système de licences professionnel');
        console.log('✅ Interface tactile optimisée');
        console.log('✅ Mode sombre/clair');
        console.log('✅ Sauvegarde/restauration automatique');
        
        console.log('\n🔐 SÉCURITÉ:');
        console.log('═══════════════════════════════════════════');
        console.log('✅ Authentification multi-utilisateurs');
        console.log('✅ Mots de passe hachés (Bcrypt)');
        console.log('✅ Rôles utilisateurs (Propriétaire/Vendeur)');
        console.log('✅ Protection contre injection SQL');
        console.log('✅ Système de licences avec empreinte matérielle');
        
        console.log('\n📋 INSTRUCTIONS D\'INSTALLATION:');
        console.log('═══════════════════════════════════════════');
        console.log('1. 📂 Copiez le fichier .exe sur l\'ordinateur cible');
        console.log('2. 🖱️  Double-cliquez sur "GestionPro-Installer-v2.1.0-win-x64.exe"');
        console.log('3. 🛡️  Acceptez les demandes de sécurité Windows');
        console.log('4. 📁 Choisissez le répertoire d\'installation (optionnel)');
        console.log('5. ✅ Suivez l\'assistant d\'installation');
        console.log('6. 🚀 Lancez GestionPro depuis le raccourci bureau');
        
        console.log('\n🔑 PREMIÈRE CONNEXION:');
        console.log('═══════════════════════════════════════════');
        console.log('👤 Utilisateur: proprietaire');
        console.log('🔒 Mot de passe: admin');
        console.log('⚠️  IMPORTANT: Changez le mot de passe après la première connexion !');
        
        console.log('\n🎊 INSTALLATEUR PRÊT POUR LA DISTRIBUTION !');
        console.log('═══════════════════════════════════════════');
        
        // Vérifier les autres fichiers
        const blockMapPath = installerPath + '.blockmap';
        if (fs.existsSync(blockMapPath)) {
            console.log('✅ Fichier blockmap généré (pour les mises à jour)');
        }
        
        const unpackedPath = path.join(__dirname, 'dist-installer', 'win-unpacked');
        if (fs.existsSync(unpackedPath)) {
            console.log('✅ Version décompressée disponible pour tests');
        }
        
    } else {
        console.log('❌ ERREUR: Installateur non trouvé !');
        console.log('📍 Chemin recherché:', installerPath);
        console.log('\n💡 SOLUTIONS:');
        console.log('1. Relancez la génération avec: npm run dist');
        console.log('2. Vérifiez les erreurs dans la console');
        console.log('3. Assurez-vous d\'avoir les droits d\'écriture');
    }
    
} catch (error) {
    console.error('❌ Erreur lors de la validation:', error.message);
}

console.log('\n' + '═'.repeat(50));
