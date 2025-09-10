const { parentPort } = require('worker_threads');
const db = require('./database.js'); // Le worker importe la configuration de la DB

// Le worker écoute les messages (tâches) venant de main.js
parentPort.on('message', (task) => {
    const { type, payload, taskId } = task;

    try {
        let result;
        
        // Ce grand 'switch' est le "standard téléphonique" qui dirige chaque appel
        // vers la bonne fonction de la base de données.
        switch (type) {
            case 'init': 
                db.initDatabase();
                result = true;
                break;
            
            // --- Produits ---
            case 'products:getAll': result = db.productDB.getAll(payload); break;
            case 'products:getById': result = db.productDB.getById(payload); break;
            case 'products:add': result = db.productDB.add(payload); break;
            case 'products:update': result = db.productDB.update(payload); break;
            case 'products:delete': result = db.productDB.delete(payload); break;
            case 'products:getCategories': result = db.productDB.getCategories(); break;
            case 'products:getLowStock': result = db.productDB.getLowStock(); break;
            case 'products:adjustStock': result = db.productDB.adjustStock(payload.adjustments, payload.reason, payload.userId); break;

            // --- Clients ---
            case 'clients:getAll': result = db.clientDB.getAll(payload); break;
            case 'clients:getById': result = db.clientDB.getById(payload); break;
            case 'clients:add': result = db.clientDB.add(payload); break;
            case 'clients:update': result = db.clientDB.update(payload); break;
            case 'clients:delete': result = db.clientDB.delete(payload); break;
            
            // --- Ventes ---
            case 'sales:process': result = db.salesDB.process(payload); break;
            case 'sales:getHistory': result = db.salesDB.getHistory(); break;
            case 'sales:getHistoryForUser': result = db.salesDB.getHistoryForUser(payload); break;
            case 'sales:getDetails': result = db.salesDB.getDetails(payload); break;
            case 'sales:processReturn': result = db.salesDB.processReturn(payload.originalSaleId, payload.itemsToReturn, payload.clientId); break;
            case 'sales:getLast': result = db.salesDB.getLast(payload); break;
            case 'sales:edit': result = db.salesDB.edit(payload.originalSaleId, payload.newSaleData); break;

            // --- Crédits ---
            case 'credits:getDebtors': result = db.creditsDB.getDebtors(); break;
            case 'credits:recordPayment': result = db.creditsDB.recordPayment(payload); break;
            case 'credits:addManual': result = db.creditsDB.addManual(payload); break;

            // --- Facturation ---
            case 'invoices:getAll': result = db.invoicesDB.getAll(); break;
            case 'invoices:getDetails': result = db.invoicesDB.getDetails(payload); break;
            case 'invoices:getNextNumber': result = db.invoicesDB.getNextNumber(); break;
            case 'invoices:create': result = db.invoicesDB.create(payload); break;
            
            // --- Paramètres ---
            case 'settings:getCompanyInfo': result = db.settingsDB.getCompanyInfo(); break;
            case 'settings:saveCompanyInfo': result = db.settingsDB.saveCompanyInfo(payload); break;
            
            // --- Thème ---
            case 'theme:get': result = db.settingsDB.get('theme'); break;
            case 'theme:set': result = db.settingsDB.save('theme', payload); break;

            // --- Utilisateurs ---
            case 'users:authenticate': result = db.usersDB.authenticateUser(payload.username, payload.password); break;
            case 'users:getAll': result = db.usersDB.getAll(); break;
            case 'users:add': result = db.usersDB.add(payload.username, payload.password); break;
            case 'users:updatePassword': result = db.usersDB.updateUserPassword(payload.id, payload.password); break;
            case 'users:delete': result = db.usersDB.deleteUser(payload); break;
            
            // --- Dashboard ---
            case 'dashboard:getStats': result = db.dashboardDB.getStats(payload); break;

            default:
                throw new Error(`Tâche de base de données inconnue dans le worker: ${type}`);
        }
        
        parentPort.postMessage({ status: 'success', taskId, result });

    } catch (error) {
        console.error(`Erreur dans le worker pour la tâche ${type}:`, error);
        parentPort.postMessage({ status: 'error', taskId, error: { message: error.message, stack: error.stack } });
    }
});