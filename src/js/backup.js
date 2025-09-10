/**
 * Gestionnaire de sauvegarde et restauration des données
 * GestionPro - Système d'import/export complet
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Initialisation du système de sauvegarde...');

    // Éléments DOM
    const exportCompleteBtn = document.getElementById('export-complete-btn');
    const exportPartialBtn = document.getElementById('export-partial-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const selectFileBtn = document.getElementById('select-file-btn');
    const dropZone = document.getElementById('drop-zone');
    const autoBackupToggle = document.getElementById('auto-backup-toggle');
    const refreshHistoryBtn = document.getElementById('refresh-history-btn');

    // État de l'application
    let selectedFile = null;
    let backupHistory = [];

    /**
     * Initialisation
     */
    function init() {
        setupEventListeners();
        loadBackupSettings();
        loadBackupHistory();
        updateUI();
    }

    /**
     * Configuration des event listeners
     */
    function setupEventListeners() {
        // Export
        exportCompleteBtn?.addEventListener('click', () => exportData('complete'));
        exportPartialBtn?.addEventListener('click', () => exportData('partial'));

        // Import
        selectFileBtn?.addEventListener('click', () => importFile?.click());
        importFile?.addEventListener('change', handleFileSelect);
        importBtn?.addEventListener('click', importData);

        // Drag & Drop
        dropZone?.addEventListener('dragover', handleDragOver);
        dropZone?.addEventListener('drop', handleDrop);
        dropZone?.addEventListener('click', () => importFile?.click());

        // Sauvegardes automatiques
        autoBackupToggle?.addEventListener('change', toggleAutoBackup);
        
        // Historique
        refreshHistoryBtn?.addEventListener('click', loadBackupHistory);
    }

    /**
     * Export des données
     */
    async function exportData(type = 'complete') {
        try {
            showNotification('Préparation de l\'export...', 'info');

            // Récupérer les options sélectionnées
            const options = getExportOptions();
            const format = getSelectedFormat();

            // Validation
            if (type === 'partial' && !hasSelectedOptions(options)) {
                showNotification('Veuillez sélectionner au moins une option d\'export', 'warning');
                return;
            }

            // Récupérer les données
            const data = await collectExportData(options);
            
            // Générer le fichier selon le format
            let filename, content, mimeType;
            
            switch (format) {
                case 'json':
                    ({ filename, content, mimeType } = generateJSONExport(data, type));
                    break;
                case 'csv':
                    ({ filename, content, mimeType } = generateCSVExport(data, type));
                    break;
                case 'excel':
                    ({ filename, content, mimeType } = generateExcelExport(data, type));
                    break;
                default:
                    throw new Error('Format d\'export non supporté');
            }

            // Télécharger le fichier
            downloadFile(content, filename, mimeType);

            // Enregistrer dans l'historique
            await saveBackupToHistory({
                type: type === 'complete' ? 'Sauvegarde complète' : 'Export sélectif',
                format: format.toUpperCase(),
                size: content.length,
                filename: filename
            });

            showNotification(`Export ${type} réussi ! (${filename})`, 'success');

        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            showNotification('Erreur lors de l\'export des données', 'error');
        }
    }

    /**
     * Récupération des options d'export sélectionnées
     */
    function getExportOptions() {
        return {
            products: document.getElementById('export-products')?.checked || false,
            clients: document.getElementById('export-clients')?.checked || false,
            sales: document.getElementById('export-sales')?.checked || false,
            invoices: document.getElementById('export-invoices')?.checked || false,
            settings: document.getElementById('export-settings')?.checked || false
        };
    }

    /**
     * Récupération du format sélectionné
     */
    function getSelectedFormat() {
        const formatRadio = document.querySelector('input[name="export-format"]:checked');
        return formatRadio?.value || 'json';
    }

    /**
     * Vérification qu'au moins une option est sélectionnée
     */
    function hasSelectedOptions(options) {
        return Object.values(options).some(option => option === true);
    }

    /**
     * Collecte des données pour l'export
     */
    async function collectExportData(options) {
        const data = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: '2.0.0',
                source: 'GestionPro'
            }
        };

        try {
            if (options.products) {
                showNotification('Récupération des produits...', 'info');
                data.products = await window.api.products.getAll();
            }

            if (options.clients) {
                showNotification('Récupération des clients...', 'info');
                data.clients = await window.api.clients.getAll();
            }

            if (options.sales) {
                showNotification('Récupération des ventes...', 'info');
                data.sales = await window.api.sales.getAll();
                data.saleItems = await window.api.sales.getAllItems();
            }

            if (options.invoices) {
                showNotification('Récupération des factures...', 'info');
                data.invoices = await window.api.invoices.getAll();
                data.invoiceItems = await window.api.invoices.getAllItems();
            }

            if (options.settings) {
                showNotification('Récupération des paramètres...', 'info');
                data.settings = await window.api.settings.getAll();
            }

            return data;

        } catch (error) {
            console.error('Erreur lors de la collecte des données:', error);
            throw new Error('Impossible de récupérer toutes les données');
        }
    }

    /**
     * Génération de l'export JSON
     */
    function generateJSONExport(data, type) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `gestionpro-backup-${type}-${timestamp}.json`;
        const content = JSON.stringify(data, null, 2);
        const mimeType = 'application/json';

        return { filename, content, mimeType };
    }

    /**
     * Génération de l'export CSV
     */
    function generateCSVExport(data, type) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `gestionpro-export-${type}-${timestamp}.csv`;
        
        let csvContent = '\uFEFF'; // BOM pour UTF-8
        
        // Export des produits en CSV
        if (data.products) {
            csvContent += 'PRODUITS\n';
            csvContent += 'ID,Code-barres,Nom,Prix achat,Prix détail,Prix gros,Prix carton,Stock,Seuil alerte,Pièces/carton,Catégorie\n';
            
            data.products.forEach(product => {
                csvContent += [
                    product.id,
                    product.barcode || '',
                    `"${product.name}"`,
                    product.purchase_price,
                    product.price_retail,
                    product.price_wholesale,
                    product.price_carton,
                    product.stock,
                    product.alert_threshold,
                    product.pieces_per_carton,
                    `"${product.category || ''}"`
                ].join(',') + '\n';
            });
            csvContent += '\n';
        }

        // Export des clients en CSV
        if (data.clients) {
            csvContent += 'CLIENTS\n';
            csvContent += 'ID,Nom,Téléphone,Adresse,Solde crédit,ICE\n';
            
            data.clients.forEach(client => {
                csvContent += [
                    client.id,
                    `"${client.name}"`,
                    `"${client.phone || ''}"`,
                    `"${client.address || ''}"`,
                    client.credit_balance,
                    `"${client.ice || ''}"`
                ].join(',') + '\n';
            });
        }

        const mimeType = 'text/csv;charset=utf-8';
        return { filename, content: csvContent, mimeType };
    }

    /**
     * Génération de l'export Excel
     */
    function generateExcelExport(data, type) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `gestionpro-export-${type}-${timestamp}.xls`;
        
        let excelContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>
        `;

        let sheetIndex = 0;

        // Feuille Produits
        if (data.products) {
            excelContent += `<x:ExcelWorksheet><x:Name>Produits</x:Name><x:WorksheetSource HRef="sheet${sheetIndex++}.htm"/></x:ExcelWorksheet>`;
        }

        // Feuille Clients
        if (data.clients) {
            excelContent += `<x:ExcelWorksheet><x:Name>Clients</x:Name><x:WorksheetSource HRef="sheet${sheetIndex++}.htm"/></x:ExcelWorksheet>`;
        }

        excelContent += `
                </x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
                <style>
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                </style>
            </head>
            <body>
        `;

        // Contenu des produits
        if (data.products) {
            excelContent += `
                <table>
                    <tr><th colspan="11">PRODUITS - Export du ${new Date().toLocaleDateString()}</th></tr>
                    <tr>
                        <th>ID</th><th>Code-barres</th><th>Nom</th><th>Prix achat</th><th>Prix détail</th>
                        <th>Prix gros</th><th>Prix carton</th><th>Stock</th><th>Seuil alerte</th><th>Pièces/carton</th><th>Catégorie</th>
                    </tr>
            `;
            
            data.products.forEach(product => {
                excelContent += `
                    <tr>
                        <td>${product.id}</td>
                        <td>${product.barcode || ''}</td>
                        <td>${product.name}</td>
                        <td>${product.purchase_price}</td>
                        <td>${product.price_retail}</td>
                        <td>${product.price_wholesale}</td>
                        <td>${product.price_carton}</td>
                        <td>${product.stock}</td>
                        <td>${product.alert_threshold}</td>
                        <td>${product.pieces_per_carton}</td>
                        <td>${product.category || ''}</td>
                    </tr>
                `;
            });
            
            excelContent += '</table><br><br>';
        }

        // Contenu des clients
        if (data.clients) {
            excelContent += `
                <table>
                    <tr><th colspan="6">CLIENTS - Export du ${new Date().toLocaleDateString()}</th></tr>
                    <tr>
                        <th>ID</th><th>Nom</th><th>Téléphone</th><th>Adresse</th><th>Solde crédit</th><th>ICE</th>
                    </tr>
            `;
            
            data.clients.forEach(client => {
                excelContent += `
                    <tr>
                        <td>${client.id}</td>
                        <td>${client.name}</td>
                        <td>${client.phone || ''}</td>
                        <td>${client.address || ''}</td>
                        <td>${client.credit_balance}</td>
                        <td>${client.ice || ''}</td>
                    </tr>
                `;
            });
            
            excelContent += '</table>';
        }

        excelContent += '</body></html>';

        const mimeType = 'application/vnd.ms-excel';
        return { filename, content: excelContent, mimeType };
    }

    /**
     * Téléchargement du fichier
     */
    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Gestion de la sélection de fichier
     */
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            selectedFile = file;
            updateDropZoneUI(file);
            importBtn.disabled = false;
        }
    }

    /**
     * Gestion du drag over
     */
    function handleDragOver(event) {
        event.preventDefault();
        dropZone.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
    }

    /**
     * Gestion du drop
     */
    function handleDrop(event) {
        event.preventDefault();
        dropZone.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            selectedFile = files[0];
            updateDropZoneUI(files[0]);
            importBtn.disabled = false;
        }
    }

    /**
     * Mise à jour de l'UI de la zone de drop
     */
    function updateDropZoneUI(file) {
        const fileInfo = `
            <div class="text-center">
                <svg class="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-gray-700 dark:text-gray-300 font-medium">${file.name}</p>
                <p class="text-sm text-gray-500">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
        `;
        dropZone.innerHTML = fileInfo;
    }

    /**
     * Import des données
     */
    async function importData() {
        if (!selectedFile) {
            showNotification('Veuillez sélectionner un fichier', 'warning');
            return;
        }

        try {
            showNotification('Lecture du fichier...', 'info');

            // Créer une sauvegarde automatique avant l'import
            await createAutoBackup('pre-import');

            const importMode = document.querySelector('input[name="import-mode"]:checked')?.value || 'replace';
            const fileContent = await readFile(selectedFile);
            
            let data;
            if (selectedFile.name.endsWith('.json')) {
                data = JSON.parse(fileContent);
            } else {
                throw new Error('Format de fichier non supporté pour l\'import');
            }

            // Validation des données
            if (!validateImportData(data)) {
                throw new Error('Fichier de sauvegarde invalide');
            }

            // Import selon le mode sélectionné
            await processImport(data, importMode);

            showNotification('Import réussi ! Redémarrage recommandé.', 'success');

            // Réinitialiser l'UI
            resetImportUI();

        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            showNotification(`Erreur lors de l\'import: ${error.message}`, 'error');
        }
    }

    /**
     * Lecture du fichier
     */
    function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Erreur de lecture du fichier'));
            reader.readAsText(file);
        });
    }

    /**
     * Validation des données d'import
     */
    function validateImportData(data) {
        // Vérifier la structure de base
        if (!data.metadata || !data.metadata.source) {
            return false;
        }

        // Vérifier que c'est bien un export GestionPro
        if (data.metadata.source !== 'GestionPro') {
            return false;
        }

        return true;
    }

    /**
     * Traitement de l'import
     */
    async function processImport(data, mode) {
        try {
            if (mode === 'replace') {
                showNotification('Remplacement des données...', 'info');
                // Supprimer les données existantes puis importer
                await window.api.backup.clearAllData();
            }

            // Import des produits
            if (data.products) {
                showNotification('Import des produits...', 'info');
                await window.api.backup.importProducts(data.products, mode);
            }

            // Import des clients
            if (data.clients) {
                showNotification('Import des clients...', 'info');
                await window.api.backup.importClients(data.clients, mode);
            }

            // Import des ventes
            if (data.sales) {
                showNotification('Import des ventes...', 'info');
                await window.api.backup.importSales(data.sales, data.saleItems, mode);
            }

            // Import des factures
            if (data.invoices) {
                showNotification('Import des factures...', 'info');
                await window.api.backup.importInvoices(data.invoices, data.invoiceItems, mode);
            }

            // Import des paramètres
            if (data.settings) {
                showNotification('Import des paramètres...', 'info');
                await window.api.backup.importSettings(data.settings, mode);
            }

        } catch (error) {
            console.error('Erreur lors du traitement de l\'import:', error);
            throw error;
        }
    }

    /**
     * Création d'une sauvegarde automatique
     */
    async function createAutoBackup(reason = 'auto') {
        try {
            const data = await collectExportData({
                products: true,
                clients: true,
                sales: true,
                invoices: true,
                settings: true
            });

            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `auto-backup-${reason}-${timestamp}.json`;
            const content = JSON.stringify(data, null, 2);

            // Sauvegarder localement
            await window.api.backup.saveAutoBackup(filename, content);

            await saveBackupToHistory({
                type: 'Sauvegarde automatique',
                format: 'JSON',
                size: content.length,
                filename: filename,
                reason: reason
            });

        } catch (error) {
            console.error('Erreur lors de la sauvegarde automatique:', error);
        }
    }

    /**
     * Sauvegarde dans l'historique
     */
    async function saveBackupToHistory(backupInfo) {
        try {
            const backup = {
                ...backupInfo,
                date: new Date().toISOString(),
                status: 'Réussi'
            };

            backupHistory.unshift(backup);
            await window.api.backup.saveBackupHistory(backupHistory);
            updateBackupHistoryTable();

        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'historique:', error);
        }
    }

    /**
     * Chargement de l'historique des sauvegardes
     */
    async function loadBackupHistory() {
        try {
            backupHistory = await window.api.backup.getBackupHistory() || [];
            updateBackupHistoryTable();
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique:', error);
            backupHistory = [];
        }
    }

    /**
     * Mise à jour du tableau d'historique
     */
    function updateBackupHistoryTable() {
        const tbody = document.getElementById('backup-history-table');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (backupHistory.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Aucune sauvegarde trouvée
                    </td>
                </tr>
            `;
            return;
        }

        backupHistory.forEach((backup, index) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700';
            
            const date = new Date(backup.date).toLocaleString();
            const size = (backup.size / 1024 / 1024).toFixed(2);
            
            row.innerHTML = `
                <td class="px-4 py-2 text-gray-900 dark:text-white">${date}</td>
                <td class="px-4 py-2 text-gray-700 dark:text-gray-300">${backup.type}</td>
                <td class="px-4 py-2 text-gray-700 dark:text-gray-300">${size} MB</td>
                <td class="px-4 py-2">
                    <span class="px-2 py-1 text-xs rounded-full ${backup.status === 'Réussi' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${backup.status}
                    </span>
                </td>
                <td class="px-4 py-2">
                    <button onclick="downloadBackup(${index})" class="text-blue-600 hover:text-blue-800 mr-2" title="Télécharger">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </button>
                    <button onclick="deleteBackup(${index})" class="text-red-600 hover:text-red-800" title="Supprimer">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    /**
     * Téléchargement d'une sauvegarde depuis l'historique
     */
    window.downloadBackup = async function(index) {
        try {
            const backup = backupHistory[index];
            if (!backup) return;

            const content = await window.api.backup.getBackupContent(backup.filename);
            downloadFile(content, backup.filename, 'application/json');
            
            showNotification(`Sauvegarde téléchargée: ${backup.filename}`, 'success');
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
            showNotification('Erreur lors du téléchargement de la sauvegarde', 'error');
        }
    };

    /**
     * Suppression d'une sauvegarde
     */
    window.deleteBackup = async function(index) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde ?')) {
            return;
        }

        try {
            const backup = backupHistory[index];
            await window.api.backup.deleteBackup(backup.filename);
            
            backupHistory.splice(index, 1);
            await window.api.backup.saveBackupHistory(backupHistory);
            
            updateBackupHistoryTable();
            showNotification('Sauvegarde supprimée', 'success');
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            showNotification('Erreur lors de la suppression de la sauvegarde', 'error');
        }
    };

    /**
     * Activation/désactivation des sauvegardes automatiques
     */
    function toggleAutoBackup() {
        const enabled = autoBackupToggle.checked;
        
        if (enabled) {
            setupAutoBackup();
            showNotification('Sauvegardes automatiques activées', 'success');
        } else {
            clearAutoBackup();
            showNotification('Sauvegardes automatiques désactivées', 'info');
        }
        
        saveBackupSettings();
    }

    /**
     * Configuration des sauvegardes automatiques
     */
    function setupAutoBackup() {
        // Implémentation du système de sauvegarde automatique
        // Cette fonction sera étendue pour gérer les sauvegardes programmées
    }

    /**
     * Suppression des sauvegardes automatiques
     */
    function clearAutoBackup() {
        // Suppression des tâches programmées
    }

    /**
     * Chargement des paramètres de sauvegarde
     */
    async function loadBackupSettings() {
        try {
            const settings = await window.api.backup.getBackupSettings();
            if (settings) {
                autoBackupToggle.checked = settings.autoBackupEnabled || false;
                document.getElementById('backup-frequency').value = settings.frequency || 'daily';
                document.getElementById('backup-time').value = settings.time || '02:00';
                document.getElementById('backup-retention').value = settings.retention || '30';
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
        }
    }

    /**
     * Sauvegarde des paramètres
     */
    async function saveBackupSettings() {
        try {
            const settings = {
                autoBackupEnabled: autoBackupToggle.checked,
                frequency: document.getElementById('backup-frequency').value,
                time: document.getElementById('backup-time').value,
                retention: document.getElementById('backup-retention').value
            };
            
            await window.api.backup.saveBackupSettings(settings);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des paramètres:', error);
        }
    }

    /**
     * Réinitialisation de l'UI d'import
     */
    function resetImportUI() {
        selectedFile = null;
        importBtn.disabled = true;
        importFile.value = '';
        
        dropZone.innerHTML = `
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p class="text-gray-600 dark:text-gray-400 mb-2">Glissez votre fichier de sauvegarde ici</p>
            <p class="text-sm text-gray-500 dark:text-gray-500 mb-4">ou cliquez pour sélectionner</p>
            <button id="select-file-btn" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">Sélectionner un fichier</button>
        `;
    }

    /**
     * Mise à jour de l'interface utilisateur
     */
    function updateUI() {
        // Mise à jour de l'état des boutons et de l'interface
    }

    /**
     * Affichage des notifications
     */
    function showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;

        const colors = {
            success: 'bg-green-100 border-green-500 text-green-700',
            error: 'bg-red-100 border-red-500 text-red-700',
            warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
            info: 'bg-blue-100 border-blue-500 text-blue-700'
        };

        notification.className = `mb-6 p-4 rounded-lg border-l-4 ${colors[type] || colors.info}`;
        notification.textContent = message;
        notification.classList.remove('hidden');

        // Masquer automatiquement après 5 secondes
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 5000);
    }

    // Initialisation
    init();
});
