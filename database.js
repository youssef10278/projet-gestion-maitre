const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const fs = require('fs');
const os = require('os');
const { app } = require('electron');
const ExpensesDB = require('./expenses-db');

// Utiliser le dossier userData d'Electron pour les données
function getDataPath() {
    try {
        if (app && app.getPath) {
            // En mode production (app empaquetée)
            const userDataPath = path.join(app.getPath('userData'), 'database');
            return userDataPath;
        } else {
            // En mode développement
            return path.join(process.cwd(), 'database');
        }
    } catch (error) {
        console.error(`❌ Erreur lors de la récupération du chemin userData: ${error.message}`);
        // Fallback vers un dossier temporaire
        return path.join(os.tmpdir(), 'GestionPro', 'database');
    }
}

let dbDir, dbPath;

try {
    dbDir = getDataPath();
    dbPath = path.join(dbDir, 'main.db');

    // Créer le dossier de données s'il n'existe pas
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`📁 Dossier de données créé: ${dbDir}`);
    }
} catch (error) {
    console.error(`❌ Erreur lors de la création du dossier de données: ${error.message}`);
    // Fallback vers un dossier temporaire
    dbDir = path.join(os.tmpdir(), 'GestionPro', 'database');
    dbPath = path.join(dbDir, 'main.db');

    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    console.log(`📁 Utilisation du dossier temporaire: ${dbDir}`);
}

// Copier la base de données vierge si elle n'existe pas
if (!fs.existsSync(dbPath)) {
    // PRIORITÉ ABSOLUE : Base de données vierge pour les clients
    const cleanDbPath = path.join(__dirname, 'database', 'main-clean.db');

    if (fs.existsSync(cleanDbPath)) {
        try {
            fs.copyFileSync(cleanDbPath, dbPath);
            console.log(`📋 ✅ Base de données VIERGE copiée pour le client: ${dbPath}`);
        } catch (error) {
            console.log(`⚠️ Erreur copie DB vierge: ${error.message}`);
        }
    } else {
        console.log(`❌ ATTENTION: Base de données vierge introuvable à ${cleanDbPath}`);
        // En dernier recours, créer une DB vide
        console.log(`🔧 Création d'une base de données vide...`);
    }
}

const db = new Database(dbPath);
console.log(`🗄️ Base de données initialisée: ${dbPath}`);

function initDatabase() {
    db.exec(`
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            barcode TEXT UNIQUE,
            name TEXT NOT NULL,
            purchase_price REAL NOT NULL DEFAULT 0,
            price_retail REAL NOT NULL,
            price_wholesale REAL NOT NULL,
            price_carton REAL NOT NULL DEFAULT 0,
            stock INTEGER NOT NULL DEFAULT 0,
            alert_threshold INTEGER NOT NULL DEFAULT 0,
            pieces_per_carton INTEGER NOT NULL DEFAULT 0,
            category TEXT,
            image_path TEXT
        );

        CREATE TABLE IF NOT EXISTS clients ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT, address TEXT, credit_balance REAL NOT NULL DEFAULT 0, ice TEXT, UNIQUE(name, phone) );
        CREATE TABLE IF NOT EXISTS users ( id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('Propriétaire', 'Vendeur')) );
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER,
            user_id INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            amount_paid_cash REAL NOT NULL,
            amount_paid_credit REAL NOT NULL,
            sale_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK(status IN ('COMPLETED', 'RETURNED', 'CORRECTED')),
            original_sale_id INTEGER,
            ticket_number TEXT UNIQUE,
            has_returns INTEGER NOT NULL DEFAULT 0,
            payment_method TEXT NOT NULL DEFAULT 'cash',
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (original_sale_id) REFERENCES sales(id) ON DELETE SET NULL
        );
        
        CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit TEXT NOT NULL DEFAULT 'piece',
            unit_price REAL NOT NULL,
            line_total REAL NOT NULL,
            purchase_price REAL NOT NULL DEFAULT 0,
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS invoices ( id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_number TEXT NOT NULL UNIQUE, client_name TEXT, client_address TEXT, client_phone TEXT, client_ice TEXT, subtotal_ht REAL NOT NULL DEFAULT 0, tva_rate REAL NOT NULL DEFAULT 20, tva_amount REAL NOT NULL DEFAULT 0, total_amount REAL NOT NULL, invoice_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d', 'now', 'localtime')) );
        
        CREATE TABLE IF NOT EXISTS invoice_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            unit TEXT NOT NULL DEFAULT 'piece',
            line_total REAL NOT NULL,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        );

        -- Table des templates de factures
        CREATE TABLE IF NOT EXISTS invoice_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            is_default INTEGER NOT NULL DEFAULT 0,
            is_system INTEGER NOT NULL DEFAULT 0,
            user_created INTEGER NOT NULL DEFAULT 1,
            colors_config TEXT NOT NULL DEFAULT '{}',
            fonts_config TEXT NOT NULL DEFAULT '{}',
            layout_config TEXT NOT NULL DEFAULT '{}',
            logo_path TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'))
        );

        -- Table des préférences utilisateur pour les templates
        CREATE TABLE IF NOT EXISTS user_template_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            template_id INTEGER NOT NULL,
            is_default INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            FOREIGN KEY (template_id) REFERENCES invoice_templates(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quotes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number TEXT NOT NULL UNIQUE,
            client_id INTEGER,
            client_name TEXT NOT NULL,
            client_phone TEXT,
            client_address TEXT,
            date_created TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            date_validity TEXT NOT NULL,
            validity_days INTEGER NOT NULL DEFAULT 30,
            status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
            subtotal REAL NOT NULL DEFAULT 0,
            discount_type TEXT CHECK(discount_type IN ('percentage', 'amount')),
            discount_value REAL DEFAULT 0,
            discount_amount REAL DEFAULT 0,
            total_amount REAL NOT NULL,
            notes TEXT,
            conditions TEXT,
            created_by TEXT NOT NULL DEFAULT 'system',
            converted_sale_id INTEGER,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'))
        );

        CREATE TABLE IF NOT EXISTS quote_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quote_id INTEGER NOT NULL,
            product_id INTEGER,
            product_name TEXT NOT NULL,
            product_reference TEXT,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            line_total REAL NOT NULL,
            discount_type TEXT CHECK(discount_type IN ('percentage', 'amount')),
            discount_value REAL DEFAULT 0,
            discount_amount REAL DEFAULT 0,
            final_price REAL NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings ( key TEXT PRIMARY KEY, value TEXT );
        CREATE TABLE IF NOT EXISTS credit_payments ( id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER NOT NULL, user_id INTEGER NOT NULL, amount_paid REAL NOT NULL, payment_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')), note TEXT, FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) );
        CREATE TABLE IF NOT EXISTS stock_adjustments ( id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, user_id INTEGER NOT NULL, old_quantity INTEGER NOT NULL, new_quantity INTEGER NOT NULL, reason TEXT, adjustment_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')), FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) );

        CREATE TABLE IF NOT EXISTS returns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_number TEXT NOT NULL UNIQUE,
            original_sale_id INTEGER NOT NULL,
            client_id INTEGER,
            user_id INTEGER NOT NULL,
            return_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            total_refund_amount REAL NOT NULL,
            refund_cash REAL NOT NULL DEFAULT 0,
            refund_credit REAL NOT NULL DEFAULT 0,
            reason TEXT,
            notes TEXT,
            status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK(status IN ('COMPLETED', 'PENDING_VALIDATION')),
            FOREIGN KEY (original_sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS return_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_id INTEGER NOT NULL,
            original_sale_item_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity_returned INTEGER NOT NULL,
            unit TEXT NOT NULL DEFAULT 'piece',
            unit_price REAL NOT NULL,
            refund_amount REAL NOT NULL,
            condition_status TEXT NOT NULL DEFAULT 'GOOD' CHECK(condition_status IN ('GOOD', 'DEFECTIVE')),
            back_to_stock INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
            FOREIGN KEY (original_sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        -- Table des fournisseurs
        CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            company TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            city TEXT,
            postal_code TEXT,
            country TEXT DEFAULT 'Maroc',
            tax_id TEXT,
            payment_terms INTEGER DEFAULT 30,
            credit_limit REAL DEFAULT 0,
            discount_rate REAL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'))
        );

        -- Tables pour la gestion des stocks par lots
        CREATE TABLE IF NOT EXISTS stock_lots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            lot_number TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 0,
            purchase_price REAL NOT NULL,
            purchase_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            supplier_id INTEGER,
            expiry_date TEXT,
            status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE', 'RESERVED', 'EXPIRED', 'SOLD_OUT')),
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
            UNIQUE(product_id, lot_number)
        );

        CREATE TABLE IF NOT EXISTS stock_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            lot_id INTEGER,
            movement_type TEXT NOT NULL CHECK(movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER')),
            quantity INTEGER NOT NULL,
            unit_cost REAL NOT NULL DEFAULT 0,
            reference_type TEXT CHECK(reference_type IN ('SALE', 'PURCHASE', 'RETURN', 'ADJUSTMENT', 'MIGRATION')),
            reference_id INTEGER,
            movement_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            user_id INTEGER,
            notes TEXT,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (lot_id) REFERENCES stock_lots(id) ON DELETE SET NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS product_valuation_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL UNIQUE,
            valuation_method TEXT NOT NULL DEFAULT 'FIFO' CHECK(valuation_method IN ('FIFO', 'LIFO', 'AVERAGE')),
            auto_lot_creation INTEGER NOT NULL DEFAULT 1,
            track_expiry INTEGER NOT NULL DEFAULT 0,
            min_shelf_life_days INTEGER DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );


    `);

    // ===== OPTIMISATIONS PERFORMANCE CRITIQUES =====
    console.log('🚀 Création des index de performance...');

    const performanceIndexes = [
        // Index pour les recherches de produits (les plus fréquentes)
        'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)',
        'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)',
        'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)',
        'CREATE INDEX IF NOT EXISTS idx_products_stock_alert ON products(stock, alert_threshold)',
        'CREATE INDEX IF NOT EXISTS idx_products_name_barcode ON products(name, barcode)',

        // Index pour les recherches de clients
        'CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name)',
        'CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone)',
        'CREATE INDEX IF NOT EXISTS idx_clients_credit ON clients(credit_balance)',
        'CREATE INDEX IF NOT EXISTS idx_clients_name_phone ON clients(name, phone)',

        // Index pour les ventes (historique et rapports)
        'CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date)',
        'CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(client_id)',
        'CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_sales_date_client ON sales(sale_date, client_id)',
        'CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status)',
        'CREATE INDEX IF NOT EXISTS idx_sales_ticket ON sales(ticket_number)',

        // Index pour les items de vente (jointures fréquentes)
        'CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id)',
        'CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id)',
        'CREATE INDEX IF NOT EXISTS idx_sale_items_sale_product ON sale_items(sale_id, product_id)',

        // Index pour les factures
        'CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number)',
        'CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date)',

        // Index pour les devis
        'CREATE INDEX IF NOT EXISTS idx_quotes_number ON quotes(number)',
        'CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id)',
        'CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes(date_created)',
        'CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status)',

        // Index pour les items de devis
        'CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items(quote_id)',
        'CREATE INDEX IF NOT EXISTS idx_quote_items_product ON quote_items(product_id)',

        // Index pour les ajustements de stock
        'CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product ON stock_adjustments(product_id)',
        'CREATE INDEX IF NOT EXISTS idx_stock_adjustments_date ON stock_adjustments(adjustment_date)',

        // Index pour les retours
        'CREATE INDEX IF NOT EXISTS idx_returns_number ON returns(return_number)',
        'CREATE INDEX IF NOT EXISTS idx_returns_sale ON returns(original_sale_id)',
        'CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(return_date)',
        'CREATE INDEX IF NOT EXISTS idx_returns_client ON returns(client_id)',

        // Index pour les items de retour
        'CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id)',
        'CREATE INDEX IF NOT EXISTS idx_return_items_product ON return_items(product_id)',
        'CREATE INDEX IF NOT EXISTS idx_return_items_sale_item ON return_items(original_sale_item_id)',

        // Index pour les paiements de crédit
        'CREATE INDEX IF NOT EXISTS idx_credit_payments_client ON credit_payments(client_id)',
        'CREATE INDEX IF NOT EXISTS idx_credit_payments_date ON credit_payments(payment_date)',

        // Index pour les fournisseurs
        'CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name)',
        'CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status)',

        // Index pour les lots de stock
        'CREATE INDEX IF NOT EXISTS idx_stock_lots_product ON stock_lots(product_id)',
        'CREATE INDEX IF NOT EXISTS idx_stock_lots_number ON stock_lots(lot_number)',
        'CREATE INDEX IF NOT EXISTS idx_stock_lots_status ON stock_lots(status)',
        'CREATE INDEX IF NOT EXISTS idx_stock_lots_supplier ON stock_lots(supplier_id)',

        // Index pour les mouvements de stock
        'CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id)',
        'CREATE INDEX IF NOT EXISTS idx_stock_movements_lot ON stock_movements(lot_id)',
        'CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date)',
        'CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type)',
        'CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id)'
    ];

    let indexCount = 0;
    let indexCreated = 0;
    performanceIndexes.forEach(indexSQL => {
        try {
            db.exec(indexSQL);
            indexCreated++;
            indexCount++;
        } catch (error) {
            // Index existe déjà, continuer
            indexCount++;
        }
    });

    console.log(`✅ ${indexCreated} nouveaux index créés, ${indexCount} index vérifiés au total`);

    // Optimisations SQLite pour la performance maximale
    console.log('⚡ Application des optimisations SQLite...');
    try {
        db.exec(`
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            PRAGMA cache_size = 10000;
            PRAGMA temp_store = MEMORY;
            PRAGMA mmap_size = 268435456;
            PRAGMA optimize;
        `);
        console.log('✅ Optimisations SQLite appliquées');
    } catch (error) {
        console.warn('⚠️ Erreur lors des optimisations SQLite:', error.message);
    }

    // Initialiser le paramètre d'impression automatique s'il n'existe pas
    try {
        const autoPrintSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('auto_print_tickets');
        if (!autoPrintSetting) {
            db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('auto_print_tickets', 'false');
            console.log('✅ Paramètre auto_print_tickets initialisé à false');
        }
    } catch (err) {
        console.warn('⚠️ Erreur lors de l\'initialisation du paramètre auto_print_tickets:', err.message);
    }

    // Migration : Ajouter la colonne original_sale_id si elle n'existe pas
    try {
        const columns = db.prepare("PRAGMA table_info(sales)").all();
        const hasOriginalSaleId = columns.some(col => col.name === 'original_sale_id');
        if (!hasOriginalSaleId) {
            console.log('Migration: Ajout de la colonne original_sale_id à la table sales');
            db.exec('ALTER TABLE sales ADD COLUMN original_sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL');
        }
    } catch (error) {
        console.error('Erreur lors de la migration original_sale_id:', error);
    }

    // Migration : Ajouter les colonnes pour le système de retours
    try {
        const columns = db.prepare("PRAGMA table_info(sales)").all();
        const columnNames = columns.map(col => col.name);

        if (!columnNames.includes('ticket_number')) {
            console.log('Migration: Ajout de la colonne ticket_number à la table sales');
            db.exec('ALTER TABLE sales ADD COLUMN ticket_number TEXT');
        }

        if (!columnNames.includes('has_returns')) {
            console.log('Migration: Ajout de la colonne has_returns à la table sales');
            db.exec('ALTER TABLE sales ADD COLUMN has_returns INTEGER NOT NULL DEFAULT 0');
        }

        if (!columnNames.includes('payment_method')) {
            console.log('Migration: Ajout de la colonne payment_method à la table sales');
            db.exec('ALTER TABLE sales ADD COLUMN payment_method TEXT NOT NULL DEFAULT "cash"');
        }
    } catch (error) {
        console.error('Erreur lors de la migration des colonnes de retours:', error);
    }

    // Migration : Attribuer des numéros de tickets aux ventes existantes qui n'en ont pas
    try {
        const salesWithoutTickets = db.prepare('SELECT id, sale_date FROM sales WHERE ticket_number IS NULL ORDER BY id ASC').all();

        if (salesWithoutTickets.length > 0) {
            console.log(`Migration: Attribution de numéros de tickets à ${salesWithoutTickets.length} ventes existantes`);

            const updateTicketStmt = db.prepare('UPDATE sales SET ticket_number = ? WHERE id = ?');

            for (const sale of salesWithoutTickets) {
                // Générer un numéro de ticket basé sur la date de vente
                const saleDate = new Date(sale.sale_date);
                const dateStr = saleDate.toISOString().slice(0, 10).replace(/-/g, '');
                const ticketNumber = `V-${dateStr}-${sale.id.toString().padStart(4, '0')}`;

                updateTicketStmt.run(ticketNumber, sale.id);
            }

            console.log('✅ Numéros de tickets attribués aux ventes existantes');
        }
    } catch (error) {
        console.error('Erreur lors de l\'attribution des numéros de tickets:', error);
    }

    // Migration : Ajouter la colonne payment_method si elle n'existe pas
    try {
        const columns = db.prepare("PRAGMA table_info(sales)").all();
        const hasPaymentMethod = columns.some(col => col.name === 'payment_method');
        if (!hasPaymentMethod) {
            console.log('Migration: Ajout de la colonne payment_method à la table sales');
            db.exec("ALTER TABLE sales ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash' CHECK(payment_method IN ('cash', 'check', 'credit'))");
        }
    } catch (error) {
        console.error('Erreur lors de la migration payment_method:', error);
    }

    // Migration : Ajouter les colonnes TVA aux factures si elles n'existent pas
    try {
        const invoiceColumns = db.prepare("PRAGMA table_info(invoices)").all();
        const hasSubtotalHt = invoiceColumns.some(col => col.name === 'subtotal_ht');
        const hasTvaRate = invoiceColumns.some(col => col.name === 'tva_rate');
        const hasTvaAmount = invoiceColumns.some(col => col.name === 'tva_amount');

        if (!hasSubtotalHt) {
            console.log('Migration: Ajout de la colonne subtotal_ht à la table invoices');
            db.exec('ALTER TABLE invoices ADD COLUMN subtotal_ht REAL NOT NULL DEFAULT 0');
        }
        if (!hasTvaRate) {
            console.log('Migration: Ajout de la colonne tva_rate à la table invoices');
            db.exec('ALTER TABLE invoices ADD COLUMN tva_rate REAL NOT NULL DEFAULT 20');
        }
        if (!hasTvaAmount) {
            console.log('Migration: Ajout de la colonne tva_amount à la table invoices');
            db.exec('ALTER TABLE invoices ADD COLUMN tva_amount REAL NOT NULL DEFAULT 0');
        }

        // Mettre à jour les factures existantes pour calculer la TVA
        if (!hasSubtotalHt || !hasTvaRate || !hasTvaAmount) {
            console.log('Migration: Mise à jour des factures existantes avec calculs TVA');
            const existingInvoices = db.prepare('SELECT id, total_amount FROM invoices WHERE subtotal_ht = 0').all();
            const updateStmt = db.prepare('UPDATE invoices SET subtotal_ht = ?, tva_rate = 20, tva_amount = ?, total_amount = ? WHERE id = ?');

            for (const invoice of existingInvoices) {
                const subtotalHt = invoice.total_amount / 1.20; // Supposer que l'ancien total incluait déjà la TVA à 20%
                const tvaAmount = subtotalHt * 0.20;
                const newTotal = subtotalHt + tvaAmount;
                updateStmt.run(subtotalHt, tvaAmount, newTotal, invoice.id);
            }
        }
    } catch (error) {
        console.error('Erreur lors de la migration TVA:', error);
    }

    // Migration pour ajouter la contrainte UNIQUE sur les clients
    try {
        // Vérifier si la contrainte existe déjà
        const tableInfo = db.prepare("PRAGMA table_info(clients)").all();
        const hasUniqueConstraint = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='clients'").get();

        if (hasUniqueConstraint && !hasUniqueConstraint.sql.includes('UNIQUE(name, phone)')) {
            console.log('Migration: Ajout de la contrainte UNIQUE sur les clients...');

            // Supprimer les doublons existants avant d'ajouter la contrainte
            db.exec(`
                DELETE FROM clients WHERE id NOT IN (
                    SELECT MIN(id) FROM clients
                    GROUP BY name, COALESCE(phone, '')
                );
            `);

            // Recréer la table avec la contrainte UNIQUE
            db.exec(`
                CREATE TABLE clients_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    phone TEXT,
                    address TEXT,
                    credit_balance REAL NOT NULL DEFAULT 0,
                    ice TEXT,
                    UNIQUE(name, phone)
                );

                INSERT INTO clients_new (id, name, phone, address, credit_balance, ice)
                SELECT id, name, phone, address, credit_balance, ice FROM clients;

                DROP TABLE clients;
                ALTER TABLE clients_new RENAME TO clients;
            `);

            console.log('Migration: Contrainte UNIQUE ajoutée avec succès');
        }
    } catch (error) {
        console.error('Erreur lors de la migration des contraintes clients:', error);
    }

    const ownerExists = db.prepare("SELECT id FROM users WHERE username = 'proprietaire'").get();
    if (!ownerExists) {
        const passwordHash = bcrypt.hashSync('admin', saltRounds);
        db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'Propriétaire')").run('proprietaire', passwordHash);
    }
    db.prepare("INSERT INTO clients (id, name, ice) SELECT 1, 'Client de passage', null WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = 1)").run();
}

