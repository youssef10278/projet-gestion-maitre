# 📋 Guide d'Utilisation - Système TVA GestionPro v2.0

## 🚀 Démarrage Rapide

### **Accéder à la Facturation**
1. **Connectez-vous** à GestionPro
2. Cliquez sur **"Facturation"** dans le menu principal
3. Cliquez sur **"Nouvelle Facture"**

## 💰 Utilisation du Système TVA

### **Étape 1 : Créer une Facture**
1. **Remplissez les informations client** :
   - Nom du client
   - Adresse
   - Téléphone
   - ICE (Identifiant Commun de l'Entreprise)

2. **Ajoutez des articles** :
   - Description du produit/service
   - Quantité
   - Prix unitaire HT

### **Étape 2 : Configurer la TVA**
Dans la section **"Calculs TVA"** en bas à droite :

#### **Taux TVA Prédéfinis**
- **0% (Exonéré)** : Pour les produits/services exonérés
- **10% (Taux réduit)** : Produits de première nécessité
- **20% (Taux normal)** : Taux standard au Maroc

#### **Taux Personnalisé**
1. Sélectionnez **"Personnalisé"**
2. Saisissez le taux désiré (ex: 7.5)
3. Les calculs se mettent à jour automatiquement

### **Étape 3 : Vérifier les Calculs**
Le système calcule automatiquement :
- ✅ **Sous-total HT** : Somme des articles hors taxes
- ✅ **Montant TVA** : Sous-total × Taux TVA
- ✅ **Total TTC** : Sous-total + TVA

### **Étape 4 : Sauvegarder et Imprimer**
1. Cliquez sur **"Sauvegarder"**
2. Pour imprimer : **"Voir / Imprimer"** → **"Imprimer/PDF"**

## 📊 Exemples Pratiques

### **Exemple 1 : Vente Électronique (TVA 20%)**
```
Articles:
- Ordinateur portable : 1 × 5000.00 MAD
- Souris : 2 × 150.00 MAD

Calculs:
Sous-total HT : 5300.00 MAD
TVA (20%) : 1060.00 MAD
Total TTC : 6360.00 MAD
```

### **Exemple 2 : Produits Alimentaires (TVA 10%)**
```
Articles:
- Farine (sac 50kg) : 10 × 200.00 MAD
- Huile d'olive : 5 × 100.00 MAD

Calculs:
Sous-total HT : 2500.00 MAD
TVA (10%) : 250.00 MAD
Total TTC : 2750.00 MAD
```

### **Exemple 3 : Services Export (TVA 0%)**
```
Articles:
- Conseil en export : 1 × 10000.00 MAD

Calculs:
Sous-total HT : 10000.00 MAD
TVA (0%) : 0.00 MAD (Exonéré)
Total TTC : 10000.00 MAD
```

## 🎯 Cas d'Usage par Secteur

### **🏪 Commerce de Détail**
- **Produits électroniques** : TVA 20%
- **Produits alimentaires** : TVA 10% ou 20%
- **Médicaments** : TVA 0% (exonéré)

### **🏭 Industrie**
- **Équipements industriels** : TVA 20%
- **Matières premières** : TVA 20%
- **Export** : TVA 0% (exonéré)

### **💼 Services**
- **Conseil** : TVA 20%
- **Formation** : TVA 20%
- **Services export** : TVA 0% (exonéré)

## 🔧 Fonctionnalités Avancées

### **Modification de Factures**
- Les factures sauvegardées affichent le taux TVA utilisé
- Possibilité de consulter et imprimer les anciennes factures
- Historique complet des calculs TVA

### **Rapports TVA**
- Liste des factures par taux de TVA
- Totaux HT, TVA et TTC par période
- Export des données pour déclarations fiscales

### **Migration Automatique**
- Les anciennes factures sont automatiquement migrées
- Calcul rétroactif de la TVA (supposée à 20%)
- Aucune perte de données

## ⚠️ Points Importants

### **Conformité Fiscale**
- ✅ Respectez la législation marocaine en vigueur
- ✅ Vérifiez les taux applicables à vos produits/services
- ✅ Conservez les factures pour les contrôles fiscaux

### **Bonnes Pratiques**
- **Vérifiez toujours** les calculs avant sauvegarde
- **Utilisez le bon taux** selon le type de produit/service
- **Documentez** les cas d'exonération
- **Sauvegardez régulièrement** votre base de données

## 🆘 Dépannage

### **Problèmes Courants**

#### **Les calculs ne se mettent pas à jour**
- Vérifiez que vous avez sélectionné un taux TVA
- Rechargez la page si nécessaire

#### **Taux personnalisé non pris en compte**
- Assurez-vous d'avoir sélectionné "Personnalisé"
- Saisissez un nombre valide (ex: 7.5, pas 7,5)

#### **Anciennes factures sans TVA**
- Normal : migration automatique effectuée
- Les totaux sont recalculés avec TVA 20% par défaut

### **Support Technique**
1. Consultez cette documentation
2. Exécutez les tests : `node test-tva-system.js`
3. Contactez l'équipe de développement

## 📞 Contact

Pour toute question sur le système TVA :
- 📧 Email : support@gestionpro.ma
- 📱 Téléphone : +212 XXX XXX XXX
- 🌐 Site web : www.gestionpro.ma

---

**Version** : 2.0.0  
**Dernière mise à jour** : Janvier 2024  
**Développé pour la conformité fiscale marocaine** 🇲🇦
