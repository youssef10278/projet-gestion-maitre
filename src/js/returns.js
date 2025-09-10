
/**
 * Gestion des retours - Page principale
 * Version simplifiée sans historique ni statistiques
 */

// Variables globales
let currentSale = null;
let returnItems = [];
let currentStep = 1;

/**
 * Initialisation de la page retours
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Initialisation de la page retours...');

    try {
        // Attendre un peu pour s'assurer que tous les scripts sont chargés
        await new Promise(resolve => setTimeout(resolve, 100));

        // Initialiser le menu de navigation (identique au dashboard)
        if (typeof window.initializePage === 'function') {
            await window.initializePage('returns');
            console.log('✅ Menu de navigation initialisé via initializePage');
        } else if (typeof window.buildNavigation === 'function') {
            await window.buildNavigation('returns');
            console.log('✅ Menu de navigation construit via buildNavigation');
        } else {
            console.warn('⚠️ Fonctions de menu non disponibles, tentative de fallback...');
            // Fallback : attendre que layout.js soit chargé
            setTimeout(async () => {
                if (typeof window.buildNavigation === 'function') {
                    await window.buildNavigation('returns');
                    console.log('✅ Menu de navigation construit (fallback)');
                } else {
                    console.error('❌ Impossible de construire le menu de navigation');
                }
            }, 1000);
        }

        // Vérifier que le menu hamburger est initialisé
        setTimeout(() => {
            if (window.hamburgerMenu) {
                console.log('✅ Menu hamburger disponible');
            } else {
                console.warn('⚠️ Menu hamburger non disponible');
            }
        }, 500);

        // Initialiser les événements
        initializeEvents();

        // Charger les traductions
        if (typeof loadTranslations === 'function') {
            loadTranslations();
        }

        console.log('✅ Page retours initialisée');

        // Test de diagnostic pour le bouton "Traiter le Retour"
        setTimeout(() => {
            testProcessReturnButton();
        }, 1000);

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la page retours:', error);

        // Fallback d'urgence pour le menu
        setTimeout(async () => {
            try {
                if (typeof window.buildNavigation === 'function') {
                    await window.buildNavigation('returns');
                    console.log('✅ Menu de navigation construit (fallback d\'urgence)');
                }
            } catch (fallbackError) {
                console.error('❌ Échec du fallback menu:', fallbackError);
            }
        }, 1000);
    }
});

/**
 * Initialise tous les événements de la page
 */
function initializeEvents() {
    // Boutons de recherche de ticket
    addEventListenerSafe('searchBtn', 'click', searchTicket);
    addEventListenerSafe('clearSearchBtn', 'click', clearSearch);

    // Bouton retour principal supprimé (navigation via menu latéral)

    // Navigation entre les étapes - Boutons "Suivant"
    addEventListenerSafe('proceedToConfigBtn', 'click', () => showStep(3));
    addEventListenerSafe('proceedToSummaryBtn', 'click', () => showStep(4));

    // Navigation entre les étapes - Boutons "Retour"
    addEventListenerSafe('backToSearchBtn', 'click', () => showStep(1));
    addEventListenerSafe('backToDetailsBtn', 'click', () => showStep(2));
    addEventListenerSafe('backToConfigBtn', 'click', () => showStep(3));

    // Boutons d'action
    addEventListenerSafe('processReturnBtn', 'click', processReturn);
    addEventListenerSafe('cancelReturnBtn', 'click', () => showStep(1));
    addEventListenerSafe('newReturnBtn', 'click', resetReturn);
    addEventListenerSafe('printReturnTicketBtn', 'click', printReturnTicket);

    // Input de recherche avec Enter
    const searchInput = document.getElementById('searchTicket');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchTicket();
            }
        });
    }
}

/**
 * Fonction utilitaire pour ajouter des événements de manière sécurisée
 */
function addEventListenerSafe(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener(event, handler);
        console.log(`✅ Événement ${event} ajouté à ${elementId}`);
    } else {
        console.warn(`⚠️ Élément ${elementId} non trouvé`);
    }
}

/**
 * Fonction goBack supprimée - Navigation via menu latéral
 */

/**
 * Recherche des ventes avec critères multiples
 */
async function searchTicket() {
    try {
        console.log('🔍 Lancement de la recherche multi-critères');
        showLoading('searchBtn', true);

        // Récupérer tous les critères de recherche
        const searchCriteria = getSearchCriteria();
        console.log('📋 Critères de recherche:', searchCriteria);

        // Effectuer la recherche avec l'API
        const searchResults = await window.api.returns.searchSales(searchCriteria);

        if (searchResults && searchResults.length > 0) {
            console.log(`✅ ${searchResults.length} résultat(s) trouvé(s)`);

            if (searchResults.length === 1) {
                // Un seul résultat : afficher directement les détails
                await displaySingleResult(searchResults[0]);
            } else {
                // Plusieurs résultats : afficher la liste pour sélection
                displaySearchResults(searchResults);
            }
        } else {
            console.log('⚠️ Aucun résultat trouvé');
            showNotification('Aucune vente trouvée avec ces critères', 'warning');
            hideSearchResults();
        }

    } catch (error) {
        console.error('❌ Erreur lors de la recherche:', error);
        showNotification('Erreur lors de la recherche: ' + error.message, 'error');
        hideSearchResults();
    } finally {
        showLoading('searchBtn', false);
    }
}

/**
 * Récupère les critères de recherche depuis les champs
 */
function getSearchCriteria() {
    const criteria = {};

    // Numéro de ticket
    const ticketNumber = document.getElementById('searchTicket')?.value.trim();
    if (ticketNumber) {
        criteria.ticketNumber = ticketNumber;
    }

    // Nom du client
    const clientName = document.getElementById('searchClient')?.value.trim();
    if (clientName) {
        criteria.clientName = clientName;
    }

    // Date de début
    const dateFrom = document.getElementById('searchDateFrom')?.value;
    if (dateFrom) {
        criteria.dateFrom = dateFrom;
    }

    // Date de fin
    const dateTo = document.getElementById('searchDateTo')?.value;
    if (dateTo) {
        criteria.dateTo = dateTo;
    }

    console.log('🔍 Critères extraits:', criteria);
    return criteria;
}

