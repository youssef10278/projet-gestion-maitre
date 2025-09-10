/**
 * Script de test pour la gestion des stocks par lots
 */

let currentProductId = null;
let allProducts = [];

// Éléments DOM
const productSelect = document.getElementById('productSelect');
const loadLotsBtn = document.getElementById('loadLotsBtn');
const lotsContainer = document.getElementById('lotsContainer');
const movementsContainer = document.getElementById('movementsContainer');
const createLotForm = document.getElementById('createLotForm');
const confirmModal = document.getElementById('confirmModal');

// Statistiques
const totalLotsEl = document.getElementById('totalLots');
const totalQuantityEl = document.getElementById('totalQuantity');
const averageCostEl = document.getElementById('averageCost');
const totalValueEl = document.getElementById('totalValue');

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation du test des stocks par lots');
    
    // Vérifier si l'API est disponible
    if (!window.api || !window.api.stockLots) {
        showError('API des stocks par lots non disponible. Veuillez redémarrer l\'application.');
        return;
    }
    
    await loadProducts();
    setupEventListeners();
});

// Charger la liste des produits
async function loadProducts() {
    try {
        console.log('📦 Chargement des produits...');
        allProducts = await window.api.products.getAll();
        
        productSelect.innerHTML = '<option value="">Sélectionnez un produit</option>';
        
        allProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (Stock: ${product.stock})`;
            productSelect.appendChild(option);
        });
        
        console.log(`✅ ${allProducts.length} produits chargés`);
    } catch (error) {
        console.error('❌ Erreur lors du chargement des produits:', error);
        showError('Erreur lors du chargement des produits: ' + error.message);
    }
}

// Configuration des événements
function setupEventListeners() {
    // Sélection de produit
    productSelect.addEventListener('change', (e) => {
        currentProductId = e.target.value ? parseInt(e.target.value) : null;
        if (currentProductId) {
            loadProductData();
        } else {
            clearData();
        }
    });

    // Bouton charger les lots
    loadLotsBtn.addEventListener('click', () => {
        if (currentProductId) {
            loadProductData();
        }
    });

    // Formulaire de création de lot
    createLotForm.addEventListener('submit', handleCreateLot);

    // Modal de confirmation
    document.getElementById('confirmCancel').addEventListener('click', hideConfirmModal);
    document.getElementById('confirmOk').addEventListener('click', executeConfirmedAction);
}

// Charger les données d'un produit
async function loadProductData() {
    if (!currentProductId) return;
    
    try {
        console.log(`📊 Chargement des données pour le produit ${currentProductId}`);
        
        // Charger les lots
        const lots = await window.api.stockLots.getProductLots(currentProductId, true);
        displayLots(lots);
        
        // Charger les mouvements
        const movements = await window.api.stockLots.getMovements(currentProductId, 20);
        displayMovements(movements);
        
        // Calculer et afficher les statistiques
        await updateStatistics(lots);
        
        console.log(`✅ Données chargées: ${lots.length} lots, ${movements.length} mouvements`);
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        showError('Erreur lors du chargement des données: ' + error.message);
    }
}

// Afficher les lots
function displayLots(lots) {
    if (!lots || lots.length === 0) {
        lotsContainer.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-500 dark:text-gray-400">Aucun lot trouvé pour ce produit</p>
                <p class="text-sm text-gray-400 dark:text-gray-500 mt-2">Créez un nouveau lot ci-dessous</p>
            </div>
        `;
        return;
    }

    lotsContainer.innerHTML = lots.map(lot => `
        <div class="lot-card bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border ${lot.quantity > 0 ? 'border-green-200 dark:border-green-700' : 'border-gray-200 dark:border-gray-600'}">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h3 class="font-semibold text-gray-900 dark:text-white">${lot.lot_number}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Créé le ${new Date(lot.purchase_date).toLocaleDateString('fr-FR')}
                    </p>
                </div>
                <span class="px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(lot.status)}">
                    ${getStatusText(lot.status)}
                </span>
            </div>
            
            <div class="grid grid-cols-3 gap-4 text-sm">
                <div>
                    <span class="text-gray-500 dark:text-gray-400">Quantité:</span>
                    <div class="font-semibold ${lot.quantity > 0 ? 'text-green-600' : 'text-red-600'}">${lot.quantity}</div>
                </div>
                <div>
                    <span class="text-gray-500 dark:text-gray-400">Prix d'achat:</span>
                    <div class="font-semibold text-gray-900 dark:text-white">${lot.purchase_price.toFixed(2)} MAD</div>
                </div>
                <div>
                    <span class="text-gray-500 dark:text-gray-400">Valeur:</span>
                    <div class="font-semibold text-blue-600">${(lot.quantity * lot.purchase_price).toFixed(2)} MAD</div>
                </div>
            </div>
            
            ${lot.notes ? `<div class="mt-3 text-sm text-gray-600 dark:text-gray-400 italic">${lot.notes}</div>` : ''}
        </div>
    `).join('');
}

