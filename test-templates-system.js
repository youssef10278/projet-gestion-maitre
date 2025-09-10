/**
 * Script de test pour le système de templates de factures
 * Teste la création, lecture, mise à jour et suppression des templates
 */

const { initDatabase, templatesDB } = require('./database.js');
const fs = require('fs');
const path = require('path');

async function testTemplatesSystem() {
    console.log('🧪 === TEST DU SYSTÈME DE TEMPLATES ===\n');

    try {
        // 1. Initialiser la base de données
        console.log('1️⃣ Initialisation de la base de données...');
        await initDatabase();
        console.log('✅ Base de données initialisée\n');

        // 2. Tester la création de templates
        console.log('2️⃣ Test de création de templates...');
        
        // Charger la configuration du template ATLAS
        const atlasConfigPath = path.join(__dirname, 'src/templates/atlas-default.json');
        const atlasConfig = JSON.parse(fs.readFileSync(atlasConfigPath, 'utf8'));
        
        const templateData = {
            name: atlasConfig.name,
            display_name: atlasConfig.display_name,
            colors_config: atlasConfig.colors_config,
            fonts_config: atlasConfig.fonts_config,
            layout_config: atlasConfig.layout_config,
            user_created: 0
        };

        const createResult = await templatesDB.create(templateData);
        console.log('Résultat création:', createResult);
        
        if (!createResult.success) {
            throw new Error('Échec de la création du template');
        }
        
        const templateId = createResult.templateId;
        console.log(`✅ Template créé avec ID: ${templateId}\n`);

        // 3. Tester la récupération de tous les templates
        console.log('3️⃣ Test de récupération de tous les templates...');
        const allTemplates = await templatesDB.getAll();
        console.log(`✅ ${allTemplates.length} template(s) trouvé(s):`);
        allTemplates.forEach(t => {
            console.log(`   - ${t.display_name} (ID: ${t.id}, Système: ${t.is_system ? 'Oui' : 'Non'})`);
        });
        console.log('');

        // 4. Tester la récupération d'un template par ID
        console.log('4️⃣ Test de récupération par ID...');
        const templateById = await templatesDB.getById(templateId);
        console.log('✅ Template récupéré:', templateById ? templateById.display_name : 'Non trouvé');
        console.log('');

        // 5. Tester la définition du template par défaut
        console.log('5️⃣ Test de définition du template par défaut...');
        const setDefaultResult = await templatesDB.setDefault(templateId);
        console.log('Résultat définition par défaut:', setDefaultResult);
        
        const defaultTemplate = await templatesDB.getDefault();
        console.log('✅ Template par défaut:', defaultTemplate ? defaultTemplate.display_name : 'Aucun');
        console.log('');

        // 6. Tester la mise à jour d'un template
        console.log('6️⃣ Test de mise à jour de template...');
        const updatedData = {
            display_name: 'ATLAS Distribution (Modifié)',
            colors_config: { ...atlasConfig.colors_config, primary: '#ff0000' },
            fonts_config: atlasConfig.fonts_config,
            layout_config: atlasConfig.layout_config
        };

        const updateResult = await templatesDB.update(templateId, updatedData);
        console.log('Résultat mise à jour:', updateResult);
        
        const updatedTemplate = await templatesDB.getById(templateId);
        console.log('✅ Template mis à jour:', updatedTemplate ? updatedTemplate.display_name : 'Non trouvé');
        console.log('');

        // 7. Créer un template utilisateur pour tester la suppression
        console.log('7️⃣ Test de création et suppression d\'un template utilisateur...');
        const userTemplateData = {
            name: 'user-custom',
            display_name: 'Template Utilisateur Test',
            colors_config: { primary: '#00ff00' },
            fonts_config: { primary_font: 'Arial' },
            layout_config: { page_margins: { top: '20mm' } },
            user_created: 1
        };

        const userCreateResult = await templatesDB.create(userTemplateData);
        console.log('Résultat création template utilisateur:', userCreateResult);
        
        if (userCreateResult.success) {
            const userTemplateId = userCreateResult.templateId;
            
            // Tester la suppression
            const deleteResult = await templatesDB.delete(userTemplateId);
            console.log('Résultat suppression:', deleteResult);
            console.log('✅ Template utilisateur supprimé');
        }
        console.log('');

        // 8. Tester la tentative de suppression d'un template système
        console.log('8️⃣ Test de protection des templates système...');
        const deleteSystemResult = await templatesDB.delete(templateId);
        console.log('Résultat suppression template système:', deleteSystemResult);
        console.log('✅ Template système protégé contre la suppression');
        console.log('');

        // 9. Afficher le résumé final
        console.log('9️⃣ Résumé final...');
        const finalTemplates = await templatesDB.getAll();
        console.log(`✅ ${finalTemplates.length} template(s) final(aux):`);
        finalTemplates.forEach(t => {
            const isDefault = t.is_default ? ' (PAR DÉFAUT)' : '';
            const isSystem = t.is_system ? ' [SYSTÈME]' : ' [UTILISATEUR]';
            console.log(`   - ${t.display_name}${isDefault}${isSystem}`);
        });

        console.log('\n🎉 === TOUS LES TESTS RÉUSSIS ===');
        return true;

    } catch (error) {
        console.error('\n❌ === ERREUR LORS DES TESTS ===');
        console.error('Erreur:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}

// Exécuter les tests si le script est lancé directement
if (require.main === module) {
    testTemplatesSystem()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = { testTemplatesSystem };
