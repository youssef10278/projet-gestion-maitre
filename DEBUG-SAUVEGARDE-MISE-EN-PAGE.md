# 🐛 DEBUG - Problème de Sauvegarde des Paramètres de Mise en Page

## 📋 **Symptôme Observé**
- L'utilisateur modifie la **Hauteur En-tête** et l'**Espacement Sections** dans le designer de templates
- Après avoir cliqué sur **"Sauvegarder"**, les valeurs reviennent à leur état d'avant modification
- Les autres paramètres (couleurs, polices) semblent se sauvegarder correctement

## 🔍 **Possibilités d'Erreur - Analyse Systématique**

### **1. Problèmes dans la Récupération des Données du Formulaire**

#### **A. Références DOM Incorrectes**
```javascript
// Dans getTemplateDataFromForm() - ligne 424
header_height: this.layoutInputs.headerHeight?.value + 'px' || '80px'
```
**Vérifications nécessaires :**
- ✅ `this.layoutInputs.headerHeight` existe-t-il ?
- ✅ L'élément DOM `document.getElementById('headerHeight')` est-il trouvé ?
- ✅ La valeur `.value` est-elle correctement récupérée ?

#### **B. Problème de Conversion de Valeurs**
```javascript
// Possible problème de conversion
parseInt(layout.header_height) || 80  // Si header_height = "100px"
```
**Causes possibles :**
- La valeur contient "px" et `parseInt("100px")` = 100 ✅
- Mais si la valeur est `undefined` ou `null`, retour à la valeur par défaut

### **2. Problèmes dans la Fonction de Sauvegarde**

#### **A. Échec de la Sauvegarde en Base**
```javascript
// Dans saveTemplate()
result = await window.templateManager.updateTemplate(this.currentTemplate.id, templateData);
```
**Vérifications :**
- ✅ La requête SQL UPDATE fonctionne-t-elle ?
- ✅ Les colonnes `layout_config` sont-elles mises à jour ?
- ✅ Y a-t-il des erreurs dans les logs IPC ?

#### **B. Problème de Sérialisation JSON**
```javascript
layout_config: JSON.stringify({
    header_height: "100px",
    section_spacing: "30px"
})
```
**Causes possibles :**
- Erreur dans la sérialisation JSON
- Caractères spéciaux dans les valeurs
- Structure d'objet incorrecte

### **3. Problèmes dans le Rechargement après Sauvegarde**

#### **A. Rechargement Automatique du Template**
```javascript
// Après sauvegarde, le template est-il rechargé ?
await this.loadTemplateIntoForm(updatedTemplate);
```
**Vérifications :**
- ✅ Le template est-il rechargé depuis la base après sauvegarde ?
- ✅ Les données rechargées sont-elles correctes ?
- ✅ `loadTemplateIntoForm()` utilise-t-elle les bonnes valeurs ?

#### **B. Cache ou État Incorrect**
```javascript
// L'état interne est-il cohérent ?
this.currentTemplate = updatedTemplate;
this.originalTemplate = JSON.parse(JSON.stringify(updatedTemplate));
```

### **4. Problèmes dans l'Interface Utilisateur**

#### **A. Sliders Non Synchronisés**
```javascript
// Les sliders sont-ils correctement mis à jour ?
this.setSliderValueSilent('headerHeight', parseInt(layout.header_height) || 80, 'px');
```
**Vérifications :**
- ✅ `setSliderValueSilent()` met-elle à jour le slider ET l'affichage ?
- ✅ Les éléments `headerHeightValue` sont-ils mis à jour ?

#### **B. Événements Conflictuels**
```javascript
// Y a-t-il des événements qui se déclenchent pendant le rechargement ?
this.isLoading = true; // Désactive les événements
// ... chargement ...
this.isLoading = false; // Réactive les événements
```

### **5. Problèmes de Base de Données**

#### **A. Structure de la Table**
```sql
-- La colonne layout_config existe-t-elle et est-elle de type TEXT ?
PRAGMA table_info(invoice_templates);
```

#### **B. Contraintes ou Triggers**
- Y a-t-il des triggers qui modifient les données après INSERT/UPDATE ?
- Des contraintes qui empêchent la sauvegarde ?

### **6. Problèmes de Timing/Asynchrone**

#### **A. Race Conditions**
```javascript
// Sauvegarde et rechargement simultanés ?
await this.saveTemplate();
this.loadTemplateIntoForm(template); // Pas d'await ?
```

#### **B. Promesses Non Attendues**
```javascript
// Toutes les opérations async sont-elles awaited ?
const result = await window.templateManager.updateTemplate(...);
const updatedTemplate = await window.templateManager.getTemplateById(...);
```

## 🔧 **Plan de Débogage Recommandé**

### **Étape 1 : Vérification des Logs**
```javascript
// Ajouter des logs dans getTemplateDataFromForm()
console.log('🔍 Hauteur en-tête récupérée:', this.layoutInputs.headerHeight?.value);
console.log('🔍 Espacement récupéré:', this.layoutInputs.sectionSpacing?.value);
console.log('🔍 Layout config final:', templateData.layout_config);
```

### **Étape 2 : Vérification de la Sauvegarde**
```javascript
// Dans saveTemplate(), après la sauvegarde
console.log('💾 Template sauvegardé:', result);
console.log('💾 Layout config sauvegardé:', result.layout_config);
```

### **Étape 3 : Vérification du Rechargement**
```javascript
// Dans loadTemplateIntoForm()
console.log('📥 Template chargé:', template);
console.log('📥 Layout config chargé:', template.layout_config);
console.log('📥 Valeurs appliquées - Hauteur:', parseInt(layout.header_height));
```

### **Étape 4 : Vérification de la Base de Données**
```javascript
// Test direct de la base
const template = await window.api.templates.getById(templateId);
console.log('🗄️ Template depuis DB:', template.layout_config);
```

## 🎯 **Hypothèses les Plus Probables**

### **1. Problème de Référence DOM (70% probable)**
- `this.layoutInputs.headerHeight` est `undefined`
- L'élément DOM n'est pas trouvé lors de l'initialisation

### **2. Problème de Rechargement après Sauvegarde (20% probable)**
- Le template est rechargé avec les anciennes valeurs
- Cache ou état incorrect

### **3. Problème de Sérialisation/Désérialisation JSON (10% probable)**
- Les valeurs sont perdues lors de la conversion JSON
- Structure d'objet incorrecte

## 🚀 **Actions Immédiates Recommandées**

1. **Ajouter des logs détaillés** dans `getTemplateDataFromForm()`
2. **Vérifier l'initialisation** des éléments DOM dans `initializeElements()`
3. **Tester la sauvegarde** avec des valeurs hardcodées
4. **Vérifier la base de données** directement après sauvegarde
5. **Analyser les logs IPC** pour voir si la sauvegarde réussit

## 📝 **Code de Test Suggéré**

```javascript
// Test rapide dans la console du navigateur
console.log('Hauteur slider:', document.getElementById('headerHeight')?.value);
console.log('Espacement slider:', document.getElementById('sectionSpacing')?.value);
console.log('Layout inputs:', window.templateDesigner?.layoutInputs);
```
