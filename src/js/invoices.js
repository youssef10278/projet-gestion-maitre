document.addEventListener('DOMContentLoaded', async () => {
    // --- Initialisation de la traduction ---
    await window.i18n.loadTranslations();
    window.i18n.applyTranslationsToHTML();
    const t = window.i18n.t;



    // La fonction showNotification est maintenant disponible globalement via notifications.js

    // --- Vérification des API ---
    if (!window.api) { document.body.innerHTML = "<h1>ERREUR: API manquante.</h1>"; return; }

    // --- Éléments du DOM ---
    const listView = document.getElementById('listView');
    const editorView = document.getElementById('editorView');
    const newInvoiceBtn = document.getElementById('newInvoiceBtn');
    const backToListBtn = document.getElementById('backToListBtn');
    const saveInvoiceBtn = document.getElementById('saveInvoiceBtn');
    const printInvoiceBtn = document.getElementById('printInvoiceBtn');
    const invoicesTableBody = document.getElementById('invoicesTableBody');
    const invoiceEditor = document.getElementById('invoice-editor');
    const editorTitle = document.getElementById('editorView').querySelector('h1');
    
    let currentInvoiceId = null;

    // --- Fonctions ---
    const showListView = () => { currentInvoiceId = null; listView.classList.remove('hidden'); editorView.classList.add('hidden'); loadInvoices(); /* Pas de focus automatique pour éviter les conflits */ };
    const showEditorView = () => { listView.classList.add('hidden'); editorView.classList.remove('hidden'); /* Pas de focus automatique pour éviter les conflits */ };

    async function loadInvoices() {
        try {
            const invoices = await window.api.invoices.getAll();
            invoicesTableBody.innerHTML = '';
            if (invoices.length === 0) {
                invoicesTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-500">${t('no_invoice_found')}</td></tr>`;
                return;
            }
            invoices.forEach(inv => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td class="px-6 py-4">${inv.invoice_number}</td><td class="px-6 py-4">${new Date(inv.invoice_date).toLocaleDateString('fr-FR')}</td><td class="px-6 py-4">${inv.client_name}</td><td class="px-6 py-4 font-medium">${inv.total_amount.toFixed(2)} MAD</td><td class="px-6 py-4 text-right"><button class="text-blue-600 hover:underline view-invoice-btn" data-id="${inv.id}">${t('view_print_action')}</button></td>`;
                invoicesTableBody.appendChild(tr);
            });
        } catch (error) { console.error("Erreur chargement factures:", error); invoicesTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-500">${t('error_loading_invoices')}</td></tr>`; }
    }

    function createRowHTML(item, isReadOnly, index = 0) {
        const defaultPrice = item.unit_price ? item.unit_price.toFixed(2) : '0.00';
        const defaultQty = item.quantity || 1;
        const defaultDesc = item.description || '';
        let displayName = defaultDesc;
        if (item.unit === 'carton') { displayName += ' (Carton)'; } else if (item.unit === 'wholesale') { displayName += ' (Gros)';}
        const lineTotal = (defaultQty * parseFloat(defaultPrice)).toFixed(2);

        // Calcul du numéro de ligne dynamique
        const rowNumber = index + 1;

        return `
            <tr class="invoice-item-row hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                data-price-retail="${item.price_retail || 0}"
                data-price-wholesale="${item.price_wholesale || 0}"
                data-price-carton="${item.price_carton || 0}"
                data-unit="${item.unit || 'retail'}">

                <!-- Numéro de ligne -->
                <td class="p-4 text-center">
                    <span class="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full font-bold text-sm">
                        ${rowNumber}
                    </span>
                </td>

                <!-- Description avec recherche -->
                <td class="p-4 relative">
                    <input type="text" name="description"
                           value="${isReadOnly ? displayName : defaultDesc}"
                           class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white description-input"
                           placeholder="Rechercher ou saisir un produit/service..."
                           ${isReadOnly ? 'readonly' : ''} autocomplete="off">
                    <div class="search-results-container hidden absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto"></div>

                    ${!isReadOnly ? `
                    <div class="flex flex-wrap gap-1 mt-2">
                        <button type="button" class="set-price-btn px-3 py-1 text-xs rounded-full font-medium transition-colors ${item.unit === 'retail' || !item.unit ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
                                data-type="retail" title="Prix Détail">
                            🏪 Détail
                        </button>
                        <button type="button" class="set-price-btn px-3 py-1 text-xs rounded-full font-medium transition-colors ${item.unit === 'wholesale' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
                                data-type="wholesale" title="Prix Gros">
                            📦 Gros
                        </button>
                        <button type="button" class="set-price-btn px-3 py-1 text-xs rounded-full font-medium transition-colors ${item.unit === 'carton' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
                                data-type="carton" title="Prix Carton" ${!item.price_carton || item.price_carton <= 0 ? 'disabled' : ''}>
                            📋 Carton
                        </button>
                    </div>` : ''}
                </td>

                <!-- Quantité -->
                <td class="p-4">
                    <div class="flex items-center justify-center">
                        <input type="number" name="quantity" value="${defaultQty}" min="1"
                               class="w-20 p-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-medium"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                </td>

                <!-- Unité -->
                <td class="p-4 text-center">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.unit === 'carton' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                        item.unit === 'wholesale' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    }">
                        ${item.unit === 'carton' ? '📋 Carton' : item.unit === 'wholesale' ? '📦 Gros' : '🏪 Pièce'}
                    </span>
                </td>

                <!-- Prix unitaire -->
                <td class="p-4">
                    <div class="relative">
                        <input type="number" name="unit_price" value="${defaultPrice}" min="0" step="0.01"
                               class="w-full p-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-medium pr-8"
                               ${isReadOnly ? 'readonly' : ''}>
                        <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">DH</span>
                    </div>
                </td>

                <!-- Total ligne -->
                <td class="p-4">
                    <div class="text-right">
                        <span class="line-total font-bold text-lg text-gray-900 dark:text-white">0.00</span>
                        <span class="text-gray-500 text-sm ml-1">DH</span>
                    </div>
                </td>

                ${!isReadOnly ? `
                <!-- Action supprimer -->
                <td class="p-4 text-center">
                    <button type="button" class="remove-item-btn inline-flex items-center justify-center w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 rounded-full transition-colors" title="Supprimer cette ligne">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </td>` : ''}
            </tr>
        `;
    }

    async function createInvoiceEditor(invoiceId = null) {
        currentInvoiceId = invoiceId;
        let invoiceData, isReadOnly = false;
        try {
            if (invoiceId) {
                invoiceData = await window.api.invoices.getDetails(invoiceId);
                isReadOnly = true;
                editorTitle.textContent = t('invoice_details_title');
                saveInvoiceBtn.classList.add('hidden');
                printInvoiceBtn.classList.remove('hidden');
            } else {
                const nextNumber = await window.api.invoices.getNextNumber();
                invoiceData = {
                    items: [{ description: '', quantity: 1, unit_price: 0, line_total: 0, unit: 'retail' }],
                    invoice_number: nextNumber,
                    invoice_date: new Date().toISOString().split('T')[0],
                    client_name: '',
                    client_address: '',
                    client_phone: '',
                    client_ice: '',
                    subtotal_ht: 0,
                    tva_rate: 20,
                    tva_amount: 0,
                    total_amount: 0
                };
                editorTitle.textContent = t('create_invoice_title');
                saveInvoiceBtn.classList.remove('hidden');
                printInvoiceBtn.classList.remove('hidden'); // Permettre l'impression même avant sauvegarde
                printInvoiceBtn.textContent = 'Aperçu/Imprimer';
            }
            const itemsHtml = invoiceData.items.map((item, index) => createRowHTML(item, isReadOnly, index)).join('');
            invoiceEditor.innerHTML = `
                <!-- En-tête professionnel style ATLAS DISTRIBUTION -->
                <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg mb-6 shadow-lg">
                    <div class="flex justify-between items-start">
                        <div class="flex items-center space-x-4">
                            <div class="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <span class="text-2xl font-bold">GP</span>
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold">GESTION PRO</h1>
                                <p class="text-blue-100 text-sm">Système de Facturation Professionnel</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <h2 class="text-3xl font-bold mb-2">FACTURE</h2>
                            <div class="bg-white bg-opacity-20 p-3 rounded">
                                <p class="mb-1"><span class="font-semibold">N°:</span> <input type="text" name="invoice_number" value="${invoiceData.invoice_number}" class="bg-transparent border-b border-white text-white font-bold placeholder-blue-200" readonly></p>
                                <p><span class="font-semibold">Date:</span> <input type="date" name="invoice_date" value="${invoiceData.invoice_date}" class="bg-transparent border-b border-white text-white ml-2" ${isReadOnly ? 'readonly' : ''}></p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section Client Professionnelle -->
                <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-6 border-l-4 border-blue-600">
                    <h3 class="text-lg font-bold text-blue-600 mb-4 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                        </svg>
                        FACTURÉ À
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-3">
                            <div class="relative">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rechercher un client</label>
                                <input type="text" id="clientSearchInput" placeholder="Tapez le nom du client..." class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" autocomplete="off" ${isReadOnly ? 'disabled' : ''}>
                                <div id="clientSearchResults" class="search-results-container hidden"></div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du client *</label>
                                <input type="text" name="client_name" placeholder="Nom complet ou raison sociale" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value="${invoiceData.client_name || ''}" ${isReadOnly ? 'readonly' : ''}>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                                <input type="tel" name="client_phone" placeholder="+212 6XX XXX XXX" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value="${invoiceData.client_phone || ''}" ${isReadOnly ? 'readonly' : ''}>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ICE (Identifiant Commun de l'Entreprise)</label>
                                <input type="text" name="client_ice" placeholder="000000000000000" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value="${invoiceData.client_ice || ''}" ${isReadOnly ? 'readonly' : ''}>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse complète</label>
                                <textarea name="client_address" placeholder="Adresse, ville, code postal" rows="3" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none" ${isReadOnly ? 'readonly' : ''}>${invoiceData.client_address || ''}</textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tableau des Articles Professionnel -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
                    <div class="bg-blue-600 text-white p-4">
                        <h3 class="text-lg font-bold flex items-center">
                            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
                            </svg>
                            ARTICLES ET SERVICES
                        </h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="bg-gray-50 dark:bg-gray-700 border-b-2 border-blue-600">
                                    <th class="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 w-8">#</th>
                                    <th class="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">DÉSIGNATION</th>
                                    <th class="text-center p-4 font-semibold text-gray-700 dark:text-gray-300 w-20">QTÉ</th>
                                    <th class="text-center p-4 font-semibold text-gray-700 dark:text-gray-300 w-24">UNITÉ</th>
                                    <th class="text-right p-4 font-semibold text-gray-700 dark:text-gray-300 w-32">P.U. HT (DH)</th>
                                    <th class="text-right p-4 font-semibold text-gray-700 dark:text-gray-300 w-32">TOTAL HT (DH)</th>
                                    ${!isReadOnly ? '<th class="text-center p-4 font-semibold text-gray-700 dark:text-gray-300 w-16">ACTION</th>' : ''}
                                </tr>
                            </thead>
                            <tbody id="invoiceItemsTable" class="divide-y divide-gray-200 dark:divide-gray-600">
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${!isReadOnly ? `
                <div class="flex justify-center mt-6">
                    <button type="button" id="addItemBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
                        </svg>
                        <span data-i18n="add_line_button">Ajouter une ligne</span>
                    </button>
                </div>` : ''}

                <!-- Section Totaux Professionnelle -->
                <div class="flex justify-end mt-8">
                    <div class="w-full max-w-md">
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                            <!-- En-tête des totaux -->
                            <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                                <h3 class="text-lg font-bold flex items-center">
                                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                                    </svg>
                                    CALCULS FINANCIERS
                                </h3>
                            </div>

                            <div class="p-4 space-y-4">
                                <!-- Sous-total HT -->
                                <div class="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <span class="font-semibold text-gray-700 dark:text-gray-300" data-i18n="subtotal_ht_label">Sous-total HT</span>
                                    <span id="subtotal-ht" class="font-bold text-lg text-blue-600 dark:text-blue-400">0.00 DH</span>
                                </div>

                                <!-- Configuration TVA -->
                                <div class="border-t pt-4">
                                    <div class="mb-3">
                                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" data-i18n="tva_rate_label">
                                            <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                                            </svg>
                                            Taux TVA (%)
                                        </label>
                                        <select id="tva-rate" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" ${isReadOnly ? 'disabled' : ''}>
                                            <option value="0" data-i18n="tva_rate_0">0% (Exonéré)</option>
                                            <option value="10" data-i18n="tva_rate_10">10% (Taux réduit)</option>
                                            <option value="20" data-i18n="tva_rate_20" selected>20% (Taux normal)</option>
                                            <option value="custom" data-i18n="tva_rate_custom">Personnalisé</option>
                                        </select>
                                    </div>

                                    <div id="custom-tva-container" class="hidden mb-3">
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Taux personnalisé (%)</label>
                                        <input type="number" id="custom-tva-rate" placeholder="Ex: 7.5" min="0" max="100" step="0.01" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    </div>

                                    <div class="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                        <span class="font-semibold text-gray-700 dark:text-gray-300" data-i18n="tva_amount_label">Montant TVA</span>
                                        <span id="tva-amount" class="font-bold text-lg text-orange-600 dark:text-orange-400">0.00 DH</span>
                                    </div>
                                </div>

                                <!-- Total TTC -->
                                <div class="border-t pt-4">
                                    <div class="flex justify-between items-center p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-md">
                                        <span class="font-bold text-lg" data-i18n="total_ttc_label">TOTAL TTC</span>
                                        <span id="total-ttc" class="font-bold text-2xl">0.00 DH</span>
                                    </div>
                                </div>

                                <!-- Informations complémentaires -->
                                <div class="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t">
                                    <p>💡 Les calculs sont effectués automatiquement</p>
                                    <p>🇲🇦 Conforme à la législation fiscale marocaine</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Initialiser les valeurs TVA pour les factures existantes
            if (invoiceId && invoiceData.tva_rate !== undefined) {
                setTimeout(() => {
                    const tvaRateSelect = document.getElementById('tva-rate');
                    if (tvaRateSelect) {
                        if ([0, 10, 20].includes(invoiceData.tva_rate)) {
                            tvaRateSelect.value = invoiceData.tva_rate.toString();
                        } else {
                            tvaRateSelect.value = 'custom';
                            const customTvaInput = document.getElementById('custom-tva-rate');
                            const customTvaContainer = document.getElementById('custom-tva-container');
                            if (customTvaInput && customTvaContainer) {
                                customTvaContainer.classList.remove('hidden');
                                customTvaInput.value = invoiceData.tva_rate;
                            }
                        }
                    }
                    calculateTotals();
                }, 100);
            } else {
                calculateTotals();
            }

            showEditorView();

            // Calculer les totaux initiaux
            setTimeout(() => {
                calculateTotals();
            }, 100);

            // Vérifier que le bouton d'ajout est bien présent
            setTimeout(() => {
                const addBtn = document.getElementById('addItemBtn');
                if (addBtn) {
                    console.log('✅ Bouton "Ajouter une ligne" trouvé et fonctionnel');
                } else {
                    console.error('❌ Bouton "Ajouter une ligne" non trouvé dans le DOM');
                }
            }, 200);

        } catch (error) {
            console.error("Erreur createInvoiceEditor:", error);
            showNotification(t('error_creating_invoice_editor'), 'error');
        }
    }

    function calculateTotals() {
        console.log('🧮 Calcul des totaux en cours...');
        let subtotalHt = 0;

        // Calculer le sous-total HT ligne par ligne
        const rows = document.querySelectorAll('.invoice-item-row');
        console.log(`📊 Nombre de lignes trouvées : ${rows.length}`);

        rows.forEach((row, index) => {
            console.log(`🔍 Analyse ligne ${index + 1}:`);
            console.log(`   - Classe CSS: ${row.className}`);
            console.log(`   - Tag: ${row.tagName}`);

            const qtyInput = row.querySelector('[name="quantity"]');
            const priceInput = row.querySelector('[name="unit_price"]');
            const lineTotalElement = row.querySelector('.line-total');

            console.log(`   - qtyInput trouvé: ${!!qtyInput}`);
            console.log(`   - priceInput trouvé: ${!!priceInput}`);
            console.log(`   - lineTotalElement trouvé: ${!!lineTotalElement}`);

            if (!qtyInput || !priceInput || !lineTotalElement) {
                console.warn(`⚠️ Ligne ${index + 1} : éléments manquants`);
                if (!qtyInput) console.warn(`   - Manque: input[name="quantity"]`);
                if (!priceInput) console.warn(`   - Manque: input[name="unit_price"]`);
                if (!lineTotalElement) console.warn(`   - Manque: .line-total`);
                return;
            }

            const qty = parseFloat(qtyInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            const lineTotal = qty * price;

            console.log(`📝 Ligne ${index + 1} : ${qty} × ${price} = ${lineTotal.toFixed(2)}`);
            console.log(`   - Valeur avant: ${lineTotalElement.textContent}`);

            // Mettre à jour l'affichage du total de ligne
            lineTotalElement.textContent = `${lineTotal.toFixed(2)}`;

            console.log(`   - Valeur après: ${lineTotalElement.textContent}`);

            // Ajouter au sous-total
            subtotalHt += lineTotal;
        });

        console.log(`💰 Sous-total HT calculé : ${subtotalHt.toFixed(2)} MAD`);

        // Mettre à jour le sous-total HT
        const subtotalElement = document.getElementById('subtotal-ht');
        if (subtotalElement) {
            subtotalElement.textContent = `${subtotalHt.toFixed(2)} MAD`;
        } else {
            console.warn('⚠️ Élément subtotal-ht non trouvé');
        }

        // Calculer la TVA
        const tvaRateSelect = document.getElementById('tva-rate');
        const customTvaInput = document.getElementById('custom-tva-rate');
        const customTvaContainer = document.getElementById('custom-tva-container');

        let tvaRate = 20; // Valeur par défaut

        if (tvaRateSelect) {
            if (tvaRateSelect.value === 'custom') {
                customTvaContainer.classList.remove('hidden');
                tvaRate = parseFloat(customTvaInput.value) || 0;
            } else {
                customTvaContainer.classList.add('hidden');
                tvaRate = parseFloat(tvaRateSelect.value) || 0;
            }
        }

        const tvaAmount = subtotalHt * (tvaRate / 100);
        const totalTtc = subtotalHt + tvaAmount;

        // Mettre à jour l'affichage
        const tvaAmountElement = document.getElementById('tva-amount');
        const totalTtcElement = document.getElementById('total-ttc');

        if (tvaAmountElement) {
            tvaAmountElement.textContent = `${tvaAmount.toFixed(2)} MAD`;
        }

        if (totalTtcElement) {
            totalTtcElement.textContent = `${totalTtc.toFixed(2)} MAD`;
        }

        // Maintenir la compatibilité avec l'ancien système
        const oldTotalElement = document.getElementById('total-ht');
        if (oldTotalElement) {
            oldTotalElement.textContent = `${subtotalHt.toFixed(2)} MAD`;
        }
    }

    // Fonction pour récupérer le template actuel et générer les styles CSS
    async function getCurrentTemplateStyles() {
        try {
            // Récupérer le template par défaut
            const template = await window.api.templates.getDefault();
            if (!template) {
                console.warn('⚠️ Aucun template par défaut trouvé, utilisation du style par défaut');
                return getDefaultInvoiceStyles();
            }

            // Parser les configurations JSON
            const colors = JSON.parse(template.colors_config || '{}');
            const fonts = JSON.parse(template.fonts_config || '{}');
            const layout = JSON.parse(template.layout_config || '{}');
            const elements = JSON.parse(template.elements_config || '{}');

            console.log(`🎨 Application du template: ${template.display_name}`);

            // Générer les styles CSS personnalisés
            return generateTemplateCSS(colors, fonts, layout, elements);

        } catch (error) {
            console.error('❌ Erreur lors du chargement du template:', error);
            return getDefaultInvoiceStyles();
        }
    }

    // Fonction pour générer les styles CSS basés sur le template
    function generateTemplateCSS(colors, fonts, layout, elements) {
        const primaryColor = colors.primary || '#2c5aa0';
        const secondaryColor = colors.secondary || '#f97316';
        const headerGradientStart = colors.header_gradient_start || primaryColor;
        const headerGradientEnd = colors.header_gradient_end || colors.primary_dark || '#1e40af';

        const primaryFont = fonts.primary_font || 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        const titleSize = fonts.title_size || '24px';
        const bodySize = fonts.body_size || '11px';

        const headerHeight = layout.header_height || '80px';
        const sectionSpacing = layout.section_spacing || '25px';

        return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: ${primaryFont};
            font-size: ${bodySize};
            line-height: 1.4;
            color: #000;
            background: #fff;
        }

        .invoice-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
            background: white;
        }

        /* En-tête avec couleurs personnalisées */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: ${sectionSpacing};
            padding: 20px;
            background: linear-gradient(135deg, ${headerGradientStart}, ${headerGradientEnd});
            color: white;
            border-radius: 8px;
            margin-bottom: 30px;
        }

        .company-info {
            flex: 1;
        }

        .company-logo {
            width: 80px;
            height: 80px;
            display: ${elements.show_logo !== false ? 'flex' : 'none'};
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
            overflow: hidden;
        }

        .company-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .company-name {
            font-size: ${titleSize};
            font-weight: bold;
            margin-bottom: 5px;
            color: white;
        }

        .company-details {
            font-size: ${bodySize};
            line-height: 1.3;
            color: rgba(255, 255, 255, 0.9);
        }

        .invoice-title-section {
            text-align: right;
            color: white;
        }

        .invoice-title {
            font-size: ${titleSize};
            font-weight: bold;
            color: white;
            margin-bottom: 10px;
        }

        .invoice-number {
            font-size: 16px;
            font-weight: bold;
            color: ${secondaryColor};
            background: white;
            padding: 5px 10px;
            border-radius: 4px;
            display: inline-block;
        }

        /* Section client */
        .client-section {
            margin-bottom: ${sectionSpacing};
            padding: 15px;
            background: #f8f9fa;
            border-left: 4px solid ${primaryColor};
        }

        .client-title {
            font-size: 14px;
            font-weight: bold;
            color: ${primaryColor};
            margin-bottom: 8px;
        }

        /* Tableau des articles */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: ${sectionSpacing};
            font-size: ${bodySize};
        }

        .items-table th {
            background: ${primaryColor};
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            border: 1px solid ${primaryColor};
        }

        .items-table td {
            padding: 10px 8px;
            border: 1px solid #ddd;
            vertical-align: top;
        }

        .items-table tbody tr:nth-child(even) {
            background: #f8f9fa;
        }

        .items-table tbody tr:hover {
            background: #e3f2fd;
        }

        /* Totaux */
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: ${sectionSpacing};
        }

        .totals-table {
            width: 300px;
            border-collapse: collapse;
        }

        .totals-table td {
            padding: 8px 12px;
            border: 1px solid #ddd;
        }

        .totals-table .label {
            background: #f8f9fa;
            font-weight: bold;
            text-align: right;
            width: 60%;
        }

        .totals-table .amount {
            text-align: right;
            font-weight: bold;
            width: 40%;
        }

        .total-ttc .label,
        .total-ttc .amount {
            background: ${primaryColor};
            color: white;
            font-size: 14px;
        }

        /* Pied de page */
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 9px;
            color: #666;
            text-align: center;
        }

        /* Styles d'impression */
        @media print {
            body { margin: 0; padding: 0; }
            .invoice-container { box-shadow: none; margin: 0; padding: 10mm; }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .header { flex-direction: column; text-align: center; }
            .invoice-title-section { text-align: center; margin-top: 15px; }
            .items-table { font-size: 9px; }
            .totals-table { width: 100%; }
        }
        `;
    }

    // Fonction pour les styles par défaut (fallback)
    function getDefaultInvoiceStyles() {
        return generateTemplateCSS(
            { primary: '#2c5aa0', secondary: '#f97316', header_gradient_start: '#2c5aa0', header_gradient_end: '#1e40af' },
            { primary_font: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', title_size: '24px', body_size: '11px' },
            { header_height: '80px', section_spacing: '25px' },
            { show_logo: true, show_line_numbers: true, show_unit_badges: true, show_due_date: true, show_legal_mentions: true }
        );
    }

    async function generatePrintableInvoice() {
        console.log('🖨️ Génération de la facture imprimable...');

        let invoiceData;
        let itemsFromEditor = [];

        // Si on est en mode édition (facture non sauvegardée), récupérer les données de l'éditeur
        if (!currentInvoiceId) {
            console.log('📝 Mode édition : récupération des données depuis l\'éditeur');

            // Récupérer les articles depuis l'éditeur
            const editorRows = document.querySelectorAll('.invoice-item-row');
            console.log(`🔍 Récupération données éditeur : ${editorRows.length} lignes trouvées`);

            // Si pas de lignes avec .invoice-item-row, essayer avec un sélecteur alternatif
            let rowsToProcess = editorRows;
            if (editorRows.length === 0) {
                console.warn('⚠️ Aucune ligne avec .invoice-item-row trouvée, essai avec sélecteur alternatif');
                const tbody = document.getElementById('invoiceItemsTable');
                if (tbody) {
                    rowsToProcess = tbody.querySelectorAll('tr');
                    console.log(`🔄 Sélecteur alternatif : ${rowsToProcess.length} lignes TR trouvées`);
                }
            }

            rowsToProcess.forEach((row, index) => {
                console.log(`📋 Traitement ligne ${index + 1}:`);

                const descInput = row.querySelector('[name="description"]');
                const qtyInput = row.querySelector('[name="quantity"]');
                const priceInput = row.querySelector('[name="unit_price"]');

                if (!descInput || !qtyInput || !priceInput) {
                    console.warn(`   ⚠️ Éléments manquants dans ligne ${index + 1}`);
                    return;
                }

                const description = descInput.value || '';
                const quantity = parseFloat(qtyInput.value) || 0;
                const unitPrice = parseFloat(priceInput.value) || 0;
                const unit = row.dataset.unit || 'retail';
                const lineTotal = quantity * unitPrice;

                console.log(`   📝 Description: "${description}"`);
                console.log(`   📝 Quantité: ${quantity}`);
                console.log(`   📝 Prix: ${unitPrice}`);
                console.log(`   📝 Total: ${lineTotal}`);

                // Inclure TOUTES les lignes, même avec description vide si elles ont un prix
                if (description.trim() || unitPrice > 0) {
                    itemsFromEditor.push({
                        description: description || `Article ${index + 1}`,
                        quantity: quantity,
                        unit_price: unitPrice,
                        unit: unit,
                        line_total: lineTotal
                    });
                    console.log(`   ✅ Ligne ajoutée à l'export`);
                } else {
                    console.log(`   ⏭️ Ligne ignorée (vide)`);
                }
            });

            // Récupérer les autres données de l'éditeur
            const subtotalHt = parseFloat(document.getElementById('subtotal-ht').textContent.replace(' MAD', '')) || 0;
            const tvaRateSelect = document.getElementById('tva-rate');
            const customTvaInput = document.getElementById('custom-tva-rate');

            let tvaRate = 20;
            if (tvaRateSelect && tvaRateSelect.value === 'custom') {
                tvaRate = parseFloat(customTvaInput.value) || 0;
            } else if (tvaRateSelect) {
                tvaRate = parseFloat(tvaRateSelect.value) || 0;
            }

            const tvaAmount = subtotalHt * (tvaRate / 100);
            const totalTtc = subtotalHt + tvaAmount;

            invoiceData = {
                invoice_number: document.querySelector('[name="invoice_number"]').value || 'BROUILLON',
                invoice_date: document.querySelector('[name="invoice_date"]').value || new Date().toISOString().split('T')[0],
                client_name: document.querySelector('[name="client_name"]').value || 'Client',
                client_phone: document.querySelector('[name="client_phone"]').value || '',
                client_ice: document.querySelector('[name="client_ice"]').value || '',
                client_address: document.querySelector('[name="client_address"]').value || '',
                subtotal_ht: subtotalHt,
                tva_rate: tvaRate,
                tva_amount: tvaAmount,
                total_amount: totalTtc,
                items: itemsFromEditor
            };

            console.log(`📊 Données éditeur récupérées : ${itemsFromEditor.length} articles`);
        } else {
            // Facture sauvegardée : récupérer depuis la base de données
            console.log('💾 Mode visualisation : récupération depuis la base de données');
            invoiceData = await window.api.invoices.getDetails(currentInvoiceId);
            if (!invoiceData) {
                console.error('❌ Impossible de récupérer les données de la facture');
                return '';
            }
            console.log(`📊 Données DB récupérées : ${invoiceData.items.length} articles`);
        }

        const companyInfo = await window.api.settings.getCompanyInfo();

        // Générer les lignes d'articles
        const itemsHTML = invoiceData.items.map((item, index) => {
            const displayName = item.unit === 'carton' ? `${item.description} (Carton)` :
                              item.unit === 'wholesale' ? `${item.description} (Gros)` :
                              item.description;
            const unitLabel = item.unit === 'carton' ? 'Carton' :
                             item.unit === 'wholesale' ? 'Gros' :
                             'Pièce';

            return `
                <tr class="item-row">
                    <td class="item-number">${index + 1}</td>
                    <td class="item-description">${displayName}</td>
                    <td class="item-quantity">${item.quantity}</td>
                    <td class="item-unit">${unitLabel}</td>
                    <td class="item-price">${item.unit_price.toFixed(2)}</td>
                    <td class="item-total">${item.line_total.toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        console.log(`✅ ${invoiceData.items.length} lignes générées pour l'impression`);

        // Calculer les totaux (pour compatibilité avec anciennes factures)
        const subtotalHt = invoiceData.subtotal_ht || invoiceData.total_amount / 1.20;
        const tvaRate = invoiceData.tva_rate || 20;
        const tvaAmount = invoiceData.tva_amount || (subtotalHt * (tvaRate / 100));
        const totalTtc = invoiceData.total_amount;

        // Récupérer les styles du template personnalisé
        const templateStyles = await getCurrentTemplateStyles();

        return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${invoiceData.invoice_number}</title>
    <style>
        ${templateStyles}
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- En-tête -->
        <div class="header">
            <div class="company-info">
                ${companyInfo.logo ?
                    `<div class="company-logo">
                        <img src="${companyInfo.logo}" alt="Logo ${companyInfo.name || 'Société'}">
                    </div>` :
                    ''
                }
                <div class="company-name">${companyInfo.name || 'Nom de la société'}</div>
                <div class="company-details">
                    ${companyInfo.address ? `${companyInfo.address}<br>` : ''}
                    ${companyInfo.phone ? `Tél: ${companyInfo.phone}<br>` : ''}
                    ${companyInfo.email ? `Email: ${companyInfo.email}<br>` : ''}
                    ${companyInfo.ice ? `ICE: ${companyInfo.ice}` : ''}
                </div>
            </div>
            <div class="invoice-title-section">
                <div class="invoice-title">FACTURE</div>
                <div class="invoice-number">N° ${invoiceData.invoice_number}</div>
                <div class="invoice-date">Date: ${new Date(invoiceData.invoice_date).toLocaleDateString('fr-FR')}</div>
            </div>
        </div>

        <!-- Section client -->
        <div class="client-section">
            <div class="client-title">FACTURÉ À</div>
            <div class="client-info">
                <div class="client-name">${invoiceData.client_name}</div>
                ${invoiceData.client_address ? `<div>${invoiceData.client_address}</div>` : ''}
                ${invoiceData.client_phone ? `<div>Tél: ${invoiceData.client_phone}</div>` : ''}
                ${invoiceData.client_email ? `<div>Email: ${invoiceData.client_email}</div>` : ''}
            </div>
        </div>

        <!-- Tableau des articles -->
        <table class="items-table">
            <thead>
                <tr>
                    <th class="text-center" style="width: 40px;">#</th>
                    <th>Description</th>
                    <th class="text-center" style="width: 60px;">Qté</th>
                    <th class="text-center" style="width: 60px;">Unité</th>
                    <th class="text-right" style="width: 80px;">Prix Unit.</th>
                    <th class="text-right" style="width: 80px;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>

        <!-- Section totaux -->
        <div class="totals-section">
            <table class="totals-table">
                <tr class="total-ht">
                    <td class="label">Sous-total HT:</td>
                    <td class="amount">${subtotalHt.toFixed(2)} MAD</td>
                </tr>
                <tr class="total-tva">
                    <td class="label">TVA (${tvaRate}%):</td>
                    <td class="amount">${tvaAmount.toFixed(2)} MAD</td>
                </tr>
                <tr class="total-ttc">
                    <td class="label">TOTAL TTC:</td>
                    <td class="amount">${totalTtc.toFixed(2)} MAD</td>
                </tr>
            </table>
        </div>

        <!-- Pied de page -->
        <div class="footer">
            <div class="legal-mentions">
                <div>Merci pour votre confiance</div>
                <div>Conditions de paiement: ${invoiceData.payment_terms || '30 jours'}</div>
            </div>
            <div>
                Cette facture est générée automatiquement par le système de gestion.
            </div>
        </div>
    </div>
</body>
</html>`;
    }

    // Fonction pour récupérer les informations de la société
    async function getCompanyInfo() {
        try {
            const info = await window.api.settings.getCompanyInfo();
            return info || {
                name: 'Votre Société',
                address: '',
                phone: '',
                email: '',
                ice: '',
                logo: null
            };
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des informations société:', error);
            return {
                name: 'Votre Société',
                address: '',
                phone: '',
                email: '',
                ice: '',
                logo: null
            };
        }
    }

    // Fonction pour sauvegarder la facture
    async function saveInvoice() {
        console.log('💾 Sauvegarde de la facture...');

        // Récupérer les données du formulaire
        const formData = new FormData(document.getElementById('invoice-form'));
        const invoiceData = {
            client_name: formData.get('client_name'),
            client_address: formData.get('client_address'),
            client_phone: formData.get('client_phone'),
            client_email: formData.get('client_email'),
            invoice_number: formData.get('invoice_number'),
            invoice_date: formData.get('invoice_date'),
            payment_terms: formData.get('payment_terms'),
            items: getInvoiceItems(),
            subtotal_ht: parseFloat(document.getElementById('subtotal-ht').textContent.replace(' MAD', '')),
            tva_amount: parseFloat(document.getElementById('tva-amount').textContent.replace(' MAD', '')),
            total_amount: parseFloat(document.getElementById('total-ttc').textContent.replace(' MAD', ''))
        };

        try {
            await window.api.invoices.create(invoiceData);
            alert(t('invoice_saved_success'));
            showListView();
        } catch(error) {
            alert(`${t('error_saving_invoice')}: ${error.message}`);
        }
    }

    // Fonction pour récupérer les articles de la facture
    function getInvoiceItems() {
        const items = [];
        const rows = document.querySelectorAll('.invoice-item-row');

        rows.forEach((row, index) => {
            const description = row.querySelector('[name="item_description"]').value;
            const quantity = parseFloat(row.querySelector('[name="item_quantity"]').value) || 0;
            const unit = row.querySelector('[name="item_unit"]').value;
            const unitPrice = parseFloat(row.querySelector('[name="item_price"]').value) || 0;

            if (description && quantity > 0) {
                items.push({
                    line_number: index + 1,
                    description: description,
                    quantity: quantity,
                    unit: unit,
                    unit_price: unitPrice,
                    line_total: quantity * unitPrice
                });
            }
        });

        return items;
    }







    // --- Event Listeners ---

    // Bouton nouvelle facture
    if (newInvoiceBtn) {
        newInvoiceBtn.addEventListener('click', () => {
            console.log('🆕 Création d\'une nouvelle facture...');
            createInvoiceEditor();
        });
    }

    // Bouton retour à la liste
    if (backToListBtn) {
        backToListBtn.addEventListener('click', () => {
            console.log('🔙 Retour à la liste des factures...');
            showListView();
        });
    }

    // Event listener pour les boutons "Voir" dans le tableau des factures
    if (invoicesTableBody) {
        invoicesTableBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-invoice-btn')) {
                const invoiceId = e.target.getAttribute('data-id');
                console.log(`👁️ Ouverture de la facture ID: ${invoiceId}`);
                createInvoiceEditor(invoiceId);
            }
        });
    }

    // Bouton de sauvegarde
    if (saveInvoiceBtn) {
        saveInvoiceBtn.addEventListener('click', saveInvoice);
    }

    // Bouton d'impression/PDF
    if (printInvoiceBtn) {
        printInvoiceBtn.addEventListener('click', async () => {
            console.log('🖨️ Début de la génération PDF...');

            try {
                // Générer le HTML de la facture
                const invoiceHTML = await generatePrintableInvoice();
                if (!invoiceHTML) {
                    console.error('❌ Impossible de générer le HTML de la facture');
                    alert('Erreur lors de la génération de la facture');
                    return;
                }

                console.log('✅ HTML généré avec succès');

                // Convertir en PDF
                const pdfData = await window.api.print.toPDF(invoiceHTML);
                const blob = new Blob([pdfData], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                // Déterminer le nom du fichier
                let fileName = 'facture.pdf';

                if (currentInvoiceId) {
                    // Facture sauvegardée : utiliser le numéro de facture de la DB
                    try {
                        const invoiceDetails = await window.api.invoices.getDetails(currentInvoiceId);
                        fileName = `${invoiceDetails.invoice_number.replace(/\//g, '-')}.pdf`;
                    } catch (error) {
                        console.warn('⚠️ Impossible de récupérer le numéro de facture, utilisation du nom par défaut');
                    }
                } else {
                    // Facture en cours d'édition : utiliser le numéro de l'éditeur
                    const invoiceNumberInput = document.querySelector('[name="invoice_number"]');
                    if (invoiceNumberInput && invoiceNumberInput.value) {
                        fileName = `${invoiceNumberInput.value.replace(/\//g, '-')}.pdf`;
                    } else {
                        fileName = `facture-brouillon-${new Date().toISOString().split('T')[0]}.pdf`;
                    }
                }

                // Télécharger le fichier
                const a = document.createElement('a');
                a.download = fileName;
                a.href = url;
                a.click();

                // Nettoyer l'URL après un délai
                setTimeout(() => URL.revokeObjectURL(url), 100);

                console.log(`✅ PDF téléchargé : ${fileName}`);
                alert('PDF généré avec succès');

            } catch (error) {
                console.error("❌ Erreur lors de la génération PDF:", error);
                alert('Erreur lors de la génération du PDF');
            }
        });
    }

    // --- Initialisation ---
    console.log('✅ Module de facturation initialisé avec support des templates personnalisés');

    // Charger les factures au démarrage
    try {
        await loadInvoices();
        console.log('✅ Factures chargées au démarrage');
    } catch (error) {
        console.error('❌ Erreur lors du chargement initial des factures:', error);
    }

});