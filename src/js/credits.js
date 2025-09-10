document.addEventListener('DOMContentLoaded', async () => {
    // --- Initialisation de la traduction ---
    await window.i18n.loadTranslations();
    window.i18n.applyTranslationsToHTML();
    const t = window.i18n.t;

    // --- Vérification des API ---
    if (!window.api || !window.api.credits || !window.api.clients || !window.api.session) {
        document.body.innerHTML = "<h1>ERREUR: API manquante.</h1>";
        return;
    }

    // --- Éléments du DOM ---
    const tableBody = document.getElementById('debtorsTableBody');

    // Éléments pour les statistiques
    const totalClients = document.getElementById('totalClients');
    const debtorClients = document.getElementById('debtorClients');
    const totalCredit = document.getElementById('totalCredit');
    const monthlyCollection = document.getElementById('monthlyCollection');
    const overdueClients = document.getElementById('overdueClients');
    const recoveryRate = document.getElementById('recoveryRate');

    // Éléments pour la recherche et filtres
    const searchInput = document.getElementById('searchInput');
    const filterAll = document.getElementById('filterAll');
    const filterDebtors = document.getElementById('filterDebtors');
    const filterCurrent = document.getElementById('filterCurrent');
    const filterOverdue = document.getElementById('filterOverdue');
    const amountFilter = document.getElementById('amountFilter');
    const ageFilter = document.getElementById('ageFilter');

    // Éléments pour l'encaissement rapide
    const quickClientSearch = document.getElementById('quickClientSearch');
    const quickClientResults = document.getElementById('quickClientResults');
    const quickAmount = document.getElementById('quickAmount');
    const quickPayBtn = document.getElementById('quickPayBtn');

    // Boutons principaux
    const manualCreditBtn = document.getElementById('manualCreditBtn');
    const quickPaymentBtn = document.getElementById('quickPaymentBtn');
    const exportBtn = document.getElementById('exportBtn');

    // Modal de paiement amélioré
    const paymentModal = document.getElementById('paymentModal');
    const closePaymentModalBtn = document.getElementById('closeModalBtn');
    const closePaymentModalBtn2 = document.getElementById('closePaymentModalBtn');
    const paymentForm = document.getElementById('paymentForm');
    const clientNameSpan = document.getElementById('clientName');
    const clientPhoneSpan = document.getElementById('clientPhone');
    const clientDebtSpan = document.getElementById('clientDebt');
    const clientInitialSpan = document.getElementById('clientInitial');
    const clientRatingDiv = document.getElementById('clientRating');
    const paymentClientIdInput = document.getElementById('clientId');
    const amountInput = document.getElementById('amount');
    const paymentNoteInput = document.getElementById('paymentNote');
    const fullAmountBtn = document.getElementById('fullAmountBtn');

    // Modal de crédit manuel amélioré
    const manualCreditModal = document.getElementById('manualCreditModal');
    const closeManualCreditModalBtn = document.getElementById('closeManualCreditModalBtn');
    const closeManualCreditModalBtn2 = document.getElementById('closeManualCreditModalBtn2');
    const manualCreditForm = document.getElementById('manualCreditForm');
    const clientSearchInput = document.getElementById('clientSearchManual');
    const clientSearchResultsDiv = document.getElementById('clientSearchResults');
    const selectedClientInfo = document.getElementById('selectedClientInfo');
    const selectedClientNameSpan = document.getElementById('selectedClientName');
    const selectedClientInitial = document.getElementById('selectedClientInitial');
    const selectedClientDetails = document.getElementById('selectedClientDetails');
    const manualCreditClientIdInput = document.getElementById('manualCreditClientId');
    const manualAmountInput = document.getElementById('manualAmount');
    const manualNoteInput = document.getElementById('manualNote');

    // Modal d'historique
    const historyModal = document.getElementById('historyModal');
    const closeHistoryModalBtn = document.getElementById('closeHistoryModalBtn');
    const historyClientInfo = document.getElementById('historyClientInfo');
    const historyTableBody = document.getElementById('historyTableBody');

    // Modal d'encaissement rapide
    const quickPaymentModal = document.getElementById('quickPaymentModal');
    const closeQuickPaymentModalBtn = document.getElementById('closeQuickPaymentModalBtn');
    const closeQuickPaymentModalBtn2 = document.getElementById('closeQuickPaymentModalBtn2');
    const quickPaymentForm = document.getElementById('quickPaymentForm');
    const quickPayClientSearch = document.getElementById('quickPayClientSearch');
    const quickPayClientResults = document.getElementById('quickPayClientResults');
    const quickSelectedClientInfo = document.getElementById('quickSelectedClientInfo');
    const quickPayClientId = document.getElementById('quickPayClientId');
    const quickPayAmount = document.getElementById('quickPayAmount');

    // Variables globales
    let allClients = [];
    let filteredClients = [];
    let currentFilter = 'all';
    let selectedQuickClient = null;

    // La fonction showNotification est maintenant disponible globalement via notifications.js

    // --- Fonctions utilitaires ---
    function getRiskLevel(amount) {
        if (amount >= 10000) return 'critical';
        if (amount >= 5000) return 'high';
        if (amount >= 2000) return 'medium';
        return 'low';
    }

    function getRiskBadge(amount) {
        const level = getRiskLevel(amount);
        let badgeClass = 'risk-badge ';
        let icon = '';
        let text = '';

        switch (level) {
            case 'critical':
                badgeClass += 'critical';
                icon = '⚫';
                text = 'Critique';
                break;
            case 'high':
                badgeClass += 'high';
                icon = '🔴';
                text = 'Élevé';
                break;
            case 'medium':
                badgeClass += 'medium';
                icon = '🟡';
                text = 'Moyen';
                break;
            case 'low':
            default:
                badgeClass += 'low';
                icon = '🟢';
                text = 'Faible';
                break;
        }

        return `<span class="${badgeClass}">${icon} ${text}</span>`;
    }

    function getAgeBadge(days) {
        let badgeClass = 'age-badge ';
        let icon = '';
        let text = '';

        if (days <= 15) {
            badgeClass += 'recent';
            icon = '🟢';
            text = `${days}j`;
        } else if (days <= 30) {
            badgeClass += 'medium';
            icon = '🟡';
            text = `${days}j`;
        } else {
            badgeClass += 'old';
            icon = '🔴';
            text = `${days}j`;
        }

        return `<span class="${badgeClass}">${icon} ${text}</span>`;
    }

    function getRatingStars(score = 3) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= score) {
                stars += '<span class="star">★</span>';
            } else {
                stars += '<span class="star empty">★</span>';
            }
        }
        return `<div class="rating-stars">${stars}</div>`;
    }

    function calculateDaysSinceLastTransaction(client) {
        // Simulation - dans un vrai système, cela viendrait de la base de données
        return Math.floor(Math.random() * 60) + 1;
    }

    function showLoadingSkeleton() {
        tableBody.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full loading-skeleton"></div>
                        </div>
                        <div class="ml-4 space-y-2">
                            <div class="h-4 w-32 loading-skeleton rounded"></div>
                            <div class="h-3 w-24 loading-skeleton rounded"></div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4"><div class="h-4 w-24 loading-skeleton rounded"></div></td>
                <td class="px-6 py-4"><div class="h-6 w-20 loading-skeleton rounded"></div></td>
                <td class="px-6 py-4"><div class="h-4 w-16 loading-skeleton rounded"></div></td>
                <td class="px-6 py-4"><div class="h-6 w-12 loading-skeleton rounded"></div></td>
                <td class="px-6 py-4"><div class="h-8 w-24 loading-skeleton rounded"></div></td>
            `;
            tableBody.appendChild(tr);
        }
    }

    // --- Fonctions principales ---
    async function loadAllClients() {
        try {
            showLoadingSkeleton();

            // Charger tous les clients et les débiteurs
            const [clients, debtors] = await Promise.all([
                window.api.clients.getAll(),
                window.api.credits.getDebtors()
            ]);

            // Enrichir les données des clients avec les informations de crédit
            allClients = clients.map(client => {
                const debtorInfo = debtors.find(d => d.id === client.id);
                return {
                    ...client,
                    credit_balance: debtorInfo ? debtorInfo.credit_balance : 0,
                    is_debtor: !!debtorInfo,
                    days_since_last: calculateDaysSinceLastTransaction(client),
                    reliability_score: Math.floor(Math.random() * 5) + 1 // Simulation
                };
            });

            filteredClients = [...allClients];
            applyCurrentFilter();
            updateStatistics();
        } catch (error) {
            console.error('Erreur lors du chargement des clients:', error);
            showNotification('Erreur lors du chargement des données', 'error');
        }
    }

    function applyCurrentFilter() {
        // Appliquer le filtre de statut
        switch (currentFilter) {
            case 'debtors':
                filteredClients = allClients.filter(c => c.is_debtor);
                break;
            case 'current':
                filteredClients = allClients.filter(c => !c.is_debtor);
                break;
            case 'overdue':
                filteredClients = allClients.filter(c => c.is_debtor && c.days_since_last > 30);
                break;
            default:
                filteredClients = [...allClients];
        }

        // Appliquer le filtre de montant
        const amountFilterValue = amountFilter.value;
        if (amountFilterValue !== 'all') {
            filteredClients = filteredClients.filter(c => {
                const amount = c.credit_balance;
                switch (amountFilterValue) {
                    case 'small': return amount < 5000;
                    case 'medium': return amount >= 5000 && amount <= 10000;
                    case 'large': return amount > 10000;
                    default: return true;
                }
            });
        }

        // Appliquer le filtre d'âge
        const ageFilterValue = ageFilter.value;
        if (ageFilterValue !== 'all') {
            filteredClients = filteredClients.filter(c => {
                const days = c.days_since_last;
                switch (ageFilterValue) {
                    case 'recent': return days < 15;
                    case 'medium': return days >= 15 && days <= 30;
                    case 'old': return days > 30;
                    default: return true;
                }
            });
        }

        renderTable(filteredClients);
    }

    function renderTable(clients) {
        tableBody.innerHTML = '';

        if (clients.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-500 dark:text-gray-400">Aucun client trouvé</td></tr>`;
            return;
        }

        clients.forEach(client => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200';

            const creditBalance = client.credit_balance || 0;
            const daysSince = client.days_since_last;
            const reliability = client.reliability_score;

            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="flex items-center min-w-0">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                ${client.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div class="ml-4 client-info-container-credit">
                            <div class="text-sm font-medium text-gray-900 dark:text-white client-name-truncate-credit" title="${client.name}">${client.name}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                ${getRatingStars(reliability)}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 dark:text-white">${client.phone || 'N/A'}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">${client.address || 'Adresse non renseignée'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex flex-col gap-1">
                        <span class="text-lg font-bold ${creditBalance > 0 ? 'text-red-600' : 'text-green-600'}">${creditBalance.toFixed(2)} MAD</span>
                        ${creditBalance > 0 ? getRiskBadge(creditBalance) : '<span class="text-green-600 text-sm">✓ À jour</span>'}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                        ${daysSince} jours
                        <div class="text-xs text-gray-500">Dernière vente</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    ${getAgeBadge(daysSince)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="flex justify-end gap-2">
                        ${creditBalance > 0 ? `
                            <button class="payment-btn bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                                    data-client-id="${client.id}"
                                    data-client-name="${client.name}"
                                    data-client-phone="${client.phone || ''}"
                                    data-client-debt="${creditBalance.toFixed(2)}"
                                    data-client-rating="${reliability}">
                                Encaisser
                            </button>
                        ` : ''}
                        <button class="credit-btn bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                                data-client-id="${client.id}"
                                data-client-name="${client.name}">
                            ${creditBalance > 0 ? '+' : 'Crédit'}
                        </button>
                        <button class="history-btn bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                                data-client-id="${client.id}"
                                data-client-name="${client.name}">
                            Historique
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function updateStatistics() {
        // Mettre à jour les statistiques
        if (totalClients) totalClients.textContent = allClients.length;

        const debtors = allClients.filter(c => c.is_debtor);
        if (debtorClients) debtorClients.textContent = debtors.length;

        const totalCreditAmount = debtors.reduce((sum, c) => sum + c.credit_balance, 0);
        if (totalCredit) totalCredit.textContent = `${totalCreditAmount.toFixed(2)} MAD`;

        // Simulation des autres métriques
        const monthlyCollectionAmount = Math.floor(totalCreditAmount * 0.3); // 30% du total
        if (monthlyCollection) monthlyCollection.textContent = `${monthlyCollectionAmount.toFixed(2)} MAD`;

        const overdueCount = debtors.filter(c => c.days_since_last > 30).length;
        if (overdueClients) overdueClients.textContent = overdueCount;

        const recoveryRateValue = debtors.length > 0 ? Math.floor((monthlyCollectionAmount / totalCreditAmount) * 100) : 0;
        if (recoveryRate) recoveryRate.textContent = `${recoveryRateValue}%`;
    }

    function setActiveFilter(filterType) {
        currentFilter = filterType;

        // Mettre à jour les styles des boutons
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));

        switch (filterType) {
            case 'all':
                if (filterAll) filterAll.classList.add('active');
                break;
            case 'debtors':
                if (filterDebtors) filterDebtors.classList.add('active');
                break;
            case 'current':
                if (filterCurrent) filterCurrent.classList.add('active');
                break;
            case 'overdue':
                if (filterOverdue) filterOverdue.classList.add('active');
                break;
        }

        applyCurrentFilter();
    }

    // Fonction debounce pour la recherche
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

    const debouncedSearch = debounce((searchTerm) => {
        if (searchTerm.trim() === '') {
            applyCurrentFilter();
        } else {
            const filtered = filteredClients.filter(c =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.phone && c.phone.includes(searchTerm))
            );
            renderTable(filtered);
        }
    }, 300);

    // --- Fonctions pour les modals ---
    function openPaymentModal(clientData) {
        clientNameSpan.textContent = clientData.clientName;
        clientPhoneSpan.textContent = clientData.clientPhone || 'Non renseigné';
        clientDebtSpan.textContent = `${clientData.clientDebt} MAD`;
        clientInitialSpan.textContent = clientData.clientName.charAt(0).toUpperCase();
        clientRatingDiv.innerHTML = getRatingStars(parseInt(clientData.clientRating));
        paymentClientIdInput.value = clientData.clientId;
        amountInput.value = clientData.clientDebt;
        amountInput.max = clientData.clientDebt;
        paymentModal.classList.replace('hidden', 'flex');
    }

    function closePaymentModal() {
        paymentModal.classList.replace('flex', 'hidden');
        paymentForm.reset();
    }

    function openManualCreditModal() {
        manualCreditModal.classList.replace('hidden', 'flex');
        selectedClientInfo.classList.add('hidden');
    }

    function closeManualCreditModal() {
        manualCreditModal.classList.replace('flex', 'hidden');
        manualCreditForm.reset();
        selectedClientInfo.classList.add('hidden');
        clientSearchResultsDiv.classList.add('hidden');
        manualCreditClientIdInput.value = '';
    }

    async function openHistoryModal(clientId, clientName) {
        // Afficher les informations client
        historyClientInfo.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    ${clientName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 class="font-semibold text-gray-800 dark:text-white">${clientName}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Historique des transactions et détails des ventes</p>
                </div>
            </div>
        `;

        // Afficher un loading pendant le chargement
        historyTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-4 py-8 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span class="text-gray-500">Chargement de l'historique...</span>
                    </div>
                </td>
            </tr>
        `;

        historyModal.classList.replace('hidden', 'flex');

        try {
            // Récupérer l'historique réel des crédits, des ventes et des paiements pour ce client spécifique
            const [creditBalance, clientSales, creditPayments] = await Promise.all([
                window.api.credits.getClientCredit(clientId),
                window.api.sales.getClientHistory ? window.api.sales.getClientHistory(clientId) : Promise.resolve([]),
                window.api.credits.getClientHistory ? window.api.credits.getClientHistory(clientId) : Promise.resolve([])
            ]);

            // Créer un historique combiné
            const combinedHistory = [];

            // Ajouter les ventes avec crédit (utiliser les nouvelles données avec détails complets)
            clientSales.forEach(sale => {
                if (sale.payment_method === 'credit') {
                    combinedHistory.push({
                        date: sale.sale_date,
                        type: 'Vente à crédit',
                        amount: -sale.total_amount,
                        reason: `Vente #${sale.id}`,
                        details: {
                            saleId: sale.id,
                            products: sale.products || [],
                            total: sale.total_amount,
                            paymentMethod: sale.payment_method,
                            status: sale.status,
                            advancePaid: sale.advance_paid || 0,
                            creditAmount: sale.credit_amount || 0,
                            remainingBalance: sale.remaining_balance || 0
                        },
                        balance: 0, // Sera calculé
                        advancePaid: sale.advance_paid || 0,
                        remainingAfterTransaction: sale.remaining_balance || 0
                    });
                }
            });

            // Ajouter les paiements de crédit réels
            creditPayments.forEach(payment => {
                combinedHistory.push({
                    date: payment.payment_date,
                    type: payment.amount_paid > 0 ? 'Paiement' : 'Crédit ajouté',
                    amount: payment.amount_paid,
                    reason: payment.note || (payment.amount_paid > 0 ? 'Paiement de crédit' : 'Crédit manuel'),
                    details: {
                        paymentId: payment.id,
                        userName: payment.user_name || 'Utilisateur inconnu',
                        note: payment.note
                    },
                    balance: 0 // Sera calculé
                });
            });

            // Trier par date (plus récent en premier)
            combinedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Calculer les soldes (en partant du solde actuel et en remontant dans le temps)
            let runningBalance = creditBalance || 0;
            combinedHistory.forEach(transaction => {
                transaction.balance = runningBalance;
                runningBalance -= transaction.amount;
            });

            // Afficher l'historique
            historyTableBody.innerHTML = '';

            if (combinedHistory.length === 0) {
                historyTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            Aucune transaction trouvée pour ce client
                        </td>
                    </tr>
                `;
                return;
            }

            combinedHistory.forEach(transaction => {
                const tr = document.createElement('tr');

                // Créer le contenu de base et déterminer si la ligne est cliquable
                let detailsHtml = '';
                let isClickable = false;

                if (transaction.details && transaction.details.products) {
                    // Transaction de vente avec produits
                    const productCount = transaction.details.products.length;
                    isClickable = true;
                    detailsHtml = `
                        <div class="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            ${productCount} produit(s) - Cliquer pour voir les détails
                        </div>
                    `;
                } else if (transaction.details && transaction.details.paymentId) {
                    // Transaction de paiement
                    isClickable = true;
                    detailsHtml = `
                        <div class="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Cliquer pour voir les détails du paiement
                        </div>
                    `;
                }

                // Définir la classe CSS selon si la ligne est cliquable
                tr.className = isClickable ?
                    'hover:bg-gray-50 dark:hover:bg-gray-700 transaction-row-clickable' :
                    'hover:bg-gray-50 dark:hover:bg-gray-700';

                // Calculer les informations d'avance et de montant restant
                let advanceInfo = '';
                if (transaction.type === 'Vente à crédit' && transaction.details) {
                    const advancePaid = transaction.details.advancePaid || 0;
                    const remainingBalance = transaction.details.remainingBalance || 0;
                    const total = transaction.details.total || 0;

                    if (advancePaid > 0) {
                        advanceInfo = `
                            <div class="text-xs">
                                <div class="text-green-600 font-medium">Avance: ${advancePaid.toFixed(2)} MAD</div>
                                <div class="text-red-600">Restant: ${remainingBalance.toFixed(2)} MAD</div>
                            </div>
                        `;
                    } else {
                        advanceInfo = `
                            <div class="text-xs text-red-600">
                                Aucune avance<br>
                                Total à crédit: ${total.toFixed(2)} MAD
                            </div>
                        `;
                    }
                } else if (transaction.type === 'Paiement') {
                    advanceInfo = `
                        <div class="text-xs text-green-600 font-medium">
                            Paiement effectué
                        </div>
                    `;
                } else {
                    advanceInfo = `<div class="text-xs text-gray-500">-</div>`;
                }

                tr.innerHTML = `
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        ${new Date(transaction.date).toLocaleDateString('fr-FR')}
                        <div class="text-xs text-gray-500">${new Date(transaction.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</div>
                    </td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs rounded-full ${
                            transaction.type === 'Paiement' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                        }">
                            ${transaction.type}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-right text-sm font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}">
                        ${transaction.amount > 0 ? '+' : ''}${transaction.amount.toFixed(2)} MAD
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        ${transaction.reason}
                        ${detailsHtml}
                    </td>
                    <td class="px-4 py-3 text-center text-sm">
                        ${advanceInfo}
                    </td>
                    <td class="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                        ${transaction.balance.toFixed(2)} MAD
                    </td>
                `;

                // Ajouter les données pour les détails si disponibles
                if (isClickable && transaction.details) {
                    if (transaction.details.saleId) {
                        tr.title = 'Cliquer pour voir les détails de la vente';
                        tr.dataset.saleDetails = JSON.stringify(transaction.details);
                    } else if (transaction.details.paymentId) {
                        tr.title = 'Cliquer pour voir les détails du paiement';
                        tr.dataset.paymentDetails = JSON.stringify(transaction.details);
                    }
                }

                historyTableBody.appendChild(tr);
            });

        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique:', error);
            historyTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-red-500">
                        Erreur lors du chargement de l'historique
                    </td>
                </tr>
            `;
        }
    }

    function showSaleDetails(saleDetails) {
        console.log('Affichage des détails de vente:', saleDetails); // Debug

        if (!saleDetails) {
            showNotification('Aucun détail disponible pour cette vente', 'warning');
            return;
        }

        // Créer un modal pour afficher les détails de la vente
        const detailsModal = document.createElement('div');
        detailsModal.className = 'fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center z-50';
        detailsModal.id = 'saleDetailsModal';

        detailsModal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-800 dark:text-white">🧾 Détails de la Vente #${saleDetails.saleId}</h3>
                    <button class="close-details text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div class="space-y-4">
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-800 dark:text-white mb-2">Informations de la vente</h4>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-gray-600 dark:text-gray-400">Numéro de vente:</span>
                                <div class="font-medium">#${saleDetails.saleId}</div>
                            </div>
                            <div>
                                <span class="text-gray-600 dark:text-gray-400">Mode de paiement:</span>
                                <div class="font-medium">${saleDetails.paymentMethod === 'credit' ? 'À crédit' : saleDetails.paymentMethod}</div>
                            </div>
                            <div>
                                <span class="text-gray-600 dark:text-gray-400">Total:</span>
                                <div class="font-bold text-lg text-blue-600">${saleDetails.total.toFixed(2)} MAD</div>
                            </div>
                            ${saleDetails.advancePaid !== undefined ? `
                                <div>
                                    <span class="text-gray-600 dark:text-gray-400">Avance payée:</span>
                                    <div class="font-medium text-green-600">${saleDetails.advancePaid.toFixed(2)} MAD</div>
                                </div>
                            ` : ''}
                            ${saleDetails.remainingBalance !== undefined ? `
                                <div>
                                    <span class="text-gray-600 dark:text-gray-400">Montant restant:</span>
                                    <div class="font-medium text-red-600">${saleDetails.remainingBalance.toFixed(2)} MAD</div>
                                </div>
                            ` : ''}
                            ${saleDetails.status ? `
                                <div>
                                    <span class="text-gray-600 dark:text-gray-400">Statut:</span>
                                    <div class="font-medium ${saleDetails.status === 'COMPLETED' ? 'text-green-600' : 'text-orange-600'}">${saleDetails.status}</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    ${saleDetails.products && saleDetails.products.length > 0 ? `
                        <div>
                            <h4 class="font-semibold text-gray-800 dark:text-white mb-3">Produits vendus</h4>
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead class="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Produit</th>
                                            <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qté</th>
                                            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Prix Unit.</th>
                                            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        ${saleDetails.products.map(product => `
                                            <tr>
                                                <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">${product.name}</td>
                                                <td class="px-4 py-2 text-center text-sm text-gray-600 dark:text-gray-400">${product.quantity}</td>
                                                <td class="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-400">${product.price.toFixed(2)} MAD</td>
                                                <td class="px-4 py-2 text-right text-sm font-medium text-gray-900 dark:text-white">${(product.quantity * product.price).toFixed(2)} MAD</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : '<p class="text-gray-500 text-center py-4">Aucun détail de produit disponible</p>'}
                </div>
            </div>
        `;

        document.body.appendChild(detailsModal);

        // Event listener pour fermer le modal
        const closeBtn = detailsModal.querySelector('.close-details');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (document.body.contains(detailsModal)) {
                    document.body.removeChild(detailsModal);
                }
            });
        }

        // Fermer en cliquant à l'extérieur
        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) {
                if (document.body.contains(detailsModal)) {
                    document.body.removeChild(detailsModal);
                }
            }
        });

        // Fermer avec la touche Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (document.body.contains(detailsModal)) {
                    document.body.removeChild(detailsModal);
                }
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    function showPaymentDetails(paymentDetails) {
        console.log('Affichage des détails de paiement:', paymentDetails); // Debug

        if (!paymentDetails) {
            showNotification('Aucun détail disponible pour ce paiement', 'warning');
            return;
        }

        // Créer un modal pour afficher les détails du paiement
        const detailsModal = document.createElement('div');
        detailsModal.className = 'fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center z-50';
        detailsModal.id = 'paymentDetailsModal';

        detailsModal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-800 dark:text-white">💰 Détails du Paiement</h3>
                    <button class="close-payment-details text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div class="space-y-4">
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-800 dark:text-white mb-2">Informations du paiement</h4>
                        <div class="space-y-3 text-sm">
                            ${paymentDetails.paymentId ? `
                                <div>
                                    <span class="text-gray-600 dark:text-gray-400">ID Paiement:</span>
                                    <div class="font-medium">#${paymentDetails.paymentId}</div>
                                </div>
                            ` : ''}
                            ${paymentDetails.userName ? `
                                <div>
                                    <span class="text-gray-600 dark:text-gray-400">Traité par:</span>
                                    <div class="font-medium">${paymentDetails.userName}</div>
                                </div>
                            ` : ''}
                            ${paymentDetails.note ? `
                                <div>
                                    <span class="text-gray-600 dark:text-gray-400">Note:</span>
                                    <div class="font-medium">${paymentDetails.note}</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(detailsModal);

        // Event listener pour fermer le modal
        const closeBtn = detailsModal.querySelector('.close-payment-details');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (document.body.contains(detailsModal)) {
                    document.body.removeChild(detailsModal);
                }
            });
        }

        // Fermer en cliquant à l'extérieur
        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) {
                if (document.body.contains(detailsModal)) {
                    document.body.removeChild(detailsModal);
                }
            }
        });

        // Fermer avec la touche Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (document.body.contains(detailsModal)) {
                    document.body.removeChild(detailsModal);
                }
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    function closeHistoryModal() {
        historyModal.classList.replace('flex', 'hidden');
    }

    function openQuickPaymentModal() {
        quickPaymentModal.classList.replace('hidden', 'flex');
        selectedQuickClient = null;
        quickSelectedClientInfo.classList.add('hidden');
    }

    function closeQuickPaymentModal() {
        quickPaymentModal.classList.replace('flex', 'hidden');
        quickPaymentForm.reset();
        selectedQuickClient = null;
        quickSelectedClientInfo.classList.add('hidden');
        quickPayClientResults.classList.add('hidden');
    }

    // --- Fonction d'export ---
    async function exportCreditsData(exportType = 'all') {
        try {
            const typeText = {
                'all': 'rapport complet',
                'debtors': 'débiteurs uniquement',
                'summary': 'résumé exécutif'
            }[exportType] || 'rapport';

            showNotification(`Préparation de l'export ${typeText}...`, 'info');

            // Récupérer toutes les données nécessaires
            const [clients, debtors, creditHistory] = await Promise.all([
                window.api.clients.getAll(),
                window.api.credits.getDebtors(),
                // Récupérer l'historique de crédit si disponible
                Promise.resolve([]) // Placeholder pour l'historique complet
            ]);

            // Enrichir les données des clients
            const enrichedClients = clients.map(client => {
                const debtorInfo = debtors.find(d => d.id === client.id);
                const creditBalance = debtorInfo ? debtorInfo.credit_balance : 0;
                const daysSince = calculateDaysSinceLastTransaction(client);
                const riskLevel = getRiskLevel(creditBalance);

                return {
                    id: client.id,
                    name: client.name,
                    phone: client.phone || 'Non renseigné',
                    address: client.address || 'Non renseignée',
                    creditBalance: creditBalance,
                    isDebtor: creditBalance > 0,
                    riskLevel: riskLevel,
                    daysSinceLastTransaction: daysSince,
                    reliabilityScore: Math.floor(Math.random() * 5) + 1, // Simulation
                    status: creditBalance > 0 ? 'Débiteur' : 'À jour'
                };
            });

            // Créer les données pour l'export
            const exportData = {
                summary: {
                    totalClients: clients.length,
                    debtorClients: debtors.length,
                    totalCreditAmount: debtors.reduce((sum, d) => sum + d.credit_balance, 0),
                    averageCreditAmount: debtors.length > 0 ? debtors.reduce((sum, d) => sum + d.credit_balance, 0) / debtors.length : 0,
                    exportDate: new Date().toLocaleDateString('fr-FR'),
                    exportTime: new Date().toLocaleTimeString('fr-FR')
                },
                clients: enrichedClients
            };

            // Générer le fichier selon le type d'export
            await generateExcelReport(exportData, exportType);

        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            showNotification('Erreur lors de l\'export des données', 'error');
        }
    }

    async function generateExcelReport(data, exportType = 'all') {
        // Créer le contenu CSV optimisé pour Excel français
        let csvContent = '';
        const separator = ';'; // Point-virgule pour Excel français

        // En-tête du rapport selon le type
        const reportTitles = {
            'all': 'RAPPORT COMPLET DE GESTION DES CRÉDITS',
            'debtors': 'RAPPORT DES CLIENTS DÉBITEURS',
            'summary': 'RÉSUMÉ EXÉCUTIF - GESTION DES CRÉDITS'
        };

        // En-tête principal
        csvContent += `${reportTitles[exportType]}\n`;
        csvContent += `Date d'export${separator}${data.summary.exportDate} à ${data.summary.exportTime}\n`;
        csvContent += '\n';

        // Résumé exécutif en format tableau
        csvContent += 'RÉSUMÉ EXÉCUTIF\n';
        csvContent += `Métrique${separator}Valeur\n`;
        csvContent += `Total clients${separator}${data.summary.totalClients}\n`;
        csvContent += `Clients débiteurs${separator}${data.summary.debtorClients}\n`;
        csvContent += `Montant total des crédits${separator}${data.summary.totalCreditAmount.toFixed(2)} MAD\n`;
        csvContent += `Montant moyen par débiteur${separator}${data.summary.averageCreditAmount.toFixed(2)} MAD\n`;
        csvContent += `Taux de clients débiteurs${separator}${((data.summary.debtorClients / data.summary.totalClients) * 100).toFixed(1)}%\n`;
        csvContent += '\n';

        // Répartition par niveau de risque en format tableau
        csvContent += 'RÉPARTITION PAR NIVEAU DE RISQUE\n';
        const riskCounts = {
            low: data.clients.filter(c => c.riskLevel === 'low').length,
            medium: data.clients.filter(c => c.riskLevel === 'medium').length,
            high: data.clients.filter(c => c.riskLevel === 'high').length,
            critical: data.clients.filter(c => c.riskLevel === 'critical').length
        };
        csvContent += `Niveau de Risque${separator}Nombre de Clients\n`;
        csvContent += `Risque faible (< 2000 MAD)${separator}${riskCounts.low}\n`;
        csvContent += `Risque moyen (2000-5000 MAD)${separator}${riskCounts.medium}\n`;
        csvContent += `Risque élevé (5000-10000 MAD)${separator}${riskCounts.high}\n`;
        csvContent += `Risque critique (> 10000 MAD)${separator}${riskCounts.critical}\n`;
        csvContent += '\n';

        // Contenu selon le type d'export
        if (exportType === 'summary') {
            // Pour le résumé exécutif, on s'arrête aux statistiques
            csvContent += 'RECOMMANDATIONS\n';
            csvContent += `Type${separator}Description\n`;

            const criticalClients = data.clients.filter(c => c.riskLevel === 'critical').length;
            const highRiskClients = data.clients.filter(c => c.riskLevel === 'high').length;
            const oldDebtors = data.clients.filter(c => c.isDebtor && c.daysSinceLastTransaction > 30).length;

            if (criticalClients > 0) {
                csvContent += `URGENT${separator}${criticalClients} client(s) à risque critique (> 10000 MAD)\n`;
            }
            if (highRiskClients > 0) {
                csvContent += `ATTENTION${separator}${highRiskClients} client(s) à risque élevé (5000-10000 MAD)\n`;
            }
            if (oldDebtors > 0) {
                csvContent += `RELANCE${separator}${oldDebtors} client(s) sans transaction depuis plus de 30 jours\n`;
            }

        } else {
            // Détail des clients (pour 'all' et 'debtors')
            const clientsToExport = exportType === 'debtors' ?
                data.clients.filter(c => c.isDebtor) :
                data.clients;

            csvContent += `DÉTAIL DES ${exportType === 'debtors' ? 'CLIENTS DÉBITEURS' : 'CLIENTS'}\n`;
            csvContent += `ID Client${separator}Nom${separator}Téléphone${separator}Adresse${separator}Solde Crédit (MAD)${separator}Statut${separator}Niveau de Risque${separator}Jours depuis dernière transaction${separator}Score de fiabilité\n`;

            clientsToExport.forEach(client => {
                const riskText = {
                    'low': 'Faible',
                    'medium': 'Moyen',
                    'high': 'Élevé',
                    'critical': 'Critique'
                }[client.riskLevel] || 'Inconnu';

                // Nettoyer les données pour éviter les problèmes de formatage
                const cleanName = client.name.replace(/"/g, '""');
                const cleanPhone = client.phone.replace(/"/g, '""');
                const cleanAddress = client.address.replace(/"/g, '""');

                csvContent += `${client.id}${separator}"${cleanName}"${separator}"${cleanPhone}"${separator}"${cleanAddress}"${separator}${client.creditBalance.toFixed(2)}${separator}"${client.status}"${separator}"${riskText}"${separator}${client.daysSinceLastTransaction}${separator}${client.reliabilityScore}\n`;
            });

            csvContent += '\n';
        }

        // Clients débiteurs uniquement (section séparée pour rapport complet)
        if (exportType === 'all') {
            const debtorClients = data.clients.filter(c => c.isDebtor);
            if (debtorClients.length > 0) {
                csvContent += 'FOCUS SUR LES CLIENTS DÉBITEURS\n';
                csvContent += `ID Client${separator}Nom${separator}Téléphone${separator}Solde Crédit (MAD)${separator}Niveau de Risque${separator}Jours depuis dernière transaction${separator}Priorité de recouvrement\n`;

                // Trier par montant décroissant pour prioriser
                debtorClients.sort((a, b) => b.creditBalance - a.creditBalance);

                debtorClients.forEach((client, index) => {
                    const riskText = {
                        'low': 'Faible',
                        'medium': 'Moyen',
                        'high': 'Élevé',
                        'critical': 'Critique'
                    }[client.riskLevel] || 'Inconnu';

                    let priority = 'Normale';
                    if (client.riskLevel === 'critical') priority = 'Urgente';
                    else if (client.riskLevel === 'high') priority = 'Élevée';
                    else if (client.daysSinceLastTransaction > 30) priority = 'Élevée';

                    const cleanName = client.name.replace(/"/g, '""');
                    const cleanPhone = client.phone.replace(/"/g, '""');

                    csvContent += `${client.id}${separator}"${cleanName}"${separator}"${cleanPhone}"${separator}${client.creditBalance.toFixed(2)}${separator}"${riskText}"${separator}${client.daysSinceLastTransaction}${separator}"${priority}"\n`;
                });
            }
        }

        // Ajouter l'en-tête BOM pour Excel UTF-8
        const BOM = '\uFEFF';
        const finalContent = BOM + csvContent;

        // Créer et télécharger le fichier avec le bon type MIME
        const blob = new Blob([finalContent], {
            type: 'text/csv;charset=utf-8;'
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);

        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const fileNames = {
            'all': `rapport-credits-complet-${timestamp}.csv`,
            'debtors': `rapport-debiteurs-${timestamp}.csv`,
            'summary': `resume-executif-credits-${timestamp}.csv`
        };

        link.setAttribute('download', fileNames[exportType] || `rapport-credits-${timestamp}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        const clientCount = exportType === 'debtors' ?
            data.clients.filter(c => c.isDebtor).length :
            data.clients.length;

        const successMessages = {
            'all': `Rapport complet exporté (${clientCount} clients)`,
            'debtors': `Rapport débiteurs exporté (${clientCount} débiteurs)`,
            'summary': 'Résumé exécutif exporté avec succès'
        };

        showNotification(successMessages[exportType] || 'Rapport exporté avec succès', 'success');
    }

    // Fonction alternative pour export Excel natif (HTML table)
    async function generateExcelNativeReport(data, exportType = 'all') {
        // Créer un contenu HTML qui sera interprété comme Excel
        let htmlContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8">
                <meta name="ProgId" content="Excel.Sheet">
                <meta name="Generator" content="Microsoft Excel 15">
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>Rapport Crédits</x:Name>
                                <x:WorksheetSource HRef="sheet.htm"/>
                            </x:ExcelWorksheet>
                        </x:ExcelWorksheets>
                    </x:ExcelWorkbook>
                </xml>
                <![endif]-->
                <style>
                    .header { background-color: #4472C4; color: white; font-weight: bold; }
                    .summary { background-color: #E7E6E6; }
                    .risk-critical { background-color: #FF6B6B; color: white; }
                    .risk-high { background-color: #FFB347; }
                    .risk-medium { background-color: #FFE135; }
                    .risk-low { background-color: #90EE90; }
                    .number { text-align: right; }
                </style>
            </head>
            <body>
        `;

        const reportTitles = {
            'all': 'RAPPORT COMPLET DE GESTION DES CRÉDITS',
            'debtors': 'RAPPORT DES CLIENTS DÉBITEURS',
            'summary': 'RÉSUMÉ EXÉCUTIF - GESTION DES CRÉDITS'
        };

        htmlContent += `<h1>${reportTitles[exportType]}</h1>`;
        htmlContent += `<p>Date d'export: ${data.summary.exportDate} à ${data.summary.exportTime}</p>`;

        // Résumé exécutif
        htmlContent += `
            <h2>RÉSUMÉ EXÉCUTIF</h2>
            <table border="1" cellpadding="5" cellspacing="0">
                <tr class="header">
                    <th>Métrique</th>
                    <th>Valeur</th>
                </tr>
                <tr class="summary">
                    <td>Total clients</td>
                    <td class="number">${data.summary.totalClients}</td>
                </tr>
                <tr class="summary">
                    <td>Clients débiteurs</td>
                    <td class="number">${data.summary.debtorClients}</td>
                </tr>
                <tr class="summary">
                    <td>Montant total des crédits</td>
                    <td class="number">${data.summary.totalCreditAmount.toFixed(2)} MAD</td>
                </tr>
                <tr class="summary">
                    <td>Montant moyen par débiteur</td>
                    <td class="number">${data.summary.averageCreditAmount.toFixed(2)} MAD</td>
                </tr>
                <tr class="summary">
                    <td>Taux de clients débiteurs</td>
                    <td class="number">${((data.summary.debtorClients / data.summary.totalClients) * 100).toFixed(1)}%</td>
                </tr>
            </table>
        `;

        if (exportType !== 'summary') {
            // Détail des clients
            const clientsToExport = exportType === 'debtors' ?
                data.clients.filter(c => c.isDebtor) :
                data.clients;

            htmlContent += `
                <h2>DÉTAIL DES ${exportType === 'debtors' ? 'CLIENTS DÉBITEURS' : 'CLIENTS'}</h2>
                <table border="1" cellpadding="5" cellspacing="0">
                    <tr class="header">
                        <th>ID</th>
                        <th>Nom</th>
                        <th>Téléphone</th>
                        <th>Adresse</th>
                        <th>Solde Crédit (MAD)</th>
                        <th>Statut</th>
                        <th>Niveau de Risque</th>
                        <th>Jours depuis dernière transaction</th>
                        <th>Score de fiabilité</th>
                    </tr>
            `;

            clientsToExport.forEach(client => {
                const riskText = {
                    'low': 'Faible',
                    'medium': 'Moyen',
                    'high': 'Élevé',
                    'critical': 'Critique'
                }[client.riskLevel] || 'Inconnu';

                const riskClass = `risk-${client.riskLevel}`;

                htmlContent += `
                    <tr>
                        <td>${client.id}</td>
                        <td>${client.name}</td>
                        <td>${client.phone}</td>
                        <td>${client.address}</td>
                        <td class="number">${client.creditBalance.toFixed(2)}</td>
                        <td>${client.status}</td>
                        <td class="${riskClass}">${riskText}</td>
                        <td class="number">${client.daysSinceLastTransaction}</td>
                        <td class="number">${client.reliabilityScore}</td>
                    </tr>
                `;
            });

            htmlContent += '</table>';
        }

        htmlContent += '</body></html>';

        // Créer et télécharger le fichier Excel
        const blob = new Blob([htmlContent], {
            type: 'application/vnd.ms-excel;charset=utf-8;'
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);

        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const fileNames = {
            'all': `rapport-credits-complet-${timestamp}.xls`,
            'debtors': `rapport-debiteurs-${timestamp}.xls`,
            'summary': `resume-executif-credits-${timestamp}.xls`
        };

        link.setAttribute('download', fileNames[exportType] || `rapport-credits-${timestamp}.xls`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        const clientCount = exportType === 'debtors' ?
            data.clients.filter(c => c.isDebtor).length :
            data.clients.length;

        const successMessages = {
            'all': `Rapport Excel complet exporté (${clientCount} clients)`,
            'debtors': `Rapport Excel débiteurs exporté (${clientCount} débiteurs)`,
            'summary': 'Résumé exécutif Excel exporté avec succès'
        };

        showNotification(successMessages[exportType] || 'Rapport Excel exporté avec succès', 'success');
    }

    // --- Event Listeners ---

    // Recherche principale
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
    }

    // Filtres de statut
    if (filterAll) filterAll.addEventListener('click', () => setActiveFilter('all'));
    if (filterDebtors) filterDebtors.addEventListener('click', () => setActiveFilter('debtors'));
    if (filterCurrent) filterCurrent.addEventListener('click', () => setActiveFilter('current'));
    if (filterOverdue) filterOverdue.addEventListener('click', () => setActiveFilter('overdue'));

    // Filtres avancés
    if (amountFilter) amountFilter.addEventListener('change', applyCurrentFilter);
    if (ageFilter) ageFilter.addEventListener('change', applyCurrentFilter);

    // Boutons principaux
    if (manualCreditBtn) manualCreditBtn.addEventListener('click', openManualCreditModal);
    if (quickPaymentBtn) quickPaymentBtn.addEventListener('click', openQuickPaymentModal);

    // Menu d'export
    const exportMenu = document.getElementById('exportMenu');
    const exportAllBtn = document.getElementById('exportAllBtn');
    const exportDebtorsBtn = document.getElementById('exportDebtorsBtn');
    const exportSummaryBtn = document.getElementById('exportSummaryBtn');
    const exportAllExcelBtn = document.getElementById('exportAllExcelBtn');
    const exportDebtorsExcelBtn = document.getElementById('exportDebtorsExcelBtn');

    if (exportBtn) {
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportMenu.classList.toggle('hidden');
        });
    }

    // Fermer le menu en cliquant ailleurs
    document.addEventListener('click', () => {
        if (exportMenu && !exportMenu.classList.contains('hidden')) {
            exportMenu.classList.add('hidden');
        }
    });

    // Options d'export
    if (exportAllBtn) {
        exportAllBtn.addEventListener('click', () => {
            exportMenu.classList.add('hidden');
            exportCreditsData('all');
        });
    }

    if (exportDebtorsBtn) {
        exportDebtorsBtn.addEventListener('click', () => {
            exportMenu.classList.add('hidden');
            exportCreditsData('debtors');
        });
    }

    if (exportSummaryBtn) {
        exportSummaryBtn.addEventListener('click', () => {
            exportMenu.classList.add('hidden');
            exportCreditsData('summary');
        });
    }

    // Options d'export Excel natif
    if (exportAllExcelBtn) {
        exportAllExcelBtn.addEventListener('click', async () => {
            exportMenu.classList.add('hidden');
            try {
                showNotification('Préparation de l\'export Excel complet...', 'info');

                const [clients, debtors] = await Promise.all([
                    window.api.clients.getAll(),
                    window.api.credits.getDebtors()
                ]);

                const enrichedClients = clients.map(client => {
                    const debtorInfo = debtors.find(d => d.id === client.id);
                    const creditBalance = debtorInfo ? debtorInfo.credit_balance : 0;
                    const daysSince = calculateDaysSinceLastTransaction(client);
                    const riskLevel = getRiskLevel(creditBalance);

                    return {
                        id: client.id,
                        name: client.name,
                        phone: client.phone || 'Non renseigné',
                        address: client.address || 'Non renseignée',
                        creditBalance: creditBalance,
                        isDebtor: creditBalance > 0,
                        riskLevel: riskLevel,
                        daysSinceLastTransaction: daysSince,
                        reliabilityScore: Math.floor(Math.random() * 5) + 1,
                        status: creditBalance > 0 ? 'Débiteur' : 'À jour'
                    };
                });

                const exportData = {
                    summary: {
                        totalClients: clients.length,
                        debtorClients: debtors.length,
                        totalCreditAmount: debtors.reduce((sum, d) => sum + d.credit_balance, 0),
                        averageCreditAmount: debtors.length > 0 ? debtors.reduce((sum, d) => sum + d.credit_balance, 0) / debtors.length : 0,
                        exportDate: new Date().toLocaleDateString('fr-FR'),
                        exportTime: new Date().toLocaleTimeString('fr-FR')
                    },
                    clients: enrichedClients
                };

                await generateExcelNativeReport(exportData, 'all');

            } catch (error) {
                console.error('Erreur lors de l\'export Excel:', error);
                showNotification('Erreur lors de l\'export Excel', 'error');
            }
        });
    }

    if (exportDebtorsExcelBtn) {
        exportDebtorsExcelBtn.addEventListener('click', async () => {
            exportMenu.classList.add('hidden');
            try {
                showNotification('Préparation de l\'export Excel débiteurs...', 'info');

                const [clients, debtors] = await Promise.all([
                    window.api.clients.getAll(),
                    window.api.credits.getDebtors()
                ]);

                const enrichedClients = clients.map(client => {
                    const debtorInfo = debtors.find(d => d.id === client.id);
                    const creditBalance = debtorInfo ? debtorInfo.credit_balance : 0;
                    const daysSince = calculateDaysSinceLastTransaction(client);
                    const riskLevel = getRiskLevel(creditBalance);

                    return {
                        id: client.id,
                        name: client.name,
                        phone: client.phone || 'Non renseigné',
                        address: client.address || 'Non renseignée',
                        creditBalance: creditBalance,
                        isDebtor: creditBalance > 0,
                        riskLevel: riskLevel,
                        daysSinceLastTransaction: daysSince,
                        reliabilityScore: Math.floor(Math.random() * 5) + 1,
                        status: creditBalance > 0 ? 'Débiteur' : 'À jour'
                    };
                });

                const exportData = {
                    summary: {
                        totalClients: clients.length,
                        debtorClients: debtors.length,
                        totalCreditAmount: debtors.reduce((sum, d) => sum + d.credit_balance, 0),
                        averageCreditAmount: debtors.length > 0 ? debtors.reduce((sum, d) => sum + d.credit_balance, 0) / debtors.length : 0,
                        exportDate: new Date().toLocaleDateString('fr-FR'),
                        exportTime: new Date().toLocaleTimeString('fr-FR')
                    },
                    clients: enrichedClients
                };

                await generateExcelNativeReport(exportData, 'debtors');

            } catch (error) {
                console.error('Erreur lors de l\'export Excel:', error);
                showNotification('Erreur lors de l\'export Excel', 'error');
            }
        });
    }

    // Event listeners pour les boutons du tableau
    tableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('payment-btn')) {
            openPaymentModal(e.target.dataset);
        } else if (e.target.classList.contains('credit-btn')) {
            const clientId = e.target.dataset.clientId;
            const clientName = e.target.dataset.clientName;
            // Ouvrir le modal de crédit avec ce client pré-sélectionné
            openManualCreditModal();
            selectedClientNameSpan.textContent = clientName;
            selectedClientDetails.textContent = `Client ID: ${clientId}`;
            selectedClientInitial.textContent = clientName.charAt(0).toUpperCase();
            selectedClientInfo.classList.remove('hidden');
            manualCreditClientIdInput.value = clientId;
        } else if (e.target.classList.contains('history-btn')) {
            const clientId = e.target.dataset.clientId;
            const clientName = e.target.dataset.clientName;
            openHistoryModal(clientId, clientName);
        }
    });

    // Modal de paiement
    if (closePaymentModalBtn) closePaymentModalBtn.addEventListener('click', closePaymentModal);
    if (closePaymentModalBtn2) closePaymentModalBtn2.addEventListener('click', closePaymentModal);

    // Boutons de montant rapide
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-amount-btn')) {
            const amount = e.target.dataset.amount;
            amountInput.value = amount;
        }
    });

    if (fullAmountBtn) {
        fullAmountBtn.addEventListener('click', () => {
            const maxAmount = amountInput.max;
            amountInput.value = maxAmount;
        });
    }

    // Soumission du formulaire de paiement
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const paymentData = {
                clientId: parseInt(paymentClientIdInput.value),
                amount: parseFloat(amountInput.value),
                note: paymentNoteInput.value || ''
            };

            if (!paymentData.clientId || !paymentData.amount || paymentData.amount <= 0) {
                showNotification('Montant invalide', 'warning');
                return;
            }

            try {
                await window.api.credits.recordPayment(paymentData);
                showNotification('Paiement enregistré avec succès', 'success');
                closePaymentModal();
                loadAllClients();
            } catch(error) {
                showNotification(`Erreur lors de l'enregistrement: ${error.message}`, 'error');
            }
        });
    }

    // Modal de crédit manuel
    if (closeManualCreditModalBtn) closeManualCreditModalBtn.addEventListener('click', closeManualCreditModal);
    if (closeManualCreditModalBtn2) closeManualCreditModalBtn2.addEventListener('click', closeManualCreditModal);

    // Recherche de client pour crédit manuel
    if (clientSearchInput) {
        clientSearchInput.addEventListener('input', async (e) => {
            const searchTerm = e.target.value;
            if (searchTerm.length < 2) {
                clientSearchResultsDiv.classList.add('hidden');
                return;
            }

            try {
                const clients = await window.api.clients.getAll(searchTerm);
                clientSearchResultsDiv.innerHTML = '';
                if (clients.length > 0) {
                    clients.forEach(c => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'search-result-item p-2 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer';
                        itemDiv.innerHTML = `
                            <div class="font-medium">${c.name}</div>
                            <div class="text-sm text-gray-500">${c.phone || 'Pas de téléphone'}</div>
                        `;
                        itemDiv.dataset.id = c.id;
                        itemDiv.dataset.name = c.name;
                        itemDiv.dataset.phone = c.phone || '';
                        clientSearchResultsDiv.appendChild(itemDiv);
                    });
                    clientSearchResultsDiv.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Erreur lors de la recherche:', error);
            }
        });
    }

    if (clientSearchResultsDiv) {
        clientSearchResultsDiv.addEventListener('click', (e) => {
            const item = e.target.closest('.search-result-item');
            if (item) {
                manualCreditClientIdInput.value = item.dataset.id;
                selectedClientNameSpan.textContent = item.dataset.name;
                selectedClientDetails.textContent = item.dataset.phone || 'Pas de téléphone';
                selectedClientInitial.textContent = item.dataset.name.charAt(0).toUpperCase();
                selectedClientInfo.classList.remove('hidden');
                clientSearchInput.value = '';
                clientSearchResultsDiv.classList.add('hidden');
            }
        });
    }

    // Soumission du formulaire de crédit manuel
    if (manualCreditForm) {
        manualCreditForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const clientId = parseInt(manualCreditClientIdInput.value);
            const amount = parseFloat(manualAmountInput.value);
            const note = manualNoteInput.value;
            const creditType = document.querySelector('input[name="creditType"]:checked').value;

            if (!clientId || !amount || amount <= 0 || !note) {
                showNotification('Veuillez remplir tous les champs', 'warning');
                return;
            }

            try {
                const finalAmount = creditType === 'subtract' ? -amount : amount;
                await window.api.credits.addManual({
                    clientId: clientId,
                    amount: finalAmount,
                    note: note
                });

                showNotification(`Crédit ${creditType === 'add' ? 'ajouté' : 'retiré'} avec succès`, 'success');
                closeManualCreditModal();
                loadAllClients();
            } catch(error) {
                showNotification(`Erreur: ${error.message}`, 'error');
            }
        });
    }

    // Modal d'historique
    if (closeHistoryModalBtn) closeHistoryModalBtn.addEventListener('click', closeHistoryModal);

    // Event listener pour les clics sur les lignes d'historique
    if (historyTableBody) {
        historyTableBody.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (row && row.classList.contains('transaction-row-clickable')) {
                try {
                    if (row.dataset.saleDetails) {
                        // Afficher les détails de vente
                        const saleDetails = JSON.parse(row.dataset.saleDetails);
                        showSaleDetails(saleDetails);
                    } else if (row.dataset.paymentDetails) {
                        // Afficher les détails de paiement
                        const paymentDetails = JSON.parse(row.dataset.paymentDetails);
                        showPaymentDetails(paymentDetails);
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'affichage des détails:', error);
                    showNotification('Erreur lors de l\'affichage des détails', 'error');
                }
            }
        });
    }

    // Modal d'encaissement rapide
    if (closeQuickPaymentModalBtn) closeQuickPaymentModalBtn.addEventListener('click', closeQuickPaymentModal);
    if (closeQuickPaymentModalBtn2) closeQuickPaymentModalBtn2.addEventListener('click', closeQuickPaymentModal);

    // Recherche pour encaissement rapide
    if (quickPayClientSearch) {
        quickPayClientSearch.addEventListener('input', async (e) => {
            const searchTerm = e.target.value;
            if (searchTerm.length < 2) {
                quickPayClientResults.classList.add('hidden');
                return;
            }

            try {
                const debtors = await window.api.credits.getDebtors();
                const filtered = debtors.filter(c =>
                    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (c.phone && c.phone.includes(searchTerm))
                );

                quickPayClientResults.innerHTML = '';
                if (filtered.length > 0) {
                    filtered.forEach(c => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'search-result-item p-2 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer';
                        itemDiv.innerHTML = `
                            <div class="font-medium">${c.name}</div>
                            <div class="text-sm text-gray-500">Dette: ${c.credit_balance.toFixed(2)} MAD</div>
                        `;
                        itemDiv.dataset.id = c.id;
                        itemDiv.dataset.name = c.name;
                        itemDiv.dataset.debt = c.credit_balance;
                        quickPayClientResults.appendChild(itemDiv);
                    });
                    quickPayClientResults.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Erreur lors de la recherche:', error);
            }
        });
    }

    if (quickPayClientResults) {
        quickPayClientResults.addEventListener('click', (e) => {
            const item = e.target.closest('.search-result-item');
            if (item) {
                selectedQuickClient = {
                    id: item.dataset.id,
                    name: item.dataset.name,
                    debt: parseFloat(item.dataset.debt)
                };

                quickSelectedClientInfo.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                            ${selectedQuickClient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-800 dark:text-white">${selectedQuickClient.name}</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Dette: ${selectedQuickClient.debt.toFixed(2)} MAD</p>
                        </div>
                    </div>
                `;
                quickSelectedClientInfo.classList.remove('hidden');
                quickPayClientId.value = selectedQuickClient.id;
                quickPayAmount.max = selectedQuickClient.debt;
                quickPayClientSearch.value = '';
                quickPayClientResults.classList.add('hidden');
            }
        });
    }

    // Soumission de l'encaissement rapide
    if (quickPaymentForm) {
        quickPaymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!selectedQuickClient) {
                showNotification('Veuillez sélectionner un client', 'warning');
                return;
            }

            const amount = parseFloat(quickPayAmount.value);
            if (!amount || amount <= 0) {
                showNotification('Montant invalide', 'warning');
                return;
            }

            try {
                await window.api.credits.recordPayment({
                    clientId: parseInt(selectedQuickClient.id),
                    amount: amount,
                    note: 'Encaissement rapide'
                });

                showNotification('Paiement enregistré avec succès', 'success');
                closeQuickPaymentModal();
                loadAllClients();
            } catch(error) {
                showNotification(`Erreur: ${error.message}`, 'error');
            }
        });
    }

    // Encaissement rapide depuis la barre d'outils
    if (quickPayBtn) {
        quickPayBtn.addEventListener('click', async () => {
            const clientName = quickClientSearch.value.trim();
            const amount = parseFloat(quickAmount.value);

            if (!clientName || !amount || amount <= 0) {
                showNotification('Veuillez remplir le client et le montant', 'warning');
                return;
            }

            // Rechercher le client
            try {
                const debtors = await window.api.credits.getDebtors();
                const client = debtors.find(c =>
                    c.name.toLowerCase().includes(clientName.toLowerCase())
                );

                if (!client) {
                    showNotification('Client non trouvé', 'warning');
                    return;
                }

                await window.api.credits.recordPayment({
                    clientId: client.id,
                    amount: amount,
                    note: 'Encaissement rapide'
                });

                showNotification('Paiement enregistré avec succès', 'success');
                quickClientSearch.value = '';
                quickAmount.value = '';
                loadAllClients();
            } catch(error) {
                showNotification(`Erreur: ${error.message}`, 'error');
            }
        });
    }

    // --- Initialisation ---
    async function initPage() {
        if(typeof initializePage === 'function') {
            await initializePage('credits');
        }

        const user = await window.api.session.getCurrentUser();
        if (!user || user.role !== 'Propriétaire') {
            document.body.innerHTML = `<div class="w-full h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><h1 class='text-red-500 text-2xl font-bold'>${t('owner_only_access')}</h1></div>`;
            return;
        }

        loadAllClients();
    }

    initPage();
});