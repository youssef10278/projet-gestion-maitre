// src/js/supplier-orders-db.js - Gestion de la base de données pour les commandes fournisseurs

/**
 * Initialise les tables pour la gestion des commandes fournisseurs
 */
async function initializeSupplierOrdersTables() {
    try {
        console.log('🔧 Initialisation des tables commandes fournisseurs...');

        // Table des commandes fournisseurs
        await window.api.database.run(`
            CREATE TABLE IF NOT EXISTS supplier_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_number TEXT UNIQUE NOT NULL,
                supplier_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING',
                order_date TEXT NOT NULL,
                expected_delivery_date TEXT,
                actual_delivery_date TEXT,
                total_amount REAL DEFAULT 0,
                notes TEXT,
                created_by TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
            )
        `);

        // Table des lignes de commande
        await window.api.database.run(`
            CREATE TABLE IF NOT EXISTS supplier_order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER,
                product_name TEXT NOT NULL,
                product_reference TEXT,
                quantity_ordered INTEGER NOT NULL,
                quantity_received INTEGER DEFAULT 0,
                unit_price REAL NOT NULL,
                total_price REAL NOT NULL,
                notes TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES supplier_orders (id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products (id)
            )
        `);

        // Table du catalogue fournisseur (produits proposés par chaque fournisseur)
        await window.api.database.run(`
            CREATE TABLE IF NOT EXISTS supplier_catalog (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                supplier_id INTEGER NOT NULL,
                product_id INTEGER,
                supplier_reference TEXT,
                supplier_product_name TEXT NOT NULL,
                unit_price REAL NOT NULL,
                minimum_quantity INTEGER DEFAULT 1,
                delivery_time_days INTEGER DEFAULT 7,
                is_active BOOLEAN DEFAULT 1,
                last_price_update TEXT DEFAULT CURRENT_TIMESTAMP,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products (id)
            )
        `);

        // Table des réceptions de marchandises
        await window.api.database.run(`
            CREATE TABLE IF NOT EXISTS supplier_deliveries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                delivery_number TEXT,
                delivery_date TEXT NOT NULL,
                delivery_status TEXT DEFAULT 'PARTIAL',
                notes TEXT,
                received_by TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES supplier_orders (id)
            )
        `);

        // Table des lignes de réception
        await window.api.database.run(`
            CREATE TABLE IF NOT EXISTS supplier_delivery_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                delivery_id INTEGER NOT NULL,
                order_item_id INTEGER NOT NULL,
                quantity_received INTEGER NOT NULL,
                quality_status TEXT DEFAULT 'GOOD',
                notes TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (delivery_id) REFERENCES supplier_deliveries (id) ON DELETE CASCADE,
                FOREIGN KEY (order_item_id) REFERENCES supplier_order_items (id)
            )
        `);

        // Index pour optimiser les performances
        await window.api.database.run(`CREATE INDEX IF NOT EXISTS idx_supplier_orders_supplier ON supplier_orders(supplier_id)`);
        await window.api.database.run(`CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON supplier_orders(status)`);
        await window.api.database.run(`CREATE INDEX IF NOT EXISTS idx_supplier_orders_date ON supplier_orders(order_date)`);
        await window.api.database.run(`CREATE INDEX IF NOT EXISTS idx_supplier_catalog_supplier ON supplier_catalog(supplier_id)`);
        await window.api.database.run(`CREATE INDEX IF NOT EXISTS idx_supplier_deliveries_order ON supplier_deliveries(order_id)`);

        console.log('✅ Tables commandes fournisseurs initialisées avec succès');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation des tables:', error);
        throw error;
    }
}

/**
 * Génère un numéro de commande unique
 */
function generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getTime().toString().slice(-6);
    
    return `CMD${year}${month}${day}-${time}`;
}

/**
 * Statuts des commandes
 */
const ORDER_STATUS = {
    PENDING: 'PENDING',           // En attente
    CONFIRMED: 'CONFIRMED',       // Confirmée
    SHIPPED: 'SHIPPED',           // Expédiée
    PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED', // Partiellement reçue
    RECEIVED: 'RECEIVED',         // Reçue complètement
    CANCELLED: 'CANCELLED'        // Annulée
};

/**
 * Statuts de qualité
 */
const QUALITY_STATUS = {
    GOOD: 'GOOD',                 // Bon état
    DAMAGED: 'DAMAGED',           // Endommagé
    DEFECTIVE: 'DEFECTIVE',       // Défectueux
    EXPIRED: 'EXPIRED'            // Périmé
};

// Exposition des fonctions et constantes
window.supplierOrdersDB = {
    initializeSupplierOrdersTables,
    generateOrderNumber,
    ORDER_STATUS,
    QUALITY_STATUS
};

// Auto-initialisation si l'API est disponible
if (window.api && window.api.database) {
    initializeSupplierOrdersTables().catch(console.error);
}
