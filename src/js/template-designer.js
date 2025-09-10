/**
 * Designer de Templates de Factures
 * Interface de personnalisation des templates de factures
 */

class TemplateDesigner {
    constructor() {
        this.currentTemplate = null;
        this.originalTemplate = null;
        this.zoomLevel = 0.6;
        this.isDirty = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadTemplates();
    }

    /**
     * Initialise les références aux éléments DOM
     */
    initializeElements() {
        // Boutons principaux
        this.backBtn = document.getElementById('backBtn');
        this.saveTemplateBtn = document.getElementById('saveTemplateBtn');
        this.resetTemplateBtn = document.getElementById('resetTemplateBtn');
        this.newTemplateBtn = document.getElementById('newTemplateBtn');

        // Conteneurs de templates
        this.systemTemplatesContainer = document.getElementById('systemTemplates');
        this.userTemplatesContainer = document.getElementById('userTemplates');

        // Zone de prévisualisation
        this.invoicePreview = document.getElementById('invoicePreview');
        this.zoomControls = {
            zoomIn: document.getElementById('zoomInBtn'),
            zoomOut: document.getElementById('zoomOutBtn'),
            fitToScreen: document.getElementById('fitToScreenBtn'),
            zoomLevel: document.getElementById('zoomLevel')
        };

        // Propriétés du template
        this.templateName = document.getElementById('templateName');
        
        // Couleurs
        this.colorInputs = {
            primary: document.getElementById('primaryColor'),
            primaryText: document.getElementById('primaryColorText'),
            secondary: document.getElementById('secondaryColor'),
            secondaryText: document.getElementById('secondaryColorText'),
            headerStart: document.getElementById('headerStartColor'),
            headerStartText: document.getElementById('headerStartColorText'),
            headerEnd: document.getElementById('headerEndColor'),
            headerEndText: document.getElementById('headerEndColorText')
        };

        // Polices
        this.fontInputs = {
            primaryFont: document.getElementById('primaryFont'),
            titleSize: document.getElementById('titleSize'),
            titleSizeValue: document.getElementById('titleSizeValue'),
            bodySize: document.getElementById('bodySize'),
            bodySizeValue: document.getElementById('bodySizeValue')
        };

        // Mise en page
        this.layoutInputs = {
            headerHeight: document.getElementById('headerHeight'),
            headerHeightValue: document.getElementById('headerHeightValue'),
            sectionSpacing: document.getElementById('sectionSpacing'),
            sectionSpacingValue: document.getElementById('sectionSpacingValue')
        };

        // 🔍 DEBUG - Vérification de l'initialisation des éléments DOM
        console.log('🔍 DEBUG - Initialisation layoutInputs:');
        console.log('  - headerHeight:', this.layoutInputs.headerHeight);
        console.log('  - headerHeightValue:', this.layoutInputs.headerHeightValue);
        console.log('  - sectionSpacing:', this.layoutInputs.sectionSpacing);
        console.log('  - sectionSpacingValue:', this.layoutInputs.sectionSpacingValue);

        // Vérifier si les éléments existent
        if (!this.layoutInputs.headerHeight) {
            console.error('❌ Element headerHeight non trouvé !');
        }
        if (!this.layoutInputs.sectionSpacing) {
            console.error('❌ Element sectionSpacing non trouvé !');
        }

        // Éléments
        this.elementInputs = {
            showLogo: document.getElementById('showLogo'),
            showLineNumbers: document.getElementById('showLineNumbers'),
            showUnitBadges: document.getElementById('showUnitBadges'),
            showDueDate: document.getElementById('showDueDate'),
            showLegalMentions: document.getElementById('showLegalMentions')
        };
    }