/**
 * Affiche un résultat unique directement
 */
async function displaySingleResult(sale) {
    try {
        console.log('📄 Affichage du résultat unique:', sale.ticket_number);

        // Récupérer les détails complets de la vente
        const saleDetails = await window.api.returns.getSaleDetails(sale.id);

        if (saleDetails) {
            currentSale = saleDetails;
            displaySaleDetails(saleDetails);
            showStep(2);
            showNotification('Vente trouvée avec succès', 'success');
        } else {
            showNotification('Impossible de récupérer les détails de la vente', 'error');
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'affichage du résultat:', error);
        showNotification('Erreur lors de l\'affichage des détails', 'error');
    }
}

/**
 * Affiche les résultats de recherche multiples
 */
function displaySearchResults(results) {
    console.log('📋 Affichage de la liste des résultats');

    const searchResultsContainer = document.getElementById('searchResults');
    if (!searchResultsContainer) {
        console.error('❌ Container searchResults non trouvé');
        return;
    }

    // Afficher le container
    searchResultsContainer.classList.remove('hidden');

    // Créer le tableau des résultats
    const tableHTML = createResultsTable(results);
    searchResultsContainer.innerHTML = `
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            ${results.length} vente(s) trouvée(s)
        </h3>
        ${tableHTML}
    `;

    // Ajouter les événements de clic sur les lignes
    addResultClickEvents();
}

/**
 * Crée le tableau HTML des résultats
 */
function createResultsTable(results) {
    const rows = results.map(sale => {
        const date = new Date(sale.sale_date).toLocaleDateString('fr-FR');
        const clientName = sale.client_name || 'Client Passager';
        const total = (sale.total_amount || 0).toFixed(2);

        return `
            <tr class="search-result-row cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                data-sale-id="${sale.id}" data-ticket="${sale.ticket_number}">
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">${sale.ticket_number}</td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">${date}</td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">${clientName}</td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">${total} MAD</td>
                <td class="px-4 py-3 text-sm">
                    <button class="btn btn-primary btn-sm select-sale-btn" data-sale-id="${sale.id}">
                        Sélectionner
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            N° Ticket
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Date
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Client
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Total
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Action
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Ajoute les événements de clic sur les résultats
 */
function addResultClickEvents() {
    const selectButtons = document.querySelectorAll('.select-sale-btn');
    selectButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const saleId = button.getAttribute('data-sale-id');
            await selectSaleForReturn(saleId);
        });
    });

    // Permettre aussi le clic sur la ligne entière
    const rows = document.querySelectorAll('.search-result-row');
    rows.forEach(row => {
        row.addEventListener('click', async () => {
            const saleId = row.getAttribute('data-sale-id');
            await selectSaleForReturn(saleId);
        });
    });
}

/**
 * Sélectionne une vente pour le retour
 */
async function selectSaleForReturn(saleId) {
    try {
        console.log('🎯 Sélection de la vente ID:', saleId);
        showLoading('searchBtn', true);

        const saleDetails = await window.api.returns.getSaleDetails(saleId);

        if (saleDetails) {
            currentSale = saleDetails;
            displaySaleDetails(saleDetails);
            hideSearchResults();
            showStep(2);
            showNotification('Vente sélectionnée avec succès', 'success');
        } else {
            showNotification('Impossible de récupérer les détails de la vente', 'error');
        }
    } catch (error) {
        console.error('❌ Erreur lors de la sélection:', error);
        showNotification('Erreur lors de la sélection: ' + error.message, 'error');
    } finally {
        showLoading('searchBtn', false);
    }
}

/**
 * Masque les résultats de recherche
 */
function hideSearchResults() {
    const searchResultsContainer = document.getElementById('searchResults');
    if (searchResultsContainer) {
        searchResultsContainer.classList.add('hidden');
        searchResultsContainer.innerHTML = '';
    }
}

/**
 * Efface les champs de recherche et remet à zéro
 */
function clearSearch() {
    console.log('🧹 Effacement de la recherche');

    try {
        // Vider les champs de recherche
        const searchInputs = [
            'searchTicket',
            'searchClient',
            'searchDateFrom',
            'searchDateTo'
        ];

        searchInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.value = '';
                console.log(`✅ Champ ${inputId} vidé`);
            }
        });

        // Masquer les résultats de recherche
        hideSearchResults();
        console.log('✅ Résultats de recherche masqués');

        // Remettre à zéro les variables globales
        currentSale = null;
        returnItems = [];
        currentStep = 1;

        // Retourner à la première étape
        showStep(1);

        // Notification de succès
        showNotification('Recherche effacée', 'success');
        console.log('✅ Recherche effacée avec succès');

    } catch (error) {
        console.error('❌ Erreur lors de l\'effacement:', error);
        showNotification('Erreur lors de l\'effacement', 'error');
    }
}

/**
 * Affiche les détails de la vente
 */
function displaySaleDetails(sale) {
    console.log('📄 Affichage des détails de la vente:', sale);

    try {
        // Afficher les informations de base
        const ticketElement = document.getElementById('saleTicketNumber');
        if (ticketElement) {
            ticketElement.textContent = sale.ticket_number || 'N/A';
        }

        const dateElement = document.getElementById('saleDate');
        if (dateElement) {
            dateElement.textContent = new Date(sale.sale_date).toLocaleString('fr-FR');
        }

        const totalElement = document.getElementById('saleTotal');
        if (totalElement) {
            totalElement.textContent = (sale.total_amount || 0).toFixed(2) + ' MAD';
        }

        const clientElement = document.getElementById('saleClient');
        if (clientElement) {
            clientElement.textContent = sale.client_name || sale.customer_name || 'Client Passager';
        }

        // Debug: Afficher la structure des items
        if (sale.items && sale.items.length > 0) {
            console.log('🔍 Structure des items de vente:');
            sale.items.forEach((item, index) => {
                console.log(`  Item ${index + 1}:`, {
                    id: item.id,
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    unit: item.unit
                });
            });
        }

        // Afficher les articles si disponibles
        if (sale.items && sale.items.length > 0) {
            console.log(`📦 ${sale.items.length} article(s) trouvé(s)`);
            displaySaleItems(sale.items);
        } else {
            console.log('⚠️ Aucun article trouvé pour cette vente');
            showNotification('Aucun article trouvé pour cette vente', 'warning');
        }

        // Activer le bouton "Configurer le Retour" si des articles sont disponibles
        const proceedBtn = document.getElementById('proceedToConfigBtn');
        if (proceedBtn) {
            if (sale.items && sale.items.length > 0) {
                proceedBtn.disabled = false;
                proceedBtn.classList.remove('disabled');
                console.log('✅ Bouton "Configurer le Retour" activé');
            } else {
                proceedBtn.disabled = true;
                proceedBtn.classList.add('disabled');
                console.log('⚠️ Bouton "Configurer le Retour" désactivé (aucun article)');
            }
        }

        console.log('✅ Détails de la vente affichés avec succès');

    } catch (error) {
        console.error('❌ Erreur lors de l\'affichage des détails:', error);
        showNotification('Erreur lors de l\'affichage des détails', 'error');

        // Désactiver le bouton en cas d'erreur
        const proceedBtn = document.getElementById('proceedToConfigBtn');
        if (proceedBtn) {
            proceedBtn.disabled = true;
            proceedBtn.classList.add('disabled');
        }
    }
}

/**
 * Affiche la liste des articles de la vente
 */
function displaySaleItems(items) {
    // Pour l'instant, on va créer une liste simple
    // Plus tard, on pourra améliorer l'affichage
    console.log('📦 Articles de la vente:');
    items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.product_name} - Qté: ${item.quantity} - Prix: ${item.unit_price} MAD`);
    });

    // Stocker les articles pour la sélection de retour
    window.currentSaleItems = items;
}