const addProduct = (product) => { 
    const stmt = db.prepare("INSERT INTO products (barcode, name, purchase_price, price_retail, price_wholesale, price_carton, pieces_per_carton, stock, alert_threshold, category, image_path) VALUES (@barcode, @name, @purchase_price, @price_retail, @price_wholesale, @price_carton, @pieces_per_carton, @stock, @alert_threshold, @category, @image_path)"); 
    const info = stmt.run({ ...product, barcode: product.barcode || null, purchase_price: product.purchase_price || 0, price_carton: product.price_carton || 0, pieces_per_carton: product.pieces_per_carton || 0, image_path: product.image_path || null }); 
    return { id: info.lastInsertRowid, ...product }; 
};

const updateProduct = (product) => {
    const stmt = db.prepare("UPDATE products SET barcode = @barcode, name = @name, purchase_price = @purchase_price, price_retail = @price_retail, price_wholesale = @price_wholesale, price_carton = @price_carton, pieces_per_carton = @pieces_per_carton, stock = @stock, alert_threshold = @alert_threshold, category = @category, image_path = @image_path WHERE id = @id");
    stmt.run({ ...product, barcode: product.barcode || null, purchase_price: product.purchase_price || 0, price_carton: product.price_carton || 0, pieces_per_carton: product.pieces_per_carton || 0, image_path: product.image_path || null });
    return true;
};

const updateProductThreshold = (id, threshold) => {
    const stmt = db.prepare("UPDATE products SET alert_threshold = ? WHERE id = ?");
    stmt.run(threshold, id);
    return true;
};

const deleteProduct = (id) => { db.prepare("DELETE FROM products WHERE id = ?").run(id); return true; };

// ===== REQUÊTES OPTIMISÉES AVEC INDEX ET LIMIT =====
const getAllProducts = (searchTerm = '', limit = 1000) => {
    if (searchTerm && searchTerm.trim()) {
        // Recherche optimisée avec index sur name et barcode
        return db.prepare(`
            SELECT * FROM products
            WHERE name LIKE ? OR barcode LIKE ?
            ORDER BY name ASC
            LIMIT ?
        `).all(`%${searchTerm}%`, `%${searchTerm}%`, limit);
    }
    // Sans recherche, limiter quand même pour éviter les surcharges
    return db.prepare("SELECT * FROM products ORDER BY name ASC LIMIT ?").all(limit);
};

const getProductById = (id) => db.prepare("SELECT * FROM products WHERE id = ?").get(id);

const getCategories = () => {
    // Optimisé avec index sur category
    return db.prepare(`
        SELECT DISTINCT category
        FROM products
        WHERE category IS NOT NULL AND category != ''
        ORDER BY category ASC
    `).all().map(r => r.category);
};

const getLowStockProducts = () => {
    // Optimisé avec index composé sur stock et alert_threshold
    return db.prepare(`
        SELECT name, stock, alert_threshold
        FROM products
        WHERE stock <= alert_threshold AND alert_threshold > 0
        ORDER BY (alert_threshold - stock) DESC
    `).all();
};
const adjustStock = db.transaction((adjustments, reason, userId) => { const updateStmt = db.prepare('UPDATE products SET stock = ? WHERE id = ?'); const logStmt = db.prepare('INSERT INTO stock_adjustments (product_id, user_id, old_quantity, new_quantity, reason) VALUES (?, ?, ?, ?, ?)'); for (const adj of adjustments) { updateStmt.run(adj.newQuantity, adj.productId); logStmt.run(adj.productId, userId, adj.oldQuantity, adj.newQuantity, reason); } return { success: true }; });
const addClient = (client) => {
    // Validation des champs obligatoires
    if (!client.name || client.name.trim() === '') {
        throw new Error('VALIDATION_ERROR:Le nom du client est obligatoire');
    }

    // Nettoyer les données
    const cleanClient = {
        name: client.name.trim(),
        phone: client.phone && client.phone.trim() !== '' ? client.phone.trim() : null,
        address: client.address && client.address.trim() !== '' ? client.address.trim() : null,
        ice: client.ice && client.ice.trim() !== '' ? client.ice.trim() : null
    };

    // 1. VALIDATION BLOQUANTE - ICE (si renseigné)
    if (cleanClient.ice) {
        const existingICE = db.prepare("SELECT id, name, phone FROM clients WHERE ice = ? AND ice IS NOT NULL AND ice != ''").get(cleanClient.ice);
        if (existingICE) {
            throw new Error(`ICE_EXISTS:${existingICE.name}:${existingICE.phone || 'N/A'}:${existingICE.id}`);
        }
    }

    // 2. VALIDATION BLOQUANTE - Téléphone (si renseigné)
    if (cleanClient.phone) {
        const existingPhone = db.prepare("SELECT id, name, ice FROM clients WHERE phone = ?").get(cleanClient.phone);
        if (existingPhone) {
            throw new Error(`PHONE_EXISTS:${existingPhone.name}:${existingPhone.ice || 'N/A'}:${existingPhone.id}`);
        }
    }

    // 3. DÉTECTION NOM SIMILAIRE
    const similarClients = findSimilarClientNames(cleanClient.name);
    if (similarClients.length > 0) {
        const similarInfo = similarClients.map(c => `${c.id}:${c.name}:${c.phone || 'N/A'}:${c.ice || 'N/A'}`).join('|');
        throw new Error(`SIMILAR_NAME_FOUND:${similarInfo}`);
    }

    // 4. INSERTION si toutes les validations passent
    try {
        const stmt = db.prepare("INSERT INTO clients (name, phone, address, ice) VALUES (@name, @phone, @address, @ice)");
        const info = stmt.run(cleanClient);
        return { id: info.lastInsertRowid, ...cleanClient };
    } catch (error) {
        console.error('Erreur lors de l\'insertion du client:', error);
        throw new Error('INSERTION_ERROR:Erreur lors de l\'ajout du client');
    }
};

