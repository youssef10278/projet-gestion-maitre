/**
 * Script de validation avant la génération de l'installateur
 * Vérifie que tous les composants nécessaires sont présents
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validation des composants avant génération de l\'installateur...');
console.log('═'.repeat(70));

let validationPassed = true;
const errors = [];
const warnings = [];

// Fichiers critiques requis
const criticalFiles = [
    'main.js',
    'package.json',
    'preload.js',
    'database.js',
    'src/index.html',
    'src/caisse.html',
    'src/clients.html',
    'src/products.html',
    'src/invoices.html',
    'src/css/output.css'
];

// Dossiers requis
const requiredDirectories = [
    'src',
    'src/js',
    'src/css',
    'src/locales',
    'src/assets',
    'database'
];

// Modules Node.js critiques
const criticalModules = [
    'electron',
    'better-sqlite3',
    'bcrypt',
    'axios'
];

console.log('📁 Vérification des fichiers critiques...');
criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`   ✅ ${file}`);
    } else {
        console.log(`   ❌ ${file} - MANQUANT`);
        errors.push(`Fichier critique manquant: ${file}`);
        validationPassed = false;
    }
});

console.log('\n📂 Vérification des dossiers requis...');
requiredDirectories.forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`   ✅ ${dir}/`);
    } else {
        console.log(`   ❌ ${dir}/ - MANQUANT`);
        errors.push(`Dossier requis manquant: ${dir}`);
        validationPassed = false;
    }
});

console.log('\n📦 Vérification des modules Node.js...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
criticalModules.forEach(module => {
    const isInDeps = packageJson.dependencies && packageJson.dependencies[module];
    const isInDevDeps = packageJson.devDependencies && packageJson.devDependencies[module];
    const moduleExists = fs.existsSync(`node_modules/${module}`);
    
    if ((isInDeps || isInDevDeps) && moduleExists) {
        console.log(`   ✅ ${module}`);
    } else {
        console.log(`   ❌ ${module} - MANQUANT OU NON INSTALLÉ`);
        errors.push(`Module critique manquant: ${module}`);
        validationPassed = false;
    }
});

console.log('\n🎨 Vérification des ressources...');

// Vérifier les traductions
const localesDir = 'src/locales';
if (fs.existsSync(localesDir)) {
    const localeFiles = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
    if (localeFiles.length > 0) {
        console.log(`   ✅ Traductions (${localeFiles.length} fichiers)`);
        localeFiles.forEach(file => {
            console.log(`      • ${file}`);
        });
    } else {
        warnings.push('Aucun fichier de traduction trouvé');
        console.log('   ⚠️  Aucun fichier de traduction');
    }
}

// Vérifier les assets
const assetsDir = 'src/assets';
if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    console.log(`   ✅ Assets (${assetFiles.length} fichiers)`);
    
    // Vérifier l'icône spécifiquement
    if (assetFiles.includes('icon.ico')) {
        console.log('      ✅ icon.ico présent');
    } else {
        warnings.push('Icône icon.ico manquante - icône par défaut sera utilisée');
        console.log('      ⚠️  icon.ico manquant');
    }
} else {
    warnings.push('Dossier assets manquant');
}

console.log('\n🗄️  Vérification de la base de données...');
if (fs.existsSync('database.db')) {
    const stats = fs.statSync('database.db');
    console.log(`   ✅ database.db (${Math.round(stats.size / 1024)} KB)`);
} else {
    warnings.push('Base de données principale manquante - sera créée au premier lancement');
    console.log('   ⚠️  database.db manquant');
}

console.log('\n⚙️  Vérification de la configuration...');

// Vérifier package.json
if (packageJson.main) {
    console.log(`   ✅ Point d'entrée: ${packageJson.main}`);
} else {
    errors.push('Point d\'entrée manquant dans package.json');
    validationPassed = false;
}

if (packageJson.build) {
    console.log('   ✅ Configuration de build présente');
    
    if (packageJson.build.appId) {
        console.log(`      • App ID: ${packageJson.build.appId}`);
    }
    
    if (packageJson.build.productName) {
        console.log(`      • Nom du produit: ${packageJson.build.productName}`);
    }
} else {
    errors.push('Configuration de build manquante dans package.json');
    validationPassed = false;
}

console.log('\n🔧 Vérification des scripts...');
const requiredScripts = ['start', 'dist'];
requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
        console.log(`   ✅ Script "${script}": ${packageJson.scripts[script]}`);
    } else {
        errors.push(`Script requis manquant: ${script}`);
        validationPassed = false;
    }
});

console.log('\n📊 RÉSUMÉ DE LA VALIDATION');
console.log('═'.repeat(70));

if (validationPassed) {
    console.log('🎉 VALIDATION RÉUSSIE !');
    console.log('✅ Tous les composants critiques sont présents');
    console.log('✅ L\'installateur peut être généré en toute sécurité');
    
    if (warnings.length > 0) {
        console.log('\n⚠️  AVERTISSEMENTS:');
        warnings.forEach(warning => {
            console.log(`   • ${warning}`);
        });
    }
    
    console.log('\n🚀 PRÊT POUR LA GÉNÉRATION');
    console.log('   Exécutez: npm run dist');
    console.log('   Ou utilisez: build-installateur-complet.bat');
    
} else {
    console.log('❌ VALIDATION ÉCHOUÉE');
    console.log('🔧 Erreurs à corriger:');
    errors.forEach(error => {
        console.log(`   • ${error}`);
    });
    
    if (warnings.length > 0) {
        console.log('\n⚠️  Avertissements:');
        warnings.forEach(warning => {
            console.log(`   • ${warning}`);
        });
    }
    
    console.log('\n🛠️  ACTIONS RECOMMANDÉES:');
    console.log('   1. Corriger les erreurs listées ci-dessus');
    console.log('   2. Exécuter: npm install');
    console.log('   3. Relancer cette validation');
    console.log('   4. Générer l\'installateur une fois validé');
}

console.log('\n' + '═'.repeat(70));
console.log(`Validation terminée - ${new Date().toLocaleString()}`);

// Code de sortie pour les scripts batch
process.exit(validationPassed ? 0 : 1);
