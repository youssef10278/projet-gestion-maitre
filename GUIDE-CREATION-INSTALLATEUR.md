# 📦 Guide de Création d'Installateur - GestionPro v2.0.0

## 🎯 Vue d'ensemble

Ce guide vous explique comment créer un installateur exécutable pour **GestionPro** avec toutes les fonctionnalités actuelles.

## ✨ Fonctionnalités Incluses dans l'Installateur

### **💰 Système de Caisse Complet**
- Point de vente avec scanner de codes-barres
- Gestion multi-paiements (Comptant, Chèque, Crédit)
- Affichage crédit client en temps réel
- Mode modification de ventes

### **👥 Gestion Clients**
- Base de données clients avec ICE
- Suivi des crédits et dettes
- Système de paiement de crédits
- Filtrage et recherche avancée

### **📦 Gestion Produits & Stocks**
- Catalogue avec catégories et codes-barres
- Gestion multi-prix (détail, gros, carton)
- Alertes de rupture de stock
- Ajustement des prix et stocks

### **🧾 Facturation Professionnelle avec TVA**
- Système TVA complet (0%, 10%, 20%, personnalisé)
- Calculs automatiques HT → TVA → TTC
- Factures PDF conformes à la réglementation marocaine
- Numérotation automatique et export

### **📊 Dashboard & Analytics**
- Statistiques de ventes en temps réel
- Produits les plus rentables
- Insights et recommandations
- Export Excel avec formatage professionnel

### **🔐 Sécurité & Authentification**
- Mots de passe hachés avec Bcrypt
- Rôles utilisateurs (Propriétaire/Vendeur)
- Session management sécurisé
- Protection contre l'injection SQL

### **🌍 Support Multilingue**
- Français (par défaut)
- Arabe avec support RTL complet
- Interface adaptative selon la langue

## 🛠️ Méthodes de Création d'Installateur

### **Méthode 1 : Script Automatique (Recommandé)**

#### **Windows (Batch)**
```batch
# Exécuter dans l'invite de commande
build-installer-final.bat
```

#### **Cross-platform (Node.js)**
```bash
# Validation préalable
node validate-build.js

# Génération complète
node create-final-installer.js

# Ou génération avec nettoyage
node generate-installer-clean.js
```

### **Méthode 2 : Commandes Manuelles**

#### **Étape 1 : Validation**
```bash
node validate-build.js
```

#### **Étape 2 : Compilation CSS**
```bash
npx tailwindcss -i ./src/css/input.css -o ./src/css/output.css --minify
```

#### **Étape 3 : Génération**
```bash
npm run dist
```

#### **Étape 4 : Vérification**
```bash
node verify-installer.js
```

## 🔧 Résolution des Problèmes

### **Problème : Fichiers Verrouillés**
```
Erreur: Le processus ne peut pas accéder au fichier car ce fichier est utilisé par un autre processus
```

**Solutions :**
1. **Fermer tous les processus Electron**
   ```bash
   taskkill /F /IM electron.exe /T
   taskkill /F /IM GestionPro.exe /T
   ```

2. **Supprimer les dossiers de build**
   ```bash
   rmdir /s /q installateur-gestionpro
   rmdir /s /q gestionpro-v2-final
   ```

3. **Nettoyer le cache npm**
   ```bash
   npm cache clean --force
   ```

4. **Redémarrer l'ordinateur** (si nécessaire)

### **Problème : Modules Natifs**
```
Erreur: Module natif incompatible
```

**Solutions :**
```bash
npm run rebuild
# ou
npm run fix-modules
```

### **Problème : Icône Manquante**
```
Avertissement: icon.ico manquant
```

**Solution :**
- L'installateur utilisera l'icône par défaut d'Electron
- Pour une icône personnalisée, placez `icon.ico` dans `src/assets/`

## 📁 Structure de l'Installateur Généré

```
installateur-gestionpro/
├── GestionPro Setup 2.0.0.exe    # Installateur NSIS principal
├── latest.yml                     # Métadonnées de version
├── GestionPro Setup 2.0.0.exe.blockmap  # Checksum
└── win-unpacked/                  # Version décompressée
    ├── GestionPro.exe            # Exécutable principal
    ├── resources/                # Ressources de l'application
    │   ├── app.asar             # Archive de l'application
    │   └── ...                  # Autres ressources
    └── *.dll                    # Bibliothèques système
```

## 🎯 Caractéristiques de l'Installateur

### **Type d'Installateur**
- **Format** : NSIS (Nullsoft Scriptable Install System)
- **Plateforme** : Windows x64
- **Taille** : ~150-200 MB
- **Installation** : Assistant graphique

### **Fonctionnalités d'Installation**
- ✅ Choix du répertoire d'installation
- ✅ Création de raccourcis (Bureau + Menu Démarrer)
- ✅ Désinstallateur automatique
- ✅ Vérifications système
- ✅ Gestion des privilèges

### **Configuration Post-Installation**
- ✅ Base de données SQLite initialisée
- ✅ Dossiers de données créés
- ✅ Paramètres par défaut configurés
- ✅ Raccourcis fonctionnels

## 🔑 Première Utilisation

### **Connexion Initiale**
```
👤 Utilisateur : proprietaire
🔐 Mot de passe : admin
```

⚠️ **Important** : Changez ce mot de passe lors de la première connexion !

### **Configuration Recommandée**
1. **Modifier le mot de passe** administrateur
2. **Configurer les informations** de l'entreprise
3. **Paramétrer la TVA** selon votre activité
4. **Ajouter les premiers produits**
5. **Créer les comptes utilisateurs** supplémentaires

## 📊 Validation de l'Installateur

### **Tests Recommandés**
1. **Installation sur machine propre**
2. **Vérification de toutes les fonctionnalités**
3. **Test des permissions utilisateur**
4. **Validation de la base de données**
5. **Test d'impression et export**

### **Checklist de Distribution**
- [ ] Installateur généré sans erreur
- [ ] Taille appropriée (~150-200 MB)
- [ ] Test d'installation réussi
- [ ] Toutes les fonctionnalités opérationnelles
- [ ] Documentation incluse
- [ ] Identifiants par défaut fonctionnels

## 🚀 Distribution

### **Méthodes de Distribution**
1. **Téléchargement direct** : Hébergement sur serveur web
2. **Support physique** : USB, DVD
3. **Réseau local** : Partage réseau d'entreprise
4. **Email** : Envoi sécurisé (attention à la taille)

### **Recommandations de Sécurité**
- ✅ Vérifier l'intégrité avec checksums
- ✅ Scanner avec antivirus avant distribution
- ✅ Tester sur machines de test
- ✅ Documenter la procédure d'installation

## 📞 Support Technique

### **Logs et Diagnostic**
- **Logs de build** : Console de génération
- **Logs d'installation** : Journaux Windows
- **Logs d'application** : `%APPDATA%\GestionPro\logs\`

### **Ressources d'Aide**
- **Documentation** : Guides inclus dans le projet
- **Scripts de test** : Validation automatique
- **Fichiers de configuration** : package.json, build/

---

**GestionPro v2.0.0** - Installateur Professionnel  
© 2025 - Solution complète de gestion commerciale
