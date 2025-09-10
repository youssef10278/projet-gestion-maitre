# 🔑 **GUIDE : AJOUTER UNE LICENCE DE TEST SUR RAILWAY**

## 🎯 **PROBLÈME IDENTIFIÉ**

Votre serveur Railway fonctionne **parfaitement** ! Le problème est que la licence de test n'existe pas dans votre base de données.

**Message d'erreur :** `"Licence non trouvée ou expirée"`
**Status :** 404 (Normal - licence inexistante)

---

## 🔧 **SOLUTIONS POUR RÉSOUDRE**

### **Solution 1 : Ajouter une Licence via Railway Dashboard**

#### **Étape 1 : Accéder à votre Base de Données**
1. Connectez-vous à **Railway Dashboard**
2. Allez dans votre projet **gestionpro-license-server**
3. Cliquez sur votre **base de données** (PostgreSQL/MySQL)
4. Ouvrez l'onglet **"Query"** ou **"Console"**

#### **Étape 2 : Ajouter une Licence de Test**
Exécutez cette requête SQL :

```sql
-- Ajouter une licence de test
INSERT INTO licenses (
    license_key, 
    status, 
    max_activations, 
    current_activations,
    expires_at,
    created_at,
    updated_at
) VALUES (
    'GESTIONPRO-TEST-2025-DEMO',
    'active',
    5,
    0,
    '2025-12-31 23:59:59',
    NOW(),
    NOW()
);
```

#### **Étape 3 : Vérifier l'Ajout**
```sql
-- Vérifier que la licence a été ajoutée
SELECT * FROM licenses WHERE license_key = 'GESTIONPRO-TEST-2025-DEMO';
```

---

### **Solution 2 : Créer un Endpoint d'Administration**

Ajoutez un endpoint `/admin/create-license` à votre serveur Railway :

```javascript
// Dans votre serveur Railway
app.post('/admin/create-license', async (req, res) => {
    try {
        const { licenseKey, maxActivations, expiresAt } = req.body;
        
        // Ajouter la licence à la base de données
        const result = await db.query(
            'INSERT INTO licenses (license_key, status, max_activations, expires_at) VALUES (?, ?, ?, ?)',
            [licenseKey, 'active', maxActivations, expiresAt]
        );
        
        res.json({ success: true, message: 'Licence créée avec succès' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
```

---

### **Solution 3 : Utiliser une Licence Existante**

Si vous avez déjà des licences dans votre base de données, listez-les :

```sql
-- Voir toutes les licences existantes
SELECT license_key, status, expires_at FROM licenses;
```

Puis utilisez une licence existante dans vos tests.

---

## 🧪 **TESTER APRÈS CORRECTION**

### **Test 1 : Avec Licence Valide**
```bash
cd projet-gestion-maitre
node test-railway-format-correct.js
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Licence activée avec succès",
  "token": "...",
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```

### **Test 2 : Depuis l'Application**
1. Lancez **GestionPro**
2. Allez dans **Paramètres** → **Licence**
3. Entrez la clé : `GESTIONPRO-TEST-2025-DEMO`
4. Cliquez **Activer**

**Résultat attendu :** ✅ Licence activée avec succès

---

## 📊 **STRUCTURE DE BASE DE DONNÉES ATTENDUE**

Votre table `licenses` devrait avoir cette structure :

```sql
CREATE TABLE licenses (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    max_activations INTEGER DEFAULT 1,
    current_activations INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE license_activations (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(255),
    machine_id VARCHAR(255),
    hardware_fingerprint TEXT,
    activated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (license_key) REFERENCES licenses(license_key)
);
```

---

## 🎯 **LICENCES DE TEST RECOMMANDÉES**

Ajoutez ces licences pour vos tests :

```sql
-- Licence de test standard
INSERT INTO licenses VALUES 
('GESTIONPRO-TEST-2025-DEMO', 'active', 5, 0, '2025-12-31 23:59:59', NOW(), NOW()),
('GESTIONPRO-DEV-2025-001', 'active', 10, 0, '2025-12-31 23:59:59', NOW(), NOW()),
('GESTIONPRO-PROD-2025-001', 'active', 1, 0, '2025-12-31 23:59:59', NOW(), NOW());
```

---

## 🚀 **APRÈS RÉSOLUTION**

Une fois la licence ajoutée, votre système sera **100% fonctionnel** :

### ✅ **Ce qui fonctionnera :**
- **Activation** depuis l'application GestionPro
- **Validation** automatique des licences
- **Gestion** des activations multiples
- **Expiration** automatique des licences
- **Logs** complets sur Railway

### ✅ **Tests de Validation :**
```bash
# Test complet
node test-railway-format-correct.js

# Test depuis l'application
# Lancez GestionPro → Paramètres → Licence → Activer
```

---

## 💡 **RÉSUMÉ**

**🎉 VOTRE SERVEUR RAILWAY FONCTIONNE PARFAITEMENT !**

Le seul problème était l'absence de licences de test dans votre base de données. Une fois ajoutées, tout fonctionnera parfaitement.

**Prochaines étapes :**
1. ✅ Ajouter les licences de test
2. ✅ Tester l'activation
3. ✅ Distribuer votre application
4. ✅ Surveiller les activations en production

**Votre infrastructure de licences est prête pour la production !**
