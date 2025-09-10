# 🔧 Guide de Dépannage - Impression Bons de Commande

## ❌ Erreur Courante : "Commande non trouvée"

### 🎯 Symptômes
```
supplier-orders-api.js:297 Erreur lors de la récupération des détails: Error: Commande non trouvée
suppliers.js:2751 ❌ Erreur lors de l'impression: Error: Commande non trouvée
```

### 🔍 Causes Possibles

1. **Problème de type de données** - ID passé comme string vs number
2. **Commande supprimée** - La commande n'existe plus
3. **Problème de synchronisation** - Cache non actualisé
4. **Erreur de base de données** - Données corrompues

---

## 🛠️ Solutions de Dépannage

### **Solution 1 : Debug Automatique**

1. **Ouvrez la page Fournisseurs**
2. **Ouvrez la console** (F12)
3. **Exécutez** : `debugPrintIssue()`
4. **Analysez** les résultats détaillés

### **Solution 2 : Test avec ID Spécifique**

Si vous connaissez l'ID de la commande qui pose problème :
```javascript
testSpecificOrder(123) // Remplacez 123 par l'ID réel
```

### **Solution 3 : Actualisation des Données**

1. **Actualisez la page** (F5)
2. **Rechargez la liste** des commandes
3. **Réessayez** l'impression

### **Solution 4 : Vérification Manuelle**

```javascript
// Vérifier les commandes disponibles
const orders = await window.supplierOrdersAPI.getOrders();
console.log('Commandes:', orders.map(o => ({id: o.id, number: o.order_number})));

// Tester une commande spécifique
const details = await window.supplierOrdersAPI.getOrderDetails(orders[0].id);
console.log('Détails:', details);
```

---

## 🔧 Corrections Appliquées

### **1. Comparaison Flexible des IDs**

**Avant :**
```javascript
const order = orders.find(o => o.id === orderId);
```

**Après :**
```javascript
const order = orders.find(o => 
    o.id == orderId || 
    o.id === parseInt(orderId) || 
    parseInt(o.id) === parseInt(orderId)
);
```

### **2. Logs de Debug Ajoutés**

- Affichage de l'ID recherché et son type
- Liste des IDs disponibles
- Confirmation de la commande trouvée

### **3. Gestion des Articles**

Correction similaire pour la récupération des articles :
```javascript
const items = allItems.filter(item => 
    item.order_id == orderId || 
    item.order_id === parseInt(orderId) || 
    parseInt(item.order_id) === parseInt(orderId)
);
```

---

## 🧪 Tests de Validation

### **Test Complet**
```javascript
debugPrintIssue()
```

**Résultats attendus :**
- ✅ Modules disponibles
- ✅ Commandes listées
- ✅ Détails récupérés
- ✅ HTML généré
- ✅ Aperçu fonctionnel

### **Test Rapide**
```javascript
testQuickHTML()
```

**Résultats attendus :**
- ✅ HTML généré
- ✅ Aperçu ouvert dans nouvelle fenêtre

---

## 🚨 Actions d'Urgence

### **Si Aucune Commande n'Existe**

```javascript
createTestOrderIfNeeded()
```

Cette fonction :
1. Vérifie s'il y a des commandes
2. Crée une commande de test si nécessaire
3. Utilise le premier fournisseur disponible

### **Si les Fournisseurs Manquent**

1. Allez dans l'onglet **Fournisseurs**
2. Créez au moins un fournisseur
3. Revenez à l'onglet **Commandes**
4. Créez une nouvelle commande

---

## 📋 Checklist de Vérification

### **Avant de Tester l'Impression :**

- [ ] Au moins un fournisseur existe
- [ ] Au moins une commande existe
- [ ] La commande a des articles
- [ ] Le statut de la commande permet l'impression
- [ ] Les modules sont chargés (console sans erreurs)

### **Pendant le Test :**

- [ ] Clic sur le bon bouton (aperçu/impression/PDF)
- [ ] Pas de bloqueur de pop-up actif
- [ ] Console ouverte pour voir les logs
- [ ] Connexion internet stable

### **Après le Test :**

- [ ] Aperçu s'ouvre correctement
- [ ] Contenu du document complet
- [ ] Pas d'erreurs dans la console
- [ ] Fonctions PDF/impression disponibles

---

## 🔍 Diagnostic Avancé

### **Vérifier la Structure des Données**

```javascript
// Inspecter une commande
const orders = await window.supplierOrdersAPI.getOrders();
const order = orders[0];
console.log('Structure commande:', {
    id: order.id,
    type_id: typeof order.id,
    number: order.order_number,
    supplier_id: order.supplier_id,
    items_count: order.items_count
});

// Inspecter les articles
const details = await window.supplierOrdersAPI.getOrderDetails(order.id);
console.log('Articles:', details.items?.map(item => ({
    name: item.product_name,
    qty: item.quantity_ordered,
    price: item.unit_price
})));
```

### **Vérifier les APIs**

```javascript
// Tester les APIs essentielles
console.log('APIs disponibles:', {
    supplierOrdersAPI: !!window.supplierOrdersAPI,
    purchaseOrderPrinter: !!window.purchaseOrderPrinter,
    suppliers: !!window.api?.suppliers,
    products: !!window.api?.products
});
```

---

## 📞 Support Technique

### **Informations à Fournir**

Si le problème persiste, fournissez :

1. **Résultat de** `debugPrintIssue()`
2. **Messages d'erreur** complets de la console
3. **Nombre de commandes** dans le système
4. **Version du navigateur** utilisé
5. **Étapes exactes** qui causent l'erreur

### **Logs Utiles**

```javascript
// Générer un rapport complet
console.log('=== RAPPORT DE DEBUG ===');
console.log('Timestamp:', new Date().toISOString());
console.log('User Agent:', navigator.userAgent);
console.log('URL:', window.location.href);

// Exécuter le debug
await debugPrintIssue();

console.log('=== FIN RAPPORT ===');
```

---

## ✅ Validation de la Correction

### **Test Final**

1. **Actualisez** la page (F5)
2. **Ouvrez** l'onglet Commandes
3. **Cliquez** sur un bouton d'aperçu (🔍)
4. **Vérifiez** que l'aperçu s'ouvre
5. **Testez** l'export PDF (📄)

### **Critères de Succès**

- ✅ Aucune erreur "Commande non trouvée"
- ✅ Aperçu s'ouvre dans nouvelle fenêtre
- ✅ Document bien formaté avec toutes les données
- ✅ Export PDF fonctionne
- ✅ Impression directe disponible

---

**🎉 Une fois ces étapes validées, le système d'impression est pleinement fonctionnel !**
