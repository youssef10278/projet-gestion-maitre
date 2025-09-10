# 🏪 Système de Gestion Commercial - GestionPro

## 📋 Description

Système de gestion commercial complet développé avec Electron, permettant la gestion des ventes, clients, produits, stocks et finances pour les petites et moyennes entreprises.

## ✨ Fonctionnalités Principales

### 💰 **Caisse & Ventes**
- Interface de caisse intuitive avec scanner de codes-barres
- Gestion des paiements (Comptant, Chèque, Crédit)
- Affichage du crédit client en temps réel avec code couleur
- Mode modification de ventes avec workflow complet
- Support multi-utilisateurs avec authentification

### 👥 **Gestion Clients**
- Base de données clients complète
- Suivi des crédits et dettes
- Système de paiement de crédits
- Filtrage et recherche avancée

### 📦 **Gestion Produits & Stock**
- Catalogue produits avec catégories
- Gestion des stocks avec alertes de rupture
- Ajustement des prix et stocks
- Support codes-barres

### 📊 **Historique & Rapports**
- Historique complet des ventes avec méthode de paiement
- Export Excel avec formatage professionnel
- Filtrage par date, client, produit
- Suivi des modifications de ventes

### 📈 **Dashboard & Analytics**
- Statistiques de ventes en temps réel
- Produits les plus rentables et vendus
- Aperçu des performances
- Insights et recommandations

### 🧾 **Facturation Professionnelle avec TVA**
- **Système TVA complet** avec calculs automatiques
- **Multi-taux TVA** : 0% (exonéré), 10% (réduit), 20% (normal), personnalisé
- **Calculs en temps réel** : Sous-total HT, TVA, Total TTC
- **Conformité fiscale** marocaine et internationale
- **Génération de factures** professionnelles avec détail TVA
- **Numérotation automatique** et export PDF
- **Migration automatique** des anciennes factures

## 🛠️ Technologies Utilisées

- **Frontend**: HTML5, CSS3, JavaScript ES6+, Tailwind CSS
- **Backend**: Node.js, Electron
- **Base de données**: SQLite avec Better-SQLite3
- **Sécurité**: Bcrypt pour le hachage des mots de passe
- **Internationalisation**: Support Français/Arabe

## 🚀 Installation

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone [URL_DU_REPO]
cd projet-gestion-maitre
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Compiler les styles CSS**
```bash
npm run build-css
```

4. **Lancer l'application**
```bash
npm start
```

## 📁 Structure du Projet

```
projet-gestion-maitre/
├── src/                    # Code source frontend
│   ├── js/                # Scripts JavaScript
│   ├── css/               # Styles CSS
│   ├── locales/           # Fichiers de traduction
│   └── *.html             # Pages de l'application
├── database.js            # Gestion base de données
├── main.js                # Processus principal Electron
├── preload.js             # Script de préchargement
└── package.json           # Configuration npm
```

## 🔐 Sécurité

- Authentification utilisateur avec mots de passe hachés
- Rôles utilisateurs (Propriétaire, Vendeur)
- Validation des données côté serveur
- Protection contre l'injection SQL

## 🌍 Internationalisation

L'application supporte :
- **Français** (par défaut)
- **Arabe** avec support RTL

## 📝 Utilisation

### Premier Démarrage
1. L'application créera automatiquement la base de données
2. Un compte propriétaire par défaut sera créé
3. Configurez vos informations d'entreprise dans les paramètres

### Workflow Typique
1. **Ajouter des produits** dans le module Produits
2. **Enregistrer des clients** dans le module Clients
3. **Effectuer des ventes** via la Caisse
4. **Consulter l'historique** et générer des rapports
5. **Gérer les crédits** dans le module Crédits

## 🔧 Configuration

### Base de Données
- SQLite automatiquement initialisée au premier lancement
- Sauvegarde recommandée régulière du fichier `database.db`

### Paramètres Entreprise
Configurables via l'interface :
- Nom de l'entreprise
- Adresse et contacts
- Logo (optionnel)

## 📊 Fonctionnalités Avancées

### 🧾 Système TVA Professionnel
- **Calculs automatiques** : HT → TVA → TTC
- **Taux multiples** : 0%, 10%, 20%, personnalisé
- **Interface intuitive** avec sélecteur de taux
- **Factures PDF** conformes avec détail TVA
- **Migration transparente** des anciennes données
- **Conformité fiscale** marocaine

### Affichage Crédit Client
- **Vert** : Client à jour (✅ À jour)
- **Rouge** : Client endetté (🔴 Montant MAD)
- **Bleu** : Client de passage

### Export Excel
- Formatage professionnel multi-colonnes
- Inclusion de toutes les données de vente
- Compatible avec Excel et LibreOffice

### Mode Modification
- Workflow en 2 étapes : Produits → Paiement
- Possibilité de modifier produits ET méthode de paiement
- Traçabilité complète des modifications

## 🤝 Contribution

Ce projet est développé pour un usage commercial spécifique. Pour toute suggestion ou amélioration, veuillez créer une issue.

## 📄 Licence

Propriétaire - Tous droits réservés

## 📞 Support

Pour toute question ou support technique, contactez l'équipe de développement.

---

**Version**: 1.0.0  
**Dernière mise à jour**: Juin 2025  
**Développé avec** ❤️ **pour les entreprises marocaines**
