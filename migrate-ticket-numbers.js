/**
 * Script de migration pour attribuer des numéros de tickets aux ventes existantes
 * Ce script doit être exécuté une seule fois après l'implémentation du système de retours
 */

const fs = require('fs');

// Utiliser le module database.js existant
let db;
try {
    const dbModule = require('./database.js');
    db = dbModule.db;
    console.log('✅ Module database.js chargé avec succès');
} catch (error) {
    console.error('❌ Erreur lors du chargement du module database.js:', error.message);
    console.log('💡 Assurez-vous que le fichier database.js existe et est accessible.');
    process.exit(1);
}

console.log('🔄 Début de la migration des numéros de tickets...');

try {
    // Vérifier que la colonne ticket_number existe
    const columns = db.prepare("PRAGMA table_info(sales)").all();
    const hasTicketNumber = columns.some(col => col.name === 'ticket_number');
    
    if (!hasTicketNumber) {
        console.error('❌ La colonne ticket_number n\'existe pas dans la table sales');
        console.log('💡 Veuillez d\'abord exécuter les migrations de base de données.');
        process.exit(1);
    }
    
    console.log('✅ Colonne ticket_number trouvée');
    
    // Compter les ventes sans numéro de ticket
    const salesWithoutTickets = db.prepare(`
        SELECT COUNT(*) as count 
        FROM sales 
        WHERE ticket_number IS NULL OR ticket_number = ''
    `).get();
    
    console.log(`📊 Ventes sans numéro de ticket: ${salesWithoutTickets.count}`);
    
    if (salesWithoutTickets.count === 0) {
        console.log('✅ Toutes les ventes ont déjà des numéros de tickets');
        console.log('🎉 Migration terminée - Aucune action nécessaire');
        process.exit(0);
    }
    
    // Récupérer toutes les ventes sans numéro de ticket, triées par date
    const salesToMigrate = db.prepare(`
        SELECT id, sale_date, total_amount, client_id
        FROM sales 
        WHERE ticket_number IS NULL OR ticket_number = ''
        ORDER BY sale_date ASC, id ASC
    `).all();
    
    console.log(`🔄 Migration de ${salesToMigrate.length} ventes...`);
    
    // Préparer la requête de mise à jour
    const updateTicketStmt = db.prepare('UPDATE sales SET ticket_number = ? WHERE id = ?');
    
    // Compteurs pour générer des numéros uniques
    const dailyCounters = new Map(); // Map<dateString, counter>
    const usedTickets = new Set(); // Pour éviter les doublons
    
    // Récupérer les tickets existants pour éviter les conflits
    const existingTickets = db.prepare(`
        SELECT ticket_number 
        FROM sales 
        WHERE ticket_number IS NOT NULL AND ticket_number != ''
    `).all();
    
    existingTickets.forEach(row => {
        if (row.ticket_number) {
            usedTickets.add(row.ticket_number);
        }
    });
    
    console.log(`📋 ${usedTickets.size} numéros de tickets existants trouvés`);
    
    // Fonction pour générer un numéro de ticket unique
    function generateUniqueTicket(saleDate, saleId) {
        const date = new Date(saleDate);
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        
        // Obtenir le compteur pour cette date
        let counter = dailyCounters.get(dateStr) || 0;
        
        let ticketNumber;
        let attempts = 0;
        const maxAttempts = 1000;
        
        do {
            counter++;
            ticketNumber = `V-${dateStr}-${counter.toString().padStart(4, '0')}`;
            attempts++;
            
            if (attempts >= maxAttempts) {
                // Fallback avec l'ID de vente pour garantir l'unicité
                ticketNumber = `V-${dateStr}-${saleId.toString().padStart(4, '0')}`;
                break;
            }
        } while (usedTickets.has(ticketNumber));
        
        // Mettre à jour le compteur et marquer le ticket comme utilisé
        dailyCounters.set(dateStr, counter);
        usedTickets.add(ticketNumber);
        
        return ticketNumber;
    }
    
    // Commencer la transaction
    const transaction = db.transaction(() => {
        let migratedCount = 0;
        let errorCount = 0;
        
        for (const sale of salesToMigrate) {
            try {
                const ticketNumber = generateUniqueTicket(sale.sale_date, sale.id);
                updateTicketStmt.run(ticketNumber, sale.id);
                migratedCount++;
                
                if (migratedCount % 100 === 0) {
                    console.log(`  📈 ${migratedCount}/${salesToMigrate.length} ventes migrées...`);
                }
            } catch (error) {
                console.error(`❌ Erreur pour la vente ID ${sale.id}:`, error.message);
                errorCount++;
            }
        }
        
        return { migratedCount, errorCount };
    });
    
    // Exécuter la transaction
    console.log('🔄 Exécution de la migration...');
    const result = transaction();
    
    console.log('\n📊 Résultats de la migration:');
    console.log(`✅ Ventes migrées avec succès: ${result.migratedCount}`);
    console.log(`❌ Erreurs rencontrées: ${result.errorCount}`);
    
    if (result.errorCount > 0) {
        console.log('⚠️ Certaines ventes n\'ont pas pu être migrées');
    }
    
    // Vérification finale
    const finalCheck = db.prepare(`
        SELECT COUNT(*) as remaining 
        FROM sales 
        WHERE ticket_number IS NULL OR ticket_number = ''
    `).get();
    
    console.log(`📋 Ventes restantes sans ticket: ${finalCheck.remaining}`);
    
    if (finalCheck.remaining === 0) {
        console.log('🎉 Migration terminée avec succès !');
        console.log('✅ Toutes les ventes ont maintenant des numéros de tickets');
    } else {
        console.log('⚠️ Migration partiellement réussie');
        console.log(`${finalCheck.remaining} ventes nécessitent encore une attention manuelle`);
    }
    
    // Afficher quelques exemples de tickets générés
    console.log('\n📝 Exemples de tickets générés:');
    const sampleTickets = db.prepare(`
        SELECT ticket_number, sale_date, total_amount 
        FROM sales 
        WHERE ticket_number LIKE 'V-%' 
        ORDER BY sale_date DESC 
        LIMIT 5
    `).all();
    
    sampleTickets.forEach(sale => {
        const date = new Date(sale.sale_date).toLocaleDateString('fr-FR');
        console.log(`  ${sale.ticket_number} - ${date} - ${sale.total_amount.toFixed(2)} MAD`);
    });
    
    // Statistiques par jour
    console.log('\n📈 Statistiques par jour:');
    const dailyStats = db.prepare(`
        SELECT 
            DATE(sale_date) as sale_day,
            COUNT(*) as count,
            MIN(ticket_number) as first_ticket,
            MAX(ticket_number) as last_ticket
        FROM sales 
        WHERE ticket_number LIKE 'V-%'
        GROUP BY DATE(sale_date)
        ORDER BY sale_day DESC
        LIMIT 10
    `).all();
    
    dailyStats.forEach(stat => {
        console.log(`  ${stat.sale_day}: ${stat.count} ventes (${stat.first_ticket} → ${stat.last_ticket})`);
    });
    
} catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
}

console.log('\n✅ Script de migration terminé');
console.log('💡 Vous pouvez maintenant utiliser le système de retours avec toutes les ventes existantes');
