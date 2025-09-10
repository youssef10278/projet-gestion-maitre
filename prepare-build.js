const fs = require('fs');
const path = require('path');

console.log('🔧 Préparation du build...');

// Fonction pour copier récursivement
function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) {
        console.warn(`⚠️  Source n'existe pas: ${src}`);
        return;
    }

    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const stats = fs.statSync(src);

    if (stats.isDirectory()) {
        const files = fs.readdirSync(src);
        files.forEach(file => {
            copyRecursive(
                path.join(src, file),
                path.join(dest, file)
            );
        });
    } else {
        try {
            fs.copyFileSync(src, dest);
        } catch (error) {
            console.warn(`⚠️  Impossible de copier ${src}: ${error.message}`);
        }
    }
}

try {
    // Créer le dossier build s'il n'existe pas
    if (!fs.existsSync('build')) {
        fs.mkdirSync('build', { recursive: true });
    }

    // Copier les fichiers HTML racine
    const htmlFiles = ['login.html', 'activation.html', 'startup.html'];
    htmlFiles.forEach(file => {
        if (fs.existsSync(file)) {
            fs.copyFileSync(file, path.join('build', file));
            console.log(`✅ Copié: ${file}`);
        }
    });

    // Copier les fichiers JS racine
    const jsFiles = ['login.js', 'activation.js'];
    jsFiles.forEach(file => {
        if (fs.existsSync(file)) {
            fs.copyFileSync(file, path.join('build', file));
            console.log(`✅ Copié: ${file}`);
        }
    });

    // Copier le dossier src complet directement dans build (pas de sous-dossier src)
    if (fs.existsSync('src')) {
        copyRecursive('src', 'build/src');
        console.log('✅ Dossier src copié');
    }

    // Copier les fichiers de configuration nécessaires
    const configFiles = ['config.js', 'database.js', 'expenses-db.js', 'license-manager-electron.js'];
    configFiles.forEach(file => {
        if (fs.existsSync(file)) {
            fs.copyFileSync(file, path.join('build', file));
            console.log(`✅ Copié: ${file}`);
        }
    });

    // Copier la base de données
    if (fs.existsSync('database')) {
        copyRecursive('database', path.join('build', 'database'));
        console.log('✅ Base de données copiée');
    }

    console.log('🎉 Préparation du build terminée!');

} catch (error) {
    console.error('❌ Erreur lors de la préparation:', error.message);
    process.exit(1);
}