/**
 * Script de vérification de l'installateur généré
 * Valide que l'installateur contient tous les composants nécessaires
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de l\'installateur généré...');
console.log('═'.repeat(60));

const installerDir = 'dist-installer';
const expectedFiles = [
    'GestionPro Setup 2.0.0.exe',
    'latest.yml',
    'GestionPro Setup 2.0.0.exe.blockmap'
];

let verificationPassed = true;
const issues = [];

// Vérifier que le dossier d'installateur existe
if (!fs.existsSync(installerDir)) {
    console.log('❌ Dossier dist-installer manquant');
    console.log('🔧 L\'installateur n\'a pas été généré correctement');
    process.exit(1);
}

console.log('📁 Vérification du contenu de l\'installateur...');

// Lister tous les fichiers dans le dossier
const actualFiles = fs.readdirSync(installerDir);
console.log(`   📂 Fichiers trouvés: ${actualFiles.length}`);

// Vérifier les fichiers attendus
expectedFiles.forEach(file => {
    if (actualFiles.includes(file)) {
        const filePath = path.join(installerDir, file);
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`   ✅ ${file} (${sizeMB} MB)`);
    } else {
        console.log(`   ❌ ${file} - MANQUANT`);
        issues.push(`Fichier manquant: ${file}`);
        verificationPassed = false;
    }
});

// Vérifier la taille de l'installateur principal
const mainInstaller = path.join(installerDir, 'GestionPro Setup 2.0.0.exe');
if (fs.existsSync(mainInstaller)) {
    const stats = fs.statSync(mainInstaller);
    const sizeMB = stats.size / (1024 * 1024);
    
    console.log(`\n📏 Analyse de l'installateur principal:`);
    console.log(`   📦 Taille: ${sizeMB.toFixed(2)} MB`);
    
    if (sizeMB < 50) {
        console.log('   ⚠️  Taille suspicieusement petite (< 50 MB)');
        issues.push('Installateur potentiellement incomplet - taille trop petite');
    } else if (sizeMB > 500) {
        console.log('   ⚠️  Taille importante (> 500 MB)');
        issues.push('Installateur volumineux - vérifier les dépendances incluses');
    } else {
        console.log('   ✅ Taille appropriée');
    }
    
    // Vérifier la date de création
    const creationTime = stats.mtime;
    const now = new Date();
    const ageMinutes = (now - creationTime) / (1000 * 60);
    
    console.log(`   🕒 Créé: ${creationTime.toLocaleString()}`);
    console.log(`   ⏱️  Âge: ${ageMinutes.toFixed(1)} minutes`);
    
    if (ageMinutes > 60) {
        console.log('   ⚠️  Installateur ancien (> 1 heure)');
        issues.push('Installateur potentiellement obsolète');
    }
}

// Vérifier le dossier win-unpacked si présent
const unpackedDir = path.join(installerDir, 'win-unpacked');
if (fs.existsSync(unpackedDir)) {
    console.log('\n📂 Vérification du contenu décompressé...');
    
    const unpackedFiles = fs.readdirSync(unpackedDir);
    console.log(`   📁 Fichiers décompressés: ${unpackedFiles.length}`);
    
    // Vérifier les fichiers critiques dans le build décompressé
    const criticalUnpackedFiles = [
        'GestionPro.exe',
        'resources'
    ];
    
    criticalUnpackedFiles.forEach(file => {
        if (unpackedFiles.includes(file)) {
            console.log(`   ✅ ${file}`);
        } else {
            console.log(`   ❌ ${file} - MANQUANT`);
            issues.push(`Fichier critique manquant dans le build: ${file}`);
            verificationPassed = false;
        }
    });
    
    // Vérifier le dossier resources
    const resourcesDir = path.join(unpackedDir, 'resources');
    if (fs.existsSync(resourcesDir)) {
        const resourceFiles = fs.readdirSync(resourcesDir);
        console.log(`   📦 Ressources: ${resourceFiles.length} fichiers`);
        
        if (resourceFiles.includes('app.asar')) {
            const asarPath = path.join(resourcesDir, 'app.asar');
            const asarStats = fs.statSync(asarPath);
            const asarSizeMB = (asarStats.size / (1024 * 1024)).toFixed(2);
            console.log(`      ✅ app.asar (${asarSizeMB} MB)`);
        } else {
            console.log('      ❌ app.asar manquant');
            issues.push('Archive principale app.asar manquante');
            verificationPassed = false;
        }
    }
}

// Vérifier le fichier de métadonnées
const latestYml = path.join(installerDir, 'latest.yml');
if (fs.existsSync(latestYml)) {
    console.log('\n📋 Vérification des métadonnées...');
    try {
        const content = fs.readFileSync(latestYml, 'utf8');
        console.log('   ✅ latest.yml lisible');
        
        if (content.includes('GestionPro Setup 2.0.0.exe')) {
            console.log('   ✅ Référence correcte à l\'installateur');
        } else {
            console.log('   ⚠️  Référence d\'installateur incorrecte');
            issues.push('Métadonnées incohérentes dans latest.yml');
        }
    } catch (error) {
        console.log('   ❌ Erreur de lecture de latest.yml');
        issues.push('Fichier de métadonnées corrompu');
        verificationPassed = false;
    }
}

console.log('\n🔐 Vérifications de sécurité...');

// Vérifier que l'installateur n'est pas vide
if (fs.existsSync(mainInstaller)) {
    const buffer = fs.readFileSync(mainInstaller, { start: 0, end: 1024 });
    if (buffer.includes(Buffer.from('MZ'))) {
        console.log('   ✅ Signature PE valide');
    } else {
        console.log('   ❌ Signature PE invalide');
        issues.push('Installateur corrompu - signature PE manquante');
        verificationPassed = false;
    }
}

console.log('\n📊 RÉSUMÉ DE LA VÉRIFICATION');
console.log('═'.repeat(60));

if (verificationPassed && issues.length === 0) {
    console.log('🎉 VÉRIFICATION RÉUSSIE !');
    console.log('✅ L\'installateur est valide et prêt à être distribué');
    console.log('✅ Tous les composants critiques sont présents');
    console.log('✅ La taille et la structure sont correctes');
    
    console.log('\n📦 INFORMATIONS DE DISTRIBUTION:');
    console.log(`   📁 Emplacement: ${path.resolve(installerDir)}`);
    console.log('   📋 Fichier principal: GestionPro Setup 2.0.0.exe');
    console.log('   🎯 Plateforme cible: Windows x64');
    console.log('   📝 Type: NSIS Installer');
    
    console.log('\n🚀 PRÊT POUR LA DISTRIBUTION');
    console.log('   • Testez l\'installation sur une machine propre');
    console.log('   • Vérifiez toutes les fonctionnalités après installation');
    console.log('   • Distribuez aux utilisateurs finaux');
    
} else {
    console.log('❌ VÉRIFICATION ÉCHOUÉE');
    
    if (issues.length > 0) {
        console.log('🔧 Problèmes détectés:');
        issues.forEach(issue => {
            console.log(`   • ${issue}`);
        });
    }
    
    console.log('\n🛠️  ACTIONS RECOMMANDÉES:');
    console.log('   1. Corriger les problèmes listés ci-dessus');
    console.log('   2. Régénérer l\'installateur');
    console.log('   3. Relancer cette vérification');
    console.log('   4. Tester sur une machine propre avant distribution');
}

console.log('\n' + '═'.repeat(60));
console.log(`Vérification terminée - ${new Date().toLocaleString()}`);

// Code de sortie pour les scripts
process.exit(verificationPassed && issues.length === 0 ? 0 : 1);