/**
 * Crée un élément pour un article de vente
 */
function createSaleItemElement(item) {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg';

    div.innerHTML = `
        <div class="flex-1">
            <h4 class="font-medium text-gray-900 dark:text-white">${item.product_name}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                Quantité: ${item.quantity} × ${item.unit_price.toFixed(2)} MAD
            </p>
        </div>
        <div class="text-right">
            <p class="font-semibold text-gray-900 dark:text-white">
                ${(item.quantity * item.unit_price).toFixed(2)} MAD
            </p>
        </div>
        <div class="ml-4">
            <input type="checkbox" class="return-item-checkbox" data-item-id="${item.id}"
                   onchange="toggleReturnItem(${item.id}, this.checked)">
        </div>
    `;

    return div;
}

/**
 * Gère la sélection/désélection d'un article pour retour
 */
function toggleReturnItem(itemId, selected) {
    if (selected) {
        const item = currentSale.items.find(i => i.id === itemId);
        if (item && !returnItems.find(r => r.id === itemId)) {
            returnItems.push({...item, return_quantity: item.quantity});
        }
    } else {
        returnItems = returnItems.filter(item => item.id !== itemId);
    }

    updateReturnSummary();
}

/**
 * Met à jour le résumé du retour
 */
function updateReturnSummary() {
    const totalAmount = returnItems.reduce((sum, item) =>
        sum + (item.return_quantity * item.unit_price), 0);

    document.getElementById('returnTotalAmount').textContent = totalAmount.toFixed(2) + ' MAD';
    document.getElementById('returnItemsCount').textContent = returnItems.length;
}

/**
 * Affiche une étape spécifique
 */
function showStep(step) {
    // Masquer toutes les sections
    const sections = ['searchSection', 'saleDetailsSection', 'returnConfigSection', 'returnSummarySection'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('hidden');
        }
    });

    // Afficher la section demandée
    const targetSection = sections[step - 1];
    const section = document.getElementById(targetSection);
    if (section) {
        section.classList.remove('hidden');
        currentStep = step;
        console.log(`📄 Affichage de l'étape ${step}: ${targetSection}`);

        // Initialiser la section spécifique si nécessaire
        if (step === 3 && targetSection === 'returnConfigSection') {
            initializeReturnConfigSection();
        } else if (step === 4 && targetSection === 'returnSummarySection') {
            initializeReturnSummarySection();
        }
    }
}

/**
 * Initialise la section de configuration du retour
 */
function initializeReturnConfigSection() {
    console.log('🔧 Initialisation de la section de configuration du retour');

    try {
        // Vérifier qu'on a bien une vente sélectionnée
        if (!currentSale || !currentSale.items) {
            console.error('❌ Aucune vente sélectionnée pour la configuration');
            showNotification('Erreur: Aucune vente sélectionnée', 'error');
            showStep(1); // Retour à la recherche
            return;
        }

        // Vérifier les retours existants et afficher les produits disponibles
        checkExistingReturns(currentSale.id).then(() => {
            displayProductsForReturn(currentSale.items);
        }).catch(error => {
            console.error('❌ Erreur lors de la vérification des retours:', error);
            displayProductsForReturn(currentSale.items);
        });

        // Initialiser les valeurs par défaut
        initializeDefaultValues();

        console.log('✅ Section de configuration initialisée');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la configuration:', error);
        showNotification('Erreur lors de l\'initialisation de la configuration', 'error');
    }
}

/**
 * Vérifie les retours existants pour une vente
 */
