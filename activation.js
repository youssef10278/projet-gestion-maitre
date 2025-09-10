document.addEventListener('DOMContentLoaded', () => {
    const activationForm = document.getElementById('activationForm');
    const licenseKeyInput = document.getElementById('licenseKey');
    const statusMessage = document.getElementById('statusMessage');

    if (activationForm) {
        activationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const key = licenseKeyInput.value.trim();

            if (!key) {
                statusMessage.textContent = 'Veuillez saisir une clé de licence.';
                statusMessage.style.color = 'red';
                return;
            }

            statusMessage.textContent = 'Activation en cours...';
            statusMessage.style.color = 'black';

            try {
                // On appelle directement 'activate-license' avec la clé.
                // Le processus principal (main.js) s'occupera du machineId.
                const result = await window.api.app.activateLicense(key);

                if (result.success) {
                    statusMessage.textContent = 'Activation réussie !';
                    statusMessage.style.color = 'green';
                    // Le processus principal gère la fermeture de la fenêtre et la suite.
                } else {
                    // Afficher le message d'erreur renvoyé par le serveur
                    statusMessage.textContent = `Échec de l'activation : ${result.message}`;
                    statusMessage.style.color = 'red';
                }
            } catch (error) {
                console.error('Erreur lors de l\'invocation de activate-license:', error);
                statusMessage.textContent = 'Une erreur de communication est survenue.';
                statusMessage.style.color = 'red';
            }
        });
    }
});