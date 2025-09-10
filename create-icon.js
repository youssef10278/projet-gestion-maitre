const fs = require('fs');
const path = require('path');

// Créer une icône SVG simple pour GestionPro
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <!-- Fond gradient bleu professionnel -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fond arrondi -->
  <rect width="256" height="256" rx="32" ry="32" fill="url(#bgGradient)"/>
  
  <!-- Icône de gestion (graphique + engrenage) -->
  <!-- Graphique en barres -->
  <rect x="60" y="140" width="20" height="60" fill="url(#iconGradient)" rx="2"/>
  <rect x="90" y="120" width="20" height="80" fill="url(#iconGradient)" rx="2"/>
  <rect x="120" y="100" width="20" height="100" fill="url(#iconGradient)" rx="2"/>
  <rect x="150" y="110" width="20" height="90" fill="url(#iconGradient)" rx="2"/>
  
  <!-- Engrenage -->
  <g transform="translate(180,80)">
    <circle cx="0" cy="0" r="25" fill="url(#iconGradient)"/>
    <circle cx="0" cy="0" r="15" fill="none" stroke="#1e40af" stroke-width="3"/>
    <!-- Dents de l'engrenage -->
    <rect x="-3" y="-30" width="6" height="10" fill="url(#iconGradient)"/>
    <rect x="-3" y="20" width="6" height="10" fill="url(#iconGradient)"/>
    <rect x="-30" y="-3" width="10" height="6" fill="url(#iconGradient)"/>
    <rect x="20" y="-3" width="10" height="6" fill="url(#iconGradient)"/>
    <rect x="-21" y="-21" width="8" height="6" fill="url(#iconGradient)" transform="rotate(45)"/>
    <rect x="13" y="-21" width="8" height="6" fill="url(#iconGradient)" transform="rotate(-45)"/>
    <rect x="-21" y="15" width="8" height="6" fill="url(#iconGradient)" transform="rotate(-45)"/>
    <rect x="13" y="15" width="8" height="6" fill="url(#iconGradient)" transform="rotate(45)"/>
  </g>
  
  <!-- Texte GestionPro -->
  <text x="128" y="240" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
        text-anchor="middle" fill="white">GestionPro</text>
</svg>`;

// Créer le dossier build s'il n'existe pas
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

// Sauvegarder l'icône SVG
const iconPath = path.join(buildDir, 'icon.svg');
fs.writeFileSync(iconPath, svgIcon);

console.log('✅ Icône SVG créée:', iconPath);

// Créer aussi une version PNG simple (pour les systèmes qui ne supportent pas SVG)
const pngIcon = `iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAA==`;

// Note: Pour une vraie application, vous devriez utiliser un outil comme sharp ou canvas pour créer une vraie PNG
// Ici on crée juste un placeholder
const placeholderPng = Buffer.from(pngIcon, 'base64');
fs.writeFileSync(path.join(buildDir, 'icon.png'), placeholderPng);

console.log('✅ Icône PNG placeholder créée');
console.log('📁 Dossier build préparé pour Electron Builder');