async function checkExistingReturns(saleId) {
    console.log('🔍 Vérification des retours existants pour la vente:', saleId);

    try {
        // Appeler l'API pour récupérer les retours existants
        const existingReturns = await window.api.returns.getExistingReturns(saleId);

        if (existingReturns && existingReturns.length > 0) {
            console.log('⚠️ Retours existants trouvés:', existingReturns);

            // Mettre à jour les quantités disponibles pour retour
            updateAvailableQuantities(existingReturns);

            // Afficher un avertissement
            showNotification(`Cette vente a déjà ${existingReturns.length} retour(s). Vérifiez les quantités disponibles.`, 'warning');
        } else {
            console.log('✅ Aucun retour existant pour cette vente');
        }

    } catch (error) {
        console.error('❌ Erreur lors de la vérification des retours existants:', error);
        // Ne pas bloquer le processus, juste logger l'erreur
    }
}

/**
 * Met à jour les quantités disponibles pour retour
 */
function updateAvailableQuantities(existingReturns) {
    // Créer un map des quantités déjà retournées
    const returnedQuantities = {};

    existingReturns.forEach(returnItem => {
        const key = returnItem.original_sale_item_id;
        if (!returnedQuantities[key]) {
            returnedQuantities[key] = 0;
        }
        returnedQuantities[key] += returnItem.quantity_returned;
    });

    // Stocker pour utilisation lors de l'affichage
    window.returnedQuantities = returnedQuantities;

    console.log('📊 Quantités déjà retournées:', returnedQuantities);
}

/**
 * Affiche les produits disponibles pour le retour
 */
function displayProductsForReturn(items) {
    const container = document.getElementById('selectedProductsList');
    if (!container) {
        console.error('❌ Container selectedProductsList non trouvé');
        return;
    }

    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Aucun produit disponible pour le retour</p>';
        return;
    }

    items.forEach((item, index) => {
        // Calculer la quantité disponible pour retour
        const alreadyReturned = window.returnedQuantities ? (window.returnedQuantities[item.id] || 0) : 0;
        const availableForReturn = item.quantity - alreadyReturned;

        const productDiv = document.createElement('div');

        // Désactiver si plus rien à retourner
        if (availableForReturn <= 0) {
            productDiv.className = 'flex items-center justify-between p-4 bg-gray-200 dark:bg-gray-800 rounded-lg opacity-50';
        } else {
            productDiv.className = 'flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg';
        }

        productDiv.innerHTML = `
            <div class="flex items-center space-x-4 flex-1">
                <input type="checkbox"
                       id="returnItem_${index}"
                       value="${index}"
                       ${availableForReturn <= 0 ? 'disabled' : ''}
                       class="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <div class="flex-1">
                    <h5 class="font-medium text-gray-900 dark:text-white">${item.product_name || 'Produit inconnu'}</h5>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Quantité vendue: ${item.quantity || 0} |
                        Déjà retourné: ${alreadyReturned} |
                        Disponible: ${availableForReturn} |
                        Prix unitaire: ${(item.unit_price || 0).toFixed(2)} MAD
                    </p>
                    ${availableForReturn <= 0 ? '<p class="text-xs text-red-500">⚠️ Produit entièrement retourné</p>' : ''}
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <div class="text-center">
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Quantité à retourner</label>
                    <input type="number"
                           id="quantity_${index}"
                           min="1"
                           max="${availableForReturn}"
                           value="${Math.min(availableForReturn, 1)}"
                           ${availableForReturn <= 0 ? 'disabled' : ''}
                           class="w-20 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                </div>
                <div class="text-right">
                    <p class="font-medium text-gray-900 dark:text-white">
                        ${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)} MAD
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        (Prix original)
                    </p>
                </div>
            </div>
        `;

        container.appendChild(productDiv);

        // Ajouter des event listeners pour la gestion des quantités et sélections
        const checkbox = productDiv.querySelector(`#returnItem_${index}`);
        const quantityInput = productDiv.querySelector(`#quantity_${index}`);

        if (checkbox) {
            checkbox.addEventListener('change', updateSummaryButtonState);
        }

        if (quantityInput) {
            quantityInput.addEventListener('input', updateSummaryButtonState);
        }
    });

    console.log(`📦 ${items.length} produit(s) affiché(s) pour le retour`);

    // Initialiser l'état du bouton récapitulatif
    updateSummaryButtonState();
}

/**
 * Initialise les valeurs par défaut de la configuration
 */
function initializeDefaultValues() {
    // Sélectionner "Bon état" par défaut
    const goodConditionRadio = document.querySelector('input[name="productCondition"][value="GOOD"]');
    if (goodConditionRadio) {
        goodConditionRadio.checked = true;
    }

    // Sélectionner "Remboursement automatique" par défaut
    const autoRefundRadio = document.querySelector('input[name="refundMethod"][value="auto"]');
    if (autoRefundRadio) {
        autoRefundRadio.checked = true;
    }

    console.log('✅ Valeurs par défaut initialisées');
}

/**
 * Met à jour l'état du bouton "Voir le Récapitulatif"
 */
function updateSummaryButtonState() {
    const summaryBtn = document.getElementById('proceedToSummaryBtn');
    if (!summaryBtn) {
        console.warn('⚠️ Bouton proceedToSummaryBtn non trouvé');
        return;
    }

    // Vérifier s'il y a des produits sélectionnés
    const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="returnItem_"]:checked');

    if (selectedCheckboxes.length > 0) {
        // Vérifier que les quantités sont valides
        let hasValidQuantities = true;
        selectedCheckboxes.forEach(checkbox => {
            const index = checkbox.value;
            const quantityInput = document.getElementById(`quantity_${index}`);
            if (quantityInput) {
                const quantity = parseInt(quantityInput.value) || 0;
                if (quantity <= 0) {
                    hasValidQuantities = false;
                }
            }
        });

        if (hasValidQuantities) {
            summaryBtn.disabled = false;
            summaryBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            summaryBtn.classList.add('hover:bg-blue-700');
            console.log('✅ Bouton "Voir le Récapitulatif" activé');
        } else {
            summaryBtn.disabled = true;
            summaryBtn.classList.add('opacity-50', 'cursor-not-allowed');
            summaryBtn.classList.remove('hover:bg-blue-700');
            console.log('⚠️ Bouton "Voir le Récapitulatif" désactivé (quantités invalides)');
        }
    } else {
        summaryBtn.disabled = true;
        summaryBtn.classList.add('opacity-50', 'cursor-not-allowed');
        summaryBtn.classList.remove('hover:bg-blue-700');
        console.log('⚠️ Bouton "Voir le Récapitulatif" désactivé (aucun produit sélectionné)');
    }
}

