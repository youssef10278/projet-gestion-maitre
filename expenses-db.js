/**
 * Module de gestion de la base de données pour les dépenses
 */

class ExpensesDB {
    constructor(db) {
        this.db = db;
        this.initializeTables();
    }

    /**
     * Initialise les tables pour les dépenses
     */
    initializeTables() {
        try {
            // Table des dépenses
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS expenses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    description TEXT NOT NULL,
                    amount REAL NOT NULL,
                    category TEXT NOT NULL,
                    date TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    recurring_id INTEGER,
                    user_id INTEGER,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (recurring_id) REFERENCES recurring_expenses(id)
                )
            `);

            // Table des dépenses récurrentes
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS recurring_expenses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    amount REAL NOT NULL,
                    category TEXT NOT NULL,
                    frequency TEXT NOT NULL,
                    next_date TEXT NOT NULL,
                    active INTEGER DEFAULT 1,
                    user_id INTEGER,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Table des catégories de dépenses
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS expense_categories (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    color TEXT DEFAULT 'blue',
                    icon TEXT DEFAULT '💰',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Table des paramètres de budget
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS budget_settings (
                    id INTEGER PRIMARY KEY,
                    monthly_budget REAL DEFAULT 0,
                    yearly_budget REAL DEFAULT 0,
                    currency TEXT DEFAULT 'MAD',
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Insérer les catégories par défaut si elles n'existent pas
            this.insertDefaultCategories();

            // Note: insertTestData() supprimé pour éviter les données de test automatiques

            console.log('✅ Tables des dépenses initialisées');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation des tables dépenses:', error);
            throw error;
        }
    }

    /**
     * Insère les catégories par défaut
     */
    insertDefaultCategories() {
        const categories = [
            { id: 'fixed', name: 'Charges fixes', color: 'blue', icon: '🏢' },
            { id: 'variable', name: 'Charges variables', color: 'green', icon: '📊' },
            { id: 'exceptional', name: 'Exceptionnelles', color: 'yellow', icon: '⚡' }
        ];

        const insertCategory = this.db.prepare(`
            INSERT OR IGNORE INTO expense_categories (id, name, color, icon)
            VALUES (?, ?, ?, ?)
        `);

        categories.forEach(category => {
            insertCategory.run(category.id, category.name, category.color, category.icon);
        });
    }

    /**
     * Insère des données de test
     */
    insertTestData() {
        const expenseCount = this.db.prepare('SELECT COUNT(*) as count FROM expenses').get();
        
        if (expenseCount.count === 0) {
            // Insérer des dépenses de test
            const testExpenses = [
                {
                    description: 'Loyer du magasin',
                    amount: 3500,
                    category: 'fixed',
                    date: '2025-01-20',
                    status: 'paid'
                },
                {
                    description: 'Facture électricité',
                    amount: 450,
                    category: 'fixed',
                    date: '2025-01-19',
                    status: 'paid'
                },
                {
                    description: 'Achat fournitures bureau',
                    amount: 120,
                    category: 'variable',
                    date: '2025-01-18',
                    status: 'pending'
                }
            ];

            const insertExpense = this.db.prepare(`
                INSERT INTO expenses (description, amount, category, date, status)
                VALUES (?, ?, ?, ?, ?)
            `);

            testExpenses.forEach(expense => {
                insertExpense.run(expense.description, expense.amount, expense.category, expense.date, expense.status);
            });

            // Insérer des dépenses récurrentes de test
            const testRecurring = [
                {
                    name: 'Loyer magasin',
                    description: 'Loyer mensuel du local commercial',
                    amount: 3500,
                    category: 'fixed',
                    frequency: 'monthly',
                    next_date: '2025-02-01'
                },
                {
                    name: 'Assurance locale',
                    description: 'Assurance mensuelle du magasin',
                    amount: 800,
                    category: 'fixed',
                    frequency: 'monthly',
                    next_date: '2025-01-25'
                }
            ];

            const insertRecurring = this.db.prepare(`
                INSERT INTO recurring_expenses (name, description, amount, category, frequency, next_date)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            testRecurring.forEach(recurring => {
                insertRecurring.run(recurring.name, recurring.description, recurring.amount, recurring.category, recurring.frequency, recurring.next_date);
            });

            console.log('✅ Données de test des dépenses insérées');
        }
    }

    /**
     * Récupère toutes les dépenses avec filtres optionnels
     */
    getAll(filters = {}) {
        try {
            let query = 'SELECT * FROM expenses WHERE 1=1';
            const params = [];

            if (filters.category) {
                query += ' AND category = ?';
                params.push(filters.category);
            }

            if (filters.status) {
                query += ' AND status = ?';
                params.push(filters.status);
            }

            if (filters.dateFrom) {
                query += ' AND date >= ?';
                params.push(filters.dateFrom);
            }

            if (filters.dateTo) {
                query += ' AND date <= ?';
                params.push(filters.dateTo);
            }

            query += ' ORDER BY date DESC, created_at DESC';

            const stmt = this.db.prepare(query);
            return stmt.all(...params);
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des dépenses:', error);
            throw error;
        }
    }

    /**
     * Récupère une dépense par ID
     */
    getById(id) {
        try {
            const stmt = this.db.prepare('SELECT * FROM expenses WHERE id = ?');
            return stmt.get(id);
        } catch (error) {
            console.error('❌ Erreur lors de la récupération de la dépense:', error);
            throw error;
        }
    }

    /**
     * Crée une nouvelle dépense
     */
    create(expenseData) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO expenses (description, amount, category, date, status, recurring_id, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                expenseData.description,
                expenseData.amount,
                expenseData.category,
                expenseData.date || new Date().toISOString().split('T')[0],
                expenseData.status || 'pending',
                expenseData.recurring_id || null,
                expenseData.userId || null
            );

            return { id: result.lastInsertRowid, ...expenseData };
        } catch (error) {
            console.error('❌ Erreur lors de la création de la dépense:', error);
            throw error;
        }
    }

    /**
     * Met à jour une dépense
     */
    update(id, expenseData) {
        try {
            const stmt = this.db.prepare(`
                UPDATE expenses 
                SET description = ?, amount = ?, category = ?, date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);

            const result = stmt.run(
                expenseData.description,
                expenseData.amount,
                expenseData.category,
                expenseData.date,
                expenseData.status,
                id
            );

            if (result.changes === 0) {
                throw new Error('Dépense non trouvée');
            }

            return this.getById(id);
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour de la dépense:', error);
            throw error;
        }
    }

    /**
     * Supprime une dépense
     */
    delete(id) {
        try {
            const stmt = this.db.prepare('DELETE FROM expenses WHERE id = ?');
            const result = stmt.run(id);

            if (result.changes === 0) {
                throw new Error('Dépense non trouvée');
            }

            return { success: true, id };
        } catch (error) {
            console.error('❌ Erreur lors de la suppression de la dépense:', error);
            throw error;
        }
    }

    /**
     * Récupère les catégories
     */
    getCategories() {
        try {
            const stmt = this.db.prepare('SELECT * FROM expense_categories ORDER BY name');
            return stmt.all();
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des catégories:', error);
            throw error;
        }
    }

    /**
     * Récupère les statistiques des dépenses
     */
    getStats(period = 'month') {
        try {
            const now = new Date();
            let dateFilter = '';

            if (period === 'month') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                dateFilter = `AND date >= '${startOfMonth}'`;
            } else if (period === 'year') {
                const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                dateFilter = `AND date >= '${startOfYear}'`;
            }

            const totalStmt = this.db.prepare(`
                SELECT 
                    SUM(amount) as total,
                    COUNT(*) as count,
                    AVG(amount) as average
                FROM expenses 
                WHERE 1=1 ${dateFilter}
            `);

            const byCategoryStmt = this.db.prepare(`
                SELECT 
                    category,
                    SUM(amount) as total,
                    COUNT(*) as count
                FROM expenses 
                WHERE 1=1 ${dateFilter}
                GROUP BY category
            `);

            const pendingStmt = this.db.prepare(`
                SELECT COUNT(*) as count, SUM(amount) as total
                FROM expenses 
                WHERE status = 'pending' ${dateFilter}
            `);

            return {
                total: totalStmt.get(),
                byCategory: byCategoryStmt.all(),
                pending: pendingStmt.get()
            };
        } catch (error) {
            console.error('❌ Erreur lors du calcul des statistiques:', error);
            throw error;
        }
    }

    /**
     * Récupère les dépenses récurrentes
     */
    getRecurring() {
        try {
            const stmt = this.db.prepare('SELECT * FROM recurring_expenses WHERE active = 1 ORDER BY next_date');
            return stmt.all();
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des dépenses récurrentes:', error);
            throw error;
        }
    }

    /**
     * Récupère les prochaines échéances
     */
    getUpcoming(days = 7) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);
            const futureDateStr = futureDate.toISOString().split('T')[0];

            const stmt = this.db.prepare(`
                SELECT * FROM recurring_expenses 
                WHERE active = 1 AND next_date >= ? AND next_date <= ?
                ORDER BY next_date
            `);

            return stmt.all(today, futureDateStr);
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des échéances:', error);
            throw error;
        }
    }

    /**
     * Crée une dépense récurrente
     */
    createRecurring(recurringData) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO recurring_expenses (name, description, amount, category, frequency, next_date, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                recurringData.name,
                recurringData.description || '',
                recurringData.amount,
                recurringData.category,
                recurringData.frequency,
                recurringData.next_date,
                recurringData.userId || null
            );

            return { id: result.lastInsertRowid, ...recurringData };
        } catch (error) {
            console.error('❌ Erreur lors de la création de la dépense récurrente:', error);
            throw error;
        }
    }

    /**
     * Met à jour une dépense récurrente
     */
    updateRecurring(id, recurringData) {
        try {
            const stmt = this.db.prepare(`
                UPDATE recurring_expenses 
                SET name = ?, description = ?, amount = ?, category = ?, frequency = ?, next_date = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);

            const result = stmt.run(
                recurringData.name,
                recurringData.description,
                recurringData.amount,
                recurringData.category,
                recurringData.frequency,
                recurringData.next_date,
                id
            );

            if (result.changes === 0) {
                throw new Error('Dépense récurrente non trouvée');
            }

            return this.getRecurringById(id);
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour de la dépense récurrente:', error);
            throw error;
        }
    }

    /**
     * Supprime une dépense récurrente
     */
    deleteRecurring(id) {
        try {
            const stmt = this.db.prepare('DELETE FROM recurring_expenses WHERE id = ?');
            const result = stmt.run(id);

            if (result.changes === 0) {
                throw new Error('Dépense récurrente non trouvée');
            }

            return { success: true, id };
        } catch (error) {
            console.error('❌ Erreur lors de la suppression de la dépense récurrente:', error);
            throw error;
        }
    }

    /**
     * Traite une dépense récurrente (crée la dépense et met à jour la prochaine date)
     */
    processRecurring(id) {
        try {
            const recurring = this.getRecurringById(id);
            if (!recurring) {
                throw new Error('Dépense récurrente non trouvée');
            }

            // Créer la dépense
            const expense = this.create({
                description: recurring.name,
                amount: recurring.amount,
                category: recurring.category,
                date: recurring.next_date,
                status: 'pending',
                recurring_id: id
            });

            // Calculer la prochaine date
            const nextDate = this.calculateNextDate(recurring.next_date, recurring.frequency);

            // Mettre à jour la dépense récurrente
            const updateStmt = this.db.prepare(`
                UPDATE recurring_expenses 
                SET next_date = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);
            updateStmt.run(nextDate, id);

            return { expense, nextDate };
        } catch (error) {
            console.error('❌ Erreur lors du traitement de la dépense récurrente:', error);
            throw error;
        }
    }

    /**
     * Récupère une dépense récurrente par ID
     */
    getRecurringById(id) {
        try {
            const stmt = this.db.prepare('SELECT * FROM recurring_expenses WHERE id = ?');
            return stmt.get(id);
        } catch (error) {
            console.error('❌ Erreur lors de la récupération de la dépense récurrente:', error);
            throw error;
        }
    }

    /**
     * Calcule la prochaine date selon la fréquence
     */
    calculateNextDate(currentDate, frequency) {
        const date = new Date(currentDate);
        
        switch (frequency) {
            case 'daily':
                date.setDate(date.getDate() + 1);
                break;
            case 'weekly':
                date.setDate(date.getDate() + 7);
                break;
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'quarterly':
                date.setMonth(date.getMonth() + 3);
                break;
            case 'yearly':
                date.setFullYear(date.getFullYear() + 1);
                break;
            default:
                date.setMonth(date.getMonth() + 1); // Par défaut mensuel
        }
        
        return date.toISOString().split('T')[0];
    }

    /**
     * Récupère les paramètres de budget
     */
    getBudgetSettings() {
        try {
            const stmt = this.db.prepare('SELECT * FROM budget_settings WHERE id = 1');
            const settings = stmt.get();

            if (!settings) {
                // Créer des paramètres par défaut
                const defaultSettings = {
                    monthly_budget: 10000,
                    yearly_budget: 120000,
                    currency: 'MAD'
                };
                this.setBudgetSettings(defaultSettings);
                return { monthlyBudget: 10000, yearlyBudget: 120000, currency: 'MAD' };
            }

            return {
                monthlyBudget: settings.monthly_budget,
                yearlyBudget: settings.yearly_budget,
                currency: settings.currency
            };
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des paramètres de budget:', error);
            throw error;
        }
    }

    /**
     * Met à jour les paramètres de budget
     */
    setBudgetSettings(settings) {
        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO budget_settings (id, monthly_budget, yearly_budget, currency, updated_at)
                VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)
            `);

            const result = stmt.run(
                settings.monthlyBudget || 0,
                settings.yearlyBudget || 0,
                settings.currency || 'MAD'
            );

            console.log(`✅ Paramètres de budget mis à jour: ${settings.monthlyBudget} MAD/mois`);
            return { success: true, changes: result.changes };
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour des paramètres de budget:', error);
            throw error;
        }
    }

    /**
     * Nettoie toutes les données de test
     */
    clearTestData() {
        try {
            console.log('🧹 Nettoyage des données de test...');

            // Supprimer toutes les dépenses
            const deleteExpenses = this.db.prepare('DELETE FROM expenses');
            const expensesResult = deleteExpenses.run();

            // Supprimer toutes les dépenses récurrentes
            const deleteRecurring = this.db.prepare('DELETE FROM recurring_expenses');
            const recurringResult = deleteRecurring.run();

            console.log(`✅ ${expensesResult.changes} dépense(s) supprimée(s)`);
            console.log(`✅ ${recurringResult.changes} dépense(s) récurrente(s) supprimée(s)`);

            return {
                success: true,
                expensesDeleted: expensesResult.changes,
                recurringDeleted: recurringResult.changes
            };
        } catch (error) {
            console.error('❌ Erreur lors du nettoyage des données de test:', error);
            throw error;
        }
    }

    /**
     * Vérifie si la base contient des données de test
     */
    hasTestData() {
        try {
            const testExpenseCheck = this.db.prepare(`
                SELECT COUNT(*) as count FROM expenses
                WHERE description IN ('Loyer du magasin', 'Facture électricité', 'Achat fournitures bureau')
            `).get();

            const testRecurringCheck = this.db.prepare(`
                SELECT COUNT(*) as count FROM recurring_expenses
                WHERE name IN ('Loyer magasin', 'Assurance locale')
            `).get();

            return testExpenseCheck.count > 0 || testRecurringCheck.count > 0;
        } catch (error) {
            console.error('❌ Erreur lors de la vérification des données de test:', error);
            return false;
        }
    }
}

module.exports = ExpensesDB;
