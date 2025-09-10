// main.js - MODIFIÉ POUR L'INTERNATIONALISATION
const { app, BrowserWindow, ipcMain, nativeTheme, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { machineIdSync } = require('node-machine-id');
const db = require('./database.js');
const LicenseManagerElectron = require('./license-manager-electron');

// ===== OPTIMISATIONS PERFORMANCE ELECTRON CRITIQUES =====
// Optimisations mémoire et performance maximales
app.commandLine.appendSwitch('--max-old-space-size', '8192'); // Augmenté pour de meilleures performances
app.commandLine.appendSwitch('--js-flags', '--max-old-space-size=8192 --optimize-for-size');

// Optimisations de rendu et GPU
app.commandLine.appendSwitch('--enable-features', 'VaapiVideoDecoder,UseSkiaRenderer');
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor,UseChromeOSDirectVideoDecoder');

// Optimisations réseau et cache (augmentées)
app.commandLine.appendSwitch('--disk-cache-size', '100000000'); // 100MB cache
app.commandLine.appendSwitch('--media-cache-size', '50000000'); // 50MB media cache

// Optimisations de performance supplémentaires
app.commandLine.appendSwitch('--enable-gpu-rasterization');
app.commandLine.appendSwitch('--enable-zero-copy');
app.commandLine.appendSwitch('--disable-background-timer-throttling');
app.commandLine.appendSwitch('--disable-renderer-backgrounding');
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');

// Désactiver l'accélération matérielle pour éviter les conflits
app.disableHardwareAcceleration();

const activationFilePath = path.join(app.getPath('userData'), 'activation.json');
let currentUser = null;
let mainWindow;
let licenseManager = new LicenseManagerElectron();

try {
    db.initDatabase();
} catch (err) {
    console.error("Erreur critique lors de l'initialisation de la DB:", err);
    app.quit();
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        show: false,
        // ===== OPTIMISATIONS PERFORMANCE FENÊTRE =====
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            // Optimisations mémoire
            webSecurity: true,
            allowRunningInsecureContent: false,
            experimentalFeatures: false,
            // Cache et performance
            partition: 'persist:main',
            spellcheck: false, // Désactiver la vérification orthographique pour les performances
        },
        // Optimisations d'affichage
        backgroundColor: '#ffffff',
        titleBarStyle: 'default',
        // Optimisations mémoire
        thickFrame: false,
    });

    // Optimisations post-création
    mainWindow.webContents.setFrameRate(60); // Limiter le framerate

    const savedTheme = db.settingsDB.get('theme');
    if (savedTheme) nativeTheme.themeSource = savedTheme;
    mainWindow.on('closed', () => { mainWindow = null; });
}

function createModalWindow(options, file) {
    const window = new BrowserWindow({
        width: options.width,
        height: options.height,
        frame: false,
        resizable: false,
        parent: mainWindow,
        modal: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Charger directement le fichier (pas de sous-dossier build dans l'exe)
    const filePath = path.join(__dirname, file);
    window.loadFile(filePath);
    window.once('ready-to-show', () => window.show());
    return window;
}

app.whenReady().then(() => {
    createMainWindow();

    // SYSTÈME PROFESSIONNEL : Vérification simple et définitive
    checkLicenseOnStartup();
});

// Fonction de vérification professionnelle - Simple et efficace
function checkLicenseOnStartup() {
    try {
        if (fs.existsSync(activationFilePath)) {
            const activationData = JSON.parse(fs.readFileSync(activationFilePath));

            if (activationData && activationData.activated && activationData.licenseKey) {
                console.log('✅ Licence trouvée - Accès autorisé');
                createModalWindow({ width: 400, height: 500 }, 'login.html');
            } else {
                console.log('⚠️ Fichier d\'activation corrompu');
                createModalWindow({ width: 500, height: 350 }, 'activation.html');
            }
        } else {
            console.log('ℹ️ Aucune activation trouvée');
            createModalWindow({ width: 500, height: 350 }, 'activation.html');
        }
    } catch (error) {
        console.error("❌ Erreur lors de la vérification de licence:", error);
        createModalWindow({ width: 500, height: 350 }, 'activation.html');
    }
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// Fonctions de gestion des requêtes IPC
async function handleRequest(handler, ipcChannel) {
    console.time(`IPC: ${ipcChannel}`);
    try {
        return await handler();
    } catch (error) {
        console.error(`Erreur IPC sur '${ipcChannel}':`, error.message);
        throw error;
    } finally {
        console.timeEnd(`IPC: ${ipcChannel}`);
    }
}

async function handleUserRequest(handler, ipcChannel) {
    if (!currentUser || !currentUser.id) throw new Error("Aucun utilisateur n'est connecté.");
    return handleRequest(handler, ipcChannel);
}

// --- Canaux IPC ---
ipcMain.handle('app:get-machine-id', () => handleRequest(() => machineIdSync({ original: true }), 'app:get-machine-id'));
ipcMain.handle('session:get-current-user', () => handleRequest(() => currentUser, 'session:get-current-user'));
ipcMain.handle('users:authenticate', async (event, { username, password }) => {
    const user = await handleRequest(() => db.usersDB.authenticateUser(username, password), 'users:authenticate');
    if (user) {
        currentUser = user;
        const htmlFile = user.role === 'Propriétaire' ? 'src/index.html' : 'src/caisse.html';
        // Charger directement depuis src/ (pas de sous-dossier build dans l'exe)
        const filePath = path.join(__dirname, htmlFile);
        await mainWindow.loadFile(filePath);
        mainWindow.show();
        BrowserWindow.fromWebContents(event.sender)?.close();
    }
    return user;
});
ipcMain.on('app:activation-success', (event) => { BrowserWindow.fromWebContents(event.sender)?.close(); createModalWindow({ width: 400, height: 500 }, 'login.html'); });

// --- SYSTÈME PROFESSIONNEL D'ACTIVATION DE LICENCE ---
ipcMain.handle('activate-license', async (event, licenseKey) => {
    return handleRequest(async () => {
        try {
            console.log('🔄 Tentative d\'activation:', licenseKey);

            // Validation avec le gestionnaire de licences professionnel
            const activation = await licenseManager.activateLicense(licenseKey);

            if (activation.success) {
                console.log('✅ Licence activée avec succès');

                // Obtenir les informations de la machine
                const machineInfo = licenseManager.getMachineInfo();

                // Sauvegarder l'activation locale - SYSTÈME PROFESSIONNEL
                const activationData = {
                    activated: true,
                    licenseKey: licenseKey,
                    machineId: machineInfo.machineId,
                    hardwareFingerprint: machineInfo.hardwareFingerprint,
                    activationDate: new Date().toISOString()
                };

                fs.writeFileSync(activationFilePath, JSON.stringify(activationData, null, 2));

                // Fermer la fenêtre d'activation et ouvrir la fenêtre de connexion
                BrowserWindow.fromWebContents(event.sender)?.close();
                createModalWindow({ width: 400, height: 500 }, 'login.html');

                // Activation terminée - Pas de validation périodique (SYSTÈME PROFESSIONNEL)
                console.log('✅ Activation terminée - Licence valide définitivement');

                return { success: true, message: 'Licence activée avec succès' };
            } else {
                console.log('❌ Activation échouée:', activation.message);
                return { success: false, message: activation.message };
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'activation:', error);
            return { success: false, message: 'Erreur lors de l\'activation: ' + error.message };
        }
    }, 'activate-license');
});

// Plus de fonction de validation basique - Utilisation du gestionnaire professionnel
ipcMain.handle('dialog:open-image', async () => { const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }] }); if (canceled || filePaths.length === 0) return null; try { const filePath = filePaths[0]; const fileData = fs.readFileSync(filePath); const mimeType = 'image/' + path.extname(filePath).substring(1); const base64Data = fileData.toString('base64'); return `data:${mimeType};base64,${base64Data}`; } catch (error) { console.error("Erreur de lecture du fichier image:", error); return null; } });
ipcMain.handle('theme:get', () => handleRequest(() => db.settingsDB.get('theme'), 'theme:get'));
ipcMain.handle('theme:set', (event, theme) => handleRequest(() => { nativeTheme.themeSource = theme; db.settingsDB.save('theme', theme); return nativeTheme.shouldUseDarkColors; }, 'theme:set'));

