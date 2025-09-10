// src/js/clients.js - Corrigé pour l'erreur TypeError sur le crédit

document.addEventListener('DOMContentLoaded', async () => {
    // --- Initialisation de la traduction ---
    await window.i18n.loadTranslations();
    window.i18n.applyTranslationsToHTML();
    const t = window.i18n.t;

    // --- Vérification des API ---
    if (!window.api || !window.api.clients) {
        document.body.innerHTML = "<h1>ERREUR: Une API essentielle est manquante.</h1>";
        return;
    }

    // --- Éléments du DOM ---
    const clientSearchInput = document.getElementById('clientSearch');
    const clientListTbody = document.getElementById('client-list');
    const addClientBtn = document.getElementById('addClientBtn');
    const clientModal = document.getElementById('clientModal');
    const clientForm = document.getElementById('clientForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const modalTitle = document.getElementById('modalTitle');
    const deleteClientBtn = document.getElementById('deleteClientBtn');
    const filterDebtorsBtn = document.getElementById('filterDebtors');
    const clearFiltersBtn = document.getElementById('clearFilters');

    // Éléments des statistiques
    const totalClientsEl = document.getElementById('totalClients');
    const totalDebtorsEl = document.getElementById('totalDebtors');
    const totalCreditEl = document.getElementById('totalCredit');
    const healthyClientsEl = document.getElementById('healthyClients');

    // La fonction showNotification est maintenant disponible globalement via notifications.js

    // --- Variables d'état ---
    let allClients = [];
    let filteredClients = [];
    let showDebtorsOnly = false;

    // --- Fonctions ---
    const loadClients = async (searchTerm = '') => {
        try {
            allClients = await window.api.clients.getAll(searchTerm);
            // Exclure le client de passage (id = 1)
            allClients = allClients.filter(c => c.id !== 1);

            applyFiltersAndSort();
            updateStatistics();
        } catch (error) {
            console.error("Erreur lors du chargement des clients:", error);
            showNotification('Erreur lors du chargement des clients', 'error');
        }
    };

    const applyFiltersAndSort = () => {
        let clients = [...allClients];

        // Appliquer le filtre de recherche
        const searchTerm = clientSearchInput.value.toLowerCase();
        if (searchTerm) {
            clients = clients.filter(c =>
                c.name.toLowerCase().includes(searchTerm) ||
                (c.phone && c.phone.toLowerCase().includes(searchTerm)) ||
                (c.ice && c.ice.toLowerCase().includes(searchTerm))
            );
        }

        // Appliquer le filtre débiteurs
        if (showDebtorsOnly) {
            clients = clients.filter(c => (c.credit_balance || 0) > 0);
        }

        // Tri par défaut par nom (A-Z)
        clients.sort((a, b) => a.name.localeCompare(b.name));

        filteredClients = clients;
        renderClients();
    };

    const renderClients = () => {
        clientListTbody.innerHTML = '';

        if (filteredClients.length === 0) {
            clientListTbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-8">
                        <div class="flex flex-col items-center">
                            <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                            <p class="text-gray-500 dark:text-gray-400">${t('no_client_found')}</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        filteredClients.forEach(c => {
            const tr = document.createElement('tr');
            tr.className = 'border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors';

            // CORRECTION: Utiliser credit_balance au lieu de credit
            const clientCredit = c.credit_balance || 0;
            const creditClass = clientCredit > 0 ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-green-600 bg-green-50 dark:bg-green-900/20';

            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                                ${c.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-bold text-gray-900 dark:text-white">${c.name}</div>
                            ${clientCredit > 0 ? '<div class="text-xs text-red-500 font-medium">Débiteur</div>' : '<div class="text-xs text-green-500 font-medium">À jour</div>'}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                    ${c.phone ? `<a href="tel:${c.phone}" class="text-blue-600 hover:text-blue-800">${c.phone}</a>` : '<span class="text-gray-400">N/A</span>'}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                    ${c.ice || '<span class="text-gray-400">N/A</span>'}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-300 max-w-xs truncate">
                    ${c.address || '<span class="text-gray-400">N/A</span>'}
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${creditClass}">
                        ${clientCredit.toFixed(2)} MAD
                    </span>
                </td>
                <td class="px-6 py-4 text-right text-sm font-medium">
                    <button class="edit-btn inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors" data-id="${c.id}">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        ${t('edit')}
                    </button>
                </td>
            `;

            clientListTbody.appendChild(tr);
        });
    };

    const updateStatistics = () => {
        const totalClients = allClients.length;
        const debtors = allClients.filter(c => (c.credit_balance || 0) > 0);
        const totalDebtors = debtors.length;
        const totalCredit = debtors.reduce((sum, c) => sum + (c.credit_balance || 0), 0);
        const healthyClients = totalClients - totalDebtors;

        totalClientsEl.textContent = totalClients;
        totalDebtorsEl.textContent = totalDebtors;
        totalCreditEl.textContent = `${totalCredit.toFixed(2)} MAD`;
        healthyClientsEl.textContent = healthyClients;
    };

    const openModalForEdit = (client) => {
        modalTitle.textContent = t('edit_client_modal_title');
        clientForm.dataset.mode = 'edit';
        
        document.getElementById('clientId').value = client.id;
        document.getElementById('clientName').value = client.name;
        document.getElementById('clientPhone').value = client.phone;
        document.getElementById('clientIce').value = client.ice;
        document.getElementById('clientAddress').value = client.address;
        
        deleteClientBtn.classList.remove('hidden');
        clientModal.classList.replace('hidden', 'flex');
    };

    const openModalForAdd = () => {
        modalTitle.textContent = t('add_client_modal_title');
        clientForm.dataset.mode = 'add';
        clientForm.reset();
        document.getElementById('clientId').value = '';
        deleteClientBtn.classList.add('hidden');
        clientModal.classList.replace('hidden', 'flex');
        // Pas de focus automatique pour éviter les conflits avec les événements clavier
    };

    const closeModal = () => {
        clientModal.classList.replace('flex', 'hidden');
        clientForm.reset();
    };

    // --- Écouteurs d'événements ---
    addClientBtn.addEventListener('click', openModalForAdd);
    cancelBtn.addEventListener('click', closeModal);

    clientListTbody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const id = parseInt(e.target.dataset.id, 10);
            const client = await window.api.clients.getById(id);
            if (client) openModalForEdit(client);
        }
    });

    clientSearchInput.addEventListener('input', () => {
        loadClients(clientSearchInput.value);
    });

    clientForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Empêcher les soumissions multiples
        const submitButton = e.target.querySelector('button[type="submit"]');
        if (submitButton && submitButton.disabled) {
            return; // Déjà en cours de traitement
        }

        const id = document.getElementById('clientId').value;
        const clientData = {
            name: document.getElementById('clientName').value.trim(),
            phone: document.getElementById('clientPhone').value.trim(),
            ice: document.getElementById('clientIce').value.trim(),
            address: document.getElementById('clientAddress').value.trim(),
        };

        // Validation côté client
        if (!clientData.name) {
            showNotification("Le nom du client est obligatoire.", 'error');
            return;
        }

        // Désactiver le bouton pendant le traitement
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = id ? 'Modification...' : 'Ajout...';
        }

        try {
            if (id) {
                // Mode modification - pas de validation spéciale pour l'instant
                await window.api.clients.update({ id: parseInt(id), ...clientData });
                showNotification('Client modifié avec succès', 'success');
                closeModal();
                loadClients();
            } else {
                // Mode ajout - utiliser la nouvelle validation
                await handleClientAdd(clientData);
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du client:', error);
            showNotification(t('operation_failed') + ': ' + error.message, 'error');
        } finally {
            // Réactiver le bouton
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = id ? 'Modifier' : 'Ajouter';
            }
        }
    });
    
    deleteClientBtn.addEventListener('click', async () => {
        const id = parseInt(document.getElementById('clientId').value, 10);
        const confirmed = await window.showConfirmation(t('confirm_delete_client'));
        if (confirmed) {
            try {
                await window.api.clients.delete(id);
                closeModal();
                loadClients();
            } catch (error) {
                showNotification(t('delete_failed') + ': ' + error.message, 'error');
            }
        }
    });

    // --- Event Listeners pour les filtres et tri ---
    clientSearchInput.addEventListener('input', () => {
        applyFiltersAndSort();
    });

    filterDebtorsBtn.addEventListener('click', () => {
        showDebtorsOnly = true;
        filterDebtorsBtn.classList.add('bg-orange-600');
        filterDebtorsBtn.classList.remove('bg-orange-500');
        clearFiltersBtn.classList.add('bg-gray-600');
        clearFiltersBtn.classList.remove('bg-gray-500');
        applyFiltersAndSort();
    });

    clearFiltersBtn.addEventListener('click', () => {
        showDebtorsOnly = false;
        clientSearchInput.value = '';

        filterDebtorsBtn.classList.remove('bg-orange-600');
        filterDebtorsBtn.classList.add('bg-orange-500');
        clearFiltersBtn.classList.remove('bg-gray-600');
        clearFiltersBtn.classList.add('bg-gray-500');

        applyFiltersAndSort();
    });

    // --- Initialisation ---
    // --- Fonctions de gestion des validations clients ---

    // Gérer l'ajout d'un client avec validation
    async function handleClientAdd(clientData) {
        try {
            await window.api.clients.add(clientData);
            showNotification('Client ajouté avec succès', 'success');
            closeModal();
            loadClients();
        } catch (error) {
            console.error('Erreur lors de l\'ajout du client:', error);

            // Analyser le type d'erreur
            if (error.message.startsWith('ICE_EXISTS:')) {
                handleICEError(error.message, clientData);
            } else if (error.message.startsWith('PHONE_EXISTS:')) {
                handlePhoneError(error.message, clientData);
            } else if (error.message.startsWith('SIMILAR_NAME_FOUND:')) {
                handleSimilarNameFound(error.message, clientData);
            } else {
                // Erreur générique
                showNotification('Erreur lors de l\'ajout : ' + error.message, 'error');
            }
        }
    }

    // Gérer l'erreur ICE existant
    function handleICEError(errorMessage, clientData) {
        const [, existingName, existingPhone, existingId] = errorMessage.split(':');

        if (window.clientValidation) {
            window.clientValidation.showICEError(
                existingName,
                existingPhone,
                clientData.ice,
                parseInt(existingId)
            );
        } else {
            showNotification(`ICE ${clientData.ice} déjà utilisé par ${existingName}`, 'error');
        }
    }

    // Gérer l'erreur téléphone existant
    function handlePhoneError(errorMessage, clientData) {
        const [, existingName, existingICE, existingId] = errorMessage.split(':');

        if (window.clientValidation) {
            window.clientValidation.showPhoneError(
                existingName,
                existingICE,
                clientData.phone,
                parseInt(existingId)
            );
        } else {
            showNotification(`Téléphone ${clientData.phone} déjà utilisé par ${existingName}`, 'error');
        }
    }

    // Gérer la détection de nom similaire
    function handleSimilarNameFound(errorMessage, clientData) {
        const [, similarInfo] = errorMessage.split(':', 2);
        const similarClients = similarInfo.split('|').map(info => {
            const [id, name, phone, ice] = info.split(':');
            return { id: parseInt(id), name, phone, ice };
        });

        if (window.clientValidation) {
            window.clientValidation.showSimilarNameAlert(
                clientData.name,
                similarClients,
                () => forceAddClient(clientData), // Continuer quand même
                (clientId) => editExistingClient(clientId) // Modifier l'existant
            );
        } else {
            // Fallback si la validation n'est pas disponible
            const proceed = confirm(`Un client similaire existe : ${similarClients[0].name}. Continuer quand même ?`);
            if (proceed) {
                forceAddClient(clientData);
            }
        }
    }

    // Forcer l'ajout d'un client malgré un nom similaire
    async function forceAddClient(clientData) {
        try {
            await window.api.clients.forceAdd(clientData);
            showNotification('Client ajouté avec succès', 'success');
            closeModal();
            loadClients();
        } catch (error) {
            console.error('Erreur lors de l\'ajout forcé:', error);

            // Même en mode forcé, ICE et téléphone restent bloquants
            if (error.message.startsWith('ICE_EXISTS:')) {
                handleICEError(error.message, clientData);
            } else if (error.message.startsWith('PHONE_EXISTS:')) {
                handlePhoneError(error.message, clientData);
            } else {
                showNotification('Erreur lors de l\'ajout : ' + error.message, 'error');
            }
        }
    }

    // Modifier un client existant
    function editExistingClient(clientId) {
        // Fermer le modal actuel
        closeModal();

        // Charger et ouvrir le client pour modification
        setTimeout(async () => {
            try {
                const client = await window.api.clients.getById(clientId);
                if (client) {
                    openModalForEdit(client);
                }
            } catch (error) {
                console.error('Erreur lors du chargement du client:', error);
                showNotification('Erreur lors du chargement du client', 'error');
            }
        }, 100);
    }

    // Configurer le callback pour modifier un client existant depuis les modales d'erreur
    if (window.clientValidation) {
        window.clientValidation.setOnModifyExistingClient(editExistingClient);
    }

    async function init() {
        if (typeof initializePage === 'function') {
            await initializePage('clients');
        }

        loadClients();
    }
    init();
});