    /**
     * Lie les événements aux éléments
     */
    bindEvents() {
        // Boutons principaux
        this.backBtn.addEventListener('click', () => this.goBack());
        this.saveTemplateBtn.addEventListener('click', () => this.saveTemplate());
        this.resetTemplateBtn.addEventListener('click', () => this.resetTemplate());
        this.newTemplateBtn.addEventListener('click', () => this.createNewTemplate());

        // Contrôles de zoom
        this.zoomControls.zoomIn.addEventListener('click', () => this.zoomIn());
        this.zoomControls.zoomOut.addEventListener('click', () => this.zoomOut());
        this.zoomControls.fitToScreen.addEventListener('click', () => this.fitToScreen());

        // Propriétés du template
        this.templateName.addEventListener('input', () => this.markDirty());

        // Couleurs - synchronisation entre color picker et text input
        Object.keys(this.colorInputs).forEach(key => {
            if (key.endsWith('Text')) return;
            
            const colorInput = this.colorInputs[key];
            const textInput = this.colorInputs[key + 'Text'];
            
            colorInput.addEventListener('input', (e) => {
                textInput.value = e.target.value;
                this.updatePreview();
                this.markDirty();
            });
            
            textInput.addEventListener('input', (e) => {
                if (this.isValidColor(e.target.value)) {
                    colorInput.value = e.target.value;
                    this.updatePreview();
                    this.markDirty();
                }
            });
        });

        // Polices
        this.fontInputs.primaryFont.addEventListener('change', () => {
            this.updatePreview();
            this.markDirty();
        });

        // Sliders avec mise à jour des valeurs
        this.bindSlider(this.fontInputs.titleSize, this.fontInputs.titleSizeValue, 'px');
        this.bindSlider(this.fontInputs.bodySize, this.fontInputs.bodySizeValue, 'px');
        this.bindSlider(this.layoutInputs.headerHeight, this.layoutInputs.headerHeightValue, 'px');
        this.bindSlider(this.layoutInputs.sectionSpacing, this.layoutInputs.sectionSpacingValue, 'px');

        // Éléments (checkboxes)
        Object.values(this.elementInputs).forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updatePreview();
                this.markDirty();
            });
        });
    }

    /**
     * Lie un slider à son affichage de valeur
     */
    bindSlider(slider, valueDisplay, unit = '') {
        slider.addEventListener('input', (e) => {
            valueDisplay.textContent = e.target.value + unit;
            this.updatePreview();
            this.markDirty();
        });
    }

    /**
     * Vérifie si une couleur est valide
     */
    isValidColor(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }

    /**
     * Marque le template comme modifié
     */
    markDirty() {
        // Ne pas marquer comme modifié si on est en train de charger un template
        if (this.isLoading) return;

        this.isDirty = true;
        this.saveTemplateBtn.textContent = '💾 Sauvegarder *';
        this.saveTemplateBtn.classList.add('bg-orange-600', 'hover:bg-orange-700');
        this.saveTemplateBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
    }

    /**
     * Marque le template comme sauvegardé
     */
    markClean() {
        this.isDirty = false;
        this.saveTemplateBtn.textContent = '💾 Sauvegarder';
        this.saveTemplateBtn.classList.remove('bg-orange-600', 'hover:bg-orange-700');
        this.saveTemplateBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
    }

    /**
     * Charge tous les templates disponibles
     */
    async loadTemplates() {
        try {
            console.log('🎨 Chargement des templates dans le designer...');

            // Vérifier que l'API est disponible
            if (!window.api || !window.api.templates) {
                console.error('❌ API templates non disponible');
                this.showNotification('API templates non disponible', 'error');
                return;
            }

            // Charger les templates directement depuis l'API
            const templates = await window.api.templates.getAll();

            if (!templates || templates.length === 0) {
                console.log('⚠️ Aucun template trouvé');
                this.showNotification('Aucun template disponible', 'warning');
                return;
            }

            console.log(`📊 ${templates.length} templates chargés`);

            // Séparer les templates système et utilisateur
            const systemTemplates = templates.filter(t => t.is_system);
            const userTemplates = templates.filter(t => !t.is_system);

            console.log(`📋 ${systemTemplates.length} système, ${userTemplates.length} utilisateur`);

            this.renderTemplateList(systemTemplates, this.systemTemplatesContainer);
            this.renderTemplateList(userTemplates, this.userTemplatesContainer);

            // Sélectionner le template par défaut
            const defaultTemplate = await window.api.templates.getDefault();
            if (defaultTemplate) {
                console.log(`🎯 Template par défaut: ${defaultTemplate.display_name}`);
                this.selectTemplate(defaultTemplate.id);
            }

            console.log('✅ Templates chargés avec succès');

        } catch (error) {
            console.error('❌ Erreur lors du chargement des templates:', error);
            this.showNotification('Erreur lors du chargement des templates', 'error');
        }
    }

    /**
     * Affiche une liste de templates dans un conteneur
     */
    renderTemplateList(templates, container) {
        if (!container) {
            console.error('❌ Conteneur non trouvé pour les templates');
            return;
        }

        container.innerHTML = '';

        templates.forEach(template => {
            try {
                const templateCard = document.createElement('div');
                templateCard.className = 'template-card p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors';
                templateCard.dataset.templateId = template.id;

                const isDefault = template.is_default ? ' 🎯' : '';
                const isSystem = template.is_system ? ' [Système]' : '';

                // Parser les couleurs JSON de manière sécurisée
                let colors = {};
                try {
                    colors = JSON.parse(template.colors_config || '{}');
                } catch (e) {
                    console.warn('⚠️ Erreur parsing colors_config pour template:', template.name);
                    colors = {};
                }

                templateCard.innerHTML = `
                    <div class="font-medium text-sm text-gray-800">${template.display_name}${isDefault}</div>
                    <div class="text-xs text-gray-500 mt-1">${template.name}${isSystem}</div>
                    <div class="flex mt-2 space-x-1">
                        <div class="w-4 h-4 rounded border" style="background-color: ${colors.primary || '#3b82f6'}"></div>
                        <div class="w-4 h-4 rounded border" style="background-color: ${colors.secondary || '#f97316'}"></div>
                        <div class="w-4 h-4 rounded border" style="background-color: ${colors.header_gradient_start || '#3b82f6'}"></div>
                    </div>
                `;

                templateCard.addEventListener('click', () => this.selectTemplate(template.id));
                container.appendChild(templateCard);

            } catch (error) {
                console.error('❌ Erreur lors du rendu du template:', template.name, error);
            }
        });

        console.log(`✅ ${templates.length} templates rendus dans le conteneur`);
    }

    /**
     * Sélectionne un template
     */
    async selectTemplate(templateId) {
        try {
            console.log(`🎯 Sélection du template ID: ${templateId}`);

            const template = await window.api.templates.getById(templateId);
            if (!template) {
                throw new Error('Template non trouvé');
            }

            // Sauvegarder les modifications en cours si nécessaire
            if (this.isDirty) {
                const shouldSave = confirm('Vous avez des modifications non sauvegardées. Voulez-vous les sauvegarder ?');
                if (shouldSave) {
                    await this.saveTemplate();
                }
            }

            this.currentTemplate = template;
            this.originalTemplate = JSON.parse(JSON.stringify(template)); // Deep copy

            console.log(`✅ Template sélectionné: ${template.display_name}`);

            this.loadTemplateIntoForm(template);
            this.updatePreview();
            this.markClean();

            // Mettre à jour la sélection visuelle
            document.querySelectorAll('.template-card').forEach(card => {
                card.classList.remove('active', 'ring-2', 'ring-blue-500');
            });

            const selectedCard = document.querySelector(`[data-template-id="${templateId}"]`);
            if (selectedCard) {
                selectedCard.classList.add('active', 'ring-2', 'ring-blue-500', 'bg-blue-50');
            }

        } catch (error) {
            console.error('❌ Erreur lors de la sélection du template:', error);
            this.showNotification('Erreur lors de la sélection du template', 'error');
        }
    }

    /**
     * Charge les données d'un template dans le formulaire
     */
    loadTemplateIntoForm(template) {
        // Désactiver temporairement les événements pour éviter de marquer comme modifié
        this.isLoading = true;

        // Nom du template
        this.templateName.value = template.display_name || '';

        // Couleurs
        const colors = template.colors_config || {};
        this.setColorInputSilent('primary', colors.primary || '#3b82f6');
        this.setColorInputSilent('secondary', colors.secondary || '#f97316');
        this.setColorInputSilent('headerStart', colors.header_gradient_start || '#3b82f6');
        this.setColorInputSilent('headerEnd', colors.header_gradient_end || '#1e40af');

        // Polices
        const fonts = template.fonts_config || {};
        this.fontInputs.primaryFont.value = fonts.primary_font || 'Arial, sans-serif';
        this.setSliderValueSilent('titleSize', parseInt(fonts.title_size) || 24, 'px');
        this.setSliderValueSilent('bodySize', parseInt(fonts.body_size) || 14, 'px');

        // Mise en page - Parser le JSON si nécessaire
        let layout = {};
        try {
            if (typeof template.layout_config === 'string') {
                layout = JSON.parse(template.layout_config);
            } else if (typeof template.layout_config === 'object' && template.layout_config !== null) {
                layout = template.layout_config;
            }
        } catch (error) {
            console.error('Erreur parsing layout_config:', error);
            layout = {};
        }

        console.log('📥 DEBUG - Chargement template dans formulaire:');
        console.log('  - Template complet:', template);
        console.log('  - Layout config brut:', template.layout_config);
        console.log('  - Layout config parsé:', layout);
        console.log('  - header_height brut:', layout.header_height);
        console.log('  - section_spacing brut:', layout.section_spacing);

        const headerHeightParsed = parseInt(layout.header_height) || 80;
        const sectionSpacingParsed = parseInt(layout.section_spacing) || 20;

        console.log('  - header_height parsé:', headerHeightParsed);
        console.log('  - section_spacing parsé:', sectionSpacingParsed);

        this.setSliderValueSilent('headerHeight', headerHeightParsed, 'px');
        this.setSliderValueSilent('sectionSpacing', sectionSpacingParsed, 'px');

        // Éléments
        const elements = template.elements_config || {};
        this.elementInputs.showLogo.checked = elements.show_logo !== false;
        this.elementInputs.showLineNumbers.checked = elements.show_line_numbers !== false;
        this.elementInputs.showUnitBadges.checked = elements.show_unit_badges !== false;
        this.elementInputs.showDueDate.checked = elements.show_due_date !== false;
        this.elementInputs.showLegalMentions.checked = elements.show_legal_mentions !== false;

        // Réactiver les événements
        this.isLoading = false;
    }

    /**
     * Définit une valeur de couleur dans les inputs
     */
    setColorInput(key, value) {
        if (this.colorInputs[key] && this.colorInputs[key + 'Text']) {
            this.colorInputs[key].value = value;
            this.colorInputs[key + 'Text'].value = value;
            // Déclencher les événements de changement seulement si on n'est pas en train de charger
            if (!this.isLoading) {
                this.colorInputs[key].dispatchEvent(new Event('input', { bubbles: true }));
                this.colorInputs[key + 'Text'].dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }

    /**
     * Définit une valeur de couleur sans déclencher d'événements
     */
    setColorInputSilent(key, value) {
        if (this.colorInputs[key] && this.colorInputs[key + 'Text']) {
            this.colorInputs[key].value = value;
            this.colorInputs[key + 'Text'].value = value;
        }
    }

    /**
     * Définit une valeur de slider
     */
    setSliderValue(key, value, unit = '') {
        if (this.fontInputs[key]) {
            this.fontInputs[key].value = value;
            this.fontInputs[key + 'Value'].textContent = value + unit;
            // Déclencher l'événement de changement seulement si on n'est pas en train de charger
            if (!this.isLoading) {
                this.fontInputs[key].dispatchEvent(new Event('input', { bubbles: true }));
            }
        } else if (this.layoutInputs[key]) {
            this.layoutInputs[key].value = value;
            this.layoutInputs[key + 'Value'].textContent = value + unit;
            // Déclencher l'événement de changement seulement si on n'est pas en train de charger
            if (!this.isLoading) {
                this.layoutInputs[key].dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }

    /**
     * Définit une valeur de slider sans déclencher d'événements
     */
    setSliderValueSilent(key, value, unit = '') {
        console.log(`🔧 DEBUG - setSliderValueSilent(${key}, ${value}, ${unit})`);

        if (this.fontInputs[key]) {
            console.log(`  - Trouvé dans fontInputs: ${key}`);
            this.fontInputs[key].value = value;
            if (this.fontInputs[key + 'Value']) {
                this.fontInputs[key + 'Value'].textContent = value + unit;
                console.log(`  - Mis à jour fontInputs[${key}Value]: ${value + unit}`);
            }
        } else if (this.layoutInputs[key]) {
            console.log(`  - Trouvé dans layoutInputs: ${key}`);
            console.log(`  - Element:`, this.layoutInputs[key]);
            console.log(`  - Value element:`, this.layoutInputs[key + 'Value']);

            this.layoutInputs[key].value = value;
            if (this.layoutInputs[key + 'Value']) {
                this.layoutInputs[key + 'Value'].textContent = value + unit;
                console.log(`  - Mis à jour layoutInputs[${key}Value]: ${value + unit}`);
            }

            // Vérification après mise à jour
            console.log(`  - Valeur finale du slider: ${this.layoutInputs[key].value}`);
        } else {
            console.warn(`⚠️ DEBUG - Clé non trouvée: ${key}`);
            console.log('  - fontInputs keys:', Object.keys(this.fontInputs));
            console.log('  - layoutInputs keys:', Object.keys(this.layoutInputs));
        }
    }

    /**
     * Met à jour l'aperçu de la facture
     */
    updatePreview() {
        if (!this.currentTemplate) return;

        const templateData = this.getTemplateDataFromForm();
        const css = this.generatePreviewCSS(templateData);
        const html = this.generatePreviewHTML(templateData);

        // Injecter le CSS personnalisé
        let styleElement = document.getElementById('preview-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'preview-styles';
            document.head.appendChild(styleElement);
        }
        styleElement.textContent = css;

        // Mettre à jour le HTML
        this.invoicePreview.innerHTML = html;
    }

    /**
     * Récupère les données du template depuis le formulaire
     */
    getTemplateDataFromForm() {
        // 🔍 DEBUG - Vérification des éléments DOM
        console.log('🔍 DEBUG - Vérification des layoutInputs:');
        console.log('  - headerHeight element:', this.layoutInputs.headerHeight);
        console.log('  - headerHeight value:', this.layoutInputs.headerHeight?.value);
        console.log('  - sectionSpacing element:', this.layoutInputs.sectionSpacing);
        console.log('  - sectionSpacing value:', this.layoutInputs.sectionSpacing?.value);

        // Récupération sécurisée des valeurs de mise en page
        let headerHeightValue = '80';
        let sectionSpacingValue = '20';

        if (this.layoutInputs.headerHeight && this.layoutInputs.headerHeight.value !== undefined) {
            headerHeightValue = this.layoutInputs.headerHeight.value;
        }

        if (this.layoutInputs.sectionSpacing && this.layoutInputs.sectionSpacing.value !== undefined) {
            sectionSpacingValue = this.layoutInputs.sectionSpacing.value;
        }

        console.log('🔍 DEBUG - Valeurs récupérées:');
        console.log('  - headerHeightValue:', headerHeightValue);
        console.log('  - sectionSpacingValue:', sectionSpacingValue);

        const templateData = {
            display_name: this.templateName.value,
            colors_config: {
                primary: this.colorInputs.primaryText.value,
                secondary: this.colorInputs.secondaryText.value,
                header_gradient_start: this.colorInputs.headerStartText.value,
                header_gradient_end: this.colorInputs.headerEndText.value
            },
            fonts_config: {
                primary_font: this.fontInputs.primaryFont.value,
                title_size: this.fontInputs.titleSize.value + 'px',
                body_size: this.fontInputs.bodySize.value + 'px'
            },
            layout_config: {
                header_height: headerHeightValue + 'px',
                section_spacing: sectionSpacingValue + 'px'
            },
            elements_config: {
                show_logo: this.elementInputs.showLogo.checked,
                show_line_numbers: this.elementInputs.showLineNumbers.checked,
                show_unit_badges: this.elementInputs.showUnitBadges.checked,
                show_due_date: this.elementInputs.showDueDate.checked,
                show_legal_mentions: this.elementInputs.showLegalMentions.checked
            }
        };

        console.log('🔍 DEBUG - Template data final:', templateData);
        console.log('🔍 DEBUG - Layout config final:', templateData.layout_config);

        return templateData;
    }

    /**
     * Génère le CSS pour l'aperçu
     */
    generatePreviewCSS(templateData) {
        const colors = templateData.colors_config;
        const fonts = templateData.fonts_config;
        const layout = templateData.layout_config;

        return `
            .preview-invoice {
                font-family: ${fonts.primary_font};
                font-size: ${fonts.body_size};
                color: ${colors.primary};
            }
            .preview-header {
                background: linear-gradient(135deg, ${colors.header_gradient_start}, ${colors.header_gradient_end});
                height: ${layout.header_height};
                margin-bottom: ${layout.section_spacing};
            }
            .preview-title {
                font-size: ${fonts.title_size};
                color: white;
                font-weight: bold;
            }
            .preview-section {
                margin-bottom: ${layout.section_spacing};
            }
        `;
    }

    /**
     * Génère le HTML pour l'aperçu
     */
    generatePreviewHTML(templateData) {
        const elements = templateData.elements_config;

        return `
            <div class="preview-invoice p-6">
                <!-- En-tête -->
                <div class="preview-header flex items-center justify-between p-6 rounded-lg">
                    <div class="flex items-center space-x-4">
                        ${elements.show_logo ? '<div class="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center"><span class="text-2xl font-bold">GP</span></div>' : ''}
                        <div>
                            <h1 class="preview-title">GESTION PRO</h1>
                            <p class="text-white text-opacity-80 text-sm">Système de Facturation Professionnel</p>
                        </div>
                    </div>
                    <div class="text-right text-white">
                        <h2 class="text-3xl font-bold mb-2">FACTURE</h2>
                        <div class="text-sm">
                            <div><strong>N°:</strong> F-2025-001</div>
                            <div><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</div>
                            ${elements.show_due_date ? '<div><strong>Échéance:</strong> ' + new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('fr-FR') + '</div>' : ''}
                        </div>
                    </div>
                </div>

                <!-- Section Client -->
                <div class="preview-section bg-gray-50 p-4 rounded-lg border-l-4" style="border-left-color: ${templateData.colors_config.primary}">
                    <h3 class="font-semibold mb-2">Facturé à :</h3>
                    <div>
                        <div class="font-medium">Entreprise Exemple SARL</div>
                        <div class="text-sm text-gray-600">123 Rue de la Paix</div>
                        <div class="text-sm text-gray-600">20000 Casablanca, Maroc</div>
                        <div class="text-sm text-gray-600">ICE: 123456789012345</div>
                    </div>
                </div>

                <!-- Tableau des articles -->
                <div class="preview-section">
                    <table class="w-full border-collapse">
                        <thead>
                            <tr style="background-color: ${templateData.colors_config.primary}; color: white;">
                                ${elements.show_line_numbers ? '<th class="border p-2 text-left">#</th>' : ''}
                                <th class="border p-2 text-left">Description</th>
                                <th class="border p-2 text-center">Qté</th>
                                ${elements.show_unit_badges ? '<th class="border p-2 text-center">Unité</th>' : ''}
                                <th class="border p-2 text-right">Prix Unit.</th>
                                <th class="border p-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="bg-gray-50">
                                ${elements.show_line_numbers ? '<td class="border p-2">1</td>' : ''}
                                <td class="border p-2">Produit Exemple A</td>
                                <td class="border p-2 text-center">2</td>
                                ${elements.show_unit_badges ? '<td class="border p-2 text-center"><span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">pièce</span></td>' : ''}
                                <td class="border p-2 text-right">150,00 DH</td>
                                <td class="border p-2 text-right">300,00 DH</td>
                            </tr>
                            <tr>
                                ${elements.show_line_numbers ? '<td class="border p-2">2</td>' : ''}
                                <td class="border p-2">Produit Exemple B</td>
                                <td class="border p-2 text-center">1</td>
                                ${elements.show_unit_badges ? '<td class="border p-2 text-center"><span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">kg</span></td>' : ''}
                                <td class="border p-2 text-right">200,00 DH</td>
                                <td class="border p-2 text-right">200,00 DH</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Totaux -->
                <div class="preview-section flex justify-end">
                    <div class="w-80">
                        <div class="bg-blue-50 p-3 rounded mb-2 flex justify-between">
                            <span>Sous-total HT:</span>
                            <span class="font-medium">500,00 DH</span>
                        </div>
                        <div class="bg-orange-50 p-3 rounded mb-2 flex justify-between">
                            <span>TVA (20%):</span>
                            <span class="font-medium">100,00 DH</span>
                        </div>
                        <div class="bg-green-50 p-3 rounded flex justify-between font-bold text-lg">
                            <span>Total TTC:</span>
                            <span>600,00 DH</span>
                        </div>
                    </div>
                </div>

                ${elements.show_legal_mentions ? `
                <!-- Pied de page -->
                <div class="preview-section mt-8 pt-4 border-t border-gray-200 text-xs text-gray-600">
                    <div class="text-center">
                        <div>ICE: 123456789012345 • RC: 12345 • CNSS: 67890</div>
                        <div>Patente: 12345678 • Capital: 100,000.00 DH</div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Contrôles de zoom
     */
    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel + 0.1, 2.0);
        this.applyZoom();
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.2);
        this.applyZoom();
    }

    fitToScreen() {
        this.zoomLevel = 0.6;
        this.applyZoom();
    }

    applyZoom() {
        this.invoicePreview.style.transform = `scale(${this.zoomLevel})`;
        this.zoomControls.zoomLevel.textContent = Math.round(this.zoomLevel * 100) + '%';
    }

    /**
     * Sauvegarde le template
     */
    async saveTemplate() {
        try {
            console.log('💾 DEBUG - Début de la sauvegarde');
            const templateData = this.getTemplateDataFromForm();

            console.log('💾 DEBUG - Données à sauvegarder:', templateData);
            console.log('💾 DEBUG - Layout config à sauvegarder:', templateData.layout_config);

            if (!templateData.display_name.trim()) {
                this.showNotification('Veuillez saisir un nom pour le template', 'warning');
                return;
            }

            let result;
            if (this.currentTemplate.user_created) {
                // Mise à jour d'un template utilisateur
                console.log('💾 DEBUG - Mise à jour template utilisateur ID:', this.currentTemplate.id);
                result = await window.templateManager.updateTemplate(this.currentTemplate.id, templateData);
                console.log('💾 DEBUG - Résultat mise à jour:', result);
            } else {
                // Création d'un nouveau template basé sur un template système
                templateData.name = 'user-' + Date.now();
                console.log('💾 DEBUG - Création nouveau template:', templateData.name);
                result = await window.templateManager.createCustomTemplate(templateData);
                console.log('💾 DEBUG - Résultat création:', result);
            }

            if (result.success) {
                console.log('💾 DEBUG - Sauvegarde réussie, rechargement du template...');

                // Recharger le template depuis la base de données pour s'assurer d'avoir les bonnes valeurs
                const templateId = result.template?.id || this.currentTemplate.id;
                console.log('💾 DEBUG - Rechargement template ID:', templateId);

                const reloadedTemplate = await window.templateManager.reloadTemplateById(templateId);
                console.log('💾 DEBUG - Template rechargé:', reloadedTemplate);

                if (reloadedTemplate) {
                    // Mettre à jour les références internes
                    this.currentTemplate = reloadedTemplate;
                    this.originalTemplate = JSON.parse(JSON.stringify(reloadedTemplate));

                    // Recharger le template dans le formulaire
                    this.loadTemplateIntoForm(reloadedTemplate);
                    this.updatePreview();
                }

                this.showNotification('Template sauvegardé avec succès', 'success');
                this.markClean();
                await this.loadTemplates(); // Recharger la liste
            } else {
                this.showNotification('Erreur lors de la sauvegarde: ' + result.error, 'error');
            }

        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    /**
     * Réinitialise le template
     */
    resetTemplate() {
        if (this.originalTemplate) {
            this.loadTemplateIntoForm(this.originalTemplate);
            this.updatePreview();
            this.markClean();
            this.showNotification('Template réinitialisé', 'info');
        }
    }

    /**
     * Crée un nouveau template
     */
    createNewTemplate() {
        const newTemplate = {
            id: 'new',
            name: 'nouveau-template',
            display_name: 'Nouveau Template',
            user_created: 1,
            is_system: 0,
            colors_config: {
                primary: '#3b82f6',
                secondary: '#f97316',
                header_gradient_start: '#3b82f6',
                header_gradient_end: '#1e40af'
            },
            fonts_config: {
                primary_font: 'Arial, sans-serif',
                title_size: '24px',
                body_size: '14px'
            },
            layout_config: {
                header_height: '80px',
                section_spacing: '20px'
            },
            elements_config: {
                show_logo: true,
                show_line_numbers: true,
                show_unit_badges: true,
                show_due_date: true,
                show_legal_mentions: true
            }
        };

        this.currentTemplate = newTemplate;
        this.originalTemplate = JSON.parse(JSON.stringify(newTemplate));
        this.loadTemplateIntoForm(newTemplate);
        this.updatePreview();
        this.markDirty();

        // Désélectionner tous les templates
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('active');
        });
    }

    /**
     * Retour à la page précédente
     */
    goBack() {
        if (this.isDirty) {
            const shouldSave = confirm('Vous avez des modifications non sauvegardées. Voulez-vous les sauvegarder avant de quitter ?');
            if (shouldSave) {
                this.saveTemplate().then(() => {
                    window.history.back();
                });
                return;
            }
        }
        window.history.back();
    }

    /**
     * Affiche une notification
     */
    showNotification(message, type = 'info') {
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${this.getNotificationClasses(type)}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Supprimer après 3 secondes
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Retourne les classes CSS pour les notifications
     */
    getNotificationClasses(type) {
        switch (type) {
            case 'success':
                return 'bg-green-500 text-white';
            case 'error':
                return 'bg-red-500 text-white';
            case 'warning':
                return 'bg-yellow-500 text-white';
            default:
                return 'bg-blue-500 text-white';
        }
    }
}

// Initialiser le designer au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎨 Initialisation du Template Designer...');

    // Attendre que l'API soit disponible
    let retries = 0;
    const maxRetries = 10;

    while ((!window.api || !window.api.templates) && retries < maxRetries) {
        console.log(`⏳ Attente de l'API... (${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
    }

    if (!window.api || !window.api.templates) {
        console.error('❌ API templates non disponible après 5 secondes');
        document.body.innerHTML = `
            <div class="flex items-center justify-center h-screen">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-red-600 mb-4">❌ Erreur de Chargement</h1>
                    <p class="text-gray-600 mb-4">L'API des templates n'est pas disponible.</p>
                    <button onclick="location.reload()" class="bg-blue-600 text-white px-4 py-2 rounded-lg">
                        🔄 Recharger
                    </button>
                </div>
            </div>
        `;
        return;
    }

    try {
        console.log('✅ API disponible, initialisation du designer...');
        window.templateDesigner = new TemplateDesigner();
        console.log('🎉 Template Designer initialisé avec succès');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation du designer:', error);
        document.body.innerHTML = `
            <div class="flex items-center justify-center h-screen">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-red-600 mb-4">❌ Erreur d'Initialisation</h1>
                    <p class="text-gray-600 mb-4">Erreur: ${error.message}</p>
                    <button onclick="location.reload()" class="bg-blue-600 text-white px-4 py-2 rounded-lg">
                        🔄 Recharger
                    </button>
                </div>
            </div>
        `;
    }
});