// --- Canaux pour l'internationalisation (i18n) ---
ipcMain.handle('settings:get-language', () => handleRequest(() => db.settingsDB.get('language'), 'settings:get-language'));
ipcMain.handle('settings:set-language', (event, lang) => handleRequest(() => { db.settingsDB.save('language', lang); return { success: true }; }, 'settings:set-language'));
ipcMain.handle('app:reload', () => { if (mainWindow) { mainWindow.reload(); } });

ipcMain.handle('i18n:get-translation', (event, lang) => {
    // Valider le code de langue pour la sécurité
    if (!lang || !/^[a-z]{2}$/.test(lang)) {
        console.error('Tentative de chargement avec un code de langue invalide:', lang);
        throw new Error('Code de langue invalide.');
    }
    const filePath = path.join(__dirname, 'src', 'locales', `${lang}.json`);
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Impossible de lire le fichier de traduction : ${filePath}`, error);
        return {}; // Renvoyer un objet vide pour éviter un crash
    }
});

// --- FONCTION DE RÉINITIALISATION COMPLÈTE TOTALE ---
ipcMain.handle('system:factory-reset', async (event) => {
    return handleRequest(async () => {
        console.log('🧹 DÉBUT: Réinitialisation TOTALE de toutes les données...');
        console.log('⚠️  ATTENTION: Suppression de TOUT - Utilisateurs, Devis, Bons de livraison, Paramètres entreprise');

        try {
            // === SUPPRESSION TOTALE DE TOUTES LES DONNÉES ===
            const queries = [
                // 1. DONNÉES TRANSACTIONNELLES
                'DELETE FROM sale_items',
                'DELETE FROM sales',
                'DELETE FROM invoice_items',
                'DELETE FROM invoices',
                'DELETE FROM quote_items',
                'DELETE FROM quotes',
                'DELETE FROM return_items',
                'DELETE FROM returns',
                'DELETE FROM credit_payments',

                // 2. DONNÉES PRODUITS ET STOCK
                'DELETE FROM products',
                'DELETE FROM stock_lots',
                'DELETE FROM stock_movements',
                'DELETE FROM stock_adjustments',
                'DELETE FROM product_valuation_settings',

                // 3. DONNÉES CLIENTS ET FOURNISSEURS
                'DELETE FROM clients',
                'DELETE FROM suppliers',
                'DELETE FROM supplier_order_items',
                'DELETE FROM supplier_orders',
                'DELETE FROM supplier_delivery_items',
                'DELETE FROM supplier_deliveries',

                // 4. DÉPENSES
                'DELETE FROM expenses',

                // 5. TEMPLATES ET PRÉFÉRENCES
                'DELETE FROM invoice_templates',
                'DELETE FROM user_template_preferences',
                'DELETE FROM user_preferences',

                // 6. UTILISATEURS (DEMANDÉ PAR L'UTILISATEUR)
                'DELETE FROM users',

                // 7. PARAMÈTRES ENTREPRISE (DEMANDÉ PAR L'UTILISATEUR)
                'DELETE FROM settings',

                // 8. RÉINITIALISER TOUS LES COMPTEURS AUTO-INCREMENT
                'DELETE FROM sqlite_sequence'
            ];

            console.log(`📋 ${queries.length} requêtes de suppression à exécuter...`);

            // Exécuter toutes les requêtes dans une transaction
            const db_instance = db.db; // Accès direct à l'instance SQLite
            db_instance.transaction(() => {
                queries.forEach((query, index) => {
                    try {
                        db_instance.prepare(query).run();
                        console.log(`✅ ${index + 1}/${queries.length}: ${query.split(' ')[2]}`);
                    } catch (error) {
                        // Ignorer les erreurs de tables inexistantes
                        if (!error.message.includes('no such table')) {
                            console.warn(`⚠️  Erreur sur: ${query} - ${error.message}`);
                        }
                    }
                });
            })();

            console.log('✅ Réinitialisation TOTALE terminée avec succès');
            console.log('🔄 L\'application va redémarrer pour appliquer les changements...');

            return {
                success: true,
                message: 'RÉINITIALISATION TOTALE RÉUSSIE ! Toutes les données ont été supprimées définitivement.',
                details: {
                    deleted: [
                        'Tous les Produits et Stock',
                        'Tous les Clients',
                        'Toutes les Ventes et Historique',
                        'Toutes les Factures',
                        'Tous les Devis',
                        'Tous les Bons de livraison',
                        'Tous les Retours',
                        'Tous les Fournisseurs',
                        'Toutes les Dépenses',
                        'Tous les Templates',
                        'Tous les Utilisateurs',
                        'Tous les Paramètres Entreprise'
                    ],
                    kept: ['Structure de base de données uniquement'],
                    restart_required: true
                }
            };

        } catch (error) {
            console.error('❌ Erreur lors de la réinitialisation TOTALE:', error);
            return {
                success: false,
                message: `Erreur lors de la réinitialisation TOTALE: ${error.message}`
            };
        }
    }, 'system:factory-reset');
});

// --- Autres canaux IPC ---
ipcMain.handle('products:get-all', (event, searchTerm) => handleRequest(() => db.productDB.getAll(searchTerm), 'products:get-all'));
ipcMain.handle('products:get-by-id', (event, id) => handleRequest(() => db.productDB.getById(id), 'products:get-by-id'));
ipcMain.handle('products:get-categories', () => handleRequest(() => db.productDB.getCategories(), 'products:get-categories'));
ipcMain.handle('products:get-low-stock', () => handleRequest(() => db.productDB.getLowStock(), 'products:get-low-stock'));
ipcMain.handle('products:add', (event, payload) => handleRequest(() => db.productDB.add(payload), 'products:add'));
ipcMain.handle('products:update', (event, payload) => handleRequest(() => db.productDB.update(payload), 'products:update'));
ipcMain.handle('products:delete', (event, payload) => handleRequest(() => db.productDB.delete(payload), 'products:delete'));
ipcMain.handle('clients:get-all', (event, searchTerm) => handleRequest(() => db.clientDB.getAll(searchTerm), 'clients:get-all'));
ipcMain.handle('clients:get-by-id', (event, id) => handleRequest(() => db.clientDB.getById(id), 'clients:get-by-id'));
ipcMain.handle('clients:add', (event, payload) => handleRequest(() => db.clientDB.add(payload), 'clients:add'));
ipcMain.handle('clients:force-add', (event, payload) => handleRequest(() => db.clientDB.forceAdd(payload), 'clients:force-add'));
ipcMain.handle('clients:find-similar', (event, name) => handleRequest(() => db.clientDB.findSimilar(name), 'clients:find-similar'));
ipcMain.handle('clients:update', (event, payload) => handleRequest(() => db.clientDB.update(payload), 'clients:update'));
ipcMain.handle('clients:delete', (event, payload) => handleRequest(() => db.clientDB.delete(payload), 'clients:delete'));
ipcMain.handle('clients:cleanup-duplicates', () => handleRequest(() => db.clientDB.cleanupDuplicates(), 'clients:cleanup-duplicates'));
ipcMain.handle('sales:get-history', (event, filters) => handleRequest(() => db.salesDB.getHistory(filters), 'sales:get-history'));
ipcMain.handle('sales:get-details', (event, saleId) => handleRequest(() => db.salesDB.getDetails(saleId), 'sales:get-details'));
ipcMain.handle('sales:get-client-history', (event, clientId) => handleRequest(() => db.salesDB.getClientSalesHistory(clientId), 'sales:get-client-history'));
ipcMain.handle('invoices:get-all', () => handleRequest(() => db.invoicesDB.getAll(), 'invoices:get-all'));
ipcMain.handle('invoices:get-details', (event, id) => handleRequest(() => db.invoicesDB.getDetails(id), 'invoices:get-details'));
ipcMain.handle('invoices:get-next-number', () => handleRequest(() => db.invoicesDB.getNextNumber(), 'invoices:get-next-number'));
ipcMain.handle('invoices:create', (event, payload) => handleRequest(() => db.invoicesDB.create(payload), 'invoices:create'));
ipcMain.handle('settings:get-company-info', () => handleRequest(() => db.settingsDB.getCompanyInfo(), 'settings:get-company-info'));
ipcMain.handle('settings:save-company-info', (event, payload) => handleRequest(() => db.settingsDB.saveCompanyInfo(payload), 'settings:save-company-info'));

// --- Handlers pour paramètres génériques ---
ipcMain.handle('settings:get', (event, key) => handleRequest(() => db.settingsDB.get(key), 'settings:get'));
ipcMain.handle('settings:save', (event, key, value) => handleRequest(() => db.settingsDB.save(key, value), 'settings:save'));
ipcMain.handle('users:get-all', () => handleRequest(() => db.usersDB.getAll(), 'users:get-all'));
ipcMain.handle('users:add', (event, payload) => handleRequest(() => db.usersDB.add(payload.username, payload.password), 'users:add'));
ipcMain.handle('users:update-password', (event, payload) => handleRequest(() => db.usersDB.updateUserPassword(payload.id, payload.password), 'users:update-password'));
ipcMain.handle('users:delete', (event, payload) => handleRequest(() => db.usersDB.deleteUser(payload), 'users:delete'));
ipcMain.handle('dashboard:get-stats', (event, range) => handleRequest(() => db.dashboardDB.getStats(range), 'dashboard:get-stats'));
ipcMain.handle('dashboard:get-top-profitable', (event, params) => handleRequest(() => db.dashboardDB.getTopProfitable(params), 'dashboard:get-top-profitable'));
ipcMain.handle('dashboard:get-top-selling', (event, params) => handleRequest(() => db.dashboardDB.getTopSelling(params), 'dashboard:get-top-selling'));
ipcMain.handle('dashboard:get-performance-overview', (event, params) => handleRequest(() => db.dashboardDB.getPerformanceOverview(params), 'dashboard:get-performance-overview'));
ipcMain.handle('dashboard:get-insights', (event, params) => handleRequest(() => db.dashboardDB.getInsights(params), 'dashboard:get-insights'));
ipcMain.handle('credits:get-debtors', () => handleRequest(() => db.creditsDB.getDebtors(), 'credits:get-debtors'));
ipcMain.handle('credits:get-client-credit', (event, clientId) => handleRequest(() => db.creditsDB.getClientCredit(clientId), 'credits:get-client-credit'));
ipcMain.handle('credits:get-client-history', (event, clientId) => handleRequest(() => db.creditsDB.getClientCreditHistory(clientId), 'credits:get-client-history'));
ipcMain.handle('print:to-pdf', async (event, htmlContent) => { let tempWin; try { tempWin = new BrowserWindow({ show: false, parent: mainWindow }); await tempWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`); const pdf = await tempWin.webContents.printToPDF({ marginsType: 0, pageSize: 'A4', printBackground: true }); return pdf; } finally { if (tempWin) tempWin.close(); } });

