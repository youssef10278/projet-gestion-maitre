document.addEventListener('DOMContentLoaded', async () => {
    // --- Initialisation de la traduction ---
    await window.i18n.loadTranslations();
    window.i18n.applyTranslationsToHTML();
    const t = window.i18n.t;

    // La fonction showNotification est maintenant disponible globalement via notifications.js

    // --- Vérification des API ---
    if (!window.api) { document.body.innerHTML = "<h1>ERREUR: API non disponible.</h1>"; return; }

    // --- Navigation entre sections ---
    function initSectionNavigation() {
        const navButtons = document.querySelectorAll('.section-nav-btn');
        const sections = {
            'appearance': document.getElementById('appearance-section'),
            'printing': document.getElementById('printing-section'),
            'templates': document.getElementById('templates-section'),
            'company': document.getElementById('company-section'),
            'security': document.getElementById('security-section'),
            'users': document.getElementById('users-section'),
            'data': document.getElementById('data-section')
        };

        function showSection(sectionName) {
            // Masquer toutes les sections
            Object.values(sections).forEach(section => {
                if (section) section.classList.add('hidden');
            });

            // Afficher la section sélectionnée
            if (sections[sectionName]) {
                sections[sectionName].classList.remove('hidden');
            }

            // Mettre à jour les boutons de navigation
            navButtons.forEach(btn => {
                btn.classList.remove('active', 'bg-blue-500', 'text-white');
                btn.classList.add('text-gray-600', 'dark:text-gray-400');
                if (btn.dataset.section === sectionName) {
                    btn.classList.add('active', 'bg-blue-500', 'text-white');
                    btn.classList.remove('text-gray-600', 'dark:text-gray-400');
                }
            });
        }

        // Ajouter les event listeners
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                showSection(btn.dataset.section);
            });
        });

        // Afficher la première section par défaut
        showSection('appearance');
    }

    // --- Amélioration de l'indicateur de force du mot de passe ---
    function initPasswordStrengthIndicator() {
        const newPasswordInput = document.getElementById('newPassword');
        const strengthIndicator = document.getElementById('password-strength');

        if (newPasswordInput && strengthIndicator) {
            newPasswordInput.addEventListener('input', (e) => {
                const password = e.target.value;
                const strength = calculatePasswordStrength(password);
                updatePasswordStrengthIndicator(strength);
            });
        }
    }

    function calculatePasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score += 25;
        if (password.match(/[a-z]/)) score += 25;
        if (password.match(/[A-Z]/)) score += 25;
        if (password.match(/[0-9]/)) score += 15;
        if (password.match(/[^a-zA-Z0-9]/)) score += 10;
        return Math.min(score, 100);
    }

    function updatePasswordStrengthIndicator(strength) {
        const strengthIndicator = document.getElementById('password-strength');
        if (!strengthIndicator) return;

        strengthIndicator.style.width = strength + '%';

        if (strength < 30) {
            strengthIndicator.className = 'h-2 bg-red-400 rounded-full transition-all duration-300';
        } else if (strength < 60) {
            strengthIndicator.className = 'h-2 bg-yellow-400 rounded-full transition-all duration-300';
        } else if (strength < 80) {
            strengthIndicator.className = 'h-2 bg-blue-400 rounded-full transition-all duration-300';
        } else {
            strengthIndicator.className = 'h-2 bg-green-400 rounded-full transition-all duration-300';
        }
    }

    // --- Amélioration de l'affichage des utilisateurs ---
    function updateUsersTable() {
        const tableBody = document.getElementById('usersTableBody');
        const noUsersMessage = document.getElementById('no-users-message');

        if (tableBody && tableBody.children.length === 0) {
            if (noUsersMessage) noUsersMessage.classList.remove('hidden');
        } else {
            if (noUsersMessage) noUsersMessage.classList.add('hidden');
        }
    }

    // Initialiser les nouvelles fonctionnalités
    initSectionNavigation();
    initPasswordStrengthIndicator();

    // --- Éléments du DOM ---
    const themeButtons = document.querySelectorAll('.theme-btn');
    const languageSelector = document.getElementById('language-selector');
    const companyInfoForm = document.getElementById('companyInfoForm');
    const ownerSecurityCard = document.getElementById('ownerSecurityCard');
    const ownerCredentialsForm = document.getElementById('ownerCredentialsForm');
    const sellersManagementCard = document.getElementById('sellersManagementCard');
    const addUserForm = document.getElementById('addUserForm');
    const usersTableBody = document.getElementById('usersTableBody');

    // --- GESTION DU THÈME ---
    const updateThemeButtons = (activeTheme) => { themeButtons.forEach(button => { if (button.dataset.theme === activeTheme) { button.classList.add('bg-blue-600', 'text-white'); button.classList.remove('bg-gray-200', 'dark:bg-gray-700'); } else { button.classList.remove('bg-blue-600', 'text-white'); button.classList.add('bg-gray-200', 'dark:bg-gray-700'); } }); };
    themeButtons.forEach(button => { button.addEventListener('click', async () => { const theme = button.dataset.theme; await window.api.theme.set(theme); updateThemeButtons(theme); }); });

    // --- GESTION DE LA LANGUE ---
    languageSelector.addEventListener('change', async () => {
        const selectedLang = languageSelector.value;
        await window.api.settings.language.set(selectedLang);

        // Créer une modal de confirmation non-bloquante
        showLanguageChangeConfirmation(selectedLang);
    });

    function showLanguageChangeConfirmation(selectedLang) {
        // Créer la modal de confirmation
        const confirmModal = document.createElement('div');
        confirmModal.className = 'fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center z-50';
        confirmModal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Changement de langue</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Redémarrage requis</p>
                    </div>
                </div>

                <div class="mb-6">
                    <p class="text-gray-700 dark:text-gray-300 mb-3">
                        Pour appliquer la nouvelle langue <strong>${selectedLang === 'fr' ? 'Français' : 'العربية'}</strong>, l'application doit redémarrer.
                    </p>
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div class="flex items-start gap-2">
                            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <p class="text-sm text-blue-700 dark:text-blue-300">
                                Vos données seront sauvegardées automatiquement avant le redémarrage.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="flex gap-3 justify-end">
                    <button id="cancelLanguageChange" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors duration-200">
                        Annuler
                    </button>
                    <button id="confirmLanguageChange" class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Redémarrer maintenant
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmModal);

        // Event listeners pour les boutons
        const cancelBtn = confirmModal.querySelector('#cancelLanguageChange');
        const confirmBtn = confirmModal.querySelector('#confirmLanguageChange');

        cancelBtn.addEventListener('click', async () => {
            // Restaurer la langue précédente
            try {
                const currentLang = await window.api.settings.language.get();
                languageSelector.value = currentLang || 'fr';
                showNotification('Changement de langue annulé', 'info');
            } catch (error) {
                console.error('Erreur lors de la restauration de la langue:', error);
                languageSelector.value = 'fr'; // Valeur par défaut
            }
            document.body.removeChild(confirmModal);
        });

        confirmBtn.addEventListener('click', async () => {
            try {
                showNotification('Redémarrage de l\'application...', 'info');
                // Petit délai pour que la notification s'affiche
                setTimeout(async () => {
                    await window.api.app.reload();
                }, 500);
            } catch (error) {
                console.error('Erreur lors du redémarrage:', error);
                showNotification('Erreur lors du redémarrage de l\'application', 'error');
            }
            document.body.removeChild(confirmModal);
        });

        // Fermer avec Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                cancelBtn.click();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Fermer en cliquant à l'extérieur
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                cancelBtn.click();
            }
        });
    }

    // --- GESTION DU LOGO ---
    let currentLogoData = null;

    const uploadLogoBtn = document.getElementById('upload-logo-btn');
    const removeLogoBtn = document.getElementById('remove-logo-btn');
    const logoInput = document.getElementById('company_logo');
    const logoPreview = document.getElementById('logo-preview');
    const logoInfo = document.getElementById('logo-info');
    const logoFilename = document.getElementById('logo-filename');
    const logoFilesize = document.getElementById('logo-filesize');

    // Fonction pour afficher l'aperçu du logo
    function displayLogoPreview(logoData) {
        if (logoData) {
            logoPreview.innerHTML = `<img src="${logoData}" alt="Logo" class="w-full h-full object-contain rounded-lg">`;
            removeLogoBtn.classList.remove('hidden');
        } else {
            logoPreview.innerHTML = `
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
            `;
            removeLogoBtn.classList.add('hidden');
            logoInfo.classList.add('hidden');
        }
    }

    // Fonction pour formater la taille du fichier
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Gestionnaire pour le bouton de téléchargement
    uploadLogoBtn.addEventListener('click', () => {
        logoInput.click();
    });

    // Gestionnaire pour la sélection de fichier
    logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Vérifier le type de fichier
            if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
                showNotification('Format de fichier non supporté. Utilisez PNG, JPG ou JPEG.', 'error');
                return;
            }

            // Vérifier la taille du fichier (2MB max)
            if (file.size > 2 * 1024 * 1024) {
                showNotification('Le fichier est trop volumineux. Taille maximale : 2 MB.', 'error');
                return;
            }

            // Lire le fichier et créer l'aperçu
            const reader = new FileReader();
            reader.onload = (e) => {
                currentLogoData = e.target.result;
                displayLogoPreview(currentLogoData);

                // Afficher les informations du fichier
                logoFilename.textContent = file.name;
                logoFilesize.textContent = formatFileSize(file.size);
                logoInfo.classList.remove('hidden');

                showNotification('Logo téléchargé avec succès. N\'oubliez pas de sauvegarder.', 'success');
            };
            reader.readAsDataURL(file);
        }
    });

    // Gestionnaire pour supprimer le logo
    removeLogoBtn.addEventListener('click', () => {
        currentLogoData = null;
        logoInput.value = '';
        displayLogoPreview(null);
        showNotification('Logo supprimé. N\'oubliez pas de sauvegarder.', 'info');
    });

    // --- GESTION INFOS SOCIÉTÉ ---
    companyInfoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const companyData = {
            name: document.getElementById('company_name').value,
            address: document.getElementById('company_address').value,
            phone: document.getElementById('company_phone').value,
            ice: document.getElementById('company_ice').value,
            email: document.getElementById('company_email').value,
            website: document.getElementById('company_website').value,
            logo: currentLogoData // Ajouter le logo aux données
        };
        try {
            await window.api.settings.saveCompanyInfo(companyData);
            showNotification('Informations de la société sauvegardées avec succès !', 'success');
        } catch (error) {
            console.error("Erreur de sauvegarde:", error);
            showNotification("La sauvegarde a échoué : " + error.message, 'error');
        }
    });

    // --- GESTION SÉCURITÉ PROPRIÉTAIRE ---
    ownerCredentialsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newUsername = document.getElementById('ownerUsername').value;
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        if (newPassword !== confirmNewPassword) { showNotification(t('passwords_do_not_match'), 'warning'); return; }
        try {
            const result = await window.api.users.updateCredentials({ newUsername, currentPassword, newPassword: newPassword || null, });
            showNotification(t(result.message), 'success'); // Assumant que le message est une clé de traduction
            ownerCredentialsForm.reset();
        } catch (error) { console.error("Erreur de mise à jour:", error); showNotification(`${t('update_credentials_failed')}: ${error.message}`, 'error'); }
    });

    // --- GESTION DES VENDEURS ---
    async function loadUsers() {
        try {
            const users = await window.api.users.getAll();
            usersTableBody.innerHTML = '';

            const sellers = users.filter(u => u.role !== 'Propriétaire');

            sellers.forEach(user => {
                const tr = document.createElement('tr');
                tr.className = 'table-row';
                tr.innerHTML = `
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                ${user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div class="font-medium text-gray-900 dark:text-white">${user.username}</div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">Vendeur</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                            </svg>
                            Actif
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button class="change-password-btn bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200" data-id="${user.id}" data-username="${user.username}">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2h-3m-1 1L9 6 5 10l4 4"></path>
                                </svg>
                                ${t('change_password_button')}
                            </button>
                            <button class="delete-user-btn danger-btn text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2" data-id="${user.id}">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                ${t('delete')}
                            </button>
                        </div>
                    </td>
                `;
                usersTableBody.appendChild(tr);
            });

            // Mettre à jour l'affichage du message "aucun utilisateur"
            updateUsersTable();

        } catch (error) {
            console.error("Erreur chargement vendeurs:", error);
            showNotification("Erreur lors du chargement des vendeurs", 'error');
        }
    }

    addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        if (!usernameInput.value || !passwordInput.value) { showNotification(t('fill_all_fields_alert'), 'warning'); return; }
        try {
            await window.api.users.add({ username: usernameInput.value, password: passwordInput.value });
            showNotification(t('seller_added_success').replace('%s', usernameInput.value), 'success');
            usernameInput.value = ''; passwordInput.value = '';
            loadUsers();
        } catch (error) { console.error("Erreur ajout vendeur:", error); showNotification(`${t('add_seller_failed')}: ${error.message}`, 'error'); }
    });

    usersTableBody.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.classList.contains('delete-user-btn')) {
            const userId = target.dataset.id;
            if (await window.showConfirmation(t('confirm_delete_seller'))) {
                try { await window.api.users.delete(userId); showNotification(t('seller_deleted_success'), 'success'); loadUsers(); }
                catch (error) { showNotification(`${t('delete_seller_failed')}: ${error.message}`, 'error'); }
            }
        }
        if (target.classList.contains('change-password-btn')) {
            const userId = target.dataset.id;
            const username = target.dataset.username;
            showPasswordChangeModal(userId, username);
        }
    });

    // --- MODAL DE CHANGEMENT DE MOT DE PASSE ---
    function showPasswordChangeModal(userId, username) {
        const passwordModal = document.createElement('div');
        passwordModal.className = 'fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center z-50';
        passwordModal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2h-3m-1 1L9 6 5 10l4 4"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Changer le mot de passe</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Utilisateur: ${username}</p>
                    </div>
                </div>

                <form id="passwordChangeForm" class="space-y-4">
                    <div>
                        <label for="newUserPassword" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Nouveau mot de passe
                        </label>
                        <input
                            type="password"
                            id="newUserPassword"
                            class="form-input w-full px-4 py-3 rounded-xl text-sm"
                            placeholder="Entrez le nouveau mot de passe"
                            required
                            minlength="6"
                        >
                    </div>

                    <div>
                        <label for="confirmUserPassword" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Confirmer le mot de passe
                        </label>
                        <input
                            type="password"
                            id="confirmUserPassword"
                            class="form-input w-full px-4 py-3 rounded-xl text-sm"
                            placeholder="Confirmez le nouveau mot de passe"
                            required
                            minlength="6"
                        >
                    </div>

                    <!-- Indicateur de force du mot de passe -->
                    <div>
                        <div class="text-xs text-gray-600 dark:text-gray-400 mb-2">Force du mot de passe:</div>
                        <div class="flex gap-1">
                            <div class="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                                <div id="userPasswordStrength" class="h-2 bg-red-400 rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Minimum 6 caractères recommandés
                        </div>
                    </div>

                    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <div class="flex items-start gap-2">
                            <svg class="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                            <p class="text-sm text-amber-700 dark:text-amber-300">
                                Le vendeur devra utiliser ce nouveau mot de passe lors de sa prochaine connexion.
                            </p>
                        </div>
                    </div>

                    <div class="flex gap-3 justify-end pt-4">
                        <button type="button" id="cancelPasswordChange" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors duration-200">
                            Annuler
                        </button>
                        <button type="submit" class="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Changer le mot de passe
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(passwordModal);

        // Éléments du formulaire
        const form = passwordModal.querySelector('#passwordChangeForm');
        const newPasswordInput = passwordModal.querySelector('#newUserPassword');
        const confirmPasswordInput = passwordModal.querySelector('#confirmUserPassword');
        const strengthIndicator = passwordModal.querySelector('#userPasswordStrength');
        const cancelBtn = passwordModal.querySelector('#cancelPasswordChange');

        // Indicateur de force du mot de passe
        newPasswordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            const strength = calculatePasswordStrength(password);
            updatePasswordStrengthIndicator(strength, strengthIndicator);
        });

        // Validation en temps réel
        confirmPasswordInput.addEventListener('input', () => {
            if (confirmPasswordInput.value && newPasswordInput.value !== confirmPasswordInput.value) {
                confirmPasswordInput.setCustomValidity('Les mots de passe ne correspondent pas');
            } else {
                confirmPasswordInput.setCustomValidity('');
            }
        });

        // Soumission du formulaire
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (newPassword !== confirmPassword) {
                showNotification('Les mots de passe ne correspondent pas', 'warning');
                return;
            }

            if (newPassword.length < 6) {
                showNotification('Le mot de passe doit contenir au moins 6 caractères', 'warning');
                return;
            }

            try {
                await window.api.users.updatePassword({ id: userId, password: newPassword });
                showNotification(`Mot de passe mis à jour pour ${username}`, 'success');
                document.body.removeChild(passwordModal);
            } catch (error) {
                console.error('Erreur lors de la mise à jour du mot de passe:', error);
                showNotification(`Erreur lors de la mise à jour: ${error.message}`, 'error');
            }
        });

        // Annulation
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(passwordModal);
        });

        // Fermer avec Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                cancelBtn.click();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Fermer en cliquant à l'extérieur
        passwordModal.addEventListener('click', (e) => {
            if (e.target === passwordModal) {
                cancelBtn.click();
            }
        });

        // Focus sur le premier champ
        setTimeout(() => {
            newPasswordInput.focus();
        }, 100);
    }

    // Fonction utilitaire pour mettre à jour l'indicateur de force
    function updatePasswordStrengthIndicator(strength, indicator) {
        if (!indicator) return;

        indicator.style.width = strength + '%';

        if (strength < 30) {
            indicator.className = 'h-2 bg-red-400 rounded-full transition-all duration-300';
        } else if (strength < 60) {
            indicator.className = 'h-2 bg-yellow-400 rounded-full transition-all duration-300';
        } else if (strength < 80) {
            indicator.className = 'h-2 bg-blue-400 rounded-full transition-all duration-300';
        } else {
            indicator.className = 'h-2 bg-green-400 rounded-full transition-all duration-300';
        }
    }

    // --- INITIALISATION DE LA PAGE ---
    async function initPage() {
        if (typeof initializePage === 'function') { await initializePage('settings'); }
        const currentTheme = await window.api.theme.get();
        updateThemeButtons(currentTheme || 'system');
        const currentLang = await window.api.settings.language.get();
        languageSelector.value = currentLang || 'fr';
        const info = await window.api.settings.getCompanyInfo();
        if (info) {
            document.getElementById('company_name').value = info.name || '';
            document.getElementById('company_address').value = info.address || '';
            document.getElementById('company_phone').value = info.phone || '';
            document.getElementById('company_ice').value = info.ice || '';
            document.getElementById('company_email').value = info.email || '';
            document.getElementById('company_website').value = info.website || '';

            // Charger le logo s'il existe
            if (info.logo) {
                currentLogoData = info.logo;
                displayLogoPreview(currentLogoData);
            }
        }
        const currentUser = await window.api.session.getCurrentUser();
        if (currentUser && currentUser.role === 'Propriétaire') {
            // Vérifier que les éléments existent avant de les manipuler
            if (ownerSecurityCard) {
                ownerSecurityCard.classList.remove('hidden');
            }
            if (sellersManagementCard) {
                sellersManagementCard.classList.remove('hidden');
            }

            const ownerUsernameInput = document.getElementById('ownerUsername');
            if (ownerUsernameInput) {
                ownerUsernameInput.value = currentUser.username;
            }

            // Charger les utilisateurs seulement si la fonction existe
            if (typeof loadUsers === 'function') {
                loadUsers();
            }
        } else {
            // Cacher les sections pour les non-propriétaires si nécessaire
            if (ownerSecurityCard) {
                ownerSecurityCard.classList.add('hidden');
            }
            if (sellersManagementCard) {
                sellersManagementCard.classList.add('hidden');
            }
        }

        // Initialiser les paramètres d'impression
        try {
            await initPrintingSettings();
        } catch (error) {
            console.warn('⚠️ Erreur lors de l\'initialisation des paramètres d\'impression:', error.message);
        }

        // Initialiser la section des templates avec délai
        setTimeout(async () => {
            try {
                await initTemplatesSection();
            } catch (error) {
                console.warn('⚠️ Erreur lors de l\'initialisation des templates:', error.message);
            }
        }, 1000);
    }

    // --- Gestion des Paramètres d'Impression ---
    async function initPrintingSettings() {
        const autoPrintCheckbox = document.getElementById('autoPrintTickets');
        const printingStatus = document.getElementById('printingStatus');
        const savePrintingBtn = document.getElementById('savePrintingSettings');

        if (!autoPrintCheckbox || !printingStatus || !savePrintingBtn) {
            console.warn('⚠️ Éléments de paramètres d\'impression non trouvés - Section impression peut-être masquée');
            return;
        }

        try {
            // Charger la valeur actuelle
            const currentValue = await window.api.getSetting('auto_print_tickets');
            const isEnabled = currentValue === 'true';

            autoPrintCheckbox.checked = isEnabled;
            updatePrintingStatus(isEnabled);

            // Event listener pour le changement de statut en temps réel
            autoPrintCheckbox.addEventListener('change', () => {
                updatePrintingStatus(autoPrintCheckbox.checked);
            });

            // Event listener pour la sauvegarde
            savePrintingBtn.addEventListener('click', async () => {
                await savePrintingSettings();
            });

            console.log('✅ Paramètres d\'impression initialisés');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation des paramètres d\'impression:', error);
            printingStatus.textContent = 'Erreur de chargement';
        }
    }

    function updatePrintingStatus(isEnabled) {
        const printingStatus = document.getElementById('printingStatus');
        if (printingStatus) {
            if (isEnabled) {
                printingStatus.innerHTML = `
                    <span class="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        <strong>Impression automatique activée</strong>
                    </span>
                    <br>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                        Les tickets s'imprimeront automatiquement après validation du paiement
                    </span>
                `;
            } else {
                printingStatus.innerHTML = `
                    <span class="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                        </svg>
                        <strong>Impression manuelle (mode actuel)</strong>
                    </span>
                    <br>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                        Le bouton "Imprimer Ticket" sera affiché après chaque vente
                    </span>
                `;
            }
        }
    }

    async function savePrintingSettings() {
        const autoPrintCheckbox = document.getElementById('autoPrintTickets');
        const savePrintingBtn = document.getElementById('savePrintingSettings');

        if (!autoPrintCheckbox || !savePrintingBtn) return;

        try {
            // Désactiver le bouton pendant la sauvegarde
            savePrintingBtn.disabled = true;
            savePrintingBtn.innerHTML = `
                <svg class="w-4 h-4 inline mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Enregistrement...
            `;

            // Sauvegarder le paramètre
            const value = autoPrintCheckbox.checked ? 'true' : 'false';
            await window.api.saveSetting('auto_print_tickets', value);

            // Mettre à jour le statut
            updatePrintingStatus(autoPrintCheckbox.checked);

            // Notification de succès
            showNotification('Paramètres d\'impression sauvegardés avec succès', 'success');

            console.log(`✅ Paramètre auto_print_tickets sauvegardé: ${value}`);

        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde des paramètres d\'impression:', error);
            showNotification('Erreur lors de la sauvegarde des paramètres d\'impression', 'error');
        } finally {
            // Réactiver le bouton
            savePrintingBtn.disabled = false;
            savePrintingBtn.innerHTML = `
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Enregistrer les Paramètres
            `;
        }
    }

    // --- Gestion des Templates de Factures ---
    async function initTemplatesSection() {
        try {
            console.log('🎨 Initialisation de la section templates...');

            // Vérifier que l'API est disponible
            if (!window.api || !window.api.templates) {
                console.error('❌ API templates non disponible');
                // Réessayer après 2 secondes
                setTimeout(initTemplatesSection, 2000);
                return;
            }

            // Charger les templates directement sans gestionnaire complexe
            await loadTemplatesIntoSelector();

            // Afficher le template actuel
            await updateCurrentTemplateDisplay();

            // Ajouter les event listeners de manière sécurisée
            addTemplateEventListeners();

            console.log('✅ Section templates initialisée avec succès');

        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de la section templates:', error);
            // Réessayer une fois après 3 secondes
            setTimeout(() => {
                console.log('🔄 Nouvelle tentative d\'initialisation des templates...');
                initTemplatesSection();
            }, 3000);
        }
    }

    function addTemplateEventListeners() {
        const openDesignerBtn = document.getElementById('openTemplateDesigner');
        const templateSelector = document.getElementById('templateSelector');
        const applyBtn = document.getElementById('applyTemplate');

        if (openDesignerBtn) {
            openDesignerBtn.removeEventListener('click', openTemplateDesigner); // Éviter les doublons
            openDesignerBtn.addEventListener('click', openTemplateDesigner);
            console.log('✅ Event listener ajouté pour le designer');
        }

        if (templateSelector) {
            templateSelector.removeEventListener('change', onTemplateSelectionChange);
            templateSelector.addEventListener('change', onTemplateSelectionChange);
            console.log('✅ Event listener ajouté pour le sélecteur');
        }

        if (applyBtn) {
            applyBtn.removeEventListener('click', applySelectedTemplate);
            applyBtn.addEventListener('click', applySelectedTemplate);
            console.log('✅ Event listener ajouté pour l\'application');
        }
    }

    async function loadTemplatesIntoSelector() {
        const selector = document.getElementById('templateSelector');

        if (!selector) {
            console.error('❌ Sélecteur de templates non trouvé');
            return;
        }

        try {
            console.log('📋 Chargement des templates dans le sélecteur...');

            // Charger les templates directement depuis l'API
            let templates = await window.api.templates.getAll();

            if (!templates || templates.length === 0) {
                console.log('⚠️ Aucun template trouvé');
                selector.innerHTML = '<option value="">Aucun template disponible</option>';
                return;
            }

            selector.innerHTML = '<option value="">Sélectionnez un template...</option>';

            // Grouper les templates
            const systemTemplates = templates.filter(t => t.is_system);
            const userTemplates = templates.filter(t => !t.is_system);

            console.log(`📊 Templates trouvés: ${systemTemplates.length} système, ${userTemplates.length} utilisateur`);

            // Ajouter les templates système
            if (systemTemplates.length > 0) {
                const systemGroup = document.createElement('optgroup');
                systemGroup.label = 'Templates Système';

                systemTemplates.forEach(template => {
                    const option = document.createElement('option');
                    option.value = template.id;
                    option.textContent = template.display_name + (template.is_default ? ' (Par défaut)' : '');
                    systemGroup.appendChild(option);
                });

                selector.appendChild(systemGroup);
            }

            // Ajouter les templates utilisateur
            if (userTemplates.length > 0) {
                const userGroup = document.createElement('optgroup');
                userGroup.label = 'Mes Templates';

                userTemplates.forEach(template => {
                    const option = document.createElement('option');
                    option.value = template.id;
                    option.textContent = template.display_name + (template.is_default ? ' (Par défaut)' : '');
                    userGroup.appendChild(option);
                });

                selector.appendChild(userGroup);
            }

            // Sélectionner automatiquement le template par défaut
            const defaultTemplate = templates.find(t => t.is_default);
            if (defaultTemplate) {
                selector.value = defaultTemplate.id;
                console.log(`🎯 Template par défaut présélectionné: ${defaultTemplate.display_name}`);
            }

            console.log('✅ Templates chargés dans le sélecteur');

        } catch (error) {
            console.error('❌ Erreur lors du chargement des templates:', error);
            selector.innerHTML = '<option value="">Erreur lors du chargement</option>';
        }
    }

    async function updateCurrentTemplateDisplay() {
        try {
            console.log('🔄 Mise à jour de l\'affichage du template actuel...');

            // Récupérer le template par défaut depuis l'API
            const defaultTemplate = await window.api.templates.getDefault();

            const nameElement = document.getElementById('currentTemplateName');
            if (nameElement && defaultTemplate) {
                nameElement.textContent = defaultTemplate.display_name;

                // Parser les configurations JSON
                const colors = JSON.parse(defaultTemplate.colors_config || '{}');

                // Mettre à jour les couleurs d'aperçu si disponibles
                const colorElements = document.querySelectorAll('#templates-section .w-6.h-6');

                if (colorElements.length >= 3) {
                    colorElements[0].style.backgroundColor = colors.primary || '#3b82f6';
                    colorElements[1].style.backgroundColor = colors.secondary || '#f97316';
                    colorElements[2].style.backgroundColor = colors.header_gradient_end || '#1e40af';
                }

                console.log(`✅ Template actuel affiché: ${defaultTemplate.display_name}`);
            } else {
                console.log('⚠️ Aucun template par défaut trouvé');
                if (nameElement) {
                    nameElement.textContent = 'Aucun template sélectionné';
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour de l\'affichage du template:', error);
            const nameElement = document.getElementById('currentTemplateName');
            if (nameElement) {
                nameElement.textContent = 'Erreur de chargement';
            }
        }
    }

    function openTemplateDesigner() {
        // Ouvrir le designer de templates dans une nouvelle fenêtre ou rediriger
        window.location.href = './template-designer.html';
    }

    function onTemplateSelectionChange() {
        const selector = document.getElementById('templateSelector');
        const applyButton = document.getElementById('applyTemplate');

        applyButton.disabled = !selector.value;

        if (selector.value) {
            applyButton.textContent = '✨ Appliquer le Template';
            applyButton.classList.remove('bg-gray-400');
            applyButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
        } else {
            applyButton.textContent = '✨ Appliquer le Template';
            applyButton.classList.add('bg-gray-400');
            applyButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        }
    }

    async function applySelectedTemplate() {
        const selector = document.getElementById('templateSelector');
        const templateId = parseInt(selector.value);

        if (!templateId) {
            showNotification('Veuillez sélectionner un template', 'warning');
            return;
        }

        try {
            console.log(`🔄 Application du template ID: ${templateId}`);

            const result = await window.api.templates.setDefault(templateId);

            if (result.success) {
                console.log('✅ Template défini comme par défaut');

                // Mettre à jour le gestionnaire de templates si disponible
                if (window.templateManager) {
                    window.templateManager.setCurrentTemplate(templateId);
                }

                // Mettre à jour l'affichage
                await updateCurrentTemplateDisplay();
                await loadTemplatesIntoSelector();

                showNotification('Template appliqué avec succès', 'success');

                // Réinitialiser la sélection
                selector.value = '';
                onTemplateSelectionChange();

            } else {
                console.error('❌ Erreur lors de l\'application:', result.error);
                showNotification('Erreur lors de l\'application du template: ' + (result.error || 'Erreur inconnue'), 'error');
            }

        } catch (error) {
            console.error('❌ Erreur lors de l\'application du template:', error);
            showNotification('Erreur lors de l\'application du template', 'error');
        }
    }

    // --- GESTION DES DONNÉES - RÉINITIALISATION ---
    async function initDataManagement() {
        const factoryResetBtn = document.getElementById('factory-reset-btn');
        const productsCount = document.getElementById('products-count');
        const clientsCount = document.getElementById('clients-count');
        const salesCount = document.getElementById('sales-count');

        // Charger les statistiques des données
        async function loadDataStats() {
            try {
                const [products, clients, sales] = await Promise.all([
                    window.api.products.getAll(),
                    window.api.clients.getAll(),
                    window.api.sales.getAll()
                ]);

                productsCount.textContent = products?.length || 0;
                clientsCount.textContent = clients?.length || 0;
                salesCount.textContent = sales?.length || 0;
            } catch (error) {
                console.error('❌ Erreur lors du chargement des statistiques:', error);
                productsCount.textContent = '?';
                clientsCount.textContent = '?';
                salesCount.textContent = '?';
            }
        }

        // Fonction de réinitialisation complète
        async function performFactoryReset() {
            try {
                console.log('🧹 Début de la réinitialisation complète...');

                const result = await window.api.app.factoryReset();

                if (result.success) {
                    showNotification('🗑️ RÉINITIALISATION TOTALE RÉUSSIE ! Toutes les données ont été supprimées définitivement.', 'success');

                    // Afficher les détails de ce qui a été supprimé
                    console.log('📋 Données supprimées:', result.details.deleted);

                    // Recharger les statistiques
                    await loadDataStats();

                    // Redémarrage recommandé après réinitialisation totale
                    setTimeout(() => {
                        if (result.details.restart_required) {
                            showNotification('🔄 Redémarrage de l\'application recommandé...', 'info');
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        } else {
                            window.location.reload();
                        }
                    }, 3000);

                } else {
                    console.error('❌ Erreur lors de la réinitialisation TOTALE:', result.message);
                    showNotification('❌ Erreur: ' + result.message, 'error');
                }

            } catch (error) {
                console.error('❌ Erreur lors de la réinitialisation:', error);
                showNotification('❌ Erreur lors de la réinitialisation: ' + error.message, 'error');
            }
        }

        // Modal de confirmation pour la réinitialisation
        function showFactoryResetConfirmation() {
            const modal = document.getElementById('confirmationModal');
            modal.innerHTML = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
                        <div class="p-6">
                            <div class="flex items-center gap-4 mb-4">
                                <div class="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                                    <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-red-800 dark:text-red-200">⚠️ ATTENTION DANGER</h3>
                                    <p class="text-sm text-red-600 dark:text-red-400">Action irréversible</p>
                                </div>
                            </div>

                            <div class="mb-6">
                                <p class="text-gray-700 dark:text-gray-300 mb-4">
                                    Vous êtes sur le point de <strong class="text-red-600">SUPPRIMER DÉFINITIVEMENT TOUT</strong> :
                                </p>
                                <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg max-h-40 overflow-y-auto">
                                    <li>🗑️ Tous les produits et stocks</li>
                                    <li>🗑️ Tous les clients</li>
                                    <li>🗑️ Toutes les ventes et historique</li>
                                    <li>🗑️ Toutes les factures</li>
                                    <li>🗑️ <strong>Tous les devis</strong></li>
                                    <li>🗑️ <strong>Tous les bons de livraison</strong></li>
                                    <li>🗑️ Tous les retours</li>
                                    <li>🗑️ Tous les fournisseurs</li>
                                    <li>🗑️ Toutes les dépenses</li>
                                    <li>🗑️ Tous les templates</li>
                                    <li>🗑️ <strong>Tous les utilisateurs</strong></li>
                                    <li>🗑️ <strong>Tous les paramètres entreprise</strong></li>
                                </ul>
                                <p class="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                                    ⚠️ <strong>RÉINITIALISATION TOTALE :</strong> Seule la structure de base sera conservée
                                </p>
                            </div>

                            <div class="mb-6">
                                <label class="flex items-center gap-3">
                                    <input type="checkbox" id="confirm-reset-checkbox" class="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500">
                                    <span class="text-sm text-gray-700 dark:text-gray-300">
                                        Je comprends que cette action est <strong>irréversible</strong>
                                    </span>
                                </label>
                            </div>

                            <div class="flex gap-3">
                                <button id="cancel-reset-btn" class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                    Annuler
                                </button>
                                <button id="confirm-reset-btn" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                                    🗑️ SUPPRIMER TOUT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Gestion de la checkbox de confirmation
            const checkbox = document.getElementById('confirm-reset-checkbox');
            const confirmBtn = document.getElementById('confirm-reset-btn');

            checkbox.addEventListener('change', () => {
                confirmBtn.disabled = !checkbox.checked;
            });

            // Bouton d'annulation
            document.getElementById('cancel-reset-btn').addEventListener('click', () => {
                modal.innerHTML = '';
            });

            // Bouton de confirmation
            confirmBtn.addEventListener('click', async () => {
                modal.innerHTML = '';
                await performFactoryReset();
            });
        }

        // Event listener pour le bouton de réinitialisation
        if (factoryResetBtn) {
            factoryResetBtn.addEventListener('click', showFactoryResetConfirmation);
        }

        // Charger les statistiques au démarrage
        await loadDataStats();
    }

    initPage();

    // Initialiser la gestion des données
    initDataManagement();
});