const fs = require('fs');
const path = require('path');

console.log('🔍 Validation de l\'installateur GestionPro');
console.log('=' .repeat(50));

function validerInstallateur() {
    const distDir = './dist-installer';
    
    // Vérifier que le dossier existe
    if (!fs.existsSync(distDir)) {
        console.error('❌ Le dossier dist-installer n\'existe pas');
        console.log('💡 Lancez d\'abord la génération avec: npm run generer-installateur');
        return false;
    }
    
    // Lister les fichiers
    const files = fs.readdirSync(distDir);
    console.log('\n📁 Fichiers trouvés:');
    files.forEach(file => {
        const filePath = path.join(distDir, file);
        const stats = fs.statSync(filePath);
        const size = stats.isFile() ? `(${(stats.size / (1024 * 1024)).toFixed(2)} MB)` : '(dossier)';
        console.log(`  📄 ${file} ${size}`);
    });
    
    // Vérifier l'installateur principal
    const installerFile = files.find(file => file.endsWith('.exe'));
    if (!installerFile) {
        console.error('\n❌ Aucun fichier .exe trouvé');
        return false;
    }
    
    console.log(`\n✅ Installateur principal: ${installerFile}`);
    
    // Vérifier la taille
    const installerPath = path.join(distDir, installerFile);
    const stats = fs.statSync(installerPath);
    const sizeInMB = stats.size / (1024 * 1024);
    
    if (sizeInMB < 50) {
        console.warn(`⚠️  Taille suspicieusement petite: ${sizeInMB.toFixed(2)} MB`);
    } else if (sizeInMB > 500) {
        console.warn(`⚠️  Taille importante: ${sizeInMB.toFixed(2)} MB`);
    } else {
        console.log(`✅ Taille normale: ${sizeInMB.toFixed(2)} MB`);
    }
    
    // Vérifier les métadonnées
    const yamlFile = files.find(file => file.endsWith('.yml'));
    if (yamlFile) {
        console.log(`✅ Métadonnées: ${yamlFile}`);
    }
    
    console.log('\n🎯 RÉSUMÉ DE VALIDATION:');
    console.log(`📦 Installateur: ${installerFile}`);
    console.log(`📏 Taille: ${sizeInMB.toFixed(2)} MB`);
    console.log(`📅 Créé: ${stats.mtime.toLocaleString()}`);
    
    console.log('\n🚀 PRÊT POUR DISTRIBUTION!');
    console.log('\n📋 PROCHAINES ÉTAPES:');
    console.log('1. Testez l\'installateur sur une machine propre');
    console.log('2. Vérifiez que l\'application se lance correctement');
    console.log('3. Testez la désinstallation');
    console.log('4. Distribuez le fichier .exe');
    
    return true;
}

if (require.main === module) {
    validerInstallateur();
}

module.exports = { validerInstallateur };