// API pour générer et sauvegarder des tickets PDF
ipcMain.handle('pdf:generate-ticket', async (event, htmlContent, filename) => {
    return handleRequest(async () => {
        let tempWin;
        try {
            // Créer une fenêtre temporaire pour le rendu
            tempWin = new BrowserWindow({
                show: false,
                parent: mainWindow,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });

            // Charger le contenu HTML
            await tempWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

            // Générer le PDF avec des options optimisées pour les tickets
            const pdf = await tempWin.webContents.printToPDF({
                marginsType: 0,
                pageSize: {
                    width: 80000, // 80mm en microns
                    height: 200000 // Hauteur variable
                },
                printBackground: true,
                landscape: false
            });

            // Demander à l'utilisateur où sauvegarder le fichier
            const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
                title: 'Sauvegarder le ticket',
                defaultPath: filename || 'ticket.pdf',
                filters: [
                    { name: 'PDF Files', extensions: ['pdf'] }
                ]
            });

            if (!canceled && filePath) {
                // Sauvegarder le fichier
                fs.writeFileSync(filePath, pdf);
                return { success: true, filePath };
            } else {
                return { success: false, message: 'Sauvegarde annulée' };
            }

        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
            throw error;
        } finally {
            if (tempWin) tempWin.close();
        }
    }, 'pdf:generate-ticket');
});

