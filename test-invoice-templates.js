/**
 * Test d'intégration des templates avec la génération de factures
 */

const { initDatabase, templatesDB } = require('./database.js');

async function testInvoiceTemplateIntegration() {
    console.log('🧪 === TEST INTÉGRATION TEMPLATES FACTURES ===\n');

    try {
        // 1. Initialiser la base de données
        await initDatabase();
        console.log('✅ Base de données initialisée\n');

        // 2. Récupérer le template par défaut
        console.log('2️⃣ Récupération du template par défaut...');
        const defaultTemplate = await templatesDB.getDefault();
        
        if (!defaultTemplate) {
            console.log('❌ Aucun template par défaut trouvé');
            return;
        }

        console.log(`✅ Template par défaut: ${defaultTemplate.display_name}`);
        console.log(`   - ID: ${defaultTemplate.id}`);
        console.log(`   - Nom: ${defaultTemplate.name}`);
        console.log('');

        // 3. Parser les configurations
        console.log('3️⃣ Parsing des configurations...');
        const colors = JSON.parse(defaultTemplate.colors_config || '{}');
        const fonts = JSON.parse(defaultTemplate.fonts_config || '{}');
        const layout = JSON.parse(defaultTemplate.layout_config || '{}');
        const elements = JSON.parse(defaultTemplate.elements_config || '{}');

        console.log('🎨 Couleurs:');
        console.log(`   - Primaire: ${colors.primary || 'Non définie'}`);
        console.log(`   - Secondaire: ${colors.secondary || 'Non définie'}`);
        console.log(`   - Dégradé début: ${colors.header_gradient_start || 'Non définie'}`);
        console.log(`   - Dégradé fin: ${colors.header_gradient_end || 'Non définie'}`);

        console.log('📝 Polices:');
        console.log(`   - Police principale: ${fonts.primary_font || 'Non définie'}`);
        console.log(`   - Taille titre: ${fonts.title_size || 'Non définie'}`);
        console.log(`   - Taille corps: ${fonts.body_size || 'Non définie'}`);

        console.log('📐 Mise en page:');
        console.log(`   - Hauteur en-tête: ${layout.header_height || 'Non définie'}`);
        console.log(`   - Espacement sections: ${layout.section_spacing || 'Non définie'}`);

        console.log('🔧 Éléments:');
        console.log(`   - Afficher logo: ${elements.show_logo !== false ? 'Oui' : 'Non'}`);
        console.log(`   - Numéros de ligne: ${elements.show_line_numbers !== false ? 'Oui' : 'Non'}`);
        console.log(`   - Badges unités: ${elements.show_unit_badges !== false ? 'Oui' : 'Non'}`);
        console.log(`   - Date échéance: ${elements.show_due_date !== false ? 'Oui' : 'Non'}`);
        console.log(`   - Mentions légales: ${elements.show_legal_mentions !== false ? 'Oui' : 'Non'}`);
        console.log('');

        // 4. Générer un exemple de CSS
        console.log('4️⃣ Génération du CSS personnalisé...');
        const css = generateTemplateCSS(colors, fonts, layout, elements);
        
        console.log('✅ CSS généré avec succès');
        console.log(`📏 Longueur du CSS: ${css.length} caractères`);
        console.log('');

        // 5. Créer un exemple de facture HTML
        console.log('5️⃣ Génération d\'un exemple de facture...');
        const sampleInvoiceHTML = generateSampleInvoice(css);
        
        console.log('✅ HTML de facture généré');
        console.log(`📄 Longueur du HTML: ${sampleInvoiceHTML.length} caractères`);
        console.log('');

        // 6. Sauvegarder l'exemple pour test
        const fs = require('fs');
        const path = require('path');
        
        const outputPath = path.join(__dirname, 'test-invoice-output.html');
        fs.writeFileSync(outputPath, sampleInvoiceHTML, 'utf8');
        
        console.log(`💾 Exemple sauvegardé: ${outputPath}`);
        console.log('');

        console.log('🎉 === TEST TERMINÉ AVEC SUCCÈS ===');
        console.log('');
        console.log('📋 Résumé:');
        console.log(`   ✅ Template utilisé: ${defaultTemplate.display_name}`);
        console.log(`   ✅ CSS généré: ${css.length} caractères`);
        console.log(`   ✅ HTML généré: ${sampleInvoiceHTML.length} caractères`);
        console.log(`   ✅ Fichier test: test-invoice-output.html`);
        console.log('');
        console.log('🔍 Ouvrez le fichier test-invoice-output.html dans un navigateur pour voir le résultat');

    } catch (error) {
        console.error('\n❌ === ERREUR LORS DU TEST ===');
        console.error('Erreur:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Fonction pour générer le CSS basé sur le template
function generateTemplateCSS(colors, fonts, layout, elements) {
    const primaryColor = colors.primary || '#2c5aa0';
    const secondaryColor = colors.secondary || '#f97316';
    const headerGradientStart = colors.header_gradient_start || primaryColor;
    const headerGradientEnd = colors.header_gradient_end || colors.primary_dark || '#1e40af';
    
    const primaryFont = fonts.primary_font || 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
    const titleSize = fonts.title_size || '24px';
    const bodySize = fonts.body_size || '11px';
    
    const headerHeight = layout.header_height || '80px';
    const sectionSpacing = layout.section_spacing || '25px';

    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: ${primaryFont}; font-size: ${bodySize}; line-height: 1.4; color: #000; background: #fff; }
        .invoice-container { max-width: 210mm; margin: 0 auto; padding: 15mm; background: white; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${sectionSpacing}; padding: 20px; background: linear-gradient(135deg, ${headerGradientStart}, ${headerGradientEnd}); color: white; border-radius: 8px; }
        .company-name { font-size: ${titleSize}; font-weight: bold; margin-bottom: 5px; color: white; }
        .invoice-title { font-size: ${titleSize}; font-weight: bold; color: white; margin-bottom: 10px; }
        .invoice-number { font-size: 16px; font-weight: bold; color: ${secondaryColor}; background: white; padding: 5px 10px; border-radius: 4px; display: inline-block; }
        .client-section { margin-bottom: ${sectionSpacing}; padding: 15px; background: #f8f9fa; border-left: 4px solid ${primaryColor}; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: ${sectionSpacing}; font-size: ${bodySize}; }
        .items-table th { background: ${primaryColor}; color: white; padding: 12px 8px; text-align: left; font-weight: bold; border: 1px solid ${primaryColor}; }
        .items-table td { padding: 10px 8px; border: 1px solid #ddd; vertical-align: top; }
        .totals-table { width: 300px; border-collapse: collapse; }
        .totals-table .label { background: #f8f9fa; font-weight: bold; text-align: right; width: 60%; }
        .total-ttc .label, .total-ttc .amount { background: ${primaryColor}; color: white; font-size: 14px; }
    `;
}

// Fonction pour générer un exemple de facture
function generateSampleInvoice(css) {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture Test Template</title>
    <style>${css}</style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="company-info">
                <div class="company-name">ATLAS DISTRIBUTION</div>
                <div class="company-details">123 Rue de Test<br>Casablanca, Maroc<br>Tél: +212 123 456 789</div>
            </div>
            <div class="invoice-title-section">
                <div class="invoice-title">FACTURE</div>
                <div class="invoice-number">N° FAC-2024-001</div>
            </div>
        </div>
        
        <div class="client-section">
            <div class="client-title">FACTURÉ À</div>
            <div>Client Test<br>Adresse Client<br>Ville, Pays</div>
        </div>
        
        <table class="items-table">
            <thead>
                <tr><th>Description</th><th>Qté</th><th>Prix Unit.</th><th>Total</th></tr>
            </thead>
            <tbody>
                <tr><td>Article de test</td><td>2</td><td>100.00 MAD</td><td>200.00 MAD</td></tr>
                <tr><td>Service de test</td><td>1</td><td>150.00 MAD</td><td>150.00 MAD</td></tr>
            </tbody>
        </table>
        
        <div style="display: flex; justify-content: flex-end;">
            <table class="totals-table">
                <tr><td class="label">Sous-total HT:</td><td class="amount">350.00 MAD</td></tr>
                <tr><td class="label">TVA (20%):</td><td class="amount">70.00 MAD</td></tr>
                <tr class="total-ttc"><td class="label">TOTAL TTC:</td><td class="amount">420.00 MAD</td></tr>
            </table>
        </div>
    </div>
</body>
</html>`;
}

// Exécuter le test
if (require.main === module) {
    testInvoiceTemplateIntegration();
}

module.exports = { testInvoiceTemplateIntegration, generateTemplateCSS };