// Afficher les mouvements
function displayMovements(movements) {
    if (!movements || movements.length === 0) {
        movementsContainer.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-500 dark:text-gray-400">Aucun mouvement trouvé</p>
            </div>
        `;
        return;
    }

    movementsContainer.innerHTML = movements.map(movement => `
        <div class="movement-${movement.movement_type.toLowerCase()} bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-semibold text-gray-900 dark:text-white">
                            ${getMovementIcon(movement.movement_type)} ${getMovementText(movement.movement_type)}
                        </span>
                        <span class="text-sm text-gray-500 dark:text-gray-400">
                            ${movement.lot_number || 'Lot supprimé'}
                        </span>
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                        ${movement.quantity} unités à ${movement.unit_cost.toFixed(2)} MAD
                    </div>
                    ${movement.notes ? `<div class="text-xs text-gray-500 dark:text-gray-500 mt-1">${movement.notes}</div>` : ''}
                </div>
                <div class="text-right">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                        ${new Date(movement.movement_date).toLocaleDateString('fr-FR')}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        ${new Date(movement.movement_date).toLocaleTimeString('fr-FR')}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Mettre à jour les statistiques
async function updateStatistics(lots) {
    try {
        const activeLots = lots.filter(lot => lot.quantity > 0);
        const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantity, 0);
        const totalValue = lots.reduce((sum, lot) => sum + (lot.quantity * lot.purchase_price), 0);
        
        // Calculer le coût moyen
        let averageCost = 0;
        if (currentProductId) {
            averageCost = await window.api.stockLots.calculateAverageCost(currentProductId);
        }
        
        totalLotsEl.textContent = activeLots.length;
        totalQuantityEl.textContent = totalQuantity;
        averageCostEl.textContent = averageCost.toFixed(2) + ' MAD';
        totalValueEl.textContent = totalValue.toFixed(2) + ' MAD';
    } catch (error) {
        console.error('❌ Erreur lors du calcul des statistiques:', error);
    }
}

// Gérer la création d'un nouveau lot
async function handleCreateLot(e) {
    e.preventDefault();
    
    if (!currentProductId) {
        showError('Veuillez sélectionner un produit');
        return;
    }
    
    const lotNumber = document.getElementById('lotNumber').value.trim();
    const quantity = parseInt(document.getElementById('lotQuantity').value);
    const price = parseFloat(document.getElementById('lotPrice').value);
    
    if (!lotNumber || !quantity || !price) {
        showError('Veuillez remplir tous les champs');
        return;
    }
    
    try {
        console.log('➕ Création d\'un nouveau lot...');
        
        const lotData = {
            product_id: currentProductId,
            lot_number: lotNumber,
            quantity: quantity,
            purchase_price: price,
            notes: `Lot créé via l'interface de test le ${new Date().toLocaleString('fr-FR')}`
        };
        
        const newLot = await window.api.stockLots.createLot(lotData);
        console.log('✅ Lot créé:', newLot);
        
        // Enregistrer le mouvement d'entrée
        await window.api.stockLots.recordMovement({
            product_id: currentProductId,
            lot_id: newLot.id,
            movement_type: 'IN',
            quantity: quantity,
            unit_cost: price,
            reference_type: 'PURCHASE',
            notes: `Entrée initiale du lot ${lotNumber}`
        });
        
        // Réinitialiser le formulaire
        createLotForm.reset();
        
        // Recharger les données
        await loadProductData();
        
        showSuccess(`Lot ${lotNumber} créé avec succès !`);
    } catch (error) {
        console.error('❌ Erreur lors de la création du lot:', error);
        showError('Erreur lors de la création du lot: ' + error.message);
    }
}

// Fonctions utilitaires
function getStatusBadgeClass(status) {
    switch (status) {
        case 'AVAILABLE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'SOLD_OUT': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        case 'EXPIRED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'AVAILABLE': return 'Disponible';
        case 'SOLD_OUT': return 'Épuisé';
        case 'EXPIRED': return 'Expiré';
        default: return status;
    }
}

function getMovementIcon(type) {
    switch (type) {
        case 'IN': return '📥';
        case 'OUT': return '📤';
        case 'ADJUSTMENT': return '⚖️';
        case 'TRANSFER': return '🔄';
        default: return '📋';
    }
}

function getMovementText(type) {
    switch (type) {
        case 'IN': return 'Entrée';
        case 'OUT': return 'Sortie';
        case 'ADJUSTMENT': return 'Ajustement';
        case 'TRANSFER': return 'Transfert';
        default: return type;
    }
}

function clearData() {
    lotsContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-8">Sélectionnez un produit pour voir ses lots</p>';
    movementsContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-8">Sélectionnez un produit pour voir l\'historique</p>';
    
    totalLotsEl.textContent = '-';
    totalQuantityEl.textContent = '-';
    averageCostEl.textContent = '-';
    totalValueEl.textContent = '-';
}

function showError(message) {
    console.error('❌', message);
    // Ici on pourrait ajouter une notification toast
    alert('Erreur: ' + message);
}

function showSuccess(message) {
    console.log('✅', message);
    // Ici on pourrait ajouter une notification toast
    alert('Succès: ' + message);
}

function hideConfirmModal() {
    confirmModal.classList.add('hidden');
}

function executeConfirmedAction() {
    // Placeholder pour les actions confirmées
    hideConfirmModal();
}