// API pour générer et sauvegarder des devis PDF (format A4)
ipcMain.handle('pdf:generate-quote', async (event, htmlContent, filename) => {
    return handleRequest(async () => {
        let tempWin;
        try {
            // Créer une fenêtre temporaire pour le rendu
            tempWin = new BrowserWindow({
                show: false,
                parent: mainWindow,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });

            // Charger le contenu HTML
            await tempWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

            // Attendre que le contenu soit complètement chargé
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Générer le PDF avec des options optimisées pour les devis A4
            const pdf = await tempWin.webContents.printToPDF({
                marginsType: 1, // Marges minimales
                pageSize: 'A4',
                printBackground: true,
                landscape: false,
                preferCSSPageSize: true
            });

            // Demander à l'utilisateur où sauvegarder le fichier
            const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
                title: 'Sauvegarder le devis',
                defaultPath: filename || 'devis.pdf',
                filters: [
                    { name: 'PDF Files', extensions: ['pdf'] }
                ]
            });

            if (!canceled && filePath) {
                // Sauvegarder le fichier
                fs.writeFileSync(filePath, pdf);
                return { success: true, filePath };
            } else {
                return { success: false, message: 'Sauvegarde annulée' };
            }

        } catch (error) {
            console.error('Erreur lors de la génération du PDF devis:', error);
            throw error;
        } finally {
            if (tempWin) tempWin.close();
        }
    }, 'pdf:generate-quote');
});

// --- Canaux nécessitant un utilisateur connecté ---
ipcMain.handle('users:update-credentials', (event, payload) => handleUserRequest(async () => { const { newUsername, currentPassword, newPassword } = payload; await db.usersDB.updateCredentials({ id: currentUser.id, currentUsername: currentUser.username, newUsername, currentPassword, newPassword }); if (currentUser.username !== newUsername) { currentUser.username = newUsername; } return { success: true, message: "Vos informations ont été mises à jour avec succès." }; }, 'users:update-credentials'));
ipcMain.handle('sales:get-last', (event) => handleUserRequest(() => db.salesDB.getLast(currentUser.id), 'sales:get-last'));
ipcMain.handle('sales:process', (event, payload) => handleUserRequest(() => db.salesDB.process({ ...payload, userId: currentUser.id }), 'sales:process'));
ipcMain.handle('sales:edit', (event, payload) => handleUserRequest(() => db.salesDB.edit(payload.originalSaleId, { ...payload.newSaleData, userId: currentUser.id }), 'sales:edit'));
ipcMain.handle('sales:get-history-for-user', () => handleUserRequest(() => db.salesDB.getHistoryForUser(currentUser.id), 'sales:get-history-for-user'));
ipcMain.handle('products:adjust-stock', (event, payload) => handleUserRequest(() => db.productDB.adjustStock(payload.adjustments, payload.reason, currentUser.id), 'products:adjust-stock'));

// === Gestion des stocks par lots ===
ipcMain.handle('stock-lots:get-product-lots', (event, productId, includeEmpty) => handleUserRequest(() => db.stockLotsDB.getProductLots(productId, includeEmpty), 'stock-lots:get-product-lots'));
ipcMain.handle('stock-lots:get-lot-by-id', (event, lotId) => handleUserRequest(() => db.stockLotsDB.getLotById(lotId), 'stock-lots:get-lot-by-id'));
ipcMain.handle('stock-lots:create-lot', (event, lotData) => handleUserRequest(() => db.stockLotsDB.createLot(lotData), 'stock-lots:create-lot'));
ipcMain.handle('stock-lots:update-quantity', (event, lotId, quantity) => handleUserRequest(() => db.stockLotsDB.updateLotQuantity(lotId, quantity), 'stock-lots:update-quantity'));
ipcMain.handle('stock-lots:record-movement', (event, movementData) => handleUserRequest(() => db.stockLotsDB.recordMovement({ ...movementData, user_id: currentUser.id }), 'stock-lots:record-movement'));
ipcMain.handle('stock-lots:get-movements', (event, productId, limit) => handleUserRequest(() => db.stockLotsDB.getProductMovements(productId, limit), 'stock-lots:get-movements'));
ipcMain.handle('stock-lots:get-valuation-settings', (event, productId) => handleUserRequest(() => db.stockLotsDB.getValuationSettings(productId), 'stock-lots:get-valuation-settings'));
ipcMain.handle('stock-lots:calculate-average-cost', (event, productId) => handleUserRequest(() => db.stockLotsDB.calculateAverageCost(productId), 'stock-lots:calculate-average-cost'));
ipcMain.handle('stock-lots:migrate', () => handleUserRequest(() => db.stockLotsDB.migrateToStockLots(), 'stock-lots:migrate'));
ipcMain.handle('stock-lots:sync-product-stock', (event, productId) => handleUserRequest(() => db.stockLotsDB.syncProductStock(productId), 'stock-lots:sync-product-stock'));
ipcMain.handle('stock-lots:sync-all-stocks', () => handleUserRequest(() => db.stockLotsDB.syncAllProductsStock(), 'stock-lots:sync-all-stocks'));

