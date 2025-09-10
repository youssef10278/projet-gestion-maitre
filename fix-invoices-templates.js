/**
 * Script pour corriger l'intégration des templates dans invoices.js
 */

const fs = require('fs');
const path = require('path');

// Fonction pour corriger le fichier invoices.js
function fixInvoicesFile() {
    console.log('🔧 Correction du fichier invoices.js...');
    
    const invoicesPath = path.join(__dirname, 'src', 'js', 'invoices.js');
    
    try {
        // Lire le fichier actuel
        let content = fs.readFileSync(invoicesPath, 'utf8');
        
        // Trouver la position de la fin du module principal
        const endModuleIndex = content.indexOf('})();');
        
        if (endModuleIndex === -1) {
            console.error('❌ Impossible de trouver la fin du module');
            return false;
        }
        
        // Garder seulement le contenu jusqu'à la fin du module
        const cleanContent = content.substring(0, endModuleIndex + 5);
        
        console.log(`📏 Contenu original: ${content.length} caractères`);
        console.log(`📏 Contenu nettoyé: ${cleanContent.length} caractères`);
        
        // Écrire le contenu nettoyé
        fs.writeFileSync(invoicesPath, cleanContent, 'utf8');
        
        console.log('✅ Fichier invoices.js corrigé avec succès');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error.message);
        return false;
    }
}

// Fonction pour ajouter l'intégration des templates
function addTemplateIntegration() {
    console.log('🎨 Ajout de l\'intégration des templates...');
    
    const invoicesPath = path.join(__dirname, 'src', 'js', 'invoices.js');
    
    try {
        let content = fs.readFileSync(invoicesPath, 'utf8');
        
        // Trouver la fonction generatePrintableInvoice
        const functionStart = content.indexOf('async function generatePrintableInvoice()');
        
        if (functionStart === -1) {
            console.error('❌ Fonction generatePrintableInvoice non trouvée');
            return false;
        }
        
        // Trouver le début de la section style dans cette fonction
        const styleStart = content.indexOf('<style>', functionStart);
        const styleEnd = content.indexOf('</style>', styleStart) + 8;
        
        if (styleStart === -1 || styleEnd === -1) {
            console.error('❌ Section style non trouvée dans generatePrintableInvoice');
            return false;
        }
        
        // Remplacer la section style par l'appel au template
        const beforeStyle = content.substring(0, styleStart);
        const afterStyle = content.substring(styleEnd);
        
        const newStyleSection = `<style>
        \${templateStyles}
    </style>`;
        
        // Ajouter la récupération des styles de template avant le return
        const returnIndex = beforeStyle.lastIndexOf('return `');
        const beforeReturn = beforeStyle.substring(0, returnIndex);
        const afterReturn = beforeStyle.substring(returnIndex);
        
        const templateCode = `
        // Récupérer les styles du template personnalisé
        const templateStyles = await getCurrentTemplateStyles();

        `;
        
        const newContent = beforeReturn + templateCode + afterReturn + newStyleSection + afterStyle;
        
        fs.writeFileSync(invoicesPath, newContent, 'utf8');
        
        console.log('✅ Intégration des templates ajoutée avec succès');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout des templates:', error.message);
        return false;
    }
}

// Exécuter les corrections
async function main() {
    console.log('🚀 === CORRECTION INTÉGRATION TEMPLATES FACTURES ===\n');
    
    // 1. Nettoyer le fichier
    if (!fixInvoicesFile()) {
        console.error('❌ Échec de la correction du fichier');
        return;
    }
    
    console.log('');
    
    // 2. Ajouter l'intégration des templates
    if (!addTemplateIntegration()) {
        console.error('❌ Échec de l\'ajout des templates');
        return;
    }
    
    console.log('\n🎉 === CORRECTION TERMINÉE AVEC SUCCÈS ===');
    console.log('');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Tester l\'application: npm start');
    console.log('   2. Aller dans la page Factures');
    console.log('   3. Créer une nouvelle facture');
    console.log('   4. Générer le PDF pour voir le template appliqué');
    console.log('');
    console.log('🔍 Le style de la facture devrait maintenant utiliser le template sélectionné dans les paramètres');
}

if (require.main === module) {
    main();
}

module.exports = { fixInvoicesFile, addTemplateIntegration };