// Fonction pour détecter les noms similaires
const findSimilarClientNames = (name) => {
    // Normaliser le nom pour la comparaison (minuscules, sans accents)
    const normalizedName = name.toLowerCase()
        .replace(/[éèêë]/g, 'e')
        .replace(/[àâä]/g, 'a')
        .replace(/[îï]/g, 'i')
        .replace(/[ôö]/g, 'o')
        .replace(/[ùûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[ñ]/g, 'n')
        .trim();

    // Rechercher les noms identiques après normalisation
    return db.prepare(`
        SELECT id, name, phone, ice
        FROM clients
        WHERE LOWER(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(name, 'é', 'e'),
                                'è', 'e'),
                            'ê', 'e'),
                        'à', 'a'),
                    'â', 'a'),
                'ç', 'c'),
            'ñ', 'n')
        ) = ?
        AND id != 1
        ORDER BY name
    `).all(normalizedName);
};

// Fonction pour forcer l'ajout d'un client malgré un nom similaire
const forceAddClient = (client) => {
    // Nettoyer les données
    const cleanClient = {
        name: client.name.trim(),
        phone: client.phone && client.phone.trim() !== '' ? client.phone.trim() : null,
        address: client.address && client.address.trim() !== '' ? client.address.trim() : null,
        ice: client.ice && client.ice.trim() !== '' ? client.ice.trim() : null
    };

    // Validation obligatoire ICE et téléphone (même en mode forcé)
    if (cleanClient.ice) {
        const existingICE = db.prepare("SELECT id, name, phone FROM clients WHERE ice = ? AND ice IS NOT NULL AND ice != ''").get(cleanClient.ice);
        if (existingICE) {
            throw new Error(`ICE_EXISTS:${existingICE.name}:${existingICE.phone || 'N/A'}:${existingICE.id}`);
        }
    }

    if (cleanClient.phone) {
        const existingPhone = db.prepare("SELECT id, name, ice FROM clients WHERE phone = ?").get(cleanClient.phone);
        if (existingPhone) {
            throw new Error(`PHONE_EXISTS:${existingPhone.name}:${existingPhone.ice || 'N/A'}:${existingPhone.id}`);
        }
    }

    // Insertion directe sans vérification de nom similaire
    try {
        const stmt = db.prepare("INSERT INTO clients (name, phone, address, ice) VALUES (@name, @phone, @address, @ice)");
        const info = stmt.run(cleanClient);
        return { id: info.lastInsertRowid, ...cleanClient };
    } catch (error) {
        console.error('Erreur lors de l\'insertion forcée du client:', error);
        throw new Error('INSERTION_ERROR:Erreur lors de l\'ajout du client');
    }
};

const updateClient = (client) => { db.prepare("UPDATE clients SET name = ?, phone = ?, address = ?, ice = ? WHERE id = ?").run(client.name, client.phone || null, client.address || null, client.ice || null, client.id); return true; };
const deleteClient = (id) => { if (id === 1) return false; db.prepare("DELETE FROM clients WHERE id = ?").run(id); return true; };

// ===== REQUÊTES CLIENTS OPTIMISÉES =====
const getAllClients = (searchTerm = '', limit = 1000) => {
    if (searchTerm && searchTerm.trim()) {
        // Recherche optimisée avec index sur name et phone
        return db.prepare(`
            SELECT * FROM clients
            WHERE name LIKE ? OR phone LIKE ?
            ORDER BY name ASC
            LIMIT ?
        `).all(`%${searchTerm}%`, `%${searchTerm}%`, limit);
    }
    // Sans recherche, limiter pour éviter les surcharges
    return db.prepare("SELECT * FROM clients ORDER BY name ASC LIMIT ?").all(limit);
};

const getClientById = (id) => db.prepare("SELECT * FROM clients WHERE id = ?").get(id);

// Fonction utilitaire pour nettoyer les doublons existants
const cleanupDuplicateClients = () => {
    try {
        const duplicates = db.prepare(`
            SELECT name, phone, COUNT(*) as count, GROUP_CONCAT(id) as ids
            FROM clients
            WHERE id != 1  -- Exclure le client de passage
            GROUP BY name, COALESCE(phone, '')
            HAVING COUNT(*) > 1
        `).all();

        // ===== OPTIMISATION: TRANSACTION GROUPÉE AU LIEU DE BOUCLES =====
        let totalRemoved = 0;

        // Préparer la requête de suppression une seule fois
        const deleteStmt = db.prepare("DELETE FROM clients WHERE id = ?");

        // Utiliser une transaction pour grouper toutes les suppressions
        const cleanupTransaction = db.transaction(() => {
            duplicates.forEach(duplicate => {
                const ids = duplicate.ids.split(',').map(id => parseInt(id));
                const keepId = Math.min(...ids); // Garder le plus ancien
                const removeIds = ids.filter(id => id !== keepId);

                // Supprimer tous les doublons en une fois dans la transaction
                removeIds.forEach(id => {
                    deleteStmt.run(id);
                    totalRemoved++;
                });

                console.log(`Doublons supprimés pour "${duplicate.name}" (${duplicate.phone || 'N/A'}): gardé ID ${keepId}, supprimé ${removeIds.length} doublons`);
            });
        });

        // Exécuter toutes les suppressions en une seule transaction (beaucoup plus rapide)
        cleanupTransaction();

        console.log(`Nettoyage terminé: ${totalRemoved} doublons supprimés`);
        return { removed: totalRemoved, duplicates: duplicates.length };
    } catch (error) {
        console.error('Erreur lors du nettoyage des doublons:', error);
        throw error;
    }
};

/**
 * Traiter une sortie de stock avec méthode FIFO
 * @param {number} productId - ID du produit
 * @param {number} quantityToDeduct - Quantité à déduire
 * @param {number} saleId - ID de la vente (pour traçabilité)
 * @returns {number} Coût réel moyen pondéré de la sortie
 */
const processStockOutFIFO = (productId, quantityToDeduct, saleId) => {
    // Récupérer les lots disponibles triés par date (FIFO)
    const availableLotsStmt = db.prepare(`
        SELECT * FROM stock_lots
        WHERE product_id = ? AND quantity > 0
        ORDER BY purchase_date ASC, id ASC
    `);
    const availableLots = availableLotsStmt.all(productId);

    if (availableLots.length === 0) {
        throw new Error(`Aucun lot disponible pour le produit ID ${productId}`);
    }

    let remainingToDeduct = quantityToDeduct;
    let totalCost = 0;
    let totalQuantityDeducted = 0;

    const updateLotStmt = db.prepare(`
        UPDATE stock_lots
        SET quantity = ?,
            status = CASE WHEN ? <= 0 THEN 'SOLD_OUT' ELSE 'AVAILABLE' END,
            updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')
        WHERE id = ?
    `);

    const recordMovementStmt = db.prepare(`
        INSERT INTO stock_movements (
            product_id, lot_id, movement_type, quantity, unit_cost,
            reference_type, reference_id, movement_date, notes
        ) VALUES (?, ?, 'OUT', ?, ?, 'SALE', ?, strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'), ?)
    `);

    // Traiter chaque lot selon FIFO
    for (const lot of availableLots) {
        if (remainingToDeduct <= 0) break;

        const quantityFromThisLot = Math.min(remainingToDeduct, lot.quantity);
        const newLotQuantity = lot.quantity - quantityFromThisLot;

        // Mettre à jour le lot
        updateLotStmt.run(newLotQuantity, newLotQuantity, lot.id);

        // Enregistrer le mouvement
        recordMovementStmt.run(
            productId,
            lot.id,
            -quantityFromThisLot, // Négatif pour sortie
            lot.purchase_price,
            saleId,
            `Vente - Sortie FIFO de ${quantityFromThisLot} unités`
        );

        // Calculer le coût
        totalCost += quantityFromThisLot * lot.purchase_price;
        totalQuantityDeducted += quantityFromThisLot;
        remainingToDeduct -= quantityFromThisLot;
    }

    if (remainingToDeduct > 0) {
        throw new Error(`Stock insuffisant pour le produit ID ${productId}. Manque ${remainingToDeduct} unités.`);
    }

    // Synchroniser automatiquement le stock global
    syncProductStockWithLots(productId);

    // Retourner le coût moyen pondéré
    return totalQuantityDeducted > 0 ? totalCost / totalQuantityDeducted : 0;
};

/**
 * Synchroniser le stock global d'un produit avec ses lots
 * @param {number} productId - ID du produit
 * @returns {number} Nouveau stock total
 */
const syncProductStockWithLots = (productId) => {
    const totalStock = db.prepare(`
        SELECT COALESCE(SUM(quantity), 0) as total
        FROM stock_lots
        WHERE product_id = ? AND quantity > 0
    `).get(productId).total;

    db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(totalStock, productId);

    return totalStock;
};

/**
 * Synchroniser tous les stocks avec leurs lots
 * @returns {Object} Résultat de la synchronisation
 */
const syncAllProductsStockWithLots = () => {
    const products = db.prepare('SELECT id FROM products').all();
    let updatedCount = 0;

    const transaction = db.transaction(() => {
        for (const product of products) {
            syncProductStockWithLots(product.id);
            updatedCount++;
        }
    });

    transaction();

    return { success: true, updatedCount };
};

// ===== INTÉGRATION TRANSPARENTE STOCK/LOTS =====

/**
 * Créer un lot générique automatiquement
 * @param {number} productId - ID du produit
 * @param {number} quantity - Quantité à ajouter
 * @returns {Object} Lot créé
 */
const createGenericLot = (productId, quantity) => {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
        throw new Error('Produit non trouvé');
    }

    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').split('.')[0];
    const lotNumber = `AUTO-${timestamp}`;

    const lotData = {
        product_id: productId,
        lot_number: lotNumber,
        quantity: quantity,
        purchase_price: product.purchase_price || 0,
        expiry_date: null,
        status: 'AVAILABLE'
    };

    return createStockLot(lotData);
};

/**
 * Ajuster le stock directement (interface simple)
 * @param {number} productId - ID du produit
 * @param {number} newStock - Nouveau stock total
 * @returns {Object} Résultat de l'ajustement
 */
const adjustStockDirectly = db.transaction((productId, newStock) => {
    // Récupérer le stock actuel
    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
    if (!product) {
        throw new Error('Produit non trouvé');
    }

    const currentStock = product.stock;
    const difference = newStock - currentStock;

    if (difference === 0) {
        return { success: true, message: 'Aucun changement nécessaire' };
    }

    if (difference > 0) {
        // Augmentation : Ajouter au dernier lot ou créer un lot générique
        addToLastLot(productId, difference);
    } else {
        // Réduction : Supprimer du dernier lot (LIFO)
        reduceStockLIFO(productId, Math.abs(difference));
    }

    // Synchroniser le stock global
    syncProductStockWithLots(productId);

    return {
        success: true,
        oldStock: currentStock,
        newStock: newStock,
        difference: difference,
        message: `Stock ajusté de ${currentStock} à ${newStock} (${difference > 0 ? '+' : ''}${difference})`
    };
});

/**
 * Ajouter des unités au dernier lot ou créer un lot générique
 * @param {number} productId - ID du produit
 * @param {number} quantity - Quantité à ajouter
 */
const addToLastLot = (productId, quantity) => {
    // Récupérer le dernier lot créé pour ce produit
    const lastLot = db.prepare(`
        SELECT * FROM stock_lots
        WHERE product_id = ? AND status = 'AVAILABLE'
        ORDER BY created_at DESC
        LIMIT 1
    `).get(productId);

    if (lastLot) {
        // Ajouter au dernier lot existant
        const newQuantity = lastLot.quantity + quantity;
        db.prepare(`
            UPDATE stock_lots
            SET quantity = ?,
                updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')
            WHERE id = ?
        `).run(newQuantity, lastLot.id);

        console.log(`✅ Ajouté ${quantity} unités au lot ${lastLot.lot_number} (${lastLot.quantity} → ${newQuantity})`);
    } else {
        // Créer un nouveau lot générique
        createGenericLot(productId, quantity);
        console.log(`✅ Créé un lot générique avec ${quantity} unités`);
    }
};

/**
 * Réduire le stock en utilisant la logique LIFO (Last In, First Out)
 * @param {number} productId - ID du produit
 * @param {number} quantityToReduce - Quantité à réduire
 */
const reduceStockLIFO = (productId, quantityToReduce) => {
    // Récupérer les lots par ordre décroissant de création (LIFO)
    const lots = db.prepare(`
        SELECT * FROM stock_lots
        WHERE product_id = ? AND status = 'AVAILABLE' AND quantity > 0
        ORDER BY created_at DESC
    `).all(productId);

    let remainingToReduce = quantityToReduce;

    for (const lot of lots) {
        if (remainingToReduce <= 0) break;

        if (lot.quantity >= remainingToReduce) {
            // Ce lot peut absorber toute la réduction
            const newQuantity = lot.quantity - remainingToReduce;

            if (newQuantity === 0) {
                // Supprimer le lot complètement
                db.prepare('DELETE FROM stock_lots WHERE id = ?').run(lot.id);
                console.log(`🗑️ Lot ${lot.lot_number} supprimé complètement`);
            } else {
                // Réduire la quantité du lot
                db.prepare(`
                    UPDATE stock_lots
                    SET quantity = ?,
                        updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')
                    WHERE id = ?
                `).run(newQuantity, lot.id);
                console.log(`📉 Lot ${lot.lot_number} réduit de ${lot.quantity} à ${newQuantity}`);
            }

            remainingToReduce = 0;
        } else {
            // Ce lot sera complètement supprimé
            db.prepare('DELETE FROM stock_lots WHERE id = ?').run(lot.id);
            remainingToReduce -= lot.quantity;
            console.log(`🗑️ Lot ${lot.lot_number} supprimé complètement (${lot.quantity} unités)`);
        }
    }

    if (remainingToReduce > 0) {
        console.warn(`⚠️ Impossible de réduire de ${remainingToReduce} unités supplémentaires (stock insuffisant)`);
    }
};

/**
 * Migrer automatiquement un produit vers le système de lots s'il n'en a pas
 * @param {number} productId - ID du produit
 * @returns {Object} Résultat de la migration
 */
const ensureProductHasLots = (productId) => {
    // Vérifier si le produit a déjà des lots
    const existingLots = db.prepare(`
        SELECT COUNT(*) as count FROM stock_lots
        WHERE product_id = ? AND status = 'AVAILABLE'
    `).get(productId);

    if (existingLots.count > 0) {
        return { success: true, message: 'Produit déjà géré par lots' };
    }

    // Récupérer le produit
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
        throw new Error('Produit non trouvé');
    }

    // Si le produit a du stock, créer un lot générique
    if (product.stock > 0) {
        createGenericLot(productId, product.stock);
        return {
            success: true,
            message: `Lot générique créé avec ${product.stock} unités`,
            lotCreated: true
        };
    }

    return {
        success: true,
        message: 'Produit prêt pour la gestion par lots',
        lotCreated: false
    };
};

/**
 * Migrer automatiquement tous les produits vers le système de lots
 * @returns {Object} Résultat global de la migration
 */
const ensureAllProductsHaveLots = () => {
    const products = db.prepare('SELECT id, name, stock FROM products').all();
    let migratedCount = 0;
    let lotsCreated = 0;

    for (const product of products) {
        try {
            const result = ensureProductHasLots(product.id);
            if (result.lotCreated) {
                lotsCreated++;
            }
            migratedCount++;
        } catch (error) {
            console.error(`Erreur lors de la migration du produit ${product.name}:`, error);
        }
    }

    return {
        success: true,
        migratedCount,
        lotsCreated,
        message: `${migratedCount} produits vérifiés, ${lotsCreated} lots génériques créés`
    };
};

// ===== GESTION DES PRÉFÉRENCES UTILISATEUR =====

/**
 * Sauvegarder les préférences de filtrage des lots
 * @param {number} userId - ID de l'utilisateur (optionnel)
 * @param {Object} preferences - Préférences à sauvegarder
 * @returns {Object} Résultat
 */