// --- Intégration Transparente Stock/Lots ---
ipcMain.handle('stock-lots:adjust-stock-directly', (event, productId, newStock) => handleUserRequest(() => db.stockLotsDB.adjustStockDirectly(productId, newStock), 'stock-lots:adjust-stock-directly'));
ipcMain.handle('stock-lots:ensure-product-has-lots', (event, productId) => handleUserRequest(() => db.stockLotsDB.ensureProductHasLots(productId), 'stock-lots:ensure-product-has-lots'));
ipcMain.handle('stock-lots:ensure-all-products-have-lots', () => handleUserRequest(() => db.stockLotsDB.ensureAllProductsHaveLots(), 'stock-lots:ensure-all-products-have-lots'));

// --- Filtrage et Préférences des Lots ---
ipcMain.handle('stock-lots:save-filter-preferences', (event, userId, preferences) => handleUserRequest(() => db.stockLotsDB.saveLotFilterPreferences(userId, preferences), 'stock-lots:save-filter-preferences'));
ipcMain.handle('stock-lots:get-filter-preferences', (event, userId) => handleUserRequest(() => db.stockLotsDB.getLotFilterPreferences(userId), 'stock-lots:get-filter-preferences'));
ipcMain.handle('stock-lots:bulk-action', (event, lotIds, action, actionData) => handleUserRequest(() => db.stockLotsDB.performBulkLotAction(lotIds, action, actionData), 'stock-lots:bulk-action'));

// --- Gestion des Fournisseurs ---
ipcMain.handle('suppliers:create', (event, supplierData) => handleUserRequest(() => db.stockLotsDB.createSupplier(supplierData), 'suppliers:create'));
ipcMain.handle('suppliers:getAll', (event, options) => handleUserRequest(() => db.stockLotsDB.getAllSuppliers(options), 'suppliers:getAll'));
ipcMain.handle('suppliers:getById', (event, supplierId) => handleUserRequest(() => db.stockLotsDB.getSupplierById(supplierId), 'suppliers:getById'));
ipcMain.handle('suppliers:update', (event, supplierId, supplierData) => handleUserRequest(() => db.stockLotsDB.updateSupplier(supplierId, supplierData), 'suppliers:update'));
ipcMain.handle('suppliers:delete', (event, supplierId) => handleUserRequest(() => db.stockLotsDB.deleteSupplier(supplierId), 'suppliers:delete'));
ipcMain.handle('suppliers:getStats', (event, supplierId) => handleUserRequest(() => db.stockLotsDB.getSupplierStats(supplierId), 'suppliers:getStats'));
ipcMain.handle('suppliers:getAllWithStats', (event, options) => handleUserRequest(() => db.stockLotsDB.getSuppliersWithStats(options), 'suppliers:getAllWithStats'));


ipcMain.handle('products:update-threshold', (event, productId, threshold) => handleUserRequest(() => db.productDB.updateThreshold(productId, threshold), 'products:update-threshold'));
ipcMain.handle('credits:record-payment', (event, payload) => handleUserRequest(() => db.creditsDB.recordPayment({ ...payload, userId: currentUser.id }), 'credits:record-payment'));
ipcMain.handle('credits:add-manual', (event, payload) => handleUserRequest(() => db.creditsDB.addManual({ ...payload, userId: currentUser.id }), 'credits:add-manual'));

// --- API Système de Retours ---
ipcMain.handle('returns:search-sales', (event, filters) => handleUserRequest(() => db.returnsDB.searchSales(filters), 'returns:search-sales'));
ipcMain.handle('returns:get-sale-details', (event, saleId) => handleUserRequest(() => db.returnsDB.getSaleDetails(saleId), 'returns:get-sale-details'));
ipcMain.handle('returns:process', (event, returnData) => handleUserRequest(() => {
    // Ajouter l'ID utilisateur aux données de retour
    const dataWithUser = { ...returnData, userId: currentUser.id };

    // Valider les données avant traitement
    const validation = db.returnsDB.validate(dataWithUser);
    if (!validation.isValid) {
        throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
    }

    return db.returnsDB.process(dataWithUser);
}, 'returns:process'));
ipcMain.handle('returns:get-history', (event, filters) => handleUserRequest(() => db.returnsDB.getHistory(filters), 'returns:get-history'));
ipcMain.handle('returns:get-details', (event, returnId) => handleUserRequest(() => db.returnsDB.getDetails(returnId), 'returns:get-details'));
ipcMain.handle('returns:get-existing-returns', (event, saleId) => handleUserRequest(() => db.returnsDB.getExistingReturns(saleId), 'returns:get-existing-returns'));
ipcMain.handle('returns:get-stats', () => handleUserRequest(() => db.returnsDB.getStats(), 'returns:get-stats'));

