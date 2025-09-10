// Script pour vider la base de données avec Electron
const { app } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const fs = require('fs');

console.log('🧹 Nettoyage de la base de données avec Electron...');

// Attendre que l'app soit prête
app.whenReady().then(() => {
    try {
        const cleanDbPath = path.join(__dirname, 'database', 'main-clean.db');
        
        if (!fs.existsSync(cleanDbPath)) {
            console.log('❌ Base de données vierge introuvable');
            app.quit();
            return;
        }

        const db = new Database(cleanDbPath);
        
        console.log('🗑️ Suppression des données existantes...');
        
        // Supprimer toutes les données SAUF les utilisateurs admin
        db.exec(`
            DELETE FROM sale_items;
            DELETE FROM sales;
            DELETE FROM products;
            DELETE FROM clients;
            DELETE FROM suppliers;
            DELETE FROM expenses;
            DELETE FROM users WHERE username != 'admin';
        `);
        
        // Réinitialiser les compteurs auto-increment
        db.exec(`
            DELETE FROM sqlite_sequence WHERE name IN ('products', 'clients', 'suppliers', 'sales', 'sale_items', 'expenses');
        `);
        
        // Vérifier que l'admin existe, sinon le créer
        const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('admin');
        
        if (adminExists.count === 0) {
            console.log('👤 Création de l\'utilisateur admin...');
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'Propriétaire');
        }
        
        // Vérifier les paramètres de base
        const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
        if (settingsCount.count === 0) {
            console.log('⚙️ Ajout des paramètres par défaut...');
            const settingsStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
            settingsStmt.run('company_name', 'Mon Entreprise');
            settingsStmt.run('currency', 'MAD');
            settingsStmt.run('language', 'fr');
            settingsStmt.run('theme', 'light');
            settingsStmt.run('tax_rate', '20');
        }
        
        // Vérifier le résultat
        const counts = {
            products: db.prepare('SELECT COUNT(*) as count FROM products').get().count,
            clients: db.prepare('SELECT COUNT(*) as count FROM clients').get().count,
            sales: db.prepare('SELECT COUNT(*) as count FROM sales').get().count,
            users: db.prepare('SELECT COUNT(*) as count FROM users').get().count
        };
        
        db.close();
        
        console.log('✅ Base de données nettoyée avec succès !');
        console.log(`📊 Résultat:`);
        console.log(`   - Produits: ${counts.products}`);
        console.log(`   - Clients: ${counts.clients}`);
        console.log(`   - Ventes: ${counts.sales}`);
        console.log(`   - Utilisateurs: ${counts.users} (admin seulement)`);
        
        app.quit();
        
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error.message);
        app.quit();
    }
});

// Éviter que l'app reste ouverte
app.on('window-all-closed', () => {
    app.quit();
});
