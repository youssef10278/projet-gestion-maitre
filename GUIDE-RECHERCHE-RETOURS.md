# 🔍 Guide d'Utilisation - Recherche Multi-Critères dans Gestion des Retours

## 📋 Vue d'Ensemble

La page **Gestion des Retours** dispose maintenant d'un système de recherche flexible qui permet de trouver des ventes selon plusieurs critères ou d'afficher tous les anciens tickets.

---

## 🎯 Fonctionnalités de Recherche

### **Critères de Recherche Disponibles :**

1. **🎫 Numéro de Ticket**
   - Recherche exacte par numéro de ticket
   - Format : V-20250120-0001

2. **👤 Nom du Client**
   - Recherche par nom de client (partielle ou complète)
   - Exemple : "Dupont" ou "Jean Dupont"

3. **📅 Date de Début**
   - Recherche des ventes à partir d'une date
   - Format : YYYY-MM-DD

4. **📅 Date de Fin**
   - Recherche des ventes jusqu'à une date
   - Format : YYYY-MM-DD

---

## 🔄 Scénarios d'Utilisation

### **Scénario 1 : Afficher Tous les Anciens Tickets**
```
1. Laisser TOUS les champs vides
2. Cliquer sur "Rechercher"
3. → Affiche tous les tickets de vente disponibles
```

### **Scénario 2 : Recherche par Ticket Spécifique**
```
1. Saisir le numéro de ticket : "V-20250120-0001"
2. Laisser les autres champs vides
3. Cliquer sur "Rechercher"
4. → Affiche directement les détails si trouvé
```

### **Scénario 3 : Recherche par Client**
```
1. Saisir le nom du client : "Dupont"
2. Laisser les autres champs vides
3. Cliquer sur "Rechercher"
4. → Affiche tous les tickets de ce client
```

### **Scénario 4 : Recherche par Période**
```
1. Saisir la date de début : "2025-01-01"
2. Saisir la date de fin : "2025-01-31"
3. Laisser les autres champs vides
4. Cliquer sur "Rechercher"
5. → Affiche tous les tickets de janvier 2025
```

### **Scénario 5 : Recherche Combinée**
```
1. Saisir le nom du client : "Martin"
2. Saisir la date de début : "2025-01-15"
3. Cliquer sur "Rechercher"
4. → Affiche les tickets de Martin depuis le 15 janvier
```

---

## 📊 Types de Résultats

### **🎯 Résultat Unique**
- **Comportement :** Navigation automatique vers les détails de la vente
- **Affichage :** Détails complets avec articles
- **Action :** Possibilité de configurer le retour immédiatement

### **📋 Résultats Multiples**
- **Comportement :** Affichage d'un tableau de sélection
- **Colonnes :** N° Ticket, Date, Client, Total, Action
- **Sélection :** Clic sur la ligne ou bouton "Sélectionner"
- **Navigation :** Vers les détails après sélection

### **❌ Aucun Résultat**
- **Comportement :** Message informatif
- **Message :** "Aucune vente trouvée avec ces critères"
- **Action :** Possibilité de modifier les critères

---

## 🎮 Interface Utilisateur

### **Champs de Recherche :**
```
┌─────────────────────────────────────────────────────────┐
│ Numéro de Ticket    │ Nom du Client                     │
│ [V-20250120-0001]   │ [Jean Dupont]                     │
├─────────────────────┼───────────────────────────────────┤
│ Date de Début       │ Date de Fin                       │
│ [2025-01-01]        │ [2025-01-31]                      │
└─────────────────────┴───────────────────────────────────┘
         [🔍 Rechercher]  [🗑️ Effacer]
```

### **Tableau de Résultats (si plusieurs) :**
```
┌──────────────┬────────────┬─────────────┬─────────┬────────────┐
│ N° Ticket    │ Date       │ Client      │ Total   │ Action     │
├──────────────┼────────────┼─────────────┼─────────┼────────────┤
│ V-20250120-1 │ 20/01/2025 │ Jean Dupont │ 150 MAD │ [Sélect.]  │
│ V-20250120-2 │ 20/01/2025 │ Marie Martin│ 200 MAD │ [Sélect.]  │
│ V-20250121-1 │ 21/01/2025 │ Paul Durand │ 75 MAD  │ [Sélect.]  │
└──────────────┴────────────┴─────────────┴─────────┴────────────┘
```

---

## ⚡ Actions Disponibles

### **🔍 Bouton "Rechercher"**
- **Fonction :** Lance la recherche avec les critères saisis
- **Comportement :** Fonctionne même avec tous les champs vides
- **Raccourci :** Touche Enter dans le champ ticket

### **🗑️ Bouton "Effacer"**
- **Fonction :** Vide tous les champs de recherche
- **Comportement :** Masque les résultats et remet à zéro
- **Utilité :** Recommencer une nouvelle recherche

### **✅ Bouton "Sélectionner"**
- **Fonction :** Choisit une vente spécifique depuis la liste
- **Comportement :** Navigation vers les détails de la vente
- **Alternative :** Clic direct sur la ligne du tableau

---

## 🎯 Conseils d'Utilisation

### **Pour une Recherche Efficace :**
1. **Recherche large :** Commencer sans critères pour voir tous les tickets
2. **Affinage progressif :** Ajouter des critères pour préciser
3. **Combinaison intelligente :** Utiliser client + date pour cibler
4. **Vérification :** Utiliser "Effacer" pour recommencer

### **Cas d'Usage Typiques :**
- **Retour immédiat :** Recherche par numéro de ticket exact
- **Client récurrent :** Recherche par nom de client
- **Audit période :** Recherche par plage de dates
- **Vue d'ensemble :** Recherche vide pour tout afficher

---

## 🔧 Fonctionnalités Techniques

### **Recherche Intelligente :**
- **Critères optionnels :** Aucun champ n'est obligatoire
- **Combinaison libre :** Tous les critères peuvent être combinés
- **Recherche partielle :** Le nom de client accepte les correspondances partielles
- **Gestion des dates :** Période flexible avec début et/ou fin

### **Affichage Adaptatif :**
- **1 résultat :** Navigation directe vers les détails
- **Plusieurs résultats :** Tableau de sélection interactif
- **0 résultat :** Message informatif avec suggestion

### **Performance :**
- **Recherche rapide :** Utilisation des APIs optimisées
- **Interface réactive :** Feedback visuel pendant la recherche
- **Gestion d'erreur :** Messages clairs en cas de problème

---

## 🎊 Résumé

La recherche multi-critères dans la gestion des retours offre une **flexibilité maximale** pour trouver les ventes à traiter. Que vous cherchiez un ticket spécifique, les ventes d'un client, ou que vous souhaitiez voir tous les anciens tickets, le système s'adapte à vos besoins.

**Utilisation simple :** Remplissez les critères souhaités (ou aucun) et cliquez "Rechercher" !
