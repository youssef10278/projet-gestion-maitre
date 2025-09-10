// Gestion des validations et erreurs pour les clients
class ClientValidation {
    constructor() {
        this.createValidationModals();
    }

    // Créer les modales de validation
    createValidationModals() {
        // Modal d'erreur ICE
        this.createICEErrorModal();
        
        // Modal d'erreur téléphone
        this.createPhoneErrorModal();
        
        // Modal d'alerte nom similaire
        this.createSimilarNameModal();
    }

    // Modal d'erreur ICE existant
    createICEErrorModal() {
        const modalHTML = `
            <div id="iceErrorModal" class="fixed inset-0 bg-gray-800 bg-opacity-60 hidden items-center justify-center z-50">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
                    <div class="flex items-center mb-4">
                        <div class="bg-red-100 rounded-full p-2 mr-3">
                            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-red-600">ICE Déjà Utilisé</h3>
                    </div>
                    
                    <div class="mb-6">
                        <p class="text-gray-700 dark:text-gray-300 mb-4">
                            L'ICE "<span id="iceErrorValue" class="font-mono font-bold"></span>" est déjà utilisé par :
                        </p>
                        
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div class="flex items-center mb-2">
                                <svg class="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                                <span id="iceErrorClientName" class="font-semibold"></span>
                            </div>
                            <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V6z"></path>
                                </svg>
                                <span id="iceErrorClientPhone"></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button id="iceErrorModifyBtn" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                            Modifier ce client
                        </button>
                        <button id="iceErrorCloseBtn" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Event listeners
        document.getElementById('iceErrorCloseBtn').addEventListener('click', () => {
            this.hideModal('iceErrorModal');
        });
    }

    // Modal d'erreur téléphone existant
    createPhoneErrorModal() {
        const modalHTML = `
            <div id="phoneErrorModal" class="fixed inset-0 bg-gray-800 bg-opacity-60 hidden items-center justify-center z-50">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
                    <div class="flex items-center mb-4">
                        <div class="bg-red-100 rounded-full p-2 mr-3">
                            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-red-600">Téléphone Déjà Utilisé</h3>
                    </div>
                    
                    <div class="mb-6">
                        <p class="text-gray-700 dark:text-gray-300 mb-4">
                            Le numéro "<span id="phoneErrorValue" class="font-mono font-bold"></span>" est déjà utilisé par :
                        </p>
                        
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div class="flex items-center mb-2">
                                <svg class="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                                <span id="phoneErrorClientName" class="font-semibold"></span>
                            </div>
                            <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                </svg>
                                <span id="phoneErrorClientICE"></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button id="phoneErrorModifyBtn" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                            Modifier ce client
                        </button>
                        <button id="phoneErrorCloseBtn" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Event listeners
        document.getElementById('phoneErrorCloseBtn').addEventListener('click', () => {
            this.hideModal('phoneErrorModal');
        });
    }

    // Modal d'alerte nom similaire
    createSimilarNameModal() {
        const modalHTML = `
            <div id="similarNameModal" class="fixed inset-0 bg-gray-800 bg-opacity-60 hidden items-center justify-center z-50">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg">
                    <div class="flex items-center mb-4">
                        <div class="bg-yellow-100 rounded-full p-2 mr-3">
                            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-yellow-600">Client Similaire Trouvé</h3>
                    </div>
                    
                    <div class="mb-6">
                        <p class="text-gray-700 dark:text-gray-300 mb-4">
                            Vous ajoutez : "<span id="similarNameNew" class="font-semibold"></span>"<br>
                            Client(s) existant(s) :
                        </p>
                        
                        <div id="similarClientsContainer" class="space-y-3 max-h-48 overflow-y-auto">
                            <!-- Les clients similaires seront ajoutés ici -->
                        </div>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button id="similarNameModifyBtn" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                            Modifier l'existant
                        </button>
                        <button id="similarNameContinueBtn" class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                            Continuer quand même
                        </button>
                        <button id="similarNameCancelBtn" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition">
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Event listeners
        document.getElementById('similarNameCancelBtn').addEventListener('click', () => {
            this.hideModal('similarNameModal');
        });
    }

    // Afficher modal d'erreur ICE
    showICEError(existingClientName, existingClientPhone, ice, existingClientId) {
        document.getElementById('iceErrorValue').textContent = ice;
        document.getElementById('iceErrorClientName').textContent = existingClientName;
        document.getElementById('iceErrorClientPhone').textContent = existingClientPhone;
        
        // Gérer le bouton modifier
        const modifyBtn = document.getElementById('iceErrorModifyBtn');
        modifyBtn.onclick = () => {
            this.hideModal('iceErrorModal');
            if (this.onModifyExistingClient) {
                this.onModifyExistingClient(existingClientId);
            }
        };
        
        this.showModal('iceErrorModal');
    }

    // Afficher modal d'erreur téléphone
    showPhoneError(existingClientName, existingClientICE, phone, existingClientId) {
        document.getElementById('phoneErrorValue').textContent = phone;
        document.getElementById('phoneErrorClientName').textContent = existingClientName;
        document.getElementById('phoneErrorClientICE').textContent = existingClientICE;
        
        // Gérer le bouton modifier
        const modifyBtn = document.getElementById('phoneErrorModifyBtn');
        modifyBtn.onclick = () => {
            this.hideModal('phoneErrorModal');
            if (this.onModifyExistingClient) {
                this.onModifyExistingClient(existingClientId);
            }
        };
        
        this.showModal('phoneErrorModal');
    }

    // Afficher modal d'alerte nom similaire
    showSimilarNameAlert(newClientName, similarClients, onContinue, onModify) {
        document.getElementById('similarNameNew').textContent = newClientName;
        
        // Remplir la liste des clients similaires
        const container = document.getElementById('similarClientsContainer');
        container.innerHTML = '';
        
        similarClients.forEach(client => {
            const clientDiv = document.createElement('div');
            clientDiv.className = 'bg-gray-50 dark:bg-gray-700 rounded-lg p-3';
            clientDiv.innerHTML = `
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-semibold">${client.name}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                            📞 ${client.phone || 'N/A'} • 🏢 ${client.ice || 'N/A'}
                        </div>
                    </div>
                    <button class="modify-similar-btn bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-200 transition" data-client-id="${client.id}">
                        Modifier
                    </button>
                </div>
            `;
            container.appendChild(clientDiv);
        });
        
        // Event listeners pour les boutons de modification individuels
        container.querySelectorAll('.modify-similar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const clientId = parseInt(e.target.dataset.clientId);
                this.hideModal('similarNameModal');
                if (onModify) onModify(clientId);
            });
        });
        
        // Event listeners pour les boutons principaux
        document.getElementById('similarNameContinueBtn').onclick = () => {
            this.hideModal('similarNameModal');
            if (onContinue) onContinue();
        };
        
        document.getElementById('similarNameModifyBtn').onclick = () => {
            this.hideModal('similarNameModal');
            if (onModify && similarClients.length > 0) {
                onModify(similarClients[0].id);
            }
        };
        
        this.showModal('similarNameModal');
    }

    // Afficher une modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    // Cacher une modal
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('flex');
            modal.classList.add('hidden');
        }
    }

    // Callback pour modifier un client existant
    setOnModifyExistingClient(callback) {
        this.onModifyExistingClient = callback;
    }
}

// Instance globale
window.clientValidation = new ClientValidation();