/**
 * Initialise la section récapitulatif du retour
 */
function initializeReturnSummarySection() {
    console.log('📋 Initialisation de la section récapitulatif du retour');

    try {
        // Vérifier qu'on a bien une vente sélectionnée
        if (!currentSale || !currentSale.items) {
            console.error('❌ Aucune vente sélectionnée pour le récapitulatif');
            showNotification('Erreur: Aucune vente sélectionnée', 'error');
            showStep(1); // Retour à la recherche
            return;
        }

        // Récupérer les données de configuration
        const returnConfig = collectReturnConfiguration();

        if (!returnConfig.selectedProducts || returnConfig.selectedProducts.length === 0) {
            console.error('❌ Aucun produit sélectionné pour le retour');
            showNotification('Erreur: Aucun produit sélectionné pour le retour', 'error');
            showStep(3); // Retour à la configuration
            return;
        }

        // Afficher le récapitulatif de la vente originale
        displayOriginalSaleSummary(currentSale);

        // Afficher les produits à retourner
        displayReturnProductsSummary(returnConfig.selectedProducts);

        // Afficher le récapitulatif financier
        displayFinancialSummary(returnConfig);

        // Afficher les informations additionnelles
        displayAdditionalInfo(returnConfig);

        console.log('✅ Section récapitulatif initialisée');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation du récapitulatif:', error);
        showNotification('Erreur lors de l\'initialisation du récapitulatif', 'error');
    }
}

/**
 * Collecte la configuration du retour depuis le formulaire
 */
function collectReturnConfiguration() {
    const config = {
        selectedProducts: [],
        condition: 'GOOD',
        refundMethod: 'auto',
        reason: '',
        notes: ''
    };

    // Récupérer les produits sélectionnés
    const checkboxes = document.querySelectorAll('input[type="checkbox"][id^="returnItem_"]:checked');
    checkboxes.forEach(checkbox => {
        const index = parseInt(checkbox.value);
        if (currentSale.items[index]) {
            const product = currentSale.items[index];
            const quantityInput = document.getElementById(`quantity_${index}`);
            const quantity = quantityInput ? parseInt(quantityInput.value) || product.quantity : product.quantity;

            config.selectedProducts.push({
                ...product,
                original_sale_item_id: product.id, // ID de l'item dans sale_items
                returnQuantity: quantity,
                returnTotal: quantity * product.unit_price
            });
        }
    });

    // Récupérer l'état des produits
    const conditionRadio = document.querySelector('input[name="productCondition"]:checked');
    if (conditionRadio) {
        config.condition = conditionRadio.value;
    }

    // Récupérer le mode de remboursement
    const refundRadio = document.querySelector('input[name="refundMethod"]:checked');
    if (refundRadio) {
        config.refundMethod = refundRadio.value;
    }

    // Récupérer la raison et les notes
    const reasonField = document.getElementById('returnReason');
    if (reasonField) {
        config.reason = reasonField.value;
    }

    const notesField = document.getElementById('returnNotes');
    if (notesField) {
        config.notes = notesField.value;
    }

    console.log('📊 Configuration collectée:', config);
    return config;
}

/**
 * Affiche le récapitulatif de la vente originale
 */
