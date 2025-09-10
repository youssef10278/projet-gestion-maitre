document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');
    const loginButton = document.getElementById('loginButton');
    const loginButtonText = document.getElementById('loginButtonText');
    const loginSpinner = document.getElementById('loginSpinner');
    const togglePassword = document.getElementById('togglePassword');
    const closeWindowBtn = document.getElementById('closeWindow');
    const themeToggleBtn = document.getElementById('themeToggle');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');

    // Initialisation du thème
    function initTheme() {
        // Vérifier le thème sauvegardé ou utiliser la préférence système
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        let isDark = false;
        if (savedTheme) {
            isDark = savedTheme === 'dark';
        } else {
            isDark = systemPrefersDark;
        }

        updateTheme(isDark);
    }

    // Fonction pour mettre à jour le thème
    function updateTheme(isDark) {
        if (isDark) {
            document.documentElement.classList.add('dark');
            if (sunIcon) sunIcon.classList.remove('hidden');
            if (moonIcon) moonIcon.classList.add('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            if (sunIcon) sunIcon.classList.add('hidden');
            if (moonIcon) moonIcon.classList.remove('hidden');
        }

        // Sauvegarder la préférence
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    // Basculement de thème
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.contains('dark');
            updateTheme(!isDark);
        });
    }

    // Fonctionnalité de fermeture de fenêtre
    if (closeWindowBtn) {
        closeWindowBtn.addEventListener('click', () => {
            if (window.api && window.api.app && window.api.app.quit) {
                window.api.app.quit();
            } else {
                window.close();
            }
        });
    }

    // Fonctionnalité de basculement du mot de passe
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Changer l'icône
            const icon = togglePassword.querySelector('svg');
            if (type === 'text') {
                icon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                `;
            } else {
                icon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                `;
            }
        });
    }

    // Fonction pour afficher l'état de chargement
    function setLoadingState(isLoading) {
        if (loginButton && loginButtonText && loginSpinner) {
            if (isLoading) {
                loginButton.disabled = true;
                loginButtonText.textContent = 'Connexion...';
                loginSpinner.classList.remove('hidden');
                loginButton.classList.add('opacity-75');
            } else {
                loginButton.disabled = false;
                loginButtonText.textContent = 'Se Connecter';
                loginSpinner.classList.add('hidden');
                loginButton.classList.remove('opacity-75');
            }
        }
    }

    // Fonction pour afficher les erreurs avec animation
    function showError(message) {
        if (errorMessage) {
            const errorText = errorMessage.querySelector('span');
            if (errorText) {
                errorText.textContent = message;
            } else {
                errorMessage.textContent = message;
            }
            errorMessage.classList.remove('hidden');

            // Animation d'apparition
            errorMessage.style.opacity = '0';
            errorMessage.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                errorMessage.style.transition = 'all 0.3s ease';
                errorMessage.style.opacity = '1';
                errorMessage.style.transform = 'translateY(0)';
            }, 10);
        }
    }

    // Fonction pour masquer les erreurs
    function hideError() {
        if (errorMessage) {
            errorMessage.classList.add('hidden');
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            // Validation côté client
            if (!username) {
                showError('Veuillez entrer votre nom d\'utilisateur');
                return;
            }

            if (!password) {
                showError('Veuillez entrer votre mot de passe');
                return;
            }

            // Masquer les erreurs précédentes
            hideError();

            // Afficher l'état de chargement
            setLoadingState(true);

            try {
                // On utilise le chemin d'API correct et structuré
                const user = await window.api.session.authenticate(username, password);

                if (user) {
                    // Animation de succès
                    if (loginButtonText) {
                        loginButtonText.textContent = 'Connexion réussie !';
                    }
                    if (loginButton) {
                        loginButton.classList.add('bg-green-500');
                    }

                    console.log("Authentification réussie pour l'utilisateur:", user.username);
                    // main.js gère la redirection de la fenêtre
                } else {
                    // L'API a retourné null, signifiant que les identifiants sont incorrects.
                    setLoadingState(false);
                    showError('Nom d\'utilisateur ou mot de passe incorrect');

                    // Secouer le formulaire pour indiquer l'erreur
                    if (loginForm) {
                        loginForm.style.animation = 'shake 0.5s ease-in-out';
                        setTimeout(() => {
                            loginForm.style.animation = '';
                        }, 500);
                    }
                }
            } catch (error) {
                // Une erreur s'est produite lors de la communication avec le processus principal.
                console.error('Erreur de connexion:', error);
                setLoadingState(false);
                showError(`Erreur de connexion: ${error.message}`);

                // Secouer le formulaire
                if (loginForm) {
                    loginForm.style.animation = 'shake 0.5s ease-in-out';
                    setTimeout(() => {
                        loginForm.style.animation = '';
                    }, 500);
                }
            }
        });
    }

    // Animation de secousse pour les erreurs
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);

    // Focus automatique sur le champ nom d'utilisateur
    if (usernameInput) {
        setTimeout(() => {
            usernameInput.focus();
        }, 500);
    }

    // Gestion des raccourcis clavier
    document.addEventListener('keydown', (e) => {
        // Échap pour fermer la fenêtre
        if (e.key === 'Escape') {
            if (closeWindowBtn) {
                closeWindowBtn.click();
            }
        }
    });

    // Initialiser le thème au chargement
    initTheme();
});