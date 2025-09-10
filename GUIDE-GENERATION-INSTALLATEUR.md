# 📦 Guide de Génération d'Installateur GestionPro v2.1.0

## 🎯 Vue d'ensemble

Ce guide vous explique comment générer un fichier `.exe` installable pour votre application GestionPro. L'installateur créé sera professionnel et permettra une installation facile sur n'importe quel PC Windows.

## 🔧 Prérequis

### Logiciels requis :
- **Node.js** (version 16 ou supérieure) - [Télécharger ici](https://nodejs.org/)
- **npm** (inclus avec Node.js)
- **Windows** (pour générer un installateur .exe)

### Vérification des prérequis :
```bash
node --version    # Doit afficher v16.x.x ou supérieur
npm --version     # Doit afficher une version
```

## 🚀 Méthodes de génération

### Méthode 1 : Script automatique (Recommandé)

1. **Double-cliquez** sur le fichier `GENERER-INSTALLATEUR.bat`
2. **Suivez les instructions** à l'écran
3. **Attendez** la fin de la génération (peut prendre 5-10 minutes)
4. **Récupérez** votre installateur dans le dossier `dist-installer`

### Méthode 2 : Ligne de commande

```bash
# Ouvrir un terminal dans le dossier du projet
cd projet-gestion-maitre

# Lancer la génération
npm run generer-installateur
```

### Méthode 3 : Étapes manuelles

```bash
# 1. Installer les dépendances
npm install

# 2. Construire le CSS
npm run build-css

# 3. Reconstruire les modules natifs
npm run rebuild

# 4. Générer l'installateur
npm run dist
```

## 📁 Structure des fichiers générés

Après génération, vous trouverez dans le dossier `dist-installer` :

```
dist-installer/
├── GestionPro-Installer-v2.1.0-win-x64.exe  ← Votre installateur
├── latest.yml                                ← Métadonnées
└── win-unpacked/                             ← Version portable (optionnel)
```

## 🎯 Caractéristiques de l'installateur

### ✅ Fonctionnalités incluses :
- **Installation guidée** avec interface graphique
- **Choix du répertoire** d'installation
- **Raccourcis automatiques** (Bureau + Menu Démarrer)
- **Désinstallation propre** via Panneau de configuration
- **Base de données** incluse et configurée
- **Toutes les dépendances** intégrées
- **Pas besoin d'internet** pour l'installation

### 📋 Informations techniques :
- **Taille** : ~150-200 MB
- **Architecture** : Windows x64
- **Format** : NSIS Installer
- **Signature** : Non signé (peut déclencher SmartScreen)

## 🔧 Résolution des problèmes

### ❌ Erreur "Node.js not found"
**Solution :** Installez Node.js depuis https://nodejs.org/

### ❌ Erreur "npm install failed"
**Solutions :**
```bash
# Nettoyer le cache
npm cache clean --force

# Supprimer node_modules et réinstaller
rmdir /s node_modules
npm install
```

### ❌ Erreur "electron-rebuild failed"
**Solutions :**
```bash
# Réinstaller electron-rebuild
npm install electron-rebuild --save-dev

# Forcer la reconstruction
npm run fix-modules
```

### ❌ Erreur "Permission denied"
**Solution :** Exécutez le terminal en tant qu'administrateur

### ❌ L'installateur est détecté comme virus
**Explication :** C'est normal pour les exécutables non signés
**Solutions :**
- Ajoutez une exception dans votre antivirus
- Signez le code avec un certificat (pour distribution commerciale)

## 📦 Distribution de l'installateur

### Pour un usage interne :
1. **Copiez** le fichier `.exe` sur une clé USB
2. **Transférez** sur l'ordinateur cible
3. **Exécutez** en tant qu'administrateur
4. **Suivez** l'assistant d'installation

### Pour une distribution large :
1. **Signez** le code avec un certificat valide
2. **Testez** sur plusieurs configurations Windows
3. **Créez** une documentation d'installation
4. **Distribuez** via votre canal préféré

## 🎯 Conseils d'optimisation

### Réduire la taille :
- Supprimez les fichiers de développement inutiles
- Optimisez les images et ressources
- Excluez les modules non utilisés

### Améliorer la sécurité :
- Signez le code avec un certificat
- Activez la vérification d'intégrité
- Ajoutez une licence d'utilisation

### Personnaliser l'installateur :
- Modifiez l'icône dans `build/icon.ico`
- Personnalisez les textes dans `package.json`
- Ajoutez un logo d'entreprise

## 📞 Support

En cas de problème :
1. **Vérifiez** ce guide
2. **Consultez** les logs d'erreur
3. **Testez** sur une machine propre
4. **Documentez** le problème pour support

---

**🎉 Félicitations !** Vous avez maintenant un installateur professionnel pour GestionPro v2.1.0 !
