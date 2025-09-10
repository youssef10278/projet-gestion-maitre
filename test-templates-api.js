/**
 * Test simple de l'API des templates
 * Vérifie que les templates sont bien créés et accessibles
 */

const { initDatabase, templatesDB } = require('./database.js');
const fs = require('fs');
const path = require('path');

async function testTemplatesAPI() {
    console.log('🧪 === TEST API TEMPLATES ===\n');

    try {
        // 1. Initialiser la base de données
        console.log('1️⃣ Initialisation de la base de données...');
        await initDatabase();
        console.log('✅ Base de données initialisée\n');

        // 2. Vérifier si des templates existent
        console.log('2️⃣ Vérification des templates existants...');
        const existingTemplates = await templatesDB.getAll();
        console.log(`📊 ${existingTemplates.length} template(s) trouvé(s):`);
        existingTemplates.forEach(t => {
            console.log(`   - ${t.display_name} (ID: ${t.id}, Défaut: ${t.is_default ? 'Oui' : 'Non'})`);
        });
        console.log('');

        // 3. Si aucun template, créer les templates système
        if (existingTemplates.length === 0) {
            console.log('3️⃣ Création des templates système...');
            
            const templatesConfig = [
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

            for (const templateConfig of templatesConfig) {
                try {
                    const configPath = path.join(__dirname, 'src/templates', templateConfig.file);
                    
                    if (!fs.existsSync(configPath)) {
                        console.log(`⚠️ Fichier ${templateConfig.file} non trouvé`);
                        continue;
                    }

                    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                    
                    const templateData = {
                        name: config.name,
                        display_name: config.display_name,
                        colors_config: config.colors_config,
                        fonts_config: config.fonts_config,
                        layout_config: config.layout_config,
                        user_created: 0,
                        is_system: 1
                    };

                    const result = await templatesDB.create(templateData);
                    
                    if (result.success) {
                        console.log(`✅ Template créé: ${config.display_name}`);
                        
                        if (templateConfig.isDefault) {
                            await templatesDB.setDefault(result.templateId);
                            console.log(`🎯 Défini comme template par défaut`);
                        }
                    } else {
                        console.log(`❌ Erreur: ${result.error}`);
                    }
                    
                } catch (error) {
                    console.log(`❌ Erreur lors de la création du template ${templateConfig.file}:`, error.message);
                }
            }
            console.log('');
        }

        // 4. Vérifier le template par défaut
        console.log('4️⃣ Vérification du template par défaut...');
        const defaultTemplate = await templatesDB.getDefault();
        if (defaultTemplate) {
            console.log(`✅ Template par défaut: ${defaultTemplate.display_name}`);
        } else {
            console.log('⚠️ Aucun template par défaut défini');
        }
        console.log('');

        // 5. Afficher le résumé final
        console.log('5️⃣ Résumé final...');
        const finalTemplates = await templatesDB.getAll();
        console.log(`📊 ${finalTemplates.length} template(s) disponible(s):`);
        finalTemplates.forEach(t => {
            const status = t.is_default ? ' 🎯 (PAR DÉFAUT)' : '';
            const type = t.is_system ? ' [SYSTÈME]' : ' [UTILISATEUR]';
            console.log(`   - ${t.display_name}${status}${type}`);
        });

        console.log('\n🎉 === TEST TERMINÉ AVEC SUCCÈS ===');
        return true;

    } catch (error) {
        console.error('\n❌ === ERREUR LORS DU TEST ===');
        console.error('Erreur:', error.message);
        return false;
    }
}

// Exécuter le test
if (require.main === module) {
    testTemplatesAPI()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = { testTemplatesAPI };
