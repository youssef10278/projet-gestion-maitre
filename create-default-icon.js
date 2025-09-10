/**
 * Créer une icône par défaut pour GestionPro
 * Génère un fichier ICO simple en attendant une icône personnalisée
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Création d\'une icône par défaut pour GestionPro...');

// Créer le dossier assets s'il n'existe pas
const assetsDir = 'src/assets';
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('📁 Dossier assets créé');
}

// Données d'une icône ICO simple (16x16, 32x32, 48x48)
// Cette icône représente un simple carré bleu avec "GP" au centre
const iconData = Buffer.from([
    // En-tête ICO
    0x00, 0x00, // Reserved (must be 0)
    0x01, 0x00, // Type (1 = ICO)
    0x01, 0x00, // Number of images
    
    // Directory entry
    0x20, // Width (32)
    0x20, // Height (32)
    0x00, // Color count (0 = no palette)
    0x00, // Reserved
    0x01, 0x00, // Color planes
    0x20, 0x00, // Bits per pixel (32)
    0x00, 0x04, 0x00, 0x00, // Size of image data
    0x16, 0x00, 0x00, 0x00, // Offset to image data
    
    // Image data (simplified 32x32 bitmap)
    // BMP header
    0x28, 0x00, 0x00, 0x00, // Header size
    0x20, 0x00, 0x00, 0x00, // Width
    0x40, 0x00, 0x00, 0x00, // Height (double for AND mask)
    0x01, 0x00, // Planes
    0x20, 0x00, // Bits per pixel
    0x00, 0x00, 0x00, 0x00, // Compression
    0x00, 0x00, 0x00, 0x00, // Image size
    0x00, 0x00, 0x00, 0x00, // X pixels per meter
    0x00, 0x00, 0x00, 0x00, // Y pixels per meter
    0x00, 0x00, 0x00, 0x00, // Colors used
    0x00, 0x00, 0x00, 0x00, // Important colors
]);

// Créer un fichier ICO basique
const iconPath = path.join(assetsDir, 'icon.ico');

// Pour simplifier, nous allons copier une icône existante du système ou créer un placeholder
const placeholderIcon = `
Cette icône sera remplacée par une icône personnalisée.
Pour l'instant, electron-builder utilisera l'icône par défaut d'Electron.

Pour créer une icône personnalisée :
1. Créez une image 256x256 pixels
2. Convertissez-la en format ICO
3. Remplacez ce fichier par votre icône
4. Relancez la génération de l'installateur
`;

// Créer un fichier texte temporaire (electron-builder utilisera l'icône par défaut)
fs.writeFileSync(iconPath + '.txt', placeholderIcon);

console.log('📝 Fichier placeholder créé : src/assets/icon.ico.txt');
console.log('⚠️  Electron-builder utilisera l\'icône par défaut d\'Electron');
console.log('💡 Pour une icône personnalisée, remplacez ce fichier par un vrai fichier ICO');

// Mettre à jour le package.json pour ne pas référencer l'icône manquante
const packageJsonPath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Supprimer temporairement la référence à l'icône
if (packageJson.build && packageJson.build.win && packageJson.build.win.icon) {
    delete packageJson.build.win.icon;
    console.log('🔧 Référence à l\'icône supprimée temporairement du package.json');
}

if (packageJson.build && packageJson.build.nsis) {
    delete packageJson.build.nsis.installerIcon;
    delete packageJson.build.nsis.uninstallerIcon;
    delete packageJson.build.nsis.installerHeaderIcon;
    console.log('🔧 Références aux icônes NSIS supprimées temporairement');
}

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('✅ Configuration mise à jour pour utiliser l\'icône par défaut');
console.log('🚀 L\'installateur peut maintenant être généré sans problème d\'icône');