const saveLotFilterPreferences = (userId = 1, preferences) => {
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO user_preferences (user_id, preference_key, preference_value)
        VALUES (?, 'lot_filters', ?)
    `);

    try {
        stmt.run(userId, JSON.stringify(preferences));
        return { success: true };
    } catch (error) {
        // Si la table n'existe pas, la créer
        try {
            db.prepare(`
                CREATE TABLE IF NOT EXISTS user_preferences (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL DEFAULT 1,
                    preference_key TEXT NOT NULL,
                    preference_value TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
                    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
                    UNIQUE(user_id, preference_key)
                )
            `).run();

            // Réessayer la sauvegarde
            stmt.run(userId, JSON.stringify(preferences));
            return { success: true };
        } catch (createError) {
            console.error('Erreur lors de la création de la table user_preferences:', createError);
            return { success: false, error: createError.message };
        }
    }
};

/**
 * Récupérer les préférences de filtrage des lots
 * @param {number} userId - ID de l'utilisateur (optionnel)
 * @returns {Object} Préférences ou valeurs par défaut
 */
const getLotFilterPreferences = (userId = 1) => {
    const defaultPreferences = {
        sortBy: 'created_at',
        sortOrder: 'DESC',
        statusFilter: 'ALL',
        searchTerm: '',
        expiryFilter: 'ALL'
    };

    try {
        const result = db.prepare(`
            SELECT preference_value
            FROM user_preferences
            WHERE user_id = ? AND preference_key = 'lot_filters'
        `).get(userId);

        if (result) {
            return { ...defaultPreferences, ...JSON.parse(result.preference_value) };
        }
    } catch (error) {
        console.warn('Erreur lors de la récupération des préférences:', error);
    }

    return defaultPreferences;
};

// ===== GESTION DES FOURNISSEURS =====

/**
 * Créer un nouveau fournisseur
 * @param {Object} supplierData - Données du fournisseur
 * @returns {Object} Résultat avec ID du fournisseur créé
 */
const createSupplier = (supplierData) => {
    const {
        name, company, email, phone, address, city, postal_code,
        country = 'Maroc', tax_id, payment_terms = 30,
        credit_limit = 0, discount_rate = 0, status = 'ACTIVE', notes
    } = supplierData;

    if (!name || name.trim() === '') {
        throw new Error('Le nom du fournisseur est obligatoire');
    }

    const stmt = db.prepare(`
        INSERT INTO suppliers (
            name, company, email, phone, address, city, postal_code,
            country, tax_id, payment_terms, credit_limit, discount_rate,
            status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
        const result = stmt.run(
            name.trim(), company, email, phone, address, city, postal_code,
            country, tax_id, payment_terms, credit_limit, discount_rate,
            status, notes
        );

        return {
            success: true,
            id: result.lastInsertRowid,
            message: 'Fournisseur créé avec succès'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Obtenir tous les fournisseurs
 * @param {Object} options - Options de filtrage
 * @returns {Array} Liste des fournisseurs
 */
const getAllSuppliers = (options = {}) => {
    const { status = 'ALL', search = '', sortBy = 'name', sortOrder = 'ASC' } = options;

    let sql = 'SELECT * FROM suppliers WHERE 1=1';
    const params = [];

    if (status !== 'ALL') {
        sql += ' AND status = ?';
        params.push(status);
    }

    if (search) {
        sql += ' AND (name LIKE ? OR company LIKE ? OR email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const validSortColumns = ['name', 'company', 'created_at', 'status'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    sql += ` ORDER BY ${sortColumn} ${order}`;

    return db.prepare(sql).all(...params);
};

/**
 * Obtenir un fournisseur par ID
 * @param {number} supplierId - ID du fournisseur
 * @returns {Object|null} Fournisseur ou null
 */
const getSupplierById = (supplierId) => {
    return db.prepare('SELECT * FROM suppliers WHERE id = ?').get(supplierId);
};

/**
 * Mettre à jour un fournisseur
 * @param {number} supplierId - ID du fournisseur
 * @param {Object} supplierData - Nouvelles données
 * @returns {Object} Résultat
 */
const updateSupplier = (supplierId, supplierData) => {
    const supplier = getSupplierById(supplierId);
    if (!supplier) {
        return { success: false, error: 'Fournisseur non trouvé' };
    }

    const {
        name, company, email, phone, address, city, postal_code,
        country, tax_id, payment_terms, credit_limit, discount_rate,
        status, notes
    } = supplierData;

    if (!name || name.trim() === '') {
        return { success: false, error: 'Le nom du fournisseur est obligatoire' };
    }

    const stmt = db.prepare(`
        UPDATE suppliers SET
            name = ?, company = ?, email = ?, phone = ?, address = ?,
            city = ?, postal_code = ?, country = ?, tax_id = ?,
            payment_terms = ?, credit_limit = ?, discount_rate = ?,
            status = ?, notes = ?,
            updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')
        WHERE id = ?
    `);

    try {
        stmt.run(
            name.trim(), company, email, phone, address, city, postal_code,
            country, tax_id, payment_terms, credit_limit, discount_rate,
            status, notes, supplierId
        );

        return {
            success: true,
            message: 'Fournisseur mis à jour avec succès'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Supprimer un fournisseur
 * @param {number} supplierId - ID du fournisseur
 * @returns {Object} Résultat
 */
const deleteSupplier = (supplierId) => {
    // Vérifier s'il y a des lots liés
    const lotsCount = db.prepare('SELECT COUNT(*) as count FROM stock_lots WHERE supplier_id = ?').get(supplierId).count;

    if (lotsCount > 0) {
        return {
            success: false,
            error: `Impossible de supprimer ce fournisseur car il est lié à ${lotsCount} lot(s). Désactivez-le plutôt.`
        };
    }

    try {
        const result = db.prepare('DELETE FROM suppliers WHERE id = ?').run(supplierId);

        if (result.changes === 0) {
            return { success: false, error: 'Fournisseur non trouvé' };
        }

        return {
            success: true,
            message: 'Fournisseur supprimé avec succès'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Obtenir les statistiques d'un fournisseur
 * @param {number} supplierId - ID du fournisseur
 * @returns {Object} Statistiques du fournisseur
 */
const getSupplierStats = (supplierId) => {
    try {
        // Statistiques des lots
        const lotsStats = db.prepare(`
            SELECT
                COUNT(*) as total_lots,
                COUNT(CASE WHEN quantity > 0 THEN 1 END) as active_lots,
                COALESCE(SUM(quantity), 0) as total_quantity,
                COALESCE(SUM(quantity * purchase_price), 0) as total_value,
                COALESCE(AVG(purchase_price), 0) as avg_price
            FROM stock_lots
            WHERE supplier_id = ?
        `).get(supplierId);

        // Derniers lots
        const recentLots = db.prepare(`
            SELECT sl.*, p.name as product_name
            FROM stock_lots sl
            LEFT JOIN products p ON sl.product_id = p.id
            WHERE sl.supplier_id = ?
            ORDER BY sl.created_at DESC
            LIMIT 5
        `).all(supplierId);

        // Produits fournis
        const productsCount = db.prepare(`
            SELECT COUNT(DISTINCT product_id) as count
            FROM stock_lots
            WHERE supplier_id = ?
        `).get(supplierId).count;

        return {
            ...lotsStats,
            products_count: productsCount,
            recent_lots: recentLots
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques fournisseur:', error);
        return {
            total_lots: 0,
            active_lots: 0,
            total_quantity: 0,
            total_value: 0,
            avg_price: 0,
            products_count: 0,
            recent_lots: []
        };
    }
};

/**
 * Obtenir les fournisseurs avec leurs statistiques
 * @param {Object} options - Options de filtrage
 * @returns {Array} Fournisseurs avec statistiques
 */
const getSuppliersWithStats = (options = {}) => {
    const suppliers = getAllSuppliers(options);

    return suppliers.map(supplier => ({
        ...supplier,
        stats: getSupplierStats(supplier.id)
    }));
};

/**
 * Effectuer des actions en lot sur plusieurs lots
 * @param {Array} lotIds - IDs des lots
 * @param {string} action - Action à effectuer ('delete', 'update_status', 'update_expiry')
 * @param {Object} actionData - Données pour l'action
 * @returns {Object} Résultat
 */
const performBulkLotAction = (lotIds, action, actionData = {}) => {
    if (!Array.isArray(lotIds) || lotIds.length === 0) {
        return { success: false, error: 'Aucun lot sélectionné' };
    }

    const transaction = db.transaction(() => {
        let affectedCount = 0;

        switch (action) {
            case 'delete':
                const deleteStmt = db.prepare('DELETE FROM stock_lots WHERE id = ?');
                for (const lotId of lotIds) {
                    const result = deleteStmt.run(lotId);
                    affectedCount += result.changes;
                }
                break;

            case 'update_status':
                const statusStmt = db.prepare(`
                    UPDATE stock_lots
                    SET status = ?, updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')
                    WHERE id = ?
                `);
                for (const lotId of lotIds) {
                    const result = statusStmt.run(actionData.status, lotId);
                    affectedCount += result.changes;
                }
                break;

            case 'update_expiry':
                const expiryStmt = db.prepare(`
                    UPDATE stock_lots
                    SET expiry_date = ?, updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')
                    WHERE id = ?
                `);
                for (const lotId of lotIds) {
                    const result = expiryStmt.run(actionData.expiry_date, lotId);
                    affectedCount += result.changes;
                }
                break;

            default:
                throw new Error(`Action non supportée: ${action}`);
        }

        return affectedCount;
    });

    try {
        const affectedCount = transaction();
        return {
            success: true,
            affectedCount,
            message: `${affectedCount} lot(s) modifié(s)`
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};









/**
 * Migrer les données existantes vers le système de lots
 */
const migrateToStockLots = () => {
    try {
        console.log('🚀 Début de la migration vers la gestion par lots...');

        // Vérifier si la migration a déjà été effectuée
        const existingLots = db.prepare('SELECT COUNT(*) as count FROM stock_lots').get();
        if (existingLots.count > 0) {
            console.log('⚠️  La migration semble déjà avoir été effectuée.');
            return { success: true, message: 'Migration déjà effectuée' };
        }

        // Récupérer tous les produits avec stock
        const products = db.prepare(`
            SELECT id, name, stock, purchase_price, category
            FROM products
            WHERE stock > 0
            ORDER BY id
        `).all();

        console.log(`📦 ${products.length} produits avec stock trouvés`);

        if (products.length === 0) {
            return { success: true, message: 'Aucun produit avec stock à migrer' };
        }

        // Commencer une transaction
        const transaction = db.transaction(() => {
            let lotsCreated = 0;
            let movementsCreated = 0;

            // Préparer les requêtes
            const insertLotStmt = db.prepare(`
                INSERT INTO stock_lots (
                    product_id, lot_number, quantity, purchase_price,
                    purchase_date, status, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const insertMovementStmt = db.prepare(`
                INSERT INTO stock_movements (
                    product_id, lot_id, movement_type, quantity,
                    unit_cost, reference_type, movement_date, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const insertValuationStmt = db.prepare(`
                INSERT INTO product_valuation_settings (
                    product_id, valuation_method, auto_lot_creation, track_expiry
                ) VALUES (?, ?, ?, ?)
            `);

            // Traiter chaque produit
            for (const product of products) {
                // Générer un numéro de lot unique pour la migration
                const lotNumber = `MIG-${Date.now()}-${product.id}`;
                const migrationDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

                // Créer le lot initial
                const lotResult = insertLotStmt.run(
                    product.id,
                    lotNumber,
                    product.stock,
                    product.purchase_price,
                    migrationDate,
                    'AVAILABLE',
                    'Lot créé lors de la migration depuis l\'ancien système'
                );

                const lotId = lotResult.lastInsertRowid;
                lotsCreated++;

                // Créer le mouvement d'entrée correspondant
                insertMovementStmt.run(
                    product.id,
                    lotId,
                    'IN',
                    product.stock,
                    product.purchase_price,
                    'MIGRATION',
                    migrationDate,
                    `Migration du stock existant: ${product.stock} unités à ${product.purchase_price} MAD`
                );
                movementsCreated++;

                // Créer les paramètres de valorisation par défaut
                insertValuationStmt.run(
                    product.id,
                    'FIFO', // Méthode par défaut
                    1,      // Auto création de lots activée
                    0       // Suivi d'expiration désactivé par défaut
                );

                console.log(`✅ Produit "${product.name}": Lot ${lotNumber} créé avec ${product.stock} unités`);
            }

            return { lotsCreated, movementsCreated, productsProcessed: products.length };
        });

        // Exécuter la transaction
        const result = transaction();

        console.log(`📊 Migration terminée:`);
        console.log(`   - ${result.lotsCreated} lots créés`);
        console.log(`   - ${result.movementsCreated} mouvements créés`);
        console.log(`   - ${result.productsProcessed} paramètres de valorisation créés`);

        return {
            success: true,
            message: `Migration réussie: ${result.lotsCreated} lots créés`,
            ...result
        };

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        return { success: false, error: error.message };
    }
};

const processSale = db.transaction((saleData) => {
    const { clientId, userId, cart, total, amountPaidCash, credit, paymentMethod = 'cash' } = saleData;

    // Générer un numéro de ticket unique
    const ticketNumber = generateUniqueTicketNumber('sale');

    const saleStmt = db.prepare(`INSERT INTO sales (client_id, user_id, total_amount, amount_paid_cash, amount_paid_credit, payment_method, ticket_number) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const saleResult = saleStmt.run(clientId, userId, total, amountPaidCash, credit, paymentMethod, ticketNumber);
    const saleId = saleResult.lastInsertRowid;
    if (!saleId) throw new Error("La création de la vente a échoué.");
    // ===== OPTIMISATION: PRÉPARER TOUTES LES REQUÊTES UNE SEULE FOIS =====
    const getProductInfoStmt = db.prepare('SELECT pieces_per_carton FROM products WHERE id = ?');
    const updateStockStmt = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    const insertItemStmt = db.prepare(`INSERT INTO sale_items (sale_id, product_id, quantity, unit, unit_price, line_total, purchase_price) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const getTotalLotQuantityStmt = db.prepare(`
        SELECT COALESCE(SUM(quantity), 0) as total
        FROM stock_lots
        WHERE product_id = ? AND quantity > 0
    `);
    const updateProductStockStmt = db.prepare('UPDATE products SET stock = ? WHERE id = ?');

    // Récupérer toutes les infos produits en une seule fois (évite N requêtes)
    const productIds = cart.map(item => item.id);
    const productInfos = new Map();

    if (productIds.length > 0) {
        const placeholders = productIds.map(() => '?').join(',');
        const allProductInfos = db.prepare(`
            SELECT id, pieces_per_carton
            FROM products
            WHERE id IN (${placeholders})
        `).all(...productIds);

        allProductInfos.forEach(info => {
            productInfos.set(info.id, info);
        });
    }

    // Traiter tous les items avec les données pré-chargées
    for (const item of cart) {
        let stockToDeduct = item.quantity;

        if (item.unit === 'carton') {
            const productInfo = productInfos.get(item.id);
            if (productInfo && productInfo.pieces_per_carton > 0) {
                stockToDeduct = item.quantity * productInfo.pieces_per_carton;
            } else {
                console.warn(`Produit ID ${item.id} vendu en carton sans 'pieces_per_carton' défini.`);
            }
        }

        // Utiliser la gestion par lots FIFO pour calculer le coût réel
        let realPurchasePrice = item.purchase_price || 0;
        try {
            realPurchasePrice = processStockOutFIFO(item.id, stockToDeduct, saleId);
        } catch (error) {
            console.warn(`Erreur FIFO pour produit ${item.id}, utilisation du stock global:`, error.message);
            // Fallback vers l'ancienne méthode si les lots ne sont pas disponibles
            updateStockStmt.run(stockToDeduct, item.id);
        }

        insertItemStmt.run(saleId, item.id, item.quantity, item.unit || 'piece', item.price, item.quantity * item.price, realPurchasePrice);

        // Mettre à jour le stock global (somme des lots) - requête préparée
        const totalLotQuantity = getTotalLotQuantityStmt.get(item.id).total;
        updateProductStockStmt.run(totalLotQuantity, item.id);
    }
    if (credit > 0 && clientId !== 1) {
        db.prepare('UPDATE clients SET credit_balance = credit_balance + ? WHERE id = ?').run(credit, clientId);
    }
    return { success: true, saleId: saleId, ticketNumber: ticketNumber };
});

// MODIFIÉ : La fonction de recherche dans l'historique a été entièrement réécrite
const getSalesHistory = (filters = {}) => {
    let sql = `
        SELECT
            s.id as sale_id,
            s.sale_date,
            s.status,
            s.total_amount,
            s.amount_paid_cash,
            s.amount_paid_credit,
            s.payment_method,
            s.original_sale_id,
            p.name as product_name,
            si.quantity,
            si.unit,
            si.unit_price,
            si.line_total,
            c.name as client_name,
            u.username as user_name,
            CASE
                WHEN s.original_sale_id IS NOT NULL THEN 'CORRECTION'
                WHEN EXISTS(SELECT 1 FROM sales WHERE original_sale_id = s.id) THEN 'CORRECTED'
                ELSE s.status
            END as display_status
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        LEFT JOIN clients c ON s.client_id = c.id
        JOIN users u ON s.user_id = u.id
        WHERE 1=1
    `;
    const params = [];

    if (filters.clientId) {
        sql += ' AND s.client_id = ?';
        params.push(filters.clientId);
    }
    if (filters.productId) {
        sql += ' AND si.product_id = ?';
        params.push(filters.productId);
    }
    if (filters.startDate) {
        sql += ' AND date(s.sale_date) >= ?';
        params.push(filters.startDate);
    }
    if (filters.endDate) {
        sql += ' AND date(s.sale_date) <= ?';
        params.push(filters.endDate);
    }
    
    // ===== OPTIMISATION PERFORMANCE =====
    // Toujours limiter les résultats pour éviter les surcharges
    sql += ' ORDER BY s.sale_date DESC LIMIT ?';
    const limit = filters.limit || 500; // Limite par défaut pour éviter les surcharges
    params.push(limit);

    return db.prepare(sql).all(params);
};

// ===== REQUÊTE UTILISATEUR OPTIMISÉE =====
const getHistoryForUser = (userId, limit = 100) => {
    return db.prepare(`
        SELECT s.id, s.sale_date, s.total_amount, s.status, c.name as client_name
        FROM sales s
        JOIN clients c ON s.client_id = c.id
        WHERE s.user_id = ? AND date(s.sale_date) = date('now', 'localtime')
        ORDER BY s.sale_date DESC
        LIMIT ?
    `).all(userId, limit);
};

// Nouvelle fonction pour récupérer l'historique des ventes d'un client spécifique
const getClientSalesHistory = (clientId) => {
    const sales = db.prepare(`
        SELECT s.id, s.sale_date, s.total_amount, s.status, s.payment_method,
               s.amount_paid_cash, s.amount_paid_credit,
               c.name as client_name, c.id as client_id
        FROM sales s
        JOIN clients c ON s.client_id = c.id
        WHERE s.client_id = ?
        ORDER BY s.sale_date DESC
    `).all(clientId);

    // ===== CORRECTION REQUÊTE N+1 =====
    // AVANT: 1 requête pour les ventes + N requêtes pour les items (très lent)
    // APRÈS: 1 seule requête avec JOIN pour tout récupérer (très rapide)

    const salesWithItems = db.prepare(`
        SELECT
            s.id as sale_id,
            s.sale_date,
            s.total_amount,
            s.status,
            s.payment_method,
            s.amount_paid_cash,
            s.amount_paid_credit,
            s.client_name,
            s.client_id,
            si.id as item_id,
            si.quantity,
            si.unit,
            si.unit_price,
            si.line_total,
            p.name as product_name
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
        WHERE s.client_id = ?
        ORDER BY s.sale_date DESC, si.id ASC
        LIMIT 1000
    `).all(clientId);

    // Grouper efficacement par vente (évite les requêtes répétées)
    const salesMap = new Map();

    salesWithItems.forEach(row => {
        if (!salesMap.has(row.sale_id)) {
            salesMap.set(row.sale_id, {
                id: row.sale_id,
                sale_date: row.sale_date,
                total_amount: row.total_amount,
                status: row.status,
                payment_method: row.payment_method,
                client_name: row.client_name,
                client_id: row.client_id,
                advance_paid: row.amount_paid_cash || 0,
                credit_amount: row.amount_paid_credit || 0,
                remaining_balance: (row.total_amount - (row.amount_paid_cash || 0)),
                products: []
            });
        }

        // Ajouter le produit s'il existe
        if (row.item_id) {
            salesMap.get(row.sale_id).products.push({
                name: row.product_name,
                quantity: row.quantity,
                price: row.unit_price,
                unit: row.unit,
                total: row.line_total
            });
        }
    });

    return Array.from(salesMap.values());
};
// ===== CORRECTION REQUÊTE N+1 DANS getSaleDetails =====
const getSaleDetails = (saleId) => {
    // AVANT: 4 requêtes séparées (sale + items + corrections + original)
    // APRÈS: 1 requête principale + requêtes conditionnelles optimisées

    // Requête principale avec tous les détails en une fois
    const saleWithItems = db.prepare(`
        SELECT
            s.*,
            c.name as client_name,
            si.id as item_id,
            si.quantity,
            si.unit,
            si.unit_price,
            si.line_total,
            si.purchase_price,
            p.name as product_name,
            p.id as product_id
        FROM sales s
        JOIN clients c ON s.client_id = c.id
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
        WHERE s.id = ?
        ORDER BY si.id ASC
    `).all(saleId);

    if (saleWithItems.length === 0) {
        return null;
    }

    // Construire l'objet sale à partir du premier résultat
    const firstRow = saleWithItems[0];
    const sale = {
        id: firstRow.id,
        client_id: firstRow.client_id,
        user_id: firstRow.user_id,
        total_amount: firstRow.total_amount,
        amount_paid_cash: firstRow.amount_paid_cash,
        amount_paid_credit: firstRow.amount_paid_credit,
        sale_date: firstRow.sale_date,
        status: firstRow.status,
        original_sale_id: firstRow.original_sale_id,
        ticket_number: firstRow.ticket_number,
        has_returns: firstRow.has_returns,
        payment_method: firstRow.payment_method,
        client_name: firstRow.client_name,
        items: []
    };

    // Ajouter tous les items (évite la requête séparée)
    saleWithItems.forEach(row => {
        if (row.item_id) {
            sale.items.push({
                id: row.item_id,
                quantity: row.quantity,
                unit: row.unit,
                unit_price: row.unit_price,
                line_total: row.line_total,
                purchase_price: row.purchase_price,
                product_name: row.product_name,
                product_id: row.product_id
            });
        }
    });

    // Requêtes conditionnelles optimisées (seulement si nécessaire)
    sale.corrections = db.prepare(`
        SELECT id, total_amount, sale_date, status
        FROM sales
        WHERE original_sale_id = ?
        ORDER BY sale_date DESC
    `).all(saleId);

    sale.original_sale = sale.original_sale_id ?
        db.prepare(`SELECT id, total_amount, sale_date, status FROM sales WHERE id = ?`).get(sale.original_sale_id) :
        null;

    return sale;
};
const getLastSale = (userId) => db.prepare('SELECT id FROM sales WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);
const editSale = db.transaction((originalSaleId, newSaleData) => {
    const { clientId, userId, cart, total, amountPaidCash, credit, paymentMethod = 'cash' } = newSaleData;
    const originalSale = db.prepare('SELECT * FROM sales WHERE id = ?').get(originalSaleId);
    if (!originalSale) {
        throw new Error("Vente originale introuvable.");
    }

    // Récupérer les articles originaux et remettre le stock
    const originalItems = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(originalSaleId);
    const restockStmt = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    const getProductInfoStmt = db.prepare('SELECT pieces_per_carton FROM products WHERE id = ?');

    for (const item of originalItems) {
        let stockToRestore = item.quantity;
        if (item.unit === 'carton') {
            const productInfo = getProductInfoStmt.get(item.product_id);
            if (productInfo && productInfo.pieces_per_carton > 0) {
                stockToRestore = item.quantity * productInfo.pieces_per_carton;
            }
        }
        restockStmt.run(stockToRestore, item.product_id);
    }

    // Annuler le crédit de la vente originale
    if (originalSale.amount_paid_credit > 0 && originalSale.client_id !== 1) {
        db.prepare('UPDATE clients SET credit_balance = credit_balance - ? WHERE id = ?').run(originalSale.amount_paid_credit, originalSale.client_id);
    }

    // Marquer la vente originale comme corrigée
    db.prepare("UPDATE sales SET status = 'CORRECTED' WHERE id = ?").run(originalSaleId);

    // Générer un numéro de ticket unique pour la vente corrigée
    const ticketNumber = generateUniqueTicketNumber('sale');

    // Créer la nouvelle vente avec référence à l'originale
    const saleStmt = db.prepare(`INSERT INTO sales (client_id, user_id, total_amount, amount_paid_cash, amount_paid_credit, payment_method, original_sale_id, ticket_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    const saleResult = saleStmt.run(clientId, userId, total, amountPaidCash, credit, paymentMethod, originalSaleId, ticketNumber);
    const newSaleId = saleResult.lastInsertRowid;
    if (!newSaleId) {
        throw new Error("La création de la vente corrigée a échoué.");
    }

    // Ajouter les nouveaux articles et déduire le stock
    const updateStockStmt = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    const insertItemStmt = db.prepare(`INSERT INTO sale_items (sale_id, product_id, quantity, unit, unit_price, line_total, purchase_price) VALUES (?, ?, ?, ?, ?, ?, ?)`);

    for (const item of cart) {
        let stockToDeduct = item.quantity;
        if (item.unit === 'carton') {
            const productInfo = getProductInfoStmt.get(item.id);
            if (productInfo && productInfo.pieces_per_carton > 0) {
                stockToDeduct = item.quantity * productInfo.pieces_per_carton;
            } else {
                console.warn(`Produit ID ${item.id} vendu en carton sans 'pieces_per_carton' défini.`);
            }
        }
        insertItemStmt.run(newSaleId, item.id, item.quantity, item.unit || 'piece', item.price, item.quantity * item.price, item.purchase_price || 0);
        updateStockStmt.run(stockToDeduct, item.id);
    }

    // Ajouter le nouveau crédit
    if (credit > 0 && clientId !== 1) {
        db.prepare('UPDATE clients SET credit_balance = credit_balance + ? WHERE id = ?').run(credit, clientId);
    }

    return { success: true, saleId: newSaleId, ticketNumber: ticketNumber };
});
const processReturn = db.transaction((originalSaleId, itemsToReturn, clientId) => { const originalSale = db.prepare('SELECT * FROM sales WHERE id = ?').get(originalSaleId); if (!originalSale) { throw new Error("Vente originale introuvable."); } let totalRefundAmount = 0; for (const item of itemsToReturn) { totalRefundAmount += item.quantity * item.unit_price; } if (totalRefundAmount <= 0) { throw new Error("Aucun article valide à retourner."); } const returnSaleStmt = db.prepare(`INSERT INTO sales (client_id, user_id, total_amount, amount_paid_cash, amount_paid_credit, status) VALUES (?, ?, ?, ?, ?, ?)`); const returnResult = returnSaleStmt.run(clientId, originalSale.user_id, -totalRefundAmount, 0, -totalRefundAmount, 'RETURNED'); const returnSaleId = returnResult.lastInsertRowid; const updateStockStmt = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?'); const insertReturnItemStmt = db.prepare(`INSERT INTO sale_items (sale_id, product_id, quantity, unit, unit_price, line_total, purchase_price) VALUES (?, ?, ?, ?, ?, ?, ?)`); for (const item of itemsToReturn) { const originalItem = db.prepare('SELECT purchase_price FROM sale_items WHERE sale_id = ? AND product_id = ?').get(originalSaleId, item.product_id); insertReturnItemStmt.run(returnSaleId, item.product_id, -item.quantity, item.unit || 'piece', item.unit_price, -item.quantity * item.unit_price, originalItem ? originalItem.purchase_price : 0); } if (clientId !== 1) { const updateCreditStmt = db.prepare('UPDATE clients SET credit_balance = credit_balance - ? WHERE id = ?'); updateCreditStmt.run(totalRefundAmount, clientId); } db.prepare(`UPDATE sales SET status = 'RETURNED' WHERE id = ?`).run(originalSaleId); return { success: true, returnSaleId }; });
const getDebtors = () => db.prepare(`SELECT id, name, phone, credit_balance FROM clients WHERE credit_balance > 0.01 ORDER BY name ASC`).all();
const getClientCredit = (clientId) => {
    const result = db.prepare(`SELECT credit_balance FROM clients WHERE id = ?`).get(clientId);
    return result ? result.credit_balance : 0;
};

// Nouvelle fonction pour récupérer l'historique des paiements de crédit d'un client
const getClientCreditHistory = (clientId) => {
    return db.prepare(`
        SELECT cp.*, u.username as user_name
        FROM credit_payments cp
        LEFT JOIN users u ON cp.user_id = u.id
        WHERE cp.client_id = ?
        ORDER BY cp.payment_date DESC
    `).all(clientId);
};
const recordCreditPayment = db.transaction((paymentData) => { const { clientId, amount, userId } = paymentData; db.prepare('UPDATE clients SET credit_balance = credit_balance - ? WHERE id = ?').run(amount, clientId); db.prepare('INSERT INTO credit_payments (client_id, user_id, amount_paid, note) VALUES (?, ?, ?, ?)').run(clientId, userId, amount, 'Paiement de crédit'); return { success: true }; });
const addManualCredit = db.transaction((creditData) => { const { clientId, amount, note, userId } = creditData; db.prepare('UPDATE clients SET credit_balance = credit_balance + ? WHERE id = ?').run(amount, clientId); db.prepare('INSERT INTO credit_payments (client_id, user_id, amount_paid, note) VALUES (?, ?, ?, ?)').run(clientId, userId, -amount, note); return { success: true }; });
const createInvoice = db.transaction((invoiceData) => {
    const { invoice_number, invoice_date, client_name, client_address, client_phone, client_ice, subtotal_ht, tva_rate, tva_amount, total_amount, items } = invoiceData;
    const invoiceStmt = db.prepare(`INSERT INTO invoices (invoice_number, invoice_date, client_name, client_address, client_phone, client_ice, subtotal_ht, tva_rate, tva_amount, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const result = invoiceStmt.run(invoice_number, invoice_date, client_name, client_address, client_phone, client_ice, subtotal_ht, tva_rate, tva_amount, total_amount);
    const invoiceId = result.lastInsertRowid;
    if (!invoiceId) {
        throw new Error("La création de la facture a échoué.");
    }
    const itemStmt = db.prepare(`INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, unit, line_total) VALUES (?, ?, ?, ?, ?, ?)`);
    for (const item of items) {
        itemStmt.run(invoiceId, item.description, item.quantity, item.unit_price, item.unit || 'piece', item.line_total);
    }
    return { success: true, invoiceId };
});
const getInvoices = () => db.prepare(`SELECT id, invoice_number, client_name, subtotal_ht, tva_rate, tva_amount, total_amount, invoice_date FROM invoices ORDER BY id DESC`).all();
const getInvoiceDetails = (id) => { const invoice = db.prepare(`SELECT * FROM invoices WHERE id = ?`).get(id); if (invoice) { invoice.items = db.prepare(`SELECT * FROM invoice_items WHERE invoice_id = ?`).all(id); } return invoice; };
const getNextInvoiceNumber = () => { const year = new Date().getFullYear(); const prefix = `FACT-${year}-`; const lastInvoice = db.prepare(`SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1`).get(prefix + '%'); let next = 1; if (lastInvoice) { next = parseInt(lastInvoice.invoice_number.split('-')[2], 10) + 1; } return prefix + String(next).padStart(4, '0'); };
const saveSetting = (key, value) => { db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)' ).run(key, value); return true; };
const getSetting = (key) => { const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key); return result ? result.value : null; };
const getCompanyInfo = () => ({
    name: getSetting('company_name'),
    address: getSetting('company_address'),
    phone: getSetting('company_phone'),
    ice: getSetting('company_ice'),
    email: getSetting('company_email'),
    website: getSetting('company_website'),
    logo: getSetting('company_logo')
});

const saveCompanyInfo = (info) => {
    saveSetting('company_name', info.name);
    saveSetting('company_address', info.address);
    saveSetting('company_phone', info.phone);
    saveSetting('company_ice', info.ice);
    saveSetting('company_email', info.email);
    saveSetting('company_website', info.website);
    if (info.logo !== undefined) {
        saveSetting('company_logo', info.logo);
    }
    return { success: true };
};
const authenticateUser = (username, password) => { const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username); if (user && bcrypt.compareSync(password, user.password_hash)) { const { password_hash, ...userWithoutHash } = user; return userWithoutHash; } return null; };
const getAllUsers = () => db.prepare("SELECT id, username, role FROM users WHERE role = 'Vendeur'").all();
const addUser = (username, password) => { db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'Vendeur')").run(username, bcrypt.hashSync(password, saltRounds)); return true; };
const updateUserPassword = (id, password) => { db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(bcrypt.hashSync(password, saltRounds), id); return true; };
const deleteUser = (id) => { db.prepare("DELETE FROM users WHERE id = ?").run(id); return true; };
const updateUserCredentials = (data) => {
    const { id, currentUsername, newUsername, currentPassword, newPassword } = data;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    if (!user) { throw new Error("Utilisateur non trouvé."); }
    const isPasswordCorrect = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isPasswordCorrect) { throw new Error("Le mot de passe actuel est incorrect."); }
    const isUsernameChanged = newUsername && newUsername !== currentUsername;
    const isPasswordChanged = newPassword && newPassword.length > 0;
    if (!isUsernameChanged && !isPasswordChanged) { throw new Error("Aucune modification n'a été fournie."); }
    if (isUsernameChanged) {
        const existingUser = db.prepare("SELECT id FROM users WHERE username = ? AND id != ?").get(newUsername, id);
        if (existingUser) { throw new Error("Ce nom d'utilisateur est déjà utilisé par un autre compte."); }
    }
    const params = [];
    let sql = 'UPDATE users SET ';
    if (isUsernameChanged) {
        sql += 'username = ?';
        params.push(newUsername);
    }
    if (isPasswordChanged) {
        if (isUsernameChanged) sql += ', ';
        sql += 'password_hash = ?';
        const newPasswordHash = bcrypt.hashSync(newPassword, saltRounds);
        params.push(newPasswordHash);
    }
    sql += ' WHERE id = ?';
    params.push(id);
    db.prepare(sql).run(...params);
    return { success: true };
};
// ===== OPTIMISATION DASHBOARD - UNE SEULE REQUÊTE AU LIEU DE 3 =====
const getDashboardStats = ({ startDate, endDate }) => {
    // AVANT: 3 requêtes séparées (revenue + credit_given + total_cost)
    // APRÈS: 1 seule requête avec tous les calculs

    const stats = db.prepare(`
        SELECT
            COALESCE(SUM(s.total_amount), 0) as revenue,
            COALESCE(SUM(CASE WHEN s.amount_paid_credit > 0 THEN s.amount_paid_credit ELSE 0 END), 0) as credit_given,
            COALESCE(SUM(si.quantity * si.purchase_price), 0) as total_cost,
            COUNT(DISTINCT s.id) as total_sales,
            COUNT(DISTINCT s.client_id) as unique_customers,
            COALESCE(AVG(s.total_amount), 0) as avg_sale_amount
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        WHERE s.status = 'COMPLETED'
        AND date(s.sale_date) BETWEEN ? AND ?
    `).get(startDate, endDate);

    return {
        revenue: stats.revenue,
        credit_given: stats.credit_given,
        total_cost: stats.total_cost,
        // Bonus: statistiques supplémentaires sans coût additionnel
        total_sales: stats.total_sales,
        unique_customers: stats.unique_customers,
        avg_sale_amount: stats.avg_sale_amount,
        profit: stats.revenue - stats.total_cost,
        profit_margin: stats.revenue > 0 ? ((stats.revenue - stats.total_cost) / stats.revenue * 100).toFixed(2) : 0
    };
};

// Nouvelles fonctions pour les analytics produits - v2
const getTopProfitableProducts = ({ startDate, endDate, limit = 5 }) => {
    return db.prepare(`
        SELECT
            p.id,
            p.name,
            p.category,
            SUM(si.quantity) as total_quantity,
            SUM(si.line_total) as total_revenue,
            SUM(si.quantity * si.purchase_price) as total_cost,
            SUM(si.line_total - (si.quantity * si.purchase_price)) as total_profit,
            ROUND((SUM(si.line_total - (si.quantity * si.purchase_price)) / SUM(si.line_total)) * 100, 2) as profit_margin
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.status = 'COMPLETED'
        AND date(s.sale_date) BETWEEN ? AND ?
        GROUP BY p.id, p.name, p.category
        HAVING total_profit > 0
        ORDER BY total_profit DESC
        LIMIT ?
    `).all(startDate, endDate, limit);
};

const getTopSellingProducts = ({ startDate, endDate, limit = 5 }) => {
    return db.prepare(`
        SELECT
            p.id,
            p.name,
            p.category,
            SUM(si.quantity) as total_quantity,
            SUM(si.line_total) as total_revenue,
            COUNT(DISTINCT s.id) as sales_count,
            ROUND(SUM(si.quantity) / COUNT(DISTINCT date(s.sale_date)), 2) as avg_daily_sales
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.status = 'COMPLETED'
        AND date(s.sale_date) BETWEEN ? AND ?
        GROUP BY p.id, p.name, p.category
        ORDER BY total_quantity DESC
        LIMIT ?
    `).all(startDate, endDate, limit);
};

const getProductPerformanceOverview = ({ startDate, endDate }) => {
    return db.prepare(`
        SELECT
            p.id,
            p.name,
            p.category,
            p.stock,
            p.alert_threshold,
            SUM(si.quantity) as total_quantity,
            SUM(si.line_total) as total_revenue,
            SUM(si.quantity * si.purchase_price) as total_cost,
            SUM(si.line_total - (si.quantity * si.purchase_price)) as total_profit,
            ROUND((SUM(si.line_total - (si.quantity * si.purchase_price)) / SUM(si.line_total)) * 100, 2) as profit_margin,
            COUNT(DISTINCT s.id) as sales_frequency
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.status = 'COMPLETED'
        AND date(s.sale_date) BETWEEN ? AND ?
        GROUP BY p.id, p.name, p.category, p.stock, p.alert_threshold
        HAVING total_quantity > 0
        ORDER BY total_profit DESC
    `).all(startDate, endDate);
};

const getProductInsights = ({ startDate, endDate }) => {
    const insights = [];

    // Produit en forte croissance (comparaison avec période précédente)
    const growthProducts = db.prepare(`
        WITH current_period AS (
            SELECT p.name, SUM(si.quantity) as current_sales
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE s.status = 'COMPLETED' AND date(s.sale_date) BETWEEN ? AND ?
            GROUP BY p.id, p.name
        ),
        previous_period AS (
            SELECT p.name, SUM(si.quantity) as previous_sales
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE s.status = 'COMPLETED'
            AND date(s.sale_date) BETWEEN date(?, '-' || (julianday(?) - julianday(?)) || ' days') AND date(?, '-1 day')
            GROUP BY p.id, p.name
        )
        SELECT
            cp.name,
            cp.current_sales,
            COALESCE(pp.previous_sales, 0) as previous_sales,
            ROUND(((cp.current_sales - COALESCE(pp.previous_sales, 0)) / COALESCE(pp.previous_sales, 1)) * 100, 1) as growth_rate
        FROM current_period cp
        LEFT JOIN previous_period pp ON cp.name = pp.name
        WHERE cp.current_sales > COALESCE(pp.previous_sales, 0) * 1.25
        ORDER BY growth_rate DESC
        LIMIT 1
    `).get(startDate, endDate, startDate, endDate, startDate, startDate);

    if (growthProducts) {
        insights.push({
            type: 'growth',
            icon: '📈',
            message: `${growthProducts.name} en forte croissance (+${growthProducts.growth_rate}%)`
        });
    }

    // Produits rentables avec stock faible
    const lowStockProfitable = db.prepare(`
        SELECT p.name, p.stock, p.alert_threshold,
               SUM(si.line_total - (si.quantity * si.purchase_price)) as profit
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.status = 'COMPLETED'
        AND date(s.sale_date) BETWEEN ? AND ?
        AND p.stock <= p.alert_threshold
        AND p.alert_threshold > 0
        GROUP BY p.id, p.name, p.stock, p.alert_threshold
        HAVING profit > 0
        ORDER BY profit DESC
        LIMIT 1
    `).get(startDate, endDate);

    if (lowStockProfitable) {
        insights.push({
            type: 'warning',
            icon: '⚠️',
            message: `Stock faible sur produit rentable: ${lowStockProfitable.name}`
        });
    }

    // Opportunité d'augmentation de prix
    const pricingOpportunity = db.prepare(`
        SELECT p.name,
               ROUND((SUM(si.line_total - (si.quantity * si.purchase_price)) / SUM(si.line_total)) * 100, 1) as margin
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.status = 'COMPLETED'
        AND date(s.sale_date) BETWEEN ? AND ?
        GROUP BY p.id, p.name
        HAVING SUM(si.quantity) > 10 AND margin > 50
        ORDER BY SUM(si.quantity) DESC
        LIMIT 1
    `).get(startDate, endDate);

    if (pricingOpportunity) {
        insights.push({
            type: 'opportunity',
            icon: '💡',
            message: `Opportunité: Augmenter prix ${pricingOpportunity.name} (marge ${pricingOpportunity.margin}%)`
        });
    }

    return insights;
};

// Fonctions pour l'export de données
const getAllSales = () => {
    return db.prepare('SELECT * FROM sales ORDER BY sale_date DESC').all();
};

const getAllSaleItems = () => {
    return db.prepare('SELECT * FROM sale_items').all();
};

const getAllInvoiceItems = () => {
    return db.prepare('SELECT * FROM invoice_items').all();
};

const getAllSettings = () => {
    return db.prepare('SELECT * FROM settings').all();
};

// ===== SYSTÈME DE RETOURS =====

/**
 * Recherche des ventes pour le système de retours
 * @param {Object} filters - Filtres de recherche
 * @returns {Array} Liste des ventes trouvées
 */
const searchSalesForReturns = (filters = {}) => {
    let sql = `
        SELECT
            s.id,
            s.ticket_number,
            s.sale_date,
            s.total_amount,
            s.status,
            s.has_returns,
            c.name as client_name,
            c.id as client_id,
            u.username as user_name
        FROM sales s
        LEFT JOIN clients c ON s.client_id = c.id
        JOIN users u ON s.user_id = u.id
        WHERE s.status IN ('COMPLETED', 'CORRECTED')
    `;

    const params = [];

    // Filtre par numéro de ticket
    if (filters.ticketNumber) {
        sql += ` AND s.ticket_number LIKE ?`;
        params.push(`%${filters.ticketNumber}%`);
    }

    // Filtre par nom de client
    if (filters.clientName) {
        sql += ` AND c.name LIKE ?`;
        params.push(`%${filters.clientName}%`);
    }

    // Filtre par plage de dates
    if (filters.startDate) {
        sql += ` AND DATE(s.sale_date) >= ?`;
        params.push(filters.startDate);
    }

    if (filters.endDate) {
        sql += ` AND DATE(s.sale_date) <= ?`;
        params.push(filters.endDate);
    }

    sql += ` ORDER BY s.sale_date DESC LIMIT 100`;

    try {
        return db.prepare(sql).all(...params);
    } catch (error) {
        console.error('Erreur lors de la recherche de ventes:', error);
        return [];
    }
};

/**
 * Obtient les détails d'une vente pour les retours
 * @param {number} saleId - ID de la vente
 * @returns {Object} Détails de la vente avec produits et retours existants
 */
const getSaleReturnDetails = (saleId) => {
    try {
        // Informations de base de la vente
        const sale = db.prepare(`
            SELECT
                s.*,
                c.name as client_name,
                c.id as client_id,
                u.username as user_name
            FROM sales s
            LEFT JOIN clients c ON s.client_id = c.id
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ?
        `).get(saleId);

        if (!sale) {
            return null;
        }

        // Produits de la vente
        const items = db.prepare(`
            SELECT
                si.*,
                p.name as product_name,
                p.pieces_per_carton
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        `).all(saleId);

        // Retours existants pour cette vente
        const returns = db.prepare(`
            SELECT
                ri.*,
                r.return_date,
                r.return_number
            FROM return_items ri
            JOIN returns r ON ri.return_id = r.id
            WHERE r.original_sale_id = ?
        `).all(saleId);

        // Calculer les quantités déjà retournées pour chaque produit
        const returnedQuantities = {};
        returns.forEach(returnItem => {
            const key = returnItem.original_sale_item_id;
            if (!returnedQuantities[key]) {
                returnedQuantities[key] = 0;
            }
            returnedQuantities[key] += returnItem.quantity_returned;
        });

        // Enrichir les items avec les informations de retour
        const enrichedItems = items.map(item => ({
            ...item,
            quantity_returned: returnedQuantities[item.id] || 0,
            quantity_available_for_return: item.quantity - (returnedQuantities[item.id] || 0)
        }));

        return {
            ...sale,
            items: enrichedItems,
            returns: returns
        };

    } catch (error) {
        console.error('Erreur lors de la récupération des détails de vente:', error);
        return null;
    }
};

/**
 * Traite un retour de produits
 * @param {Object} returnData - Données du retour
 * @returns {Object} Résultat du traitement
 */
const processProductReturn = db.transaction((returnData) => {
    const {
        originalSaleId,
        clientId,
        userId,
        itemsToReturn,
        refundCash,
        refundCredit,
        reason,
        notes
    } = returnData;

    // Vérifier que la vente originale existe
    const originalSale = db.prepare('SELECT * FROM sales WHERE id = ?').get(originalSaleId);
    if (!originalSale) {
        throw new Error("Vente originale introuvable.");
    }

    // Vérifier les quantités déjà retournées pour éviter les retours multiples
    const checkReturnedQuantities = db.prepare(`
        SELECT
            ri.original_sale_item_id,
            SUM(ri.quantity_returned) as total_returned
        FROM return_items ri
        JOIN returns r ON ri.return_id = r.id
        WHERE r.original_sale_id = ?
        GROUP BY ri.original_sale_item_id
    `);

    const alreadyReturned = checkReturnedQuantities.all(originalSaleId);
    const returnedMap = {};
    alreadyReturned.forEach(item => {
        returnedMap[item.original_sale_item_id] = item.total_returned;
    });

    // Vérifier que les quantités à retourner ne dépassent pas les quantités vendues
    for (const item of itemsToReturn) {
        const originalItem = db.prepare('SELECT quantity FROM sale_items WHERE id = ?').get(item.original_sale_item_id);
        if (!originalItem) {
            throw new Error(`Article de vente original introuvable (ID: ${item.original_sale_item_id}).`);
        }

        const alreadyReturnedQty = returnedMap[item.original_sale_item_id] || 0;
        const totalAfterReturn = alreadyReturnedQty + item.quantity_returned;

        if (totalAfterReturn > originalItem.quantity) {
            throw new Error(`Quantité de retour invalide pour l'article ${item.product_name}. Vendu: ${originalItem.quantity}, Déjà retourné: ${alreadyReturnedQty}, Tentative de retour: ${item.quantity_returned}.`);
        }
    }

    // Calculer le montant total du remboursement
    let totalRefundAmount = 0;
    for (const item of itemsToReturn) {
        totalRefundAmount += item.quantity_returned * item.unit_price;
    }

    if (totalRefundAmount <= 0) {
        throw new Error("Aucun montant valide à rembourser.");
    }

    // Vérifier que les montants de remboursement correspondent
    if (Math.abs((refundCash + refundCredit) - totalRefundAmount) > 0.01) {
        throw new Error("Les montants de remboursement ne correspondent pas au total.");
    }

    // Générer un numéro de retour unique
    const returnNumber = generateUniqueTicketNumber('return');

    // Créer l'enregistrement de retour
    const returnStmt = db.prepare(`
        INSERT INTO returns (
            return_number, original_sale_id, client_id, user_id,
            total_refund_amount, refund_cash, refund_credit, reason, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const returnResult = returnStmt.run(
        returnNumber, originalSaleId, clientId, userId,
        totalRefundAmount, refundCash, refundCredit, reason, notes
    );

    const returnId = returnResult.lastInsertRowid;
    if (!returnId) {
        throw new Error("La création du retour a échoué.");
    }

    // Traiter chaque produit retourné
    const insertReturnItemStmt = db.prepare(`
        INSERT INTO return_items (
            return_id, original_sale_item_id, product_id, quantity_returned,
            unit, unit_price, refund_amount, condition_status, back_to_stock
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStockStmt = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    const getProductInfoStmt = db.prepare('SELECT pieces_per_carton FROM products WHERE id = ?');

    for (const item of itemsToReturn) {
        const refundAmount = item.quantity_returned * item.unit_price;

        // Insérer l'item de retour
        insertReturnItemStmt.run(
            returnId,
            item.original_sale_item_id,
            item.product_id,
            item.quantity_returned,
            item.unit,
            item.unit_price,
            refundAmount,
            item.condition_status || 'GOOD',
            item.back_to_stock ? 1 : 0
        );

        // Remettre en stock si nécessaire et si en bon état
        if (item.back_to_stock && item.condition_status === 'GOOD') {
            let stockToRestore = item.quantity_returned;

            // Gérer les cartons
            if (item.unit === 'carton') {
                const productInfo = getProductInfoStmt.get(item.product_id);
                if (productInfo && productInfo.pieces_per_carton > 0) {
                    stockToRestore = item.quantity_returned * productInfo.pieces_per_carton;
                }
            }

            updateStockStmt.run(stockToRestore, item.product_id);
        }
    }

    // Gérer les remboursements financiers
    if (refundCredit > 0 && clientId && clientId !== 1) {
        // Créditer le compte client
        db.prepare('UPDATE clients SET credit_balance = credit_balance + ? WHERE id = ?')
          .run(refundCredit, clientId);
    }

    // Marquer la vente comme ayant des retours
    db.prepare('UPDATE sales SET has_returns = 1 WHERE id = ?').run(originalSaleId);

    return {
        success: true,
        returnId: returnId,
        returnNumber: returnNumber,
        totalRefundAmount: totalRefundAmount
    };
});

/**
 * Obtient l'historique des retours
 * @param {Object} filters - Filtres optionnels
 * @returns {Array} Liste des retours
 */
const getReturnsHistory = (filters = {}) => {
    let sql = `
        SELECT
            r.*,
            s.ticket_number as original_ticket_number,
            s.sale_date as original_sale_date,
            c.name as client_name,
            u.username as user_name
        FROM returns r
        JOIN sales s ON r.original_sale_id = s.id
        LEFT JOIN clients c ON r.client_id = c.id
        JOIN users u ON r.user_id = u.id
        WHERE 1=1
    `;

    const params = [];

    // Filtre par numéro de retour
    if (filters.returnNumber) {
        sql += ` AND r.return_number LIKE ?`;
        params.push(`%${filters.returnNumber}%`);
    }

    // Filtre par client
    if (filters.clientName) {
        sql += ` AND c.name LIKE ?`;
        params.push(`%${filters.clientName}%`);
    }

    // Filtre par plage de dates
    if (filters.startDate) {
        sql += ` AND DATE(r.return_date) >= ?`;
        params.push(filters.startDate);
    }

    if (filters.endDate) {
        sql += ` AND DATE(r.return_date) <= ?`;
        params.push(filters.endDate);
    }

    sql += ` ORDER BY r.return_date DESC LIMIT 100`;

    try {
        return db.prepare(sql).all(...params);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique des retours:', error);
        return [];
    }
};

/**
 * Obtient les retours existants pour une vente spécifique
 * @param {number} saleId - ID de la vente
 * @returns {Array} Liste des items déjà retournés
 */
const getExistingReturns = (saleId) => {
    try {
        const query = `
            SELECT
                ri.original_sale_item_id,
                ri.product_id,
                ri.quantity_returned,
                ri.unit_price,
                ri.refund_amount,
                ri.condition_status,
                ri.back_to_stock,
                p.name as product_name,
                r.return_number,
                r.created_at as return_date
            FROM return_items ri
            JOIN returns r ON ri.return_id = r.id
            JOIN products p ON ri.product_id = p.id
            WHERE r.original_sale_id = ?
            ORDER BY r.created_at DESC
        `;

        return db.prepare(query).all(saleId);
    } catch (error) {
        console.error('Erreur lors de la récupération des retours existants:', error);
        return [];
    }
};

/**
 * Obtient les détails d'un retour spécifique
 * @param {number} returnId - ID du retour
 * @returns {Object} Détails du retour avec items
 */
const getReturnDetails = (returnId) => {
    try {
        // Informations de base du retour
        const returnInfo = db.prepare(`
            SELECT
                r.*,
                s.ticket_number as original_ticket_number,
                s.sale_date as original_sale_date,
                s.total_amount as original_total_amount,
                c.name as client_name,
                u.username as user_name
            FROM returns r
            JOIN sales s ON r.original_sale_id = s.id
            LEFT JOIN clients c ON r.client_id = c.id
            JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        `).get(returnId);

        if (!returnInfo) {
            return null;
        }

        // Items du retour
        const items = db.prepare(`
            SELECT
                ri.*,
                p.name as product_name,
                si.quantity as original_quantity,
                si.unit_price as original_unit_price
            FROM return_items ri
            JOIN products p ON ri.product_id = p.id
            JOIN sale_items si ON ri.original_sale_item_id = si.id
            WHERE ri.return_id = ?
        `).all(returnId);

        return {
            ...returnInfo,
            items: items
        };

    } catch (error) {
        console.error('Erreur lors de la récupération des détails du retour:', error);
        return null;
    }
};

/**
 * Obtient les statistiques des retours
 * @returns {Object} Statistiques des retours
 */
const getReturnsStats = () => {
    try {
        const stats = db.prepare(`
            SELECT
                COUNT(*) as total_returns,
                SUM(total_refund_amount) as total_refunded,
                AVG(total_refund_amount) as average_refund,
                COUNT(CASE WHEN DATE(return_date) = DATE('now', 'localtime') THEN 1 END) as today_returns
            FROM returns
        `).get();

        const topReasons = db.prepare(`
            SELECT reason, COUNT(*) as count
            FROM returns
            WHERE reason IS NOT NULL AND reason != ''
            GROUP BY reason
            ORDER BY count DESC
            LIMIT 5
        `).all();

        return {
            ...stats,
            top_reasons: topReasons
        };

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques de retours:', error);
        return {
            total_returns: 0,
            total_refunded: 0,
            average_refund: 0,
            today_returns: 0,
            top_reasons: []
        };
    }
};

/**
 * Valide les données d'un retour avant traitement
 * @param {Object} returnData - Données du retour à valider
 * @returns {Object} Résultat de la validation
 */
const validateReturnData = (returnData) => {
    const errors = [];

    // Vérifications de base
    if (!returnData.originalSaleId) {
        errors.push("ID de vente originale manquant");
    }

    if (!returnData.userId) {
        errors.push("ID utilisateur manquant");
    }

    if (!returnData.itemsToReturn || !Array.isArray(returnData.itemsToReturn) || returnData.itemsToReturn.length === 0) {
        errors.push("Aucun produit à retourner spécifié");
    }

    // Vérifications des montants
    const totalRefund = (returnData.refundCash || 0) + (returnData.refundCredit || 0);
    if (totalRefund <= 0) {
        errors.push("Montant de remboursement invalide");
    }

    // Vérifications des items
    if (returnData.itemsToReturn) {
        returnData.itemsToReturn.forEach((item, index) => {
            if (!item.product_id) {
                errors.push(`Produit ${index + 1}: ID produit manquant`);
            }

            if (!item.quantity_returned || item.quantity_returned <= 0) {
                errors.push(`Produit ${index + 1}: Quantité à retourner invalide`);
            }

            if (!item.unit_price || item.unit_price <= 0) {
                errors.push(`Produit ${index + 1}: Prix unitaire invalide`);
            }
        });
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

// ===== SYSTÈME DE NUMÉROTATION DES TICKETS =====

/**
 * Génère un numéro de ticket unique
 * @param {string} type - 'sale' ou 'return'
 * @returns {string} Numéro de ticket au format V-YYYYMMDD-XXXX ou R-YYYYMMDD-XXXX
 */
const generateTicketNumber = (type) => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const prefix = type === 'sale' ? 'V' : 'R';
    const settingKey = `last_${type}_ticket_date`;
    const counterKey = `${type}_ticket_counter`;

    try {
        // Vérifier si on est sur un nouveau jour
        const lastTicketDate = getSetting(settingKey);
        let counter = 1;

        if (lastTicketDate === dateStr) {
            // Même jour, incrémenter le compteur
            const lastCounter = parseInt(getSetting(counterKey) || '0');
            counter = lastCounter + 1;
        } else {
            // Nouveau jour, remettre le compteur à 1
            saveSetting(settingKey, dateStr);
        }

        // Sauvegarder le nouveau compteur
        saveSetting(counterKey, counter.toString());

        // Formater le numéro avec des zéros à gauche
        const ticketNumber = `${prefix}-${dateStr}-${counter.toString().padStart(4, '0')}`;

        return ticketNumber;
    } catch (error) {
        console.error('Erreur lors de la génération du numéro de ticket:', error);
        // Fallback : utiliser timestamp
        return `${prefix}-${dateStr}-${Date.now().toString().slice(-4)}`;
    }
};

/**
 * Vérifie si un numéro de ticket existe déjà
 * @param {string} ticketNumber - Numéro de ticket à vérifier
 * @param {string} type - 'sale' ou 'return'
 * @returns {boolean} True si le ticket existe
 */
const ticketNumberExists = (ticketNumber, type) => {
    try {
        if (type === 'sale') {
            const result = db.prepare('SELECT id FROM sales WHERE ticket_number = ?').get(ticketNumber);
            return !!result;
        } else if (type === 'return') {
            const result = db.prepare('SELECT id FROM returns WHERE return_number = ?').get(ticketNumber);
            return !!result;
        }
        return false;
    } catch (error) {
        console.error('Erreur lors de la vérification du numéro de ticket:', error);
        return false;
    }
};

/**
 * Génère un numéro de ticket unique en évitant les doublons
 * @param {string} type - 'sale' ou 'return'
 * @returns {string} Numéro de ticket unique
 */
const generateUniqueTicketNumber = (type) => {
    let ticketNumber;
    let attempts = 0;
    const maxAttempts = 10;

    do {
        ticketNumber = generateTicketNumber(type);
        attempts++;

        if (attempts >= maxAttempts) {
            // Fallback avec timestamp pour éviter les boucles infinies
            const timestamp = Date.now().toString().slice(-6);
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const prefix = type === 'sale' ? 'V' : 'R';
            ticketNumber = `${prefix}-${dateStr}-${timestamp}`;
            break;
        }
    } while (ticketNumberExists(ticketNumber, type));

    return ticketNumber;
};

// ===== GESTION DES STOCKS PAR LOTS =====

/**
 * Créer un nouveau lot de stock
 * @param {Object} lotData - Données du lot
 * @returns {Object} Lot créé avec son ID
 */
const createStockLot = db.transaction((lotData) => {
    // Vérifier que le produit existe
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(lotData.product_id);
    if (!product) {
        throw new Error(`Produit avec l'ID ${lotData.product_id} non trouvé`);
    }

    // Vérifier l'unicité du numéro de lot pour ce produit
    const existingLot = db.prepare('SELECT id FROM stock_lots WHERE product_id = ? AND lot_number = ?')
        .get(lotData.product_id, lotData.lot_number);
    if (existingLot) {
        throw new Error(`Le numéro de lot "${lotData.lot_number}" existe déjà pour ce produit`);
    }

    const stmt = db.prepare(`
        INSERT INTO stock_lots (
            product_id, lot_number, quantity, purchase_price,
            purchase_date, supplier_id, expiry_date, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        lotData.product_id,
        lotData.lot_number,
        lotData.quantity,
        lotData.purchase_price,
        lotData.purchase_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
        lotData.supplier_id || null,
        lotData.expiry_date || null,
        lotData.status || 'AVAILABLE',
        lotData.notes || null
    );

    // Mettre à jour automatiquement le stock global du produit
    const totalStock = db.prepare(`
        SELECT COALESCE(SUM(quantity), 0) as total
        FROM stock_lots
        WHERE product_id = ? AND quantity > 0
    `).get(lotData.product_id).total;

    db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(totalStock, lotData.product_id);

    return { id: result.lastInsertRowid, ...lotData };
});

/**
 * Obtenir tous les lots d'un produit avec filtrage et tri
 * @param {number} productId - ID du produit
 * @param {Object} options - Options de filtrage et tri
 * @returns {Array} Liste des lots filtrés et triés
 */
const getProductLots = (productId, options = {}) => {
    // Support de l'ancien paramètre includeEmpty pour compatibilité
    if (typeof options === 'boolean') {
        options = { includeEmpty: options };
    }

    const {
        includeEmpty = false,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        statusFilter = 'ALL',
        searchTerm = '',
        expiryFilter = 'ALL'
    } = options;

    let sql = `
        SELECT
            sl.*,
            s.name as supplier_name,
            s.company as supplier_company,
            s.status as supplier_status,
            CASE
                WHEN sl.quantity <= 0 THEN 'SOLD_OUT'
                WHEN sl.expiry_date IS NOT NULL AND date(sl.expiry_date) <= date('now') THEN 'EXPIRED'
                WHEN sl.expiry_date IS NOT NULL AND date(sl.expiry_date) <= date('now', '+7 days') THEN 'EXPIRING_SOON'
                ELSE 'AVAILABLE'
            END as computed_status,
            ROUND(sl.quantity * sl.purchase_price, 2) as total_value,
            CASE
                WHEN sl.expiry_date IS NOT NULL
                THEN julianday(sl.expiry_date) - julianday('now')
                ELSE NULL
            END as days_until_expiry
        FROM stock_lots sl
        LEFT JOIN suppliers s ON sl.supplier_id = s.id
        WHERE sl.product_id = ?
    `;

    const params = [productId];

    // Filtrage par quantité (compatibilité includeEmpty)
    if (!includeEmpty) {
        sql += ` AND sl.quantity > 0`;
    }

    // Filtrage par statut
    if (statusFilter !== 'ALL') {
        switch (statusFilter) {
            case 'AVAILABLE':
                sql += ` AND sl.quantity > 0 AND (sl.expiry_date IS NULL OR date(sl.expiry_date) > date('now'))`;
                break;
            case 'SOLD_OUT':
                sql += ` AND sl.quantity <= 0`;
                break;
            case 'EXPIRED':
                sql += ` AND sl.expiry_date IS NOT NULL AND date(sl.expiry_date) <= date('now')`;
                break;
            case 'EXPIRING_SOON':
                sql += ` AND sl.expiry_date IS NOT NULL AND date(sl.expiry_date) > date('now') AND date(sl.expiry_date) <= date('now', '+7 days')`;
                break;
        }
    }

    // Filtrage par terme de recherche
    if (searchTerm) {
        sql += ` AND (sl.lot_number LIKE ? OR sl.notes LIKE ?)`;
        params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    // Tri
    const validSortColumns = {
        'created_at': 'sl.created_at',
        'expiry_date': 'sl.expiry_date',
        'lot_number': 'sl.lot_number',
        'quantity': 'sl.quantity',
        'purchase_price': 'sl.purchase_price',
        'total_value': 'total_value',
        'days_until_expiry': 'days_until_expiry',
        'purchase_date': 'sl.purchase_date' // Compatibilité
    };

    const sortColumn = validSortColumns[sortBy] || 'sl.created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Gestion spéciale pour le tri par expiration (NULL en dernier)
    if (sortBy === 'expiry_date') {
        sql += ` ORDER BY ${sortColumn} IS NULL, ${sortColumn} ${order}`;
    } else {
        sql += ` ORDER BY ${sortColumn} ${order}`;
    }

    return db.prepare(sql).all(...params);
};

/**
 * Obtenir un lot par ID
 * @param {number} lotId - ID du lot
 * @returns {Object|null} Données du lot
 */
const getLotById = (lotId) => {
    const stmt = db.prepare('SELECT * FROM stock_lots WHERE id = ?');
    return stmt.get(lotId);
};

/**
 * Mettre à jour la quantité d'un lot
 * @param {number} lotId - ID du lot
 * @param {number} newQuantity - Nouvelle quantité
 * @returns {Object} Résultat de la mise à jour
 */
const updateLotQuantity = db.transaction((lotId, newQuantity) => {
    // Récupérer l'ID du produit avant la mise à jour
    const lot = db.prepare('SELECT product_id FROM stock_lots WHERE id = ?').get(lotId);
    if (!lot) {
        throw new Error(`Lot avec l'ID ${lotId} non trouvé`);
    }

    // Mettre à jour le lot
    const stmt = db.prepare(`
        UPDATE stock_lots
        SET quantity = ?,
            status = CASE WHEN ? <= 0 THEN 'SOLD_OUT' ELSE 'AVAILABLE' END,
            updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')
        WHERE id = ?
    `);
    const result = stmt.run(newQuantity, newQuantity, lotId);

    // Synchroniser automatiquement le stock global du produit
    syncProductStockWithLots(lot.product_id);

    return result;
});

/**
 * Enregistrer un mouvement de stock
 * @param {Object} movementData - Données du mouvement
 * @returns {Object} Résultat de l'insertion
 */
const recordStockMovement = (movementData) => {
    const stmt = db.prepare(`
        INSERT INTO stock_movements (
            product_id, lot_id, movement_type, quantity, unit_cost,
            reference_type, reference_id, movement_date, user_id, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
        movementData.product_id,
        movementData.lot_id || null,
        movementData.movement_type,
        movementData.quantity,
        movementData.unit_cost || 0,
        movementData.reference_type || null,
        movementData.reference_id || null,
        movementData.movement_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
        movementData.user_id || null,
        movementData.notes || null
    );
};

/**
 * Obtenir l'historique des mouvements d'un produit
 * @param {number} productId - ID du produit
 * @param {number} limit - Limite de résultats
 * @returns {Array} Liste des mouvements
 */
const getProductMovements = (productId, limit = 100) => {
    const stmt = db.prepare(`
        SELECT sm.*, sl.lot_number, p.name as product_name
        FROM stock_movements sm
        LEFT JOIN stock_lots sl ON sm.lot_id = sl.id
        LEFT JOIN products p ON sm.product_id = p.id
        WHERE sm.product_id = ?
        ORDER BY sm.movement_date DESC
        LIMIT ?
    `);
    return stmt.all(productId, limit);
};

/**
 * Obtenir les paramètres de valorisation d'un produit
 * @param {number} productId - ID du produit
 * @returns {Object} Paramètres de valorisation
 */
const getProductValuationSettings = (productId) => {
    const stmt = db.prepare('SELECT * FROM product_valuation_settings WHERE product_id = ?');
    let settings = stmt.get(productId);

    // Créer des paramètres par défaut si ils n'existent pas
    if (!settings) {
        const insertStmt = db.prepare(`
            INSERT INTO product_valuation_settings (product_id, valuation_method, auto_lot_creation, track_expiry)
            VALUES (?, 'FIFO', 1, 0)
        `);
        const result = insertStmt.run(productId);
        settings = {
            id: result.lastInsertRowid,
            product_id: productId,
            valuation_method: 'FIFO',
            auto_lot_creation: 1,
            track_expiry: 0
        };
    }

    return settings;
};

/**
 * Calculer le coût moyen pondéré d'un produit
 * @param {number} productId - ID du produit
 * @returns {number} Coût moyen pondéré
 */
const calculateAverageCost = (productId) => {
    const stmt = db.prepare(`
        SELECT
            SUM(quantity * purchase_price) as total_value,
            SUM(quantity) as total_quantity
        FROM stock_lots
        WHERE product_id = ? AND quantity > 0
    `);

    const result = stmt.get(productId);

    if (!result || !result.total_quantity || result.total_quantity === 0) {
        return 0;
    }

    return result.total_value / result.total_quantity;
};

// ===== FONCTIONS DE GESTION DES DEVIS =====

/**
 * Génère un numéro de devis unique
 */
const getNextQuoteNumber = () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const lastQuote = db.prepare(`
        SELECT number FROM quotes
        WHERE number LIKE 'DEV-${today}-%'
        ORDER BY number DESC
        LIMIT 1
    `).get();

    let nextNumber = 1;
    if (lastQuote) {
        const lastNum = parseInt(lastQuote.number.split('-')[2]);
        nextNumber = lastNum + 1;
    }

    return `DEV-${today}-${nextNumber.toString().padStart(4, '0')}`;
};

/**
 * Crée un nouveau devis
 */
const createQuote = (quoteData) => {
    const { clientId, clientName, clientPhone, clientAddress, validityDays = 30, items, subtotal, discountType, discountValue, discountAmount, totalAmount, notes, conditions, createdBy } = quoteData;

    const number = getNextQuoteNumber();
    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + validityDays);

    const quoteStmt = db.prepare(`
        INSERT INTO quotes (
            number, client_id, client_name, client_phone, client_address,
            date_validity, validity_days, subtotal, discount_type, discount_value,
            discount_amount, total_amount, notes, conditions, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = quoteStmt.run(
        number, clientId, clientName, clientPhone, clientAddress,
        validityDate.toISOString(), validityDays, subtotal, discountType, discountValue,
        discountAmount, totalAmount, notes, conditions, createdBy
    );

    const quoteId = result.lastInsertRowid;

    // Ajouter les articles
    if (items && items.length > 0) {
        const itemStmt = db.prepare(`
            INSERT INTO quote_items (
                quote_id, product_id, product_name, quantity, unit_price,
                line_total, final_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const item of items) {
            itemStmt.run(
                quoteId, item.product_id, item.product_name, item.quantity,
                item.unit_price, item.line_total, item.final_price
            );
        }
    }

    return { success: true, quoteId, number };
};

/**
 * Récupère tous les devis
 */
const getAllQuotes = () => {
    return db.prepare(`
        SELECT * FROM quotes
        ORDER BY created_at DESC
    `).all();
};

/**
 * Récupère un devis par ID
 */
const getQuoteById = (id) => {
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id);
    if (quote) {
        quote.items = getQuoteItems(id);
    }
    return quote;
};

/**
 * Récupère les articles d'un devis
 */
const getQuoteItems = (quoteId) => {
    return db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(quoteId);
};

/**
 * Met à jour un devis
 */
const updateQuote = (id, updateData) => {
    const { clientName, clientPhone, clientAddress, validityDays, subtotal, discountType, discountValue, discountAmount, totalAmount, notes, conditions } = updateData;

    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + validityDays);

    return db.prepare(`
        UPDATE quotes SET
            client_name = ?, client_phone = ?, client_address = ?,
            date_validity = ?, validity_days = ?, subtotal = ?,
            discount_type = ?, discount_value = ?, discount_amount = ?,
            total_amount = ?, notes = ?, conditions = ?,
            updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')
        WHERE id = ?
    `).run(
        clientName, clientPhone, clientAddress, validityDate.toISOString(),
        validityDays, subtotal, discountType, discountValue, discountAmount,
        totalAmount, notes, conditions, id
    );
};

/**
 * Met à jour le statut d'un devis
 */
const updateQuoteStatus = (id, status, convertedSaleId = null) => {
    return db.prepare(`
        UPDATE quotes SET
            status = ?, converted_sale_id = ?,
            updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')
        WHERE id = ?
    `).run(status, convertedSaleId, id);
};

/**
 * Supprime un devis
 */
const deleteQuote = (id) => {
    return db.prepare('DELETE FROM quotes WHERE id = ?').run(id);
};

/**
 * Récupère les devis par statut
 */
const getQuotesByStatus = (status) => {
    return db.prepare('SELECT * FROM quotes WHERE status = ? ORDER BY created_at DESC').all(status);
};

/**
 * Convertit un devis en vente
 */
const convertQuoteToSale = (quoteId, saleData) => {
    // Cette fonction sera implémentée plus tard
    // Elle devra créer une vente à partir du devis et mettre à jour le statut
    return { success: true, message: 'Conversion à implémenter' };
};

/**
 * Ajoute un article à un devis
 */
const addQuoteItem = (quoteId, itemData) => {
    const { productId, productName, quantity, unitPrice, lineTotal, finalPrice } = itemData;

    return db.prepare(`
        INSERT INTO quote_items (
            quote_id, product_id, product_name, quantity, unit_price,
            line_total, final_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(quoteId, productId, productName, quantity, unitPrice, lineTotal, finalPrice);
};

/**
 * Met à jour un article de devis
 */
const updateQuoteItem = (itemId, itemData) => {
    const { quantity, unitPrice, lineTotal, finalPrice } = itemData;

    return db.prepare(`
        UPDATE quote_items SET
            quantity = ?, unit_price = ?, line_total = ?, final_price = ?
        WHERE id = ?
    `).run(quantity, unitPrice, lineTotal, finalPrice, itemId);
};

/**
 * Supprime un article de devis
 */
const deleteQuoteItem = (itemId) => {
    return db.prepare('DELETE FROM quote_items WHERE id = ?').run(itemId);
};

// === GESTION DES TEMPLATES DE FACTURES ===

// Récupérer tous les templates
function getAllTemplates() {
    try {
        const stmt = db.prepare(`
            SELECT * FROM invoice_templates
            ORDER BY is_system DESC, is_default DESC, name ASC
        `);
        return stmt.all();
    } catch (error) {
        console.error('Erreur lors de la récupération des templates:', error);
        return [];
    }
}

// Récupérer un template par ID
function getTemplateById(id) {
    try {
        const stmt = db.prepare('SELECT * FROM invoice_templates WHERE id = ?');
        return stmt.get(id);
    } catch (error) {
        console.error('Erreur lors de la récupération du template:', error);
        return null;
    }
}

// Créer un nouveau template
function createTemplate(templateData) {
    try {
        const stmt = db.prepare(`
            INSERT INTO invoice_templates
            (name, display_name, colors_config, fonts_config, layout_config, logo_path, user_created)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            templateData.name,
            templateData.display_name,
            JSON.stringify(templateData.colors_config || {}),
            JSON.stringify(templateData.fonts_config || {}),
            JSON.stringify(templateData.layout_config || {}),
            templateData.logo_path || null,
            templateData.user_created || 1
        );

        return { success: true, templateId: result.lastInsertRowid };
    } catch (error) {
        console.error('Erreur lors de la création du template:', error);
        return { success: false, error: error.message };
    }
}

// Mettre à jour un template
function updateTemplate(id, templateData) {
    try {
        const stmt = db.prepare(`
            UPDATE invoice_templates
            SET display_name = ?, colors_config = ?, fonts_config = ?,
                layout_config = ?, logo_path = ?, updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')
            WHERE id = ? AND user_created = 1
        `);

        const result = stmt.run(
            templateData.display_name,
            JSON.stringify(templateData.colors_config || {}),
            JSON.stringify(templateData.fonts_config || {}),
            JSON.stringify(templateData.layout_config || {}),
            templateData.logo_path || null,
            id
        );

        return { success: result.changes > 0 };
    } catch (error) {
        console.error('Erreur lors de la mise à jour du template:', error);
        return { success: false, error: error.message };
    }
}

// Supprimer un template (seulement les templates utilisateur)
function deleteTemplate(id) {
    try {
        // Vérifier d'abord si le template existe et s'il est supprimable
        const checkStmt = db.prepare('SELECT is_system, user_created FROM invoice_templates WHERE id = ?');
        const template = checkStmt.get(id);

        if (!template) {
            return { success: false, error: 'Template non trouvé' };
        }

        if (template.is_system || !template.user_created) {
            return { success: false, error: 'Impossible de supprimer un template système' };
        }

        const stmt = db.prepare('DELETE FROM invoice_templates WHERE id = ? AND user_created = 1');
        const result = stmt.run(id);
        return { success: result.changes > 0 };
    } catch (error) {
        console.error('Erreur lors de la suppression du template:', error);
        return { success: false, error: error.message };
    }
}

// Définir un template par défaut
function setDefaultTemplate(id) {
    try {
        const transaction = db.transaction(() => {
            // Retirer le statut par défaut de tous les templates
            db.prepare('UPDATE invoice_templates SET is_default = 0').run();
            // Définir le nouveau template par défaut
            db.prepare('UPDATE invoice_templates SET is_default = 1 WHERE id = ?').run(id);
        });

        transaction();
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la définition du template par défaut:', error);
        return { success: false, error: error.message };
    }
}

// Récupérer le template par défaut
function getDefaultTemplate() {
    try {
        const stmt = db.prepare('SELECT * FROM invoice_templates WHERE is_default = 1 LIMIT 1');
        return stmt.get();
    } catch (error) {
        console.error('Erreur lors de la récupération du template par défaut:', error);
        return null;
    }
}

module.exports = {
    initDatabase,
    db,
    productDB: {
        getAll: getAllProducts,
        getById: getProductById,
        add: addProduct,
        update: updateProduct,
        delete: deleteProduct,
        getCategories,
        getLowStock: getLowStockProducts,
        adjustStock,
        updateThreshold: updateProductThreshold
    },
    clientDB: {
        getAll: getAllClients,
        getById: getClientById,
        add: addClient,
        forceAdd: forceAddClient,
        update: updateClient,
        delete: deleteClient,
        cleanupDuplicates: cleanupDuplicateClients,
        findSimilar: findSimilarClientNames
    },
    salesDB: {
        process: processSale,
        getHistory: getSalesHistory,
        getHistoryForUser,
        getClientSalesHistory,
        getDetails: getSaleDetails,
        edit: editSale,
        getLast: getLastSale,
        processReturn,
        getAll: getAllSales,
        getAllItems: getAllSaleItems
    },
    creditsDB: {
        getDebtors,
        getClientCredit,
        getClientCreditHistory,
        recordPayment: recordCreditPayment,
        addManual: addManualCredit
    },
    invoicesDB: {
        create: createInvoice,
        getAll: getInvoices,
        getDetails: getInvoiceDetails,
        getNextNumber: getNextInvoiceNumber,
        getAllItems: getAllInvoiceItems
    },
    settingsDB: {
        save: saveSetting,
        get: getSetting,
        getCompanyInfo,
        saveCompanyInfo,
        getAll: getAllSettings
    },
    usersDB: {
        authenticateUser,
        getAll: getAllUsers,
        add: addUser,
        updatePassword: updateUserPassword,
        delete: deleteUser,
        updateCredentials: updateUserCredentials
    },
    dashboardDB: {
        getStats: getDashboardStats,
        getTopProfitable: getTopProfitableProducts,
        getTopSelling: getTopSellingProducts,
        getPerformanceOverview: getProductPerformanceOverview,
        getInsights: getProductInsights
    },
    ticketDB: {
        generateUniqueTicketNumber,
        ticketNumberExists
    },
    returnsDB: {
        searchSales: searchSalesForReturns,
        getSaleDetails: getSaleReturnDetails,
        process: processProductReturn,
        getHistory: getReturnsHistory,
        getDetails: getReturnDetails,
        getExistingReturns: getExistingReturns,
        getStats: getReturnsStats,
        validate: validateReturnData
    },
    stockLotsDB: {
        createLot: createStockLot,
        getProductLots,
        getLotById,
        updateLotQuantity,
        recordMovement: recordStockMovement,
        getProductMovements,
        getValuationSettings: getProductValuationSettings,
        calculateAverageCost,
        migrateToStockLots,
        syncProductStock: syncProductStockWithLots,
        syncAllProductsStock: syncAllProductsStockWithLots,
        // Nouvelles fonctions d'intégration transparente
        adjustStockDirectly,
        createGenericLot,
        ensureProductHasLots,
        ensureAllProductsHaveLots,
        // Fonctions de filtrage et préférences
        saveLotFilterPreferences,
        getLotFilterPreferences,
        performBulkLotAction,
        // Gestion des fournisseurs
        createSupplier,
        getAllSuppliers,
        getSupplierById,
        updateSupplier,
        deleteSupplier,
        getSupplierStats,
        getSuppliersWithStats
    },

    quotesDB: {
        create: createQuote,
        getAll: getAllQuotes,
        getById: getQuoteById,
        update: updateQuote,
        delete: deleteQuote,
        updateStatus: updateQuoteStatus,
        getByStatus: getQuotesByStatus,
        convertToSale: convertQuoteToSale,
        getNextNumber: getNextQuoteNumber,
        addItem: addQuoteItem,
        updateItem: updateQuoteItem,
        deleteItem: deleteQuoteItem,
        getItems: getQuoteItems
    },

    expensesDB: new ExpensesDB(db),

    templatesDB: {
        getAll: getAllTemplates,
        getById: getTemplateById,
        create: createTemplate,
        update: updateTemplate,
        delete: deleteTemplate,
        setDefault: setDefaultTemplate,
        getDefault: getDefaultTemplate
    }
};