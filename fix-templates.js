/**
 * Script pour corriger les templates système
 */

const { initDatabase, templatesDB } = require('./database.js');

async function fixTemplates() {
    console.log('🔧 Correction des templates système...');

    try {
        await initDatabase();
        
        // Récupérer tous les templates
        const templates = await templatesDB.getAll();
        console.log(`📊 ${templates.length} templates trouvés`);

        // Corriger les templates système
        const systemTemplateNames = ['atlas-default', 'modern-clean', 'classic-traditional', 'minimal-bw'];
        
        for (const template of templates) {
            if (systemTemplateNames.includes(template.name)) {
                console.log(`🔄 Correction du template: ${template.display_name}`);
                
                // Mettre à jour pour marquer comme template système
                const updateQuery = `
                    UPDATE invoice_templates 
                    SET is_system = 1, user_created = 0 
                    WHERE id = ?
                `;
                
                const db = require('./database.js').db;
                const stmt = db.prepare(updateQuery);
                stmt.run(template.id);
                
                console.log(`✅ Template ${template.display_name} corrigé`);
            }
        }

        // Vérifier les corrections
        console.log('\n📋 État final des templates:');
        const finalTemplates = await templatesDB.getAll();
        finalTemplates.forEach(t => {
            const type = t.is_system ? '[SYSTÈME]' : '[UTILISATEUR]';
            const isDefault = t.is_default ? ' 🎯' : '';
            console.log(`   - ${t.display_name}${isDefault} ${type}`);
        });

        console.log('\n✅ Correction terminée');

    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

fixTemplates();
