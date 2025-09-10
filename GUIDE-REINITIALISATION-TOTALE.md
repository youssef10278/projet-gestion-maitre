# 🗑️ Guide de Réinitialisation Totale - GestionPro

## 🎯 Vue d'ensemble

La fonction de **Réinitialisation Totale** a été complètement repensée pour supprimer **ABSOLUMENT TOUTES** les données du système, y compris les **devis**, **bons de livraison**, **utilisateurs**, et **paramètres entreprise**.

## ⚠️ ATTENTION - CHANGEMENT MAJEUR

### **Avant (Ancienne Version)**
- ❌ Supprimait seulement : produits, clients, ventes, fournisseurs, dépenses
- ✅ Conservait : utilisateurs, paramètres entreprise, devis, factures, bons de livraison

### **Maintenant (Nouvelle Version)**
- 🗑️ **SUPPRIME TOUT** : Toutes les données sans exception
- ⚠️ **AUCUNE CONSERVATION** : Seule la structure de base reste

## 📋 Données Supprimées (Liste Complète)

### **📦 Données Transactionnelles**
- ✅ Toutes les ventes (`sales`, `sale_items`)
- ✅ Toutes les factures (`invoices`, `invoice_items`)
- ✅ **Tous les devis** (`quotes`, `quote_items`)
- ✅ Tous les retours (`returns`, `return_items`)
- ✅ Tous les paiements de crédits (`credit_payments`)

### **📋 Bons de Livraison (NOUVEAU)**
- ✅ **Toutes les commandes fournisseurs** (`supplier_orders`, `supplier_order_items`)
- ✅ **Tous les bons de livraison** (`supplier_deliveries`, `supplier_delivery_items`)

### **📦 Données Produits et Stock**
- ✅ Tous les produits (`products`)
- ✅ Tous les lots de stock (`stock_lots`)
- ✅ Tous les mouvements de stock (`stock_movements`)
- ✅ Tous les ajustements de stock (`stock_adjustments`)
- ✅ Paramètres de valorisation (`product_valuation_settings`)

### **👥 Données Clients et Fournisseurs**
- ✅ Tous les clients (`clients`)
- ✅ Tous les fournisseurs (`suppliers`)

### **💰 Données Financières**
- ✅ Toutes les dépenses (`expenses`)

### **🎨 Templates et Préférences**
- ✅ Tous les templates de factures (`invoice_templates`)
- ✅ Préférences utilisateur templates (`user_template_preferences`)
- ✅ Toutes les préférences utilisateur (`user_preferences`)

### **⚙️ Système (NOUVEAU - SUPPRIMÉ MAINTENANT)**
- ✅ **TOUS LES UTILISATEURS** (`users`)
- ✅ **TOUS LES PARAMÈTRES ENTREPRISE** (`settings`)

### **🔢 Compteurs**
- ✅ **Tous les compteurs auto-increment** (`sqlite_sequence`)

## 🚀 Comment Utiliser

### **1. Accès à la Fonction**
1. Ouvrir **Paramètres** → **Données**
2. Descendre jusqu'à la **Zone de Danger**
3. Cliquer sur **🗑️ SUPPRIMER TOUT**

### **2. Processus de Confirmation**
1. **Modal d'avertissement** avec liste complète des données
2. **Checkbox de confirmation** obligatoire
3. **Double confirmation** avant exécution

### **3. Exécution**
- ⏱️ **Durée** : 2-5 secondes selon la taille de la base
- 🔄 **Transaction** : Toutes les suppressions en une seule transaction
- 📊 **Logs** : Progression détaillée dans la console

### **4. Après Réinitialisation**
- 🔄 **Redémarrage automatique** de l'application
- 📋 **Confirmation** avec détails des données supprimées
- 🏁 **État final** : Base de données vierge avec structure uniquement

## 🧪 Test et Validation

### **Script de Test Inclus**
```bash
node test-reinitialisation-totale.js
```

**Ce script vérifie :**
- ✅ État de toutes les tables avant/après
- ✅ Comptage des enregistrements
- ✅ Vérification des compteurs auto-increment
- ✅ Confirmation de la réinitialisation totale

### **Résultat Attendu**
```
✅ RÉINITIALISATION TOTALE CONFIRMÉE !
   Toutes les tables sont vides
   La base de données a été correctement réinitialisée
```

## 🔧 Implémentation Technique

### **Fichiers Modifiés**
1. **`main.js`** - Fonction `system:factory-reset` complètement réécrite
2. **`src/js/settings.js`** - Modal de confirmation mis à jour
3. **`src/settings.html`** - Interface utilisateur mise à jour

### **Requêtes SQL Exécutées**
```sql
-- 1. DONNÉES TRANSACTIONNELLES
DELETE FROM sale_items;
DELETE FROM sales;
DELETE FROM invoice_items;
DELETE FROM invoices;
DELETE FROM quote_items;
DELETE FROM quotes;
DELETE FROM return_items;
DELETE FROM returns;
DELETE FROM credit_payments;

-- 2. DONNÉES PRODUITS ET STOCK
DELETE FROM products;
DELETE FROM stock_lots;
DELETE FROM stock_movements;
DELETE FROM stock_adjustments;
DELETE FROM product_valuation_settings;

-- 3. DONNÉES CLIENTS ET FOURNISSEURS
DELETE FROM clients;
DELETE FROM suppliers;
DELETE FROM supplier_order_items;
DELETE FROM supplier_orders;
DELETE FROM supplier_delivery_items;
DELETE FROM supplier_deliveries;

-- 4. DÉPENSES
DELETE FROM expenses;

-- 5. TEMPLATES ET PRÉFÉRENCES
DELETE FROM invoice_templates;
DELETE FROM user_template_preferences;
DELETE FROM user_preferences;

-- 6. UTILISATEURS (NOUVEAU)
DELETE FROM users;

-- 7. PARAMÈTRES ENTREPRISE (NOUVEAU)
DELETE FROM settings;

-- 8. COMPTEURS AUTO-INCREMENT
DELETE FROM sqlite_sequence;
```

## ⚠️ Avertissements Importants

### **🚨 IRRÉVERSIBLE**
- **Aucune sauvegarde automatique** n'est créée
- **Aucun moyen de récupération** après exécution
- **Recommandation** : Faire une sauvegarde manuelle avant utilisation

### **🔄 Redémarrage Requis**
- L'application **redémarre automatiquement** après réinitialisation
- **Nécessaire** pour réinitialiser tous les caches et états

### **👤 Perte d'Accès**
- **Tous les utilisateurs** sont supprimés
- **Nécessité de recréer** un compte administrateur
- **Perte de tous les paramètres** de l'entreprise

## 💡 Cas d'Usage

### **Quand Utiliser**
- 🏭 **Nouvelle installation** pour un nouveau client
- 🧪 **Tests et développement** avec données propres
- 🔄 **Changement d'entreprise** utilisant la même installation
- 🧹 **Nettoyage complet** avant archivage

### **Quand NE PAS Utiliser**
- ❌ **En production** avec données importantes
- ❌ **Sans sauvegarde** préalable
- ❌ **Par erreur** ou sans réflexion
- ❌ **Pour nettoyer partiellement** (utiliser les suppressions individuelles)

## 🎯 Conclusion

La **Réinitialisation Totale** est maintenant une fonction **complète et puissante** qui remet véritablement le système à zéro. Elle répond parfaitement au besoin exprimé de supprimer **TOUT**, y compris les devis, bons de livraison, utilisateurs et paramètres entreprise.

**⚠️ À utiliser avec précaution et uniquement en connaissance de cause !**