// --- API Système de Dépenses ---
ipcMain.handle('expenses:get-all', (event, filters) => handleUserRequest(() => db.expensesDB.getAll(filters), 'expenses:get-all'));
ipcMain.handle('expenses:get-by-id', (event, id) => handleUserRequest(() => db.expensesDB.getById(id), 'expenses:get-by-id'));
ipcMain.handle('expenses:create', (event, expenseData) => handleUserRequest(() => {
    const dataWithUser = { ...expenseData, userId: currentUser.id };
    return db.expensesDB.create(dataWithUser);
}, 'expenses:create'));
ipcMain.handle('expenses:update', (event, id, expenseData) => handleUserRequest(() => {
    const dataWithUser = { ...expenseData, userId: currentUser.id };
    return db.expensesDB.update(id, dataWithUser);
}, 'expenses:update'));
ipcMain.handle('expenses:delete', (event, id) => handleUserRequest(() => db.expensesDB.delete(id), 'expenses:delete'));
ipcMain.handle('expenses:get-categories', () => handleUserRequest(() => db.expensesDB.getCategories(), 'expenses:get-categories'));
ipcMain.handle('expenses:get-stats', (event, period) => handleUserRequest(() => db.expensesDB.getStats(period), 'expenses:get-stats'));
ipcMain.handle('expenses:get-recurring', () => handleUserRequest(() => db.expensesDB.getRecurring(), 'expenses:get-recurring'));
ipcMain.handle('expenses:create-recurring', (event, recurringData) => handleUserRequest(() => {
    const dataWithUser = { ...recurringData, userId: currentUser.id };
    return db.expensesDB.createRecurring(dataWithUser);
}, 'expenses:create-recurring'));
ipcMain.handle('expenses:update-recurring', (event, id, recurringData) => handleUserRequest(() => {
    const dataWithUser = { ...recurringData, userId: currentUser.id };
    return db.expensesDB.updateRecurring(id, dataWithUser);
}, 'expenses:update-recurring'));
ipcMain.handle('expenses:delete-recurring', (event, id) => handleUserRequest(() => db.expensesDB.deleteRecurring(id), 'expenses:delete-recurring'));
ipcMain.handle('expenses:process-recurring', (event, id) => handleUserRequest(() => db.expensesDB.processRecurring(id), 'expenses:process-recurring'));
ipcMain.handle('expenses:get-upcoming', (event, days) => handleUserRequest(() => db.expensesDB.getUpcoming(days || 7), 'expenses:get-upcoming'));
ipcMain.handle('expenses:get-budget-settings', () => handleUserRequest(() => db.expensesDB.getBudgetSettings(), 'expenses:get-budget-settings'));
ipcMain.handle('expenses:set-budget-settings', (event, settings) => handleUserRequest(() => db.expensesDB.setBudgetSettings(settings), 'expenses:set-budget-settings'));
ipcMain.handle('expenses:clear-test-data', () => handleUserRequest(() => db.expensesDB.clearTestData(), 'expenses:clear-test-data'));

// --- API Système de Templates de Factures ---
ipcMain.handle('templates:get-all', () => handleUserRequest(() => db.templatesDB.getAll(), 'templates:get-all'));
ipcMain.handle('templates:get-by-id', (event, id) => handleUserRequest(() => db.templatesDB.getById(id), 'templates:get-by-id'));
ipcMain.handle('templates:create', (event, templateData) => handleUserRequest(() => db.templatesDB.create(templateData), 'templates:create'));
ipcMain.handle('templates:update', (event, id, templateData) => handleUserRequest(() => db.templatesDB.update(id, templateData), 'templates:update'));
ipcMain.handle('templates:delete', (event, id) => handleUserRequest(() => db.templatesDB.delete(id), 'templates:delete'));
ipcMain.handle('templates:set-default', (event, id) => handleUserRequest(() => db.templatesDB.setDefault(id), 'templates:set-default'));
ipcMain.handle('templates:get-default', () => handleUserRequest(() => db.templatesDB.getDefault(), 'templates:get-default'));
ipcMain.handle('expenses:has-test-data', () => handleUserRequest(() => db.expensesDB.hasTestData(), 'expenses:has-test-data'));

