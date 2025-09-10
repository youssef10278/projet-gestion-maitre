/**
 * Script d'initialisation des templates de factures
 * Charge et insère les templates prédéfinis dans la base de données
 */

async function initializeTemplates() {
    try {
        console.log('🎨 Initialisation des templates de factures...');

        // Vérifier si des templates existent déjà
        const existingTemplates = await window.api.templates.getAll();
        
        if (existingTemplates && existingTemplates.length > 0) {
            console.log(`✅ ${existingTemplates.length} templates déjà présents`);
            return true;
        }

        // Templates prédéfinis à charger
        const systemTemplates = [
            {
                file: 'atlas-default.json',
                isDefault: true
            },
            {
                file: 'modern-clean.json',
                isDefault: false
            },
            {
                file: 'classic-traditional.json',
                isDefault: false
            },
            {
                file: 'minimal-bw.json',
                isDefault: false
            }
        ];

        let successCount = 0;

        for (const template of systemTemplates) {
            try {
                // Charger la configuration du template
                const response = await fetch(`./templates/${template.file}`);
                if (!response.ok) {
                    console.warn(`⚠️ Template ${template.file} non trouvé`);
                    continue;
                }

                const templateConfig = await response.json();

                // Préparer les données pour la base de données
                const templateData = {
                    name: templateConfig.name,
                    display_name: templateConfig.display_name,
                    colors_config: templateConfig.colors_config,
                    fonts_config: templateConfig.fonts_config,
                    layout_config: templateConfig.layout_config,
                    user_created: 0, // Template système
                    is_system: 1
                };

                // Créer le template dans la base de données
                const result = await window.api.templates.create(templateData);

                if (result.success) {
                    console.log(`✅ Template créé: ${templateConfig.display_name}`);
                    successCount++;

                    // Définir comme template par défaut si nécessaire
                    if (template.isDefault) {
                        await window.api.templates.setDefault(result.templateId);
                        console.log(`🎯 Template par défaut défini: ${templateConfig.display_name}`);
                    }
                } else {
                    console.error(`❌ Erreur lors de la création du template ${templateConfig.display_name}:`, result.error);
                }

            } catch (error) {
                console.error(`❌ Erreur lors du traitement du template ${template.file}:`, error);
            }
        }

        console.log(`🎉 Initialisation terminée: ${successCount}/${systemTemplates.length} templates créés`);
        return successCount > 0;

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation des templates:', error);
        return false;
    }
}

/**
 * Vérifie et initialise les templates au démarrage de l'application
 */
async function checkAndInitializeTemplates() {
    try {
        // Attendre que l'API soit disponible
        if (!window.api || !window.api.templates) {
            console.log('⏳ En attente de l\'API templates...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return checkAndInitializeTemplates();
        }

        // Initialiser les templates
        const success = await initializeTemplates();
        
        if (success) {
            // Déclencher un événement pour notifier que les templates sont prêts
            window.dispatchEvent(new CustomEvent('templatesReady'));
        }

        return success;

    } catch (error) {
        console.error('❌ Erreur lors de la vérification des templates:', error);
        return false;
    }
}

// Auto-initialisation au chargement de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndInitializeTemplates);
} else {
    checkAndInitializeTemplates();
}

// Export pour utilisation dans d'autres modules
window.initializeTemplates = initializeTemplates;
window.checkAndInitializeTemplates = checkAndInitializeTemplates;
