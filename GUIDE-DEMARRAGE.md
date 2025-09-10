# 🚀 Guide de Démarrage - GestionPro

## Démarrage Normal

### Méthode 1 : Script automatique (Recommandé)
```bash
# Windows (Batch)
start-app.bat

# Windows (PowerShell)
.\start-app.ps1
```

### Méthode 2 : Commandes manuelles
```bash
# Méthode standard
npm start

# Méthode alternative
npx electron .
```

## 🔧 Résolution des Problèmes Courants

### Erreur : "electron n'est pas reconnu"

**Cause :** Electron n'est pas installé ou les modules sont corrompus

**Solutions :**

1. **Réinstaller les dépendances :**
   ```bash
   npm install
   ```

2. **Si l'erreur persiste, utiliser npx :**
   ```bash
   npx electron .
   ```

3. **Réinstallation complète :**
   ```bash
   # Supprimer node_modules (fermer l'app d'abord)
   Remove-Item -Recurse -Force node_modules
   
   # Réinstaller
   npm install
   ```

### Erreur : "EBUSY: resource busy or locked"

**Cause :** Un processus Electron est déjà en cours

**Solutions :**

1. **Fermer tous les processus Electron :**
   ```powershell
   Get-Process -Name "electron" | Stop-Process -Force
   ```

2. **Redémarrer l'ordinateur** (solution radicale mais efficace)

3. **Utiliser le Gestionnaire des tâches :**
   - Ouvrir le Gestionnaire des tâches (Ctrl+Shift+Esc)
   - Chercher "electron.exe" ou "GestionPro"
   - Terminer tous les processus liés

### Erreur : "Cannot find module"

**Cause :** Modules manquants ou corrompus

**Solution :**
```bash
# Nettoyer le cache npm
npm cache clean --force

# Réinstaller
npm install

# Rebuilder les modules natifs
npm run rebuild
```

### L'application ne se lance pas

**Vérifications :**

1. **Vérifier Node.js :**
   ```bash
   node --version
   npm --version
   ```

2. **Vérifier les fichiers principaux :**
   - `main.js` existe
   - `package.json` est valide
   - `database/` existe

3. **Vérifier les permissions :**
   - Exécuter en tant qu'administrateur si nécessaire

## 🛠️ Maintenance Préventive

### Nettoyage Régulier
```bash
# Nettoyer le cache npm
npm cache clean --force

# Rebuilder les modules natifs
npm run rebuild
```

### Mise à Jour des Dépendances
```bash
# Vérifier les mises à jour
npm outdated

# Mettre à jour (avec prudence)
npm update
```

## 📋 Scripts Disponibles

| Script | Description |
|--------|-------------|
| `npm start` | Démarrage normal |
| `npm run dev` | Mode développement avec rechargement |
| `npm run rebuild` | Reconstruction des modules natifs |
| `npm run fix-modules` | Réparation complète des modules |
| `npx electron .` | Démarrage direct avec npx |

## 🆘 Support d'Urgence

Si aucune solution ne fonctionne :

1. **Sauvegarder la base de données :**
   ```bash
   # Copier le dossier database/
   cp -r database/ database_backup/
   ```

2. **Réinstallation complète :**
   ```bash
   # Supprimer node_modules
   Remove-Item -Recurse -Force node_modules
   
   # Supprimer package-lock.json
   Remove-Item package-lock.json
   
   # Réinstaller
   npm install
   ```

3. **Vérifier l'intégrité des fichiers :**
   - Comparer avec une version de sauvegarde
   - Vérifier que tous les fichiers sont présents

## 📞 Contact

En cas de problème persistant, contacter le support technique avec :
- Version de Windows
- Version de Node.js (`node --version`)
- Message d'erreur complet
- Étapes qui ont mené au problème

---

**Note :** Ce guide couvre les problèmes les plus courants. Pour des problèmes spécifiques, consulter les logs d'erreur détaillés.