// --- API Migration des Tickets ---
ipcMain.handle('migration:get-ticket-stats', () => handleUserRequest(() => {
    try {
        const totalSales = db.db.prepare('SELECT COUNT(*) as count FROM sales').get();
        const salesWithTickets = db.db.prepare('SELECT COUNT(*) as count FROM sales WHERE ticket_number IS NOT NULL AND ticket_number != ""').get();
        const salesWithoutTickets = db.db.prepare('SELECT COUNT(*) as count FROM sales WHERE ticket_number IS NULL OR ticket_number = ""').get();

        return {
            total: totalSales.count,
            withTickets: salesWithTickets.count,
            withoutTickets: salesWithoutTickets.count
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des stats de migration:', error);
        throw error;
    }
}, 'migration:get-ticket-stats'));

ipcMain.handle('migration:migrate-ticket-numbers', () => handleUserRequest(() => {
    try {
        // Récupérer les ventes sans numéro de ticket
        const salesToMigrate = db.db.prepare(`
            SELECT id, sale_date, total_amount, client_id
            FROM sales
            WHERE ticket_number IS NULL OR ticket_number = ''
            ORDER BY sale_date ASC, id ASC
        `).all();

        if (salesToMigrate.length === 0) {
            return { success: true, migratedCount: 0, message: 'Aucune vente à migrer' };
        }

        // Préparer la requête de mise à jour
        const updateTicketStmt = db.db.prepare('UPDATE sales SET ticket_number = ? WHERE id = ?');

        // Compteurs pour générer des numéros uniques
        const dailyCounters = new Map();
        const usedTickets = new Set();

        // Récupérer les tickets existants
        const existingTickets = db.db.prepare(`
            SELECT ticket_number
            FROM sales
            WHERE ticket_number IS NOT NULL AND ticket_number != ''
        `).all();

        existingTickets.forEach(row => {
            if (row.ticket_number) {
                usedTickets.add(row.ticket_number);
            }
        });

        // Fonction pour générer un numéro de ticket unique
        function generateUniqueTicket(saleDate, saleId) {
            const date = new Date(saleDate);
            const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

            let counter = dailyCounters.get(dateStr) || 0;
            let ticketNumber;
            let attempts = 0;

            do {
                counter++;
                ticketNumber = `V-${dateStr}-${counter.toString().padStart(4, '0')}`;
                attempts++;

                if (attempts >= 1000) {
                    ticketNumber = `V-${dateStr}-${saleId.toString().padStart(4, '0')}`;
                    break;
                }
            } while (usedTickets.has(ticketNumber));

            dailyCounters.set(dateStr, counter);
            usedTickets.add(ticketNumber);

            return ticketNumber;
        }

        // Exécuter la migration dans une transaction
        const transaction = db.db.transaction(() => {
            let migratedCount = 0;

            for (const sale of salesToMigrate) {
                const ticketNumber = generateUniqueTicket(sale.sale_date, sale.id);
                updateTicketStmt.run(ticketNumber, sale.id);
                migratedCount++;
            }

            return migratedCount;
        });

        const migratedCount = transaction();

        return {
            success: true,
            migratedCount: migratedCount,
            message: `${migratedCount} ventes migrées avec succès`
        };

    } catch (error) {
        console.error('Erreur lors de la migration des tickets:', error);
        throw error;
    }
}, 'migration:migrate-ticket-numbers'));

// --- Gestion Sauvegarde/Restauration ---
ipcMain.handle('backup:clear-all-data', async () => {
    return handleRequest(async () => {
        try {
            // Supprimer toutes les données (sauf utilisateurs et client par défaut)
            db.db.prepare('DELETE FROM products').run();
            db.db.prepare('DELETE FROM clients WHERE id != 1').run(); // Garder client par défaut
            db.db.prepare('DELETE FROM sales').run();
            db.db.prepare('DELETE FROM sale_items').run();
            db.db.prepare('DELETE FROM invoices').run();
            db.db.prepare('DELETE FROM invoice_items').run();
            db.db.prepare('DELETE FROM credit_payments').run();
            db.db.prepare('DELETE FROM stock_adjustments').run();

            return { success: true };
        } catch (error) {
            console.error('Erreur lors de la suppression des données:', error);
            return { success: false, error: error.message };
        }
    }, 'backup:clear-all-data');
});

ipcMain.handle('backup:import-products', async (event, products, mode) => {
    return handleRequest(async () => {
        try {
            const stmt = db.db.prepare(`
                INSERT OR ${mode === 'replace' ? 'REPLACE' : 'IGNORE'} INTO products
                (barcode, name, purchase_price, price_retail, price_wholesale, price_carton,
                 pieces_per_carton, stock, alert_threshold, category, image_path)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const transaction = db.db.transaction((products) => {
                for (const product of products) {
                    stmt.run(
                        product.barcode || null,
                        product.name,
                        product.purchase_price || 0,
                        product.price_retail,
                        product.price_wholesale,
                        product.price_carton || 0,
                        product.pieces_per_carton || 0,
                        product.stock || 0,
                        product.alert_threshold || 0,
                        product.category || null,
                        product.image_path || null
                    );
                }
            });

            transaction(products);
            return { success: true, imported: products.length };
        } catch (error) {
            console.error('Erreur lors de l\'import des produits:', error);
            return { success: false, error: error.message };
        }
    }, 'backup:import-products');
});

ipcMain.handle('backup:import-clients', async (event, clients, mode) => {
    return handleRequest(async () => {
        try {
            const stmt = db.db.prepare(`
                INSERT OR ${mode === 'replace' ? 'REPLACE' : 'IGNORE'} INTO clients
                (name, phone, address, credit_balance, ice)
                VALUES (?, ?, ?, ?, ?)
            `);

            const transaction = db.db.transaction((clients) => {
                for (const client of clients) {
                    if (client.id === 1) continue; // Ne pas importer le client par défaut
                    stmt.run(
                        client.name,
                        client.phone || null,
                        client.address || null,
                        client.credit_balance || 0,
                        client.ice || null
                    );
                }
            });

            transaction(clients);
            return { success: true, imported: clients.length };
        } catch (error) {
            console.error('Erreur lors de l\'import des clients:', error);
            return { success: false, error: error.message };
        }
    }, 'backup:import-clients');
});

ipcMain.handle('backup:import-sales', async (event, sales, saleItems, mode) => {
    return handleRequest(async () => {
        try {
            if (mode === 'replace') {
                // Supprimer les ventes existantes
                db.db.prepare('DELETE FROM sale_items').run();
                db.db.prepare('DELETE FROM sales').run();
            }

            const salesStmt = db.db.prepare(`
                INSERT OR IGNORE INTO sales
                (client_id, user_id, total_amount, amount_paid_cash, amount_paid_credit, sale_date, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const itemsStmt = db.db.prepare(`
                INSERT OR IGNORE INTO sale_items
                (sale_id, product_id, quantity, unit, unit_price, line_total, purchase_price)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const transaction = db.db.transaction((sales, saleItems) => {
                for (const sale of sales) {
                    salesStmt.run(
                        sale.client_id,
                        sale.user_id || currentUser?.id || 1,
                        sale.total_amount,
                        sale.amount_paid_cash || 0,
                        sale.amount_paid_credit || 0,
                        sale.sale_date,
                        sale.status || 'COMPLETED'
                    );
                }

                if (saleItems) {
                    for (const item of saleItems) {
                        itemsStmt.run(
                            item.sale_id,
                            item.product_id,
                            item.quantity,
                            item.unit || 'piece',
                            item.unit_price,
                            item.line_total,
                            item.purchase_price || 0
                        );
                    }
                }
            });

            transaction(sales, saleItems || []);
            return { success: true, imported: sales.length };
        } catch (error) {
            console.error('Erreur lors de l\'import des ventes:', error);
            return { success: false, error: error.message };
        }
    }, 'backup:import-sales');
});

ipcMain.handle('backup:import-invoices', async (event, invoices, invoiceItems, mode) => {
    return handleRequest(async () => {
        try {
            if (mode === 'replace') {
                // Supprimer les factures existantes
                db.db.prepare('DELETE FROM invoice_items').run();
                db.db.prepare('DELETE FROM invoices').run();
            }

            const invoicesStmt = db.db.prepare(`
                INSERT OR IGNORE INTO invoices
                (invoice_number, client_name, client_address, client_phone, client_ice,
                 subtotal_ht, tva_rate, tva_amount, total_amount, invoice_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const itemsStmt = db.db.prepare(`
                INSERT OR IGNORE INTO invoice_items
                (invoice_id, description, quantity, unit_price, unit, line_total)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            const transaction = db.db.transaction((invoices, invoiceItems) => {
                for (const invoice of invoices) {
                    invoicesStmt.run(
                        invoice.invoice_number,
                        invoice.client_name,
                        invoice.client_address,
                        invoice.client_phone,
                        invoice.client_ice,
                        invoice.subtotal_ht || 0,
                        invoice.tva_rate || 20,
                        invoice.tva_amount || 0,
                        invoice.total_amount,
                        invoice.invoice_date
                    );
                }

                if (invoiceItems) {
                    for (const item of invoiceItems) {
                        itemsStmt.run(
                            item.invoice_id,
                            item.description,
                            item.quantity,
                            item.unit_price,
                            item.unit || 'piece',
                            item.line_total
                        );
                    }
                }
            });

            transaction(invoices, invoiceItems || []);
            return { success: true, imported: invoices.length };
        } catch (error) {
            console.error('Erreur lors de l\'import des factures:', error);
            return { success: false, error: error.message };
        }
    }, 'backup:import-invoices');
});

ipcMain.handle('backup:import-settings', async (event, settings, mode) => {
    return handleRequest(async () => {
        try {
            const stmt = db.db.prepare(`
                INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
            `);

            const transaction = db.db.transaction((settings) => {
                for (const setting of settings) {
                    stmt.run(setting.key, setting.value);
                }
            });

            transaction(settings);
            return { success: true, imported: settings.length };
        } catch (error) {
            console.error('Erreur lors de l\'import des paramètres:', error);
            return { success: false, error: error.message };
        }
    }, 'backup:import-settings');
});

// Gestion de l'historique des sauvegardes
ipcMain.handle('backup:get-backup-history', async () => {
    return handleRequest(async () => {
        try {
            const backupDir = path.join(app.getPath('userData'), 'backups');
            const historyFile = path.join(backupDir, 'backup-history.json');

            if (fs.existsSync(historyFile)) {
                const data = fs.readFileSync(historyFile, 'utf8');
                return JSON.parse(data);
            }
            return [];
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique:', error);
            return [];
        }
    }, 'backup:get-backup-history');
});

ipcMain.handle('backup:save-backup-history', async (event, history) => {
    return handleRequest(async () => {
        try {
            const backupDir = path.join(app.getPath('userData'), 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const historyFile = path.join(backupDir, 'backup-history.json');
            fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
            return { success: true };
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'historique:', error);
            return { success: false, error: error.message };
        }
    }, 'backup:save-backup-history');
});

ipcMain.handle('backup:save-auto-backup', async (event, filename, content) => {
    return handleRequest(async () => {
        try {
            const backupDir = path.join(app.getPath('userData'), 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const backupFile = path.join(backupDir, filename);
            fs.writeFileSync(backupFile, content);
            return { success: true, path: backupFile };
        } catch (error) {
            console.error('Erreur lors de la sauvegarde automatique:', error);
            return { success: false, error: error.message };
        }
    }, 'backup:save-auto-backup');
});

ipcMain.handle('backup:get-backup-content', async (event, filename) => {
    return handleRequest(async () => {
        try {
            const backupDir = path.join(app.getPath('userData'), 'backups');
            const backupFile = path.join(backupDir, filename);

            if (fs.existsSync(backupFile)) {
                return fs.readFileSync(backupFile, 'utf8');
            }
            throw new Error('Fichier de sauvegarde non trouvé');
        } catch (error) {
            console.error('Erreur lors de la lecture de la sauvegarde:', error);
            throw error;
        }
    }, 'backup:get-backup-content');
});

ipcMain.handle('backup:delete-backup', async (event, filename) => {
    return handleRequest(async () => {
        try {
            const backupDir = path.join(app.getPath('userData'), 'backups');
            const backupFile = path.join(backupDir, filename);

            if (fs.existsSync(backupFile)) {
                fs.unlinkSync(backupFile);
            }
            return { success: true };
        } catch (error) {
            console.error('Erreur lors de la suppression de la sauvegarde:', error);
            return { success: false, error: error.message };
        }
    }, 'backup:delete-backup');
});

// Gestion des paramètres de sauvegarde
ipcMain.handle('backup:get-backup-settings', async () => {
    return handleRequest(async () => {
        try {
            const settingsFile = path.join(app.getPath('userData'), 'backup-settings.json');

            if (fs.existsSync(settingsFile)) {
                const data = fs.readFileSync(settingsFile, 'utf8');
                return JSON.parse(data);
            }
            return {
                autoBackupEnabled: false,
                frequency: 'daily',
                time: '02:00',
                retention: '30'
            };
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres de sauvegarde:', error);
            return null;
        }
    }, 'backup:get-backup-settings');
});

ipcMain.handle('backup:save-backup-settings', async (event, settings) => {
    return handleRequest(async () => {
        try {
            const settingsFile = path.join(app.getPath('userData'), 'backup-settings.json');
            fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
            return { success: true };
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des paramètres:', error);
            return { success: false, error: error.message };
        }
    }, 'backup:save-backup-settings');
});

// Récupération de toutes les données pour export
ipcMain.handle('sales:get-all', () => handleUserRequest(() => db.salesDB.getAll(), 'sales:get-all'));
ipcMain.handle('sales:get-all-items', () => handleUserRequest(() => db.salesDB.getAllItems(), 'sales:get-all-items'));
ipcMain.handle('invoices:get-all-items', () => handleUserRequest(() => db.invoicesDB.getAllItems(), 'invoices:get-all-items'));
ipcMain.handle('settings:get-all', () => handleUserRequest(() => db.settingsDB.getAll(), 'settings:get-all'));

// --- API Système de Devis ---
ipcMain.handle('quotes:create', (event, payload) => handleUserRequest(() => db.quotesDB.create({ ...payload, createdBy: currentUser.username }), 'quotes:create'));
ipcMain.handle('quotes:get-all', () => handleUserRequest(() => db.quotesDB.getAll(), 'quotes:get-all'));
ipcMain.handle('quotes:get-by-id', (event, id) => handleUserRequest(() => db.quotesDB.getById(id), 'quotes:get-by-id'));
ipcMain.handle('quotes:update', (event, id, payload) => handleUserRequest(() => db.quotesDB.update(id, payload), 'quotes:update'));
ipcMain.handle('quotes:delete', (event, id) => handleUserRequest(() => db.quotesDB.delete(id), 'quotes:delete'));
ipcMain.handle('quotes:update-status', (event, id, status, saleId) => handleUserRequest(() => db.quotesDB.updateStatus(id, status, saleId), 'quotes:update-status'));
ipcMain.handle('quotes:get-by-status', (event, status) => handleUserRequest(() => db.quotesDB.getByStatus(status), 'quotes:get-by-status'));
ipcMain.handle('quotes:get-next-number', () => handleUserRequest(() => db.quotesDB.getNextNumber(), 'quotes:get-next-number'));
ipcMain.handle('quotes:add-item', (event, quoteId, item) => handleUserRequest(() => db.quotesDB.addItem(quoteId, item), 'quotes:add-item'));
ipcMain.handle('quotes:update-item', (event, itemId, item) => handleUserRequest(() => db.quotesDB.updateItem(itemId, item), 'quotes:update-item'));
ipcMain.handle('quotes:delete-item', (event, itemId) => handleUserRequest(() => db.quotesDB.deleteItem(itemId), 'quotes:delete-item'));
ipcMain.handle('quotes:get-items', (event, quoteId) => handleUserRequest(() => db.quotesDB.getItems(quoteId), 'quotes:get-items'));