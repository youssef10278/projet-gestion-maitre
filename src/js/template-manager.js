/**
 * Gestionnaire des Templates de Factures
 * Gère le chargement, la sauvegarde et l'application des templates
 */

class TemplateManager {
    constructor() {
        this.templates = new Map();
        this.currentTemplate = null;
        this.defaultTemplate = null;
    }

    /**
     * Initialise le gestionnaire de templates
     */
    async initialize() {
        try {
            console.log('🎨 Initialisation du gestionnaire de templates...');
            
            // Charger les templates depuis la base de données
            await this.loadTemplatesFromDB();
            
            // Si aucun template n'existe, initialiser les templates système
            if (this.templates.size === 0) {
                await this.initializeSystemTemplates();
            }
            
            // Définir le template par défaut
            await this.setDefaultTemplate();
            
            console.log(`✅ ${this.templates.size} templates chargés`);
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation des templates:', error);
            return false;
        }
    }

    /**
     * Charge les templates depuis la base de données
     */
    async loadTemplatesFromDB() {
        try {
            const templates = await window.api.templates.getAll();
            
            for (const template of templates) {
                // Parser les configurations JSON
                template.colors_config = JSON.parse(template.colors_config || '{}');
                template.fonts_config = JSON.parse(template.fonts_config || '{}');
                template.layout_config = JSON.parse(template.layout_config || '{}');
                
                this.templates.set(template.id, template);
                
                if (template.is_default) {
                    this.defaultTemplate = template;
                    this.currentTemplate = template;
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des templates:', error);
        }
    }

    /**
     * Initialise les templates système prédéfinis
     */
    async initializeSystemTemplates() {
        const systemTemplates = [
            'atlas-default',
            'modern-clean', 
            'classic-traditional',
            'minimal-bw'
        ];

        for (const templateName of systemTemplates) {
            try {
                const templateConfig = await this.loadTemplateConfig(templateName);
                
                const templateData = {
                    name: templateConfig.name,
                    display_name: templateConfig.display_name,
                    colors_config: templateConfig.colors_config,
                    fonts_config: templateConfig.fonts_config,
                    layout_config: templateConfig.layout_config,
                    user_created: 0, // Template système
                    is_system: 1
                };

                const result = await window.api.templates.create(templateData);
                
                if (result.success) {
                    templateData.id = result.templateId;
                    this.templates.set(result.templateId, templateData);
                    console.log(`✅ Template système créé: ${templateConfig.display_name}`);
                }
            } catch (error) {
                console.error(`❌ Erreur lors de la création du template ${templateName}:`, error);
            }
        }

        // Définir ATLAS comme template par défaut
        const atlasTemplate = Array.from(this.templates.values())
            .find(t => t.name === 'atlas-default');
        
        if (atlasTemplate) {
            await window.api.templates.setDefault(atlasTemplate.id);
            atlasTemplate.is_default = 1;
            this.defaultTemplate = atlasTemplate;
            this.currentTemplate = atlasTemplate;
        }
    }

    /**
     * Charge la configuration d'un template depuis un fichier JSON
     */
    async loadTemplateConfig(templateName) {
        try {
            const response = await fetch(`./templates/${templateName}.json`);
            if (!response.ok) {
                throw new Error(`Template ${templateName} non trouvé`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Erreur lors du chargement du template ${templateName}:`, error);
            throw error;
        }
    }

    /**
     * Définit le template par défaut
     */
    async setDefaultTemplate() {
        if (!this.defaultTemplate && this.templates.size > 0) {
            // Prendre le premier template disponible
            const firstTemplate = this.templates.values().next().value;
            await window.api.templates.setDefault(firstTemplate.id);
            firstTemplate.is_default = 1;
            this.defaultTemplate = firstTemplate;
            this.currentTemplate = firstTemplate;
        }
    }

    /**
     * Récupère tous les templates
     */
    getAllTemplates() {
        return Array.from(this.templates.values());
    }

    /**
     * Récupère un template par ID
     */
    async getTemplateById(id) {
        // Essayer d'abord le cache
        let template = this.templates.get(id);

        // Si pas dans le cache ou si on veut forcer le rechargement, aller chercher en base
        if (!template) {
            console.log(`🔍 Template ${id} non trouvé dans le cache, rechargement depuis la base...`);
            try {
                template = await window.api.templates.getById(id);
                if (template) {
                    // Parser les configurations JSON
                    template.colors_config = JSON.parse(template.colors_config || '{}');
                    template.fonts_config = JSON.parse(template.fonts_config || '{}');
                    template.layout_config = JSON.parse(template.layout_config || '{}');

                    // Mettre à jour le cache
                    this.templates.set(template.id, template);
                    console.log(`✅ Template ${id} rechargé et mis en cache`);
                }
            } catch (error) {
                console.error(`❌ Erreur lors du rechargement du template ${id}:`, error);
            }
        }

        return template;
    }

    /**
     * Force le rechargement d'un template depuis la base de données
     */
    async reloadTemplateById(id) {
        console.log(`🔄 Rechargement forcé du template ${id}...`);
        try {
            const template = await window.api.templates.getById(id);
            if (template) {
                // Parser les configurations JSON
                template.colors_config = JSON.parse(template.colors_config || '{}');
                template.fonts_config = JSON.parse(template.fonts_config || '{}');
                template.layout_config = JSON.parse(template.layout_config || '{}');

                // Mettre à jour le cache
                this.templates.set(template.id, template);
                console.log(`✅ Template ${id} rechargé avec succès`);
                return template;
            }
        } catch (error) {
            console.error(`❌ Erreur lors du rechargement forcé du template ${id}:`, error);
        }
        return null;
    }

    /**
     * Récupère le template par défaut
     */
    getDefaultTemplate() {
        return this.defaultTemplate;
    }

    /**
     * Récupère le template actuel
     */
    getCurrentTemplate() {
        return this.currentTemplate || this.defaultTemplate;
    }

    /**
     * Définit le template actuel
     */
    setCurrentTemplate(templateId) {
        const template = this.templates.get(templateId);
        if (template) {
            this.currentTemplate = template;
            return true;
        }
        return false;
    }

    /**
     * Crée un nouveau template personnalisé
     */
    async createCustomTemplate(templateData) {
        try {
            const result = await window.api.templates.create({
                ...templateData,
                user_created: 1,
                is_system: 0
            });

            if (result.success) {
                templateData.id = result.templateId;
                templateData.user_created = 1;
                templateData.is_system = 0;
                this.templates.set(result.templateId, templateData);
                return { success: true, template: templateData };
            }

            return result;
        } catch (error) {
            console.error('Erreur lors de la création du template:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Met à jour un template existant
     */
    async updateTemplate(templateId, templateData) {
        try {
            const result = await window.api.templates.update(templateId, templateData);

            if (result.success) {
                const existingTemplate = this.templates.get(templateId);
                if (existingTemplate) {
                    Object.assign(existingTemplate, templateData);
                }
                return { success: true };
            }

            return result;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du template:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Supprime un template (seulement les templates utilisateur)
     */
    async deleteTemplate(templateId) {
        try {
            const template = this.templates.get(templateId);
            if (!template || template.is_system) {
                return { success: false, error: 'Impossible de supprimer un template système' };
            }

            const result = await window.api.templates.delete(templateId);

            if (result.success) {
                this.templates.delete(templateId);
                
                // Si c'était le template par défaut, en définir un autre
                if (this.defaultTemplate && this.defaultTemplate.id === templateId) {
                    await this.setDefaultTemplate();
                }
                
                return { success: true };
            }

            return result;
        } catch (error) {
            console.error('Erreur lors de la suppression du template:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Génère le CSS pour un template donné
     */
    generateTemplateCSS(template) {
        if (!template) template = this.getCurrentTemplate();
        if (!template) return '';

        const { colors_config: colors, fonts_config: fonts, layout_config: layout } = template;

        return `
            /* Template: ${template.display_name} */
            .invoice-template {
                font-family: ${fonts.primary_font || 'Arial, sans-serif'};
                font-size: ${fonts.body_size || '14px'};
                font-weight: ${fonts.body_weight || 'normal'};
                color: ${colors.primary || '#000000'};
            }

            .invoice-header-professional {
                background: linear-gradient(135deg, ${colors.header_gradient_start || colors.primary} 0%, ${colors.header_gradient_end || colors.primary_dark} 100%);
                height: ${layout.header_height || '80px'};
                border-radius: 12px;
                margin-bottom: ${layout.section_spacing || '20px'};
            }

            .invoice-title {
                font-family: ${fonts.primary_font || 'Arial, sans-serif'};
                font-size: ${fonts.title_size || '24px'};
                font-weight: ${fonts.title_weight || 'bold'};
                color: white;
            }

            .client-section {
                background-color: ${colors.client_section_bg || '#f9fafb'};
                border: 2px solid ${colors.client_section_border || colors.primary};
                border-radius: 8px;
                padding: 15px;
                margin-bottom: ${layout.section_spacing || '20px'};
            }

            .invoice-table th {
                background-color: ${colors.table_header_bg || colors.primary};
                color: ${colors.table_header_text || '#ffffff'};
                font-weight: ${fonts.subtitle_weight || '600'};
            }

            .invoice-table tr:nth-child(even) {
                background-color: ${colors.table_row_even || '#f9fafb'};
            }

            .invoice-table tr:nth-child(odd) {
                background-color: ${colors.table_row_odd || '#ffffff'};
            }

            .totals-ht {
                background-color: ${colors.totals_ht_bg || '#dbeafe'};
                color: ${colors.totals_ht_text || '#1e40af'};
            }

            .totals-tva {
                background-color: ${colors.totals_tva_bg || '#fed7aa'};
                color: ${colors.totals_tva_text || '#ea580c'};
            }

            .totals-ttc {
                background-color: ${colors.totals_ttc_bg || '#d1fae5'};
                color: ${colors.totals_ttc_text || '#065f46'};
                font-weight: bold;
            }

            .invoice-footer {
                height: ${layout.footer_height || '60px'};
                font-size: ${fonts.small_size || '12px'};
                margin-top: ${layout.section_spacing || '20px'};
            }
        `;
    }
}

// Exposer la classe globalement
window.TemplateManager = TemplateManager;

// Instance globale du gestionnaire de templates
window.templateManager = new TemplateManager();
