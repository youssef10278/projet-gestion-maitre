document.addEventListener('DOMContentLoaded', async () => {
    // --- Initialisation de la traduction ---
    await window.i18n.loadTranslations();
    window.i18n.applyTranslationsToHTML();
    const t = window.i18n.t;

    // --- Vérification des API ---
    if (!window.api || !window.api.sales || !window.api.session || !window.api.clients || !window.api.products) {
        document.body.innerHTML = "<h1>ERREUR: API manquante.</h1>";
        return;
    }

    // --- Éléments du DOM ---
    const tableHead = document.getElementById('historyTableHead');
    const tableBody = document.getElementById('historyTableBody');
    const clientSearchInput = document.getElementById('clientSearch');
    const clientSearchResults = document.getElementById('clientSearchResults');
    const clientIdInput = document.getElementById('clientId');
    const productSearchInput = document.getElementById('productSearch');
    const productSearchResults = document.getElementById('productSearchResults');
    const productIdInput = document.getElementById('productId');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const showAllBtn = document.getElementById('showAllBtn');
    const showNormalCheckbox = document.getElementById('showNormal');
    const showCorrectionsCheckbox = document.getElementById('showCorrections');
    const showCorrectedCheckbox = document.getElementById('showCorrected');
    const filterBtn = document.getElementById('filterBtn');
    const resetBtn = document.getElementById('resetBtn');
    const resultsSummary = document.getElementById('resultsSummary');
    const totalResults = document.getElementById('totalResults');
    const totalAmount = document.getElementById('totalAmount');
    const exportBtn = document.getElementById('exportBtn');

    // Variable pour stocker le rôle de l'utilisateur
    let currentUserRole = null;

    // --- Fonctions ---

    // Initialiser le rôle de l'utilisateur
    async function initUserRole() {
        try {
            const user = await window.api.session.getCurrentUser();
            currentUserRole = user ? user.role : null;
        } catch (error) {
            console.error('Erreur lors de la récupération du rôle utilisateur:', error);
            currentUserRole = null;
        }
    }

    function renderSearchResults(items, container, type) {
        container.innerHTML = '';
        container.classList.remove('hidden');
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'search-result-item';
            itemDiv.textContent = item.name;
            itemDiv.dataset.id = item.id;
            itemDiv.dataset.name = item.name;
            itemDiv.dataset.type = type;
            container.appendChild(itemDiv);
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('search-result-item')) {
            const { id, name, type } = e.target.dataset;
            if (type === 'client') {
                clientIdInput.value = id;
                clientSearchInput.value = name;
                clientSearchResults.classList.add('hidden');
            } else if (type === 'product') {
                productIdInput.value = id;
                productSearchInput.value = name;
                productSearchResults.classList.add('hidden');
            }
        } else {
            if (!clientSearchInput.contains(e.target)) clientSearchResults.classList.add('hidden');
            if (!productSearchInput.contains(e.target)) productSearchResults.classList.add('hidden');
        }
    });

    clientSearchInput.addEventListener('input', async () => {
        const searchTerm = clientSearchInput.value;
        if (searchTerm.length < 2) { clientSearchResults.classList.add('hidden'); return; }
        const clients = await window.api.clients.getAll(searchTerm);
        renderSearchResults(clients, clientSearchResults, 'client');
    });

    productSearchInput.addEventListener('input', async () => {
        const searchTerm = productSearchInput.value;
        if (searchTerm.length < 2) { productSearchResults.classList.add('hidden'); return; }
        const products = await window.api.products.getAll(searchTerm);
        renderSearchResults(products, productSearchResults, 'product');
    });

    async function loadHistory(filters = {}) {
        try {
            const validFilters = filters || {};
            const results = await window.api.sales.getHistory(validFilters);
            
            tableHead.innerHTML = `
                <tr>
                    <th class="px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">Statut</th>
                    <th class="px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">${t('date_header')}</th>
                    <th class="px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">${t('sale_id_header')}</th>
                    <th class="px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[200px]">${t('product_header_simple')}</th>
                    <th class="px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-36">${t('client_label')}</th>
                    <th class="px-4 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28">${t('payment_method_header')}</th>
                    <th class="px-4 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">${t('quantity_header')}</th>
                    <th class="px-4 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28">${t('unit_price_header')}</th>
                    <th class="px-4 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">${t('line_total_header')}</th>
                    <th class="px-4 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">Actions</th>
                </tr>
            `;

            tableBody.innerHTML = '';
            if (results.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="10" class="text-center py-8 text-gray-500">${t('no_results_found')}</td></tr>`;
                resultsSummary.classList.add('hidden');
                return;
            }

            // Filtrer les résultats selon les options d'affichage
            const showNormal = showNormalCheckbox.checked;
            const showCorrections = showCorrectionsCheckbox.checked;
            const showCorrected = showCorrectedCheckbox.checked;

            const filteredResults = results.filter(item => {
                if (!showNormal && (item.display_status === 'COMPLETED' || (!item.display_status && !item.original_sale_id && !results.some(r => r.original_sale_id === item.sale_id)))) {
                    return false;
                }
                if (!showCorrections && item.display_status === 'CORRECTION') {
                    return false;
                }
                if (!showCorrected && item.display_status === 'CORRECTED') {
                    return false;
                }
                return true;
            });

            // Calculer le résumé
            const totalSum = filteredResults.reduce((sum, item) => sum + item.line_total, 0);
            totalResults.textContent = filteredResults.length;
            totalAmount.textContent = totalSum.toFixed(2);
            resultsSummary.classList.remove('hidden');

            filteredResults.forEach(item => {
                const tr = document.createElement('tr');
                const displayName = item.unit === 'carton' ? `${item.product_name} (Carton)` : item.product_name;

                // Déterminer la méthode de paiement
                let paymentBadge = '';

                // Utiliser la nouvelle colonne payment_method si disponible, sinon fallback sur l'ancienne logique
                const paymentMethod = item.payment_method || (item.amount_paid_credit > 0 ? 'credit' : 'cash');

                switch (paymentMethod) {
                    case 'credit':
                        paymentBadge = `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            💳 Crédit
                        </span>`;
                        break;
                    case 'check':
                        paymentBadge = `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            📄 Chèque
                        </span>`;
                        break;
                    case 'cash':
                    default:
                        paymentBadge = `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            💰 Comptant
                        </span>`;
                        break;
                }

                // Déterminer le badge selon le statut
                let statusBadge = '';
                let rowClass = '';

                switch(item.display_status) {
                    case 'CORRECTION':
                        statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            🟡 Correction
                        </span>`;
                        rowClass = 'bg-yellow-50 dark:bg-yellow-900/10';
                        break;
                    case 'CORRECTED':
                        statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            🔴 Corrigée
                        </span>`;
                        rowClass = 'bg-red-50 dark:bg-red-900/10 opacity-75';
                        break;
                    case 'RETURNED':
                        statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            ↩️ Retournée
                        </span>`;
                        rowClass = 'bg-purple-50 dark:bg-purple-900/10';
                        break;
                    default:
                        statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            🟢 Normale
                        </span>`;
                        rowClass = '';
                }

                tr.className = `${rowClass} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`;

                // Construire le texte du numéro de vente avec référence
                let saleIdDisplay = `<span class="font-mono font-semibold">#${item.sale_id}</span>`;
                if (item.original_sale_id) {
                    saleIdDisplay += `<br><span class="text-xs text-gray-500 dark:text-gray-400">(Correction de #${item.original_sale_id})</span>`;
                }

                // Formater la date
                const formattedDate = new Date(item.sale_date).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                tr.innerHTML = `
                    <td class="px-4 py-4 whitespace-nowrap">
                        ${statusBadge}
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        ${formattedDate}
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-sm">
                        ${saleIdDisplay}
                    </td>
                    <td class="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        <div class="max-w-[200px] truncate" title="${displayName}">
                            ${displayName}
                        </div>
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <div class="max-w-[120px] truncate" title="${item.client_name || 'Client de passage'}">
                            ${item.client_name || 'Client de passage'}
                        </div>
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-center text-sm">
                        ${paymentBadge}
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-gray-100">
                        ${item.quantity}
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                        ${item.unit_price.toFixed(2)} MAD
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                        ${item.line_total.toFixed(2)} MAD
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-center text-sm">
                        <div class="flex flex-col gap-1 items-center">
                            ${item.display_status === 'CORRECTED' ?
                                `<button class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors" data-action="show-corrections" data-sale-id="${item.sale_id}">
                                    📋 Corrections
                                </button>` :
                                item.original_sale_id ?
                                    `<button class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors" data-action="show-original" data-sale-id="${item.original_sale_id}">
                                        🔗 Originale
                                    </button>` :
                                    '<span class="text-gray-400">-</span>'
                            }
                            ${currentUserRole === 'Propriétaire' && item.display_status !== 'CORRECTED' ?
                                `<button class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors" data-action="edit-sale" data-sale-id="${item.sale_id}">
                                    ✏️ Modifier
                                </button>` : ''
                            }
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            // Ajouter les event listeners pour les boutons d'action
            addActionButtonListeners();

        } catch (error) {
            console.error("Erreur lors du chargement de l'historique:", error);
            tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-red-500">${t('error_loading_history')}</td></tr>`;
        }
    }

    // Ajouter les event listeners pour les boutons d'action
    function addActionButtonListeners() {
        // Supprimer les anciens event listeners pour éviter les doublons
        document.querySelectorAll('[data-action]').forEach(button => {
            button.removeEventListener('click', handleActionButtonClick);
        });

        // Ajouter les nouveaux event listeners
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', handleActionButtonClick);
        });
    }

    // Gestionnaire d'événements pour les boutons d'action
    function handleActionButtonClick(event) {
        const button = event.currentTarget;
        const action = button.getAttribute('data-action');
        const saleId = parseInt(button.getAttribute('data-sale-id'));

        switch (action) {
            case 'show-corrections':
                showCorrections(saleId);
                break;
            case 'show-original':
                showOriginal(saleId);
                break;
            case 'edit-sale':
                editSaleFromHistory(saleId);
                break;
        }
    }

    // Fonctions pour les boutons d'action
    async function showCorrections(saleId) {
        try {
            const saleDetails = await window.api.sales.getDetails(saleId);
            if (saleDetails && saleDetails.corrections && saleDetails.corrections.length > 0) {
                let message = `Corrections de la vente #${saleId}:\n\n`;
                saleDetails.corrections.forEach((correction, index) => {
                    message += `${index + 1}. Vente #${correction.id} - ${correction.total_amount.toFixed(2)} MAD\n`;
                    message += `   Date: ${new Date(correction.sale_date).toLocaleString('fr-FR')}\n`;
                    message += `   Statut: ${correction.status}\n\n`;
                });
                showNotification(message, 'info', 8000);
            } else {
                showNotification('Aucune correction trouvée pour cette vente.', 'info');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des corrections:', error);
            showNotification('Erreur lors de la récupération des corrections.', 'error');
        }
    }

    async function showOriginal(originalSaleId) {
        try {
            const saleDetails = await window.api.sales.getDetails(originalSaleId);
            if (saleDetails) {
                let message = `Vente originale #${originalSaleId}:\n\n`;
                message += `Montant: ${saleDetails.total_amount.toFixed(2)} MAD\n`;
                message += `Date: ${new Date(saleDetails.sale_date).toLocaleString('fr-FR')}\n`;
                message += `Client: ${saleDetails.client_name}\n`;
                message += `Statut: ${saleDetails.status}`;
                showNotification(message, 'info', 6000);
            } else {
                showNotification('Vente originale introuvable.', 'warning');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de la vente originale:', error);
            showNotification('Erreur lors de la récupération de la vente originale.', 'error');
        }
    }

    // Fonction pour modifier une vente depuis l'historique (propriétaire seulement)
    async function editSaleFromHistory(saleId) {
        try {
            // Vérifier que l'utilisateur est propriétaire
            if (currentUserRole !== 'Propriétaire') {
                showNotification('Seul le propriétaire peut modifier les ventes.', 'error');
                return;
            }

            // Récupérer les détails de la vente
            const saleDetails = await window.api.sales.getDetails(saleId);
            if (!saleDetails) {
                showNotification('Vente introuvable.', 'error');
                return;
            }

            // Vérifier que la vente n'a pas déjà été corrigée
            if (saleDetails.corrections && saleDetails.corrections.length > 0) {
                showNotification('Cette vente a déjà été corrigée. Vous ne pouvez pas la modifier à nouveau.', 'warning');
                return;
            }

            // Afficher les détails et demander confirmation via notification
            const confirmMessage = `Modification de la vente #${saleId}\n\n` +
                `Montant actuel: ${saleDetails.total_amount.toFixed(2)} MAD\n` +
                `Date: ${new Date(saleDetails.sale_date).toLocaleString('fr-FR')}\n` +
                `Client: ${saleDetails.client_name}\n\n` +
                `Cette action créera une nouvelle vente corrective et marquera l'originale comme corrigée.\n\n` +
                `Cliquez sur "Modifier" à nouveau pour confirmer ou attendez 10 secondes pour annuler.`;

            showNotification(confirmMessage, 'info', 10000);

            // Marquer temporairement que cette vente est en attente de confirmation
            const button = document.querySelector(`[data-action="edit-sale"][data-sale-id="${saleId}"]`);
            if (button) {
                const originalText = button.innerHTML;
                button.innerHTML = '⏳ Confirmer';
                button.style.backgroundColor = '#f59e0b';
                button.style.color = 'white';

                // Fonction de confirmation
                const confirmEdit = () => {
                    // Rediriger vers la page de caisse avec les données de la vente à modifier
                    const editData = {
                        saleId: saleId,
                        items: saleDetails.items,
                        clientId: saleDetails.client_id,
                        clientName: saleDetails.client_name,
                        isEdit: true
                    };

                    // Stocker les données dans le localStorage pour la page de caisse
                    localStorage.setItem('editSaleData', JSON.stringify(editData));

                    // Rediriger vers la page de caisse
                    window.location.href = 'caisse.html';
                };

                // Fonction d'annulation
                const cancelEdit = () => {
                    button.innerHTML = originalText;
                    button.style.backgroundColor = '';
                    button.style.color = '';
                    button.removeEventListener('click', confirmEdit);
                };

                // Remplacer temporairement l'event listener
                button.removeEventListener('click', handleActionButtonClick);
                button.addEventListener('click', confirmEdit);

                // Annuler automatiquement après 10 secondes
                setTimeout(() => {
                    cancelEdit();
                    button.addEventListener('click', handleActionButtonClick);
                }, 10000);
            }
        } catch (error) {
            console.error('Erreur lors de la modification de la vente:', error);
            showNotification('Erreur lors de la modification de la vente.', 'error');
        }
    }

    function applyFilters() {
        const filters = {
            clientId: clientIdInput.value || null,
            productId: productIdInput.value || null,
            startDate: startDateInput.value || null,
            endDate: endDateInput.value || null,
        };
        const activeFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v != null && v !== ''));
        loadHistory(activeFilters);
    }

    filterBtn.addEventListener('click', applyFilters);

    // Bouton "Afficher tout"
    showAllBtn.addEventListener('click', () => {
        showNormalCheckbox.checked = true;
        showCorrectionsCheckbox.checked = true;
        showCorrectedCheckbox.checked = true;
        applyFilters();
    });

    // Recharger automatiquement quand les options d'affichage changent
    showNormalCheckbox.addEventListener('change', applyFilters);
    showCorrectionsCheckbox.addEventListener('change', applyFilters);
    showCorrectedCheckbox.addEventListener('change', applyFilters);

    // Fonctionnalité d'export
    exportBtn.addEventListener('click', () => {
        exportToCSV();
    });

    // Fonction d'export CSV
    function exportToCSV() {
        try {
            // Récupérer les données actuellement affichées
            const currentFilters = {
                clientId: clientIdInput.value || null,
                productId: productIdInput.value || null,
                startDate: startDateInput.value || null,
                endDate: endDateInput.value || null,
            };
            const activeFilters = Object.fromEntries(Object.entries(currentFilters).filter(([_, v]) => v != null && v !== ''));

            // Charger les données pour l'export
            window.api.sales.getHistory(activeFilters).then(results => {
                // Filtrer selon les options d'affichage
                const showNormal = showNormalCheckbox.checked;
                const showCorrections = showCorrectionsCheckbox.checked;
                const showCorrected = showCorrectedCheckbox.checked;

                const filteredResults = results.filter(item => {
                    const displayStatus = item.display_status || (item.original_sale_id ? 'CORRECTION' :
                        (results.some(r => r.original_sale_id === item.sale_id) ? 'CORRECTED' : item.status));

                    if (!showNormal && (displayStatus === 'COMPLETED' || (!item.display_status && !item.original_sale_id && !results.some(r => r.original_sale_id === item.sale_id)))) {
                        return false;
                    }
                    if (!showCorrections && displayStatus === 'CORRECTION') {
                        return false;
                    }
                    if (!showCorrected && displayStatus === 'CORRECTED') {
                        return false;
                    }
                    return true;
                });

                if (filteredResults.length === 0) {
                    showNotification('Aucune donnée à exporter', 'warning');
                    return;
                }

                // Créer le contenu Excel
                const excelContent = generateExcelContent(filteredResults);

                // Télécharger le fichier
                downloadExcel(excelContent, `historique_ventes_${new Date().toISOString().split('T')[0]}.xls`);

                showNotification(`${filteredResults.length} ventes exportées avec succès`, 'success');
            }).catch(error => {
                console.error('Erreur lors de l\'export:', error);
                showNotification('Erreur lors de l\'export des données', 'error');
            });
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            showNotification('Erreur lors de l\'export des données', 'error');
        }
    }

    // Fonction utilitaire pour échapper les valeurs HTML
    function escapeHTMLValue(value) {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        return stringValue
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Générer le contenu Excel (HTML Table)
    function generateExcelContent(data) {
        const headers = [
            'Date',
            'N° Vente',
            'Statut',
            'Produit',
            'Client',
            'Méthode de Paiement',
            'Quantité',
            'Prix Unitaire (MAD)',
            'Total Ligne (MAD)',
            'Vente Originale'
        ];

        let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .number { text-align: right; }
        .center { text-align: center; }
    </style>
</head>
<body>
    <table>
        <thead>
            <tr>`;

        // Ajouter les en-têtes
        headers.forEach(header => {
            htmlContent += `<th>${escapeHTMLValue(header)}</th>`;
        });

        htmlContent += `
            </tr>
        </thead>
        <tbody>`;

        // Ajouter les données
        data.forEach(item => {
            const displayStatus = item.display_status || (item.original_sale_id ? 'Correction' :
                (data.some(r => r.original_sale_id === item.sale_id) ? 'Corrigée' : 'Normale'));

            // Déterminer la méthode de paiement pour l'export
            const paymentMethod = item.payment_method || (item.amount_paid_credit > 0 ? 'credit' : 'cash');
            let paymentMethodText = '';
            switch (paymentMethod) {
                case 'credit':
                    paymentMethodText = 'Crédit';
                    break;
                case 'check':
                    paymentMethodText = 'Chèque';
                    break;
                case 'cash':
                default:
                    paymentMethodText = 'Comptant';
                    break;
            }

            htmlContent += `
            <tr>
                <td>${escapeHTMLValue(new Date(item.sale_date).toLocaleString('fr-FR'))}</td>
                <td class="center">${escapeHTMLValue(`#${item.sale_id}`)}</td>
                <td class="center">${escapeHTMLValue(displayStatus)}</td>
                <td>${escapeHTMLValue(item.unit === 'carton' ? `${item.product_name} (Carton)` : item.product_name)}</td>
                <td>${escapeHTMLValue(item.client_name || 'Client de passage')}</td>
                <td class="center">${escapeHTMLValue(paymentMethodText)}</td>
                <td class="number">${escapeHTMLValue(item.quantity)}</td>
                <td class="number">${escapeHTMLValue(item.unit_price.toFixed(2))}</td>
                <td class="number">${escapeHTMLValue(item.line_total.toFixed(2))}</td>
                <td class="center">${escapeHTMLValue(item.original_sale_id ? `#${item.original_sale_id}` : '')}</td>
            </tr>`;
        });

        htmlContent += `
        </tbody>
    </table>
</body>
</html>`;

        return htmlContent;
    }

    // Télécharger le fichier Excel
    function downloadExcel(excelContent, filename) {
        // Créer un blob avec le contenu HTML et le type Excel
        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Gestion du responsive
    function handleResize() {
        // Recharger l'historique pour adapter l'affichage
        const currentFilters = {
            clientId: clientIdInput.value || null,
            productId: productIdInput.value || null,
            startDate: startDateInput.value || null,
            endDate: endDateInput.value || null,
        };
        const activeFilters = Object.fromEntries(Object.entries(currentFilters).filter(([_, v]) => v != null && v !== ''));
        loadHistory(activeFilters);
    }

    // Écouter les changements de taille d'écran
    window.addEventListener('resize', debounce(handleResize, 300));

    // Fonction de debounce pour éviter trop d'appels
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    resetBtn.addEventListener('click', () => {
        clientIdInput.value = '';
        clientSearchInput.value = '';
        productIdInput.value = '';
        productSearchInput.value = '';
        startDateInput.value = '';
        endDateInput.value = '';
        showNormalCheckbox.checked = true;
        showCorrectionsCheckbox.checked = true;
        showCorrectedCheckbox.checked = true;
        loadHistory();
    });

    // --- Initialisation de la Page ---
    async function initPage() {
        if(typeof initializePage === 'function'){
            await initializePage('history');
        }
        await initUserRole();
        loadHistory();
    }
    initPage();
});