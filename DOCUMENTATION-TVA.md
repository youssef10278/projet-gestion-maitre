# 📋 Documentation Système TVA - GestionPro v2.0

## 🎯 Vue d'ensemble

Le système de facturation de GestionPro v2.0 inclut maintenant un **système de TVA complet et professionnel** qui permet de gérer différents taux de TVA selon la législation marocaine et internationale.

## ✨ Fonctionnalités TVA

### **Taux de TVA Supportés**
- **0%** - Exonération de TVA (produits/services exonérés)
- **10%** - Taux réduit (certains produits de première nécessité)
- **20%** - Taux normal (taux standard au Maroc)
- **Personnalisé** - Taux libre (pour cas spéciaux)

### **Calculs Automatiques**
- ✅ **Sous-total HT** calculé automatiquement
- ✅ **Montant TVA** calculé selon le taux sélectionné
- ✅ **Total TTC** (Toutes Taxes Comprises)
- ✅ **Mise à jour en temps réel** lors des modifications

## 🏗️ Architecture Technique

### **Base de Données**
Nouvelles colonnes ajoutées à la table `invoices` :
```sql
subtotal_ht REAL NOT NULL DEFAULT 0     -- Sous-total Hors Taxes
tva_rate REAL NOT NULL DEFAULT 20       -- Taux de TVA en %
tva_amount REAL NOT NULL DEFAULT 0      -- Montant de la TVA
total_amount REAL NOT NULL              -- Total TTC (existant)
```

### **Migration Automatique**
- ✅ **Migration transparente** des anciennes factures
- ✅ **Calcul rétroactif** de la TVA pour les factures existantes
- ✅ **Compatibilité** avec l'ancien système

## 🎨 Interface Utilisateur

### **Section TVA dans l'Éditeur de Facture**
```
┌─────────────────────────────────┐
│ Sous-total HT    │   1000.00 MAD │
├─────────────────────────────────┤
│ Taux TVA (%)     │ [20% ▼]       │
│ Montant TVA      │    200.00 MAD │
├─────────────────────────────────┤
│ Total TTC        │   1200.00 MAD │
└─────────────────────────────────┘
```

### **Sélecteur de Taux TVA**
- **Menu déroulant** avec taux prédéfinis
- **Option personnalisée** pour taux spéciaux
- **Mise à jour automatique** des calculs

## 📄 Factures PDF

### **Nouveau Format avec TVA**
Les factures PDF générées incluent maintenant :
- **Sous-total HT** clairement affiché
- **Détail de la TVA** avec taux et montant
- **Total TTC** mis en évidence
- **Présentation professionnelle** conforme aux standards

### **Exemple de Totaux PDF**
```
Sous-total HT        1000.00 MAD
TVA (20%)             200.00 MAD
─────────────────────────────────
TOTAL TTC            1200.00 MAD
```

## 🔧 Utilisation

### **Créer une Facture avec TVA**

1. **Ajouter les articles** à la facture
2. **Sélectionner le taux TVA** approprié :
   - 0% pour les produits exonérés
   - 10% pour les produits à taux réduit
   - 20% pour le taux normal
   - "Personnalisé" pour un taux spécifique
3. **Vérifier les calculs** automatiques
4. **Sauvegarder** la facture

### **Taux TVA Personnalisé**
1. Sélectionner **"Personnalisé"** dans le menu
2. Saisir le **taux désiré** (ex: 7.5)
3. Les calculs se mettent à jour **automatiquement**

## 📊 Exemples de Calculs

### **Exemple 1 : TVA 20% (Taux Normal)**
```
Articles:
- Produit A: 2 × 300.00 = 600.00 MAD
- Produit B: 1 × 400.00 = 400.00 MAD

Sous-total HT:  1000.00 MAD
TVA (20%):       200.00 MAD
Total TTC:      1200.00 MAD
```

### **Exemple 2 : TVA 10% (Taux Réduit)**
```
Articles:
- Produit C: 1 × 500.00 = 500.00 MAD

Sous-total HT:   500.00 MAD
TVA (10%):        50.00 MAD
Total TTC:       550.00 MAD
```

### **Exemple 3 : Exonération TVA (0%)**
```
Articles:
- Service D: 2 × 400.00 = 800.00 MAD

Sous-total HT:   800.00 MAD
TVA (0%):          0.00 MAD
Total TTC:       800.00 MAD
```

## 🔄 Compatibilité

### **Anciennes Factures**
- ✅ **Affichage correct** des anciennes factures
- ✅ **Migration automatique** des totaux
- ✅ **Calcul rétroactif** de la TVA (supposée à 20%)
- ✅ **Pas de perte de données**

### **API et Intégrations**
- ✅ **Nouvelles propriétés** dans les réponses API
- ✅ **Compatibilité descendante** maintenue
- ✅ **Validation des données** renforcée

## 🧪 Tests

### **Exécuter les Tests TVA**
```bash
node test-tva-system.js
```

### **Tests Inclus**
- ✅ Création factures avec différents taux
- ✅ Calculs automatiques
- ✅ Stockage et récupération
- ✅ Migration des données
- ✅ Génération PDF

## 🌍 Internationalisation

### **Traductions Ajoutées**
**Français :**
- `subtotal_ht_label`: "Sous-total HT"
- `tva_rate_label`: "Taux TVA (%)"
- `tva_amount_label`: "Montant TVA"
- `total_ttc_label`: "Total TTC"

**Arabe :**
- `subtotal_ht_label`: "المجموع الفرعي بدون ضريبة"
- `tva_rate_label`: "معدل الضريبة (%)"
- `tva_amount_label`: "مبلغ الضريبة"
- `total_ttc_label`: "المجموع شامل الضريبة"

## 🚀 Avantages

### **Pour l'Entreprise**
- ✅ **Conformité fiscale** automatique
- ✅ **Calculs précis** sans erreur
- ✅ **Factures professionnelles** conformes
- ✅ **Gain de temps** considérable

### **Pour l'Utilisateur**
- ✅ **Interface intuitive** et claire
- ✅ **Calculs automatiques** en temps réel
- ✅ **Flexibilité** des taux de TVA
- ✅ **Factures PDF** professionnelles

## 📞 Support

Pour toute question concernant le système TVA :
1. Consulter cette documentation
2. Exécuter les tests : `node test-tva-system.js`
3. Vérifier les logs de migration dans la console
4. Contacter l'équipe de développement

---

**Version**: 2.0.0  
**Dernière mise à jour**: Janvier 2024  
**Développé avec** ❤️ **pour la conformité fiscale marocaine**
