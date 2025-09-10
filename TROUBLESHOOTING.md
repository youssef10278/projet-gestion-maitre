# 🔧 Guide de Dépannage - GestionPro v2.0

## ❌ Problèmes Courants et Solutions

### **🚨 Erreur: "NODE_MODULE_VERSION" avec better-sqlite3**

#### **Symptômes**
```
Error: The module '...\better_sqlite3.node' was compiled against a different Node.js version
NODE_MODULE_VERSION 119. This version requires NODE_MODULE_VERSION 115.
```

#### **Cause**
Incompatibilité entre la version Node.js et la version Electron pour les modules natifs.

#### **Solutions (par ordre de préférence)**

##### **Solution 1: Script Automatique (Recommandé)**
```bash
# Exécuter le script de correction
fix-electron-modules.bat
```

##### **Solution 2: Commandes Manuelles**
```bash
# Reconstruction pour Electron
npm run rebuild
# ou
npx electron-rebuild
```

##### **Solution 3: Réinstallation Complète**
```bash
# Supprimer node_modules
rmdir /s /q node_modules
# Réinstaller
npm install
# Reconstruire pour Electron
npx electron-rebuild
```

##### **Solution 4: Scripts NPM**
```bash
# Utiliser les nouveaux scripts
npm run fix-modules
npm run test-tva
```

---

### **💾 Problèmes de Base de Données**

#### **Erreur: "Database is locked"**
```bash
# Fermer toutes les instances de l'application
taskkill /F /IM electron.exe
taskkill /F /IM GestionPro.exe
# Relancer
npm start
```

#### **Erreur: "Table doesn't exist"**
```bash
# Réinitialiser la base
node -e "const db = require('./database.js'); db.initDatabase();"
```

---

### **🧮 Problèmes Système TVA**

#### **Les calculs TVA ne s'affichent pas**
1. **Vérifier la migration** :
   ```bash
   node test-tva-system.js
   ```

2. **Forcer la migration** :
   ```javascript
   // Dans la console développeur (F12)
   location.reload();
   ```

3. **Vérifier les traductions** :
   - Langue française : Vérifier `src/locales/fr.json`
   - Langue arabe : Vérifier `src/locales/ar.json`

#### **Taux TVA personnalisé ne fonctionne pas**
1. Sélectionner "Personnalisé" dans le menu déroulant
2. Utiliser le point (.) comme séparateur décimal (7.5, pas 7,5)
3. Vérifier que le champ n'est pas vide

#### **Anciennes factures sans TVA**
- **Normal** : Migration automatique effectuée
- Les totaux sont recalculés avec TVA 20% par défaut
- Aucune action requise

---

### **🖥️ Problèmes d'Interface**

#### **Interface en anglais au lieu du français**
```javascript
// Dans la console développeur (F12)
localStorage.setItem('app-language', 'fr');
location.reload();
```

#### **Mode sombre/clair ne fonctionne pas**
```javascript
// Réinitialiser le thème
localStorage.removeItem('app-theme');
location.reload();
```

#### **Boutons ou éléments non cliquables**
1. Vérifier la console développeur (F12) pour les erreurs JavaScript
2. Recharger la page (Ctrl+R)
3. Redémarrer l'application

---

### **📄 Problèmes PDF/Impression**

#### **Erreur génération PDF**
1. **Vérifier les permissions** :
   - L'application a-t-elle les droits d'écriture ?
   
2. **Espace disque** :
   - Vérifier l'espace disponible

3. **Redémarrer** l'application

#### **PDF vide ou mal formaté**
1. Vérifier que la facture contient des articles
2. S'assurer que les calculs TVA sont corrects
3. Tester avec une facture simple

---

### **🔐 Problèmes de Connexion**

#### **Mot de passe oublié**
```bash
# Réinitialiser le mot de passe propriétaire
node reset-owner-password.js
```

#### **Utilisateur bloqué**
- Redémarrer l'application
- Vérifier les identifiants par défaut :
  - Utilisateur : `proprietaire`
  - Mot de passe : `admin`

---

## 🛠️ Outils de Diagnostic

### **Scripts de Test Disponibles**

```bash
# Test complet du système TVA
npm run test-tva

# Démonstration interactive
npm run demo-tva

# Correction des modules
npm run fix-modules

# Reconstruction Electron
npm run rebuild
```

### **Commandes de Diagnostic**

```bash
# Vérifier la version Node.js
node --version

# Vérifier la version Electron
npx electron --version

# Tester la base de données
node -e "const db = require('./database.js'); console.log('DB OK');"

# Lister les factures
node -e "const db = require('./database.js'); console.log(db.invoicesDB.getAll());"
```

---

## 📞 Support Technique

### **Avant de Contacter le Support**

1. ✅ **Exécuter les diagnostics** :
   ```bash
   npm run test-tva
   fix-electron-modules.bat
   ```

2. ✅ **Vérifier les logs** :
   - Console développeur (F12)
   - Terminal de lancement

3. ✅ **Noter les détails** :
   - Version Windows
   - Version Node.js
   - Message d'erreur exact
   - Étapes pour reproduire

### **Informations à Fournir**

- **Système** : Windows version, Node.js version
- **Erreur** : Message complet, capture d'écran
- **Contexte** : Que faisiez-vous quand l'erreur est survenue ?
- **Logs** : Sortie de `npm run test-tva`

### **Contact**
- 📧 **Email** : support@gestionpro.ma
- 📱 **Téléphone** : +212 XXX XXX XXX
- 🌐 **Documentation** : Consultez tous les fichiers .md du projet

---

## 🔄 Maintenance Préventive

### **Actions Recommandées**

#### **Hebdomadaire**
- Sauvegarder le fichier `database.db`
- Vérifier les mises à jour : `npm outdated`

#### **Mensuelle**
- Exécuter : `npm run test-tva`
- Nettoyer : `npm cache clean --force`

#### **Avant Mise à Jour**
- Sauvegarder complète du dossier projet
- Tester sur environnement de développement
- Exécuter tous les tests

---

**Version** : 2.0.0  
**Dernière mise à jour** : Janvier 2024  
**Support technique disponible** 24/7 🛠️