function displayOriginalSaleSummary(sale) {
    const container = document.getElementById('originalSaleSummary');
    if (!container) {
        console.error('❌ Container originalSaleSummary non trouvé');
        return;
    }

    const saleDate = new Date(sale.date).toLocaleDateString('fr-FR');
    const totalAmount = sale.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Numéro de Vente:</span>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">#${sale.id}</div>
            </div>
            <div>
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Date:</span>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">${saleDate}</div>
            </div>
            <div>
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Montant Total:</span>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">${totalAmount.toFixed(2)} MAD</div>
            </div>
        </div>
    `;

    console.log('✅ Récapitulatif vente originale affiché');
}

/**
 * Affiche les produits à retourner dans le récapitulatif
 */
function displayReturnProductsSummary(selectedProducts) {
    const tbody = document.getElementById('summaryProductsBody');
    if (!tbody) {
        console.error('❌ Table body summaryProductsBody non trouvé');
        return;
    }

    tbody.innerHTML = '';

    selectedProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                ${product.product_name || 'Produit inconnu'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                ${product.returnQuantity}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                ${(product.unit_price || 0).toFixed(2)} MAD
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                ${product.returnTotal.toFixed(2)} MAD
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Bon état
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });

    console.log(`✅ ${selectedProducts.length} produit(s) affiché(s) dans le récapitulatif`);
}

/**
 * Affiche le récapitulatif financier
 */
function displayFinancialSummary(config) {
    const totalRefund = config.selectedProducts.reduce((sum, product) => sum + product.returnTotal, 0);
    const productCount = config.selectedProducts.length;
    const totalQuantity = config.selectedProducts.reduce((sum, product) => sum + product.returnQuantity, 0);

    // Mettre à jour le montant total à rembourser
    const totalRefundElement = document.getElementById('totalRefundAmount');
    if (totalRefundElement) {
        totalRefundElement.textContent = `${totalRefund.toFixed(2)} MAD`;
    }

    // Mettre à jour le nombre de produits
    const productCountElement = document.getElementById('productCount');
    if (productCountElement) {
        productCountElement.textContent = productCount.toString();
    }

    // Mettre à jour la quantité totale
    const totalQuantityElement = document.getElementById('totalQuantity');
    if (totalQuantityElement) {
        totalQuantityElement.textContent = totalQuantity.toString();
    }

    console.log(`💰 Récapitulatif financier: ${totalRefund.toFixed(2)} MAD pour ${productCount} produit(s)`);
}

/**
 * Affiche les informations additionnelles
 */
function displayAdditionalInfo(config) {
    // Afficher la raison
    const reasonElement = document.getElementById('summaryReason');
    if (reasonElement) {
        reasonElement.textContent = config.reason || 'Non spécifiée';
    }

    // Afficher l'état des produits
    const conditionElement = document.getElementById('summaryCondition');
    if (conditionElement) {
        const conditionText = config.condition === 'GOOD' ? 'Bon état (remettre en stock)' : 'Défectueux (ne pas remettre en stock)';
        conditionElement.textContent = conditionText;
    }

    // Afficher les notes si présentes
    const notesDiv = document.getElementById('summaryNotesDiv');
    const notesElement = document.getElementById('summaryNotes');
    if (config.notes && config.notes.trim()) {
        if (notesElement) {
            notesElement.textContent = config.notes;
        }
        if (notesDiv) {
            notesDiv.style.display = 'block';
        }
    } else {
        if (notesDiv) {
            notesDiv.style.display = 'none';
        }
    }

    console.log('✅ Informations additionnelles affichées');
}

/**
 * Traite le retour
 */
async function processReturn() {
    console.log('🔄 Début du traitement du retour...');

    try {
        // Vérifier qu'on a bien une vente sélectionnée
        if (!currentSale || !currentSale.items) {
            showNotification('Erreur: Aucune vente sélectionnée', 'error');
            showStep(1);
            return;
        }

        // Collecter la configuration du retour
        const returnConfig = collectReturnConfiguration();

        if (!returnConfig.selectedProducts || returnConfig.selectedProducts.length === 0) {
            showNotification('Veuillez sélectionner au moins un article à retourner', 'warning');
            showStep(3); // Retour à la configuration
            return;
        }

        console.log('📊 Configuration du retour:', returnConfig);
        showLoading('processReturnBtn', true);

        // Calculer les montants de remboursement
        const totalRefundAmount = returnConfig.selectedProducts.reduce((sum, product) => sum + product.returnTotal, 0);

        // Déterminer la répartition du remboursement selon la méthode choisie
        let refundCash = 0;
        let refundCredit = 0;

        if (returnConfig.refundMethod === 'cash') {
            refundCash = totalRefundAmount;
        } else if (returnConfig.refundMethod === 'credit') {
            refundCredit = totalRefundAmount;
        } else {
            // Mode automatique : remboursement en espèces par défaut
            refundCash = totalRefundAmount;
        }

        // Préparer les données pour l'API (format attendu par processProductReturn)
        const returnData = {
            originalSaleId: currentSale.id,
            clientId: currentSale.client_id || null,
            userId: 1, // TODO: Récupérer l'ID de l'utilisateur connecté
            itemsToReturn: returnConfig.selectedProducts.map(product => ({
                original_sale_item_id: product.original_sale_item_id || product.id,
                product_id: product.product_id,
                product_name: product.product_name,
                quantity_returned: product.returnQuantity,
                unit: product.unit || 'pièce',
                unit_price: product.unit_price,
                total_price: product.returnTotal,
                condition_status: returnConfig.condition || 'GOOD',
                back_to_stock: (returnConfig.condition === 'GOOD') ? true : false
            })),
            refundCash: refundCash,
            refundCredit: refundCredit,
            reason: returnConfig.reason || 'Non spécifiée',
            notes: returnConfig.notes || ''
        };

        console.log('📤 Envoi des données de retour:', returnData);

        // Calculer et vérifier le montant total
        const calculatedTotal = returnData.itemsToReturn.reduce((sum, item) => sum + item.total_price, 0);
        console.log('💰 Montant total calculé:', calculatedTotal.toFixed(2), 'MAD');
        console.log('💰 Répartition:', {
            refundCash: returnData.refundCash,
            refundCredit: returnData.refundCredit,
            total: returnData.refundCash + returnData.refundCredit
        });

        // Vérifier que tous les champs requis sont présents
        console.log('🔍 Vérification des données:');
        console.log('  - originalSaleId:', returnData.originalSaleId);
        console.log('  - clientId:', returnData.clientId);
        console.log('  - userId:', returnData.userId);
        console.log('  - itemsToReturn:', returnData.itemsToReturn.length, 'items');

        returnData.itemsToReturn.forEach((item, index) => {
            console.log(`  Item ${index + 1}:`, {
                original_sale_item_id: item.original_sale_item_id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity_returned: item.quantity_returned,
                unit: item.unit,
                unit_price: item.unit_price
            });
        });

        // Appeler l'API pour traiter le retour
        const result = await window.api.returns.process(returnData);

        if (result && result.success) {
            console.log('✅ Résultat de l\'API retours:', result);
            showNotification('Retour traité avec succès', 'success');

            // Mettre à jour les variables globales
            returnItems = returnData.itemsToReturn;

            // Debug: Vérifier l'état après mise à jour
            console.log('🔍 returnItems après mise à jour:', returnItems);
            console.log('💰 Montant remboursé reçu:', {
                totalRefundAmount: result.totalRefundAmount,
                refund_amount: result.refund_amount,
                returnNumber: result.returnNumber,
                returnId: result.returnId
            });
            debugReturnVariables();

            // Afficher une page de confirmation ou rediriger
            displayReturnSuccess(result);

        } else {
            const errorMessage = result?.error || 'Erreur inconnue lors du traitement';
            showNotification('Erreur lors du traitement: ' + errorMessage, 'error');
            console.error('❌ Erreur API:', result);
        }

    } catch (error) {
        console.error('❌ Erreur lors du traitement du retour:', error);
        showNotification('Erreur lors du traitement: ' + error.message, 'error');
    } finally {
        showLoading('processReturnBtn', false);
    }
}

/**
 * Affiche la confirmation de succès du retour
 */
function displayReturnSuccess(result) {
    console.log('✅ Affichage de la confirmation de succès:', result);

    try {
        // Calculer le montant total en fallback si nécessaire
        let refundAmount = result.totalRefundAmount || result.refund_amount || 0;

        // Si le montant est toujours 0, calculer depuis returnItems
        if (refundAmount === 0 && returnItems && returnItems.length > 0) {
            refundAmount = returnItems.reduce((sum, item) => {
                const itemTotal = (item.quantity_returned || 0) * (item.unit_price || 0);
                return sum + itemTotal;
            }, 0);
            console.log('💰 Montant calculé depuis returnItems:', refundAmount);
        }
        // Créer un modal de confirmation ou rediriger vers une page de succès
        const successMessage = `
            <div class="text-center">
                <div class="text-6xl text-green-500 mb-4">✅</div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Retour Traité avec Succès
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">
                    Le retour #${result.returnNumber || result.return_id || result.returnId || 'N/A'} a été traité avec succès.
                </p>
                <div class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <p>Montant remboursé: ${refundAmount.toFixed(2)} MAD</p>
                    <p>Date de traitement: ${new Date().toLocaleDateString('fr-FR')}</p>
                </div>
            </div>
        `;

        // Afficher dans la section récapitulatif ou créer un modal
        const summarySection = document.getElementById('returnSummarySection');
        if (summarySection) {
            // Ajouter une section de succès
            const successDiv = document.createElement('div');
            successDiv.className = 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-6 mt-6';
            successDiv.innerHTML = successMessage;
            summarySection.appendChild(successDiv);

            // Masquer le bouton "Traiter le Retour" et afficher les options suivantes
            const processBtn = document.getElementById('processReturnBtn');
            if (processBtn) {
                processBtn.style.display = 'none';
            }

            // Afficher les boutons d'actions suivantes
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'flex justify-center space-x-4 mt-6';
            actionsDiv.innerHTML = `
                <button id="newReturnBtn" class="btn-primary">
                    Nouveau Retour
                </button>
                <button id="printReturnTicketBtn" class="btn-secondary">
                    Imprimer le Ticket
                </button>
            `;
            summarySection.appendChild(actionsDiv);

            // Ajouter les event listeners pour les nouveaux boutons
            const newReturnBtn = document.getElementById('newReturnBtn');
            if (newReturnBtn) {
                newReturnBtn.addEventListener('click', resetReturn);
            }

            const printBtn = document.getElementById('printReturnTicketBtn');
            if (printBtn) {
                printBtn.addEventListener('click', () => {
                    // S'assurer que les données sont disponibles pour l'impression
                    const printData = {
                        ...result,
                        items: returnItems // Passer explicitement les items
                    };
                    printReturnTicket(printData);
                });
            }
        }

        console.log('✅ Confirmation de succès affichée');

    } catch (error) {
        console.error('❌ Erreur lors de l\'affichage de la confirmation:', error);
        // Fallback: simple notification
        showNotification('Retour traité avec succès!', 'success');
    }
}

/**
 * Remet à zéro pour un nouveau retour
 */
function resetReturn() {
    currentSale = null;
    returnItems = [];
    currentStep = 1;

    // Vider les champs
    const searchInput = document.getElementById('searchTicket');
    if (searchInput) {
        searchInput.value = '';
    }

    // Retourner à la première étape
    showStep(1);

    console.log('🔄 Nouveau retour initialisé');
}

/**
 * Imprime le ticket de retour
 */
function printReturnTicket() {
    console.log('🖨️ Impression du ticket de retour');

    try {
        // Pour l'instant, on affiche juste une notification
        // Plus tard, on pourra implémenter l'impression réelle
        showNotification('Fonction d\'impression en cours de développement', 'info');

    } catch (error) {
        console.error('❌ Erreur lors de l\'impression:', error);
        showNotification('Erreur lors de l\'impression', 'error');
    }
}

/**
 * Affiche/masque le loading sur un bouton
 */
function showLoading(buttonId, show) {
    const button = document.getElementById(buttonId);
    if (!button) {
        console.warn(`⚠️ Bouton ${buttonId} non trouvé pour showLoading`);
        return;
    }

    if (show) {
        // Sauvegarder le texte original s'il n'est pas déjà sauvegardé
        if (!button.getAttribute('data-original-text')) {
            button.setAttribute('data-original-text', button.innerHTML);
        }

        button.disabled = true;
        button.innerHTML = `
            <div class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Traitement...
            </div>
        `;
        console.log(`🔄 Loading activé pour ${buttonId}`);
    } else {
        button.disabled = false;

        // Restaurer le texte original du bouton
        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
            button.innerHTML = originalText;
        } else {
            // Fallback selon l'ID du bouton
            const fallbackTexts = {
                'processReturnBtn': '<span>Traiter le Retour</span>',
                'searchBtn': '<span>Rechercher</span>',
                'proceedToSummaryBtn': '<span>Voir le Récapitulatif</span>'
            };
            button.innerHTML = fallbackTexts[buttonId] || '<span>Action</span>';
        }

        console.log(`✅ Loading désactivé pour ${buttonId}`);
    }
}

/**
 * Affiche une notification à l'utilisateur
 */
function showNotification(message, type = 'info') {
    // Utiliser le système de notifications global si disponible et différent
    if (typeof window.showNotification === 'function' && window.showNotification !== showNotification) {
        window.showNotification(message, type);
    } else {
        // Fallback simple avec console.log pour debug
        console.log(`[${type.toUpperCase()}] ${message}`);

        // Afficher une alerte pour les erreurs importantes
        if (type === 'error') {
            alert(`Erreur: ${message}`);
        } else if (type === 'success') {
            console.log(`✅ ${message}`);
        } else if (type === 'warning') {
            console.log(`⚠️ ${message}`);
        } else {
            console.log(`ℹ️ ${message}`);
        }
    }
}

/**
 * Teste la disponibilité du bouton "Traiter le Retour"
 */
function testProcessReturnButton() {
    console.log('🧪 Test du bouton "Traiter le Retour"...');

    const processBtn = document.getElementById('processReturnBtn');
    if (processBtn) {
        console.log('✅ Bouton processReturnBtn trouvé');
        console.log('🔍 État du bouton:', {
            disabled: processBtn.disabled,
            innerHTML: processBtn.innerHTML,
            className: processBtn.className
        });

        // Vérifier si l'event listener est attaché
        if (typeof processReturn === 'function') {
            console.log('✅ Fonction processReturn disponible');
        } else {
            console.error('❌ Fonction processReturn NON disponible');
        }

        // Vérifier l'API
        if (window.api && window.api.returns && window.api.returns.process) {
            console.log('✅ API window.api.returns.process disponible');
        } else {
            console.error('❌ API window.api.returns.process NON disponible');
        }

    } else {
        console.error('❌ Bouton processReturnBtn NON trouvé');
    }
}

/**
 * Debug: Affiche l'état des variables globales
 */
function debugReturnVariables() {
    console.log('🔍 DEBUG - État des variables globales:');
    console.log('  - currentSale:', currentSale);
    console.log('  - returnItems:', returnItems);
    console.log('  - currentStep:', currentStep);

    if (currentSale && currentSale.items) {
        console.log(`  - currentSale.items: ${currentSale.items.length} items`);
        currentSale.items.forEach((item, index) => {
            console.log(`    Item ${index + 1}:`, {
                id: item.id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity
            });
        });
    }

    if (returnItems && returnItems.length > 0) {
        console.log(`  - returnItems: ${returnItems.length} items`);
        returnItems.forEach((item, index) => {
            console.log(`    Return Item ${index + 1}:`, {
                product_name: item.product_name,
                quantity_returned: item.quantity_returned,
                unit_price: item.unit_price
            });
        });
    }
}

/**
 * Remet à zéro le processus de retour pour commencer un nouveau retour
 */
function resetReturn() {
    console.log('🔄 Réinitialisation du processus de retour...');

    // Réinitialiser les variables globales
    currentSale = null;
    returnItems = [];

    // Retourner à l'étape 1 (recherche)
    showStep(1);

    // Vider les champs de recherche
    const searchInput = document.getElementById('saleSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }

    showNotification('Nouveau retour initialisé', 'info');
}

/**
 * Imprime le ticket de retour
 */
function printReturnTicket(returnResult) {
    console.log('🖨️ Impression du ticket de retour...', returnResult);
    console.log('🔍 returnItems disponibles:', returnItems);

    try {
        // Vérifier que les données nécessaires sont disponibles
        if (!returnItems || returnItems.length === 0) {
            console.warn('⚠️ returnItems vide, tentative de récupération depuis returnResult');

            // Fallback: essayer de récupérer les items depuis returnResult
            if (returnResult && returnResult.items && returnResult.items.length > 0) {
                returnItems = returnResult.items;
                console.log('✅ Items récupérés depuis returnResult');
            } else {
                console.error('❌ Aucun item de retour disponible pour l\'impression');
                showNotification('Erreur: Aucun produit à imprimer', 'error');
                return;
            }
        }

        if (!currentSale) {
            console.error('❌ Aucune vente courante disponible pour l\'impression');
            showNotification('Erreur: Informations de vente manquantes', 'error');
            return;
        }
        // Créer le contenu du ticket
        const ticketContent = `
            <div style="font-family: monospace; width: 300px; margin: 0 auto;">
                <div style="text-align: center; border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 10px;">
                    <h2>TICKET DE RETOUR</h2>
                    <p>Retour #${returnResult.return_id || 'N/A'}</p>
                    <p>${new Date().toLocaleString('fr-FR')}</p>
                </div>

                <div style="margin-bottom: 10px;">
                    <strong>Vente Originale:</strong> #${currentSale?.id || 'N/A'}<br>
                    <strong>Date Vente:</strong> ${currentSale?.date ? new Date(currentSale.date).toLocaleDateString('fr-FR') : 'N/A'}
                </div>

                <div style="border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 10px;">
                    <strong>PRODUITS RETOURNÉS:</strong><br>
                    ${returnItems.map(item => {
                        const productName = item.product_name || 'Produit inconnu';
                        const quantity = item.quantity_returned || item.returnQuantity || item.quantity || 0;
                        const unitPrice = item.unit_price || 0;
                        const totalPrice = item.total_price || item.returnTotal || (quantity * unitPrice);

                        return `
                            ${productName}<br>
                            Qté: ${quantity} x ${unitPrice.toFixed(2)} MAD<br>
                            Total: ${totalPrice.toFixed(2)} MAD<br>
                        `;
                    }).join('<br>')}
                </div>

                <div style="text-align: center; font-size: 18px; font-weight: bold;">
                    TOTAL REMBOURSÉ: ${returnResult.totalRefundAmount || returnResult.refund_amount || '0.00'} MAD
                </div>

                <div style="text-align: center; margin-top: 20px; font-size: 12px;">
                    Merci de votre confiance
                </div>
            </div>
        `;

        // Ouvrir une nouvelle fenêtre pour l'impression
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Ticket de Retour</title>
                    <style>
                        body { margin: 0; padding: 20px; }
                        @media print {
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    ${ticketContent}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();

        console.log('✅ Ticket de retour envoyé à l\'impression');

    } catch (error) {
        console.error('❌ Erreur lors de l\'impression:', error);
        showNotification('Erreur lors de l\'impression du ticket', 'error');
    }
}
