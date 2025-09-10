
// Optimisations de requêtes - À intégrer dans database.js

// Recherche produits optimisée avec LIMIT
const getAllProductsOptimized = (searchTerm = '', limit = 100) => {
    if (searchTerm) {
        return db.prepare(`
            SELECT * FROM products 
            WHERE name LIKE ? OR barcode LIKE ? 
            ORDER BY name ASC 
            LIMIT ?
        `).all(`%${searchTerm}%`, `%${searchTerm}%`, limit);
    }
    return db.prepare("SELECT * FROM products ORDER BY name ASC LIMIT ?").all(limit);
};

// Recherche clients optimisée
const getAllClientsOptimized = (searchTerm = '', limit = 100) => {
    if (searchTerm) {
        return db.prepare(`
            SELECT * FROM clients 
            WHERE name LIKE ? OR phone LIKE ? 
            ORDER BY name ASC 
            LIMIT ?
        `).all(`%${searchTerm}%`, `%${searchTerm}%`, limit);
    }
    return db.prepare("SELECT * FROM clients ORDER BY name ASC LIMIT ?").all(limit);
};

// Historique des ventes avec pagination
const getSalesHistoryOptimized = (filters = {}, page = 1, limit = 50) => {
    const offset = (page - 1) * limit;
    let query = `
        SELECT s.*, c.name as client_name, u.username 
        FROM sales s 
        LEFT JOIN clients c ON s.client_id = c.id 
        LEFT JOIN users u ON s.user_id = u.id 
        WHERE s.status = 'COMPLETED'
    `;
    
    const params = [];
    
    if (filters.startDate && filters.endDate) {
        query += " AND date(s.sale_date) BETWEEN ? AND ?";
        params.push(filters.startDate, filters.endDate);
    }
    
    query += " ORDER BY s.sale_date DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    
    return db.prepare(query).all(...params);
};

module.exports = {
    getAllProductsOptimized,
    getAllClientsOptimized, 
    getSalesHistoryOptimized
};
