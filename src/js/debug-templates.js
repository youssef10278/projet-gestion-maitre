/**
 * Script de débogage pour les templates
 * À charger dans la page des paramètres pour diagnostiquer les problèmes
 */

console.log('🔍 === DÉBOGAGE TEMPLATES ===');

// Vérifier la disponibilité des APIs
console.log('1️⃣ Vérification des APIs...');
console.log('window.api:', typeof window.api);
console.log('window.api.templates:', typeof window.api?.templates);

if (window.api?.templates) {
    console.log('✅ API templates disponible');
    
    // Tester l'API
    window.api.templates.getAll()
        .then(templates => {
            console.log('📊 Templates depuis API:', templates.length);
            templates.forEach(t => {
                console.log(`   - ${t.display_name} (ID: ${t.id}, Système: ${t.is_system})`);
            });
        })
        .catch(error => {
            console.error('❌ Erreur API getAll:', error);
        });
        
    window.api.templates.getDefault()
        .then(defaultTemplate => {
            console.log('🎯 Template par défaut:', defaultTemplate?.display_name);
        })
        .catch(error => {
            console.error('❌ Erreur API getDefault:', error);
        });
} else {
    console.error('❌ API templates non disponible');
}

// Vérifier les éléments DOM
console.log('2️⃣ Vérification des éléments DOM...');
const elements = {
    'templates-section': document.getElementById('templates-section'),
    'templateSelector': document.getElementById('templateSelector'),
    'currentTemplateName': document.getElementById('currentTemplateName'),
    'openTemplateDesigner': document.getElementById('openTemplateDesigner'),
    'applyTemplate': document.getElementById('applyTemplate')
};

Object.entries(elements).forEach(([name, element]) => {
    if (element) {
        console.log(`✅ ${name}: trouvé`);
    } else {
        console.error(`❌ ${name}: non trouvé`);
    }
});

// Vérifier le gestionnaire de templates
console.log('3️⃣ Vérification du gestionnaire de templates...');
console.log('window.templateManager:', typeof window.templateManager);
console.log('window.TemplateManager:', typeof window.TemplateManager);

// Vérifier les fonctions d'initialisation
console.log('4️⃣ Vérification des fonctions d\'initialisation...');
console.log('window.initializeTemplates:', typeof window.initializeTemplates);
console.log('window.checkAndInitializeTemplates:', typeof window.checkAndInitializeTemplates);

// Fonction de test manuel
window.testTemplatesSection = async function() {
    console.log('🧪 Test manuel de la section templates...');
    
    try {
        // Test de chargement des templates
        const templates = await window.api.templates.getAll();
        console.log('📊 Templates chargés:', templates.length);
        
        // Test de sélection
        const selector = document.getElementById('templateSelector');
        if (selector) {
            selector.innerHTML = '<option value="">Test...</option>';
            templates.forEach(t => {
                const option = document.createElement('option');
                option.value = t.id;
                option.textContent = t.display_name;
                selector.appendChild(option);
            });
            console.log('✅ Sélecteur mis à jour');
        }
        
        // Test d'affichage du template actuel
        const defaultTemplate = await window.api.templates.getDefault();
        const nameElement = document.getElementById('currentTemplateName');
        if (nameElement && defaultTemplate) {
            nameElement.textContent = defaultTemplate.display_name;
            console.log('✅ Nom du template actuel mis à jour');
        }
        
        console.log('🎉 Test manuel terminé avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors du test manuel:', error);
    }
};

// Fonction pour forcer l'initialisation
window.forceInitTemplates = async function() {
    console.log('🔄 Initialisation forcée des templates...');
    
    try {
        if (!window.templateManager) {
            window.templateManager = new TemplateManager();
            await window.templateManager.initialize();
        }
        
        // Charger les templates
        await window.testTemplatesSection();
        
        console.log('✅ Initialisation forcée terminée');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation forcée:', error);
    }
};

console.log('🔍 Débogage terminé. Utilisez:');
console.log('   - window.testTemplatesSection() pour tester manuellement');
console.log('   - window.forceInitTemplates() pour forcer l\'initialisation');

// Auto-test après 2 secondes
setTimeout(() => {
    console.log('🔄 Auto-test après 2 secondes...');
    if (window.testTemplatesSection) {
        window.testTemplatesSection();
    }
}, 2000);
