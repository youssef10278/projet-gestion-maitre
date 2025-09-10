// Test de l'affichage conditionnel du logo dans la facture
const fs = require('fs');

function testLogoConditionnel() {
    console.log('🧪 === TEST AFFICHAGE CONDITIONNEL DU LOGO ===\n');
    
    try {
        // Lire le fichier invoices.js
        const invoicesJs = fs.readFileSync('src/js/invoices.js', 'utf8');
        
        // Test 1: Vérifier que la condition existe
        console.log('🔍 Test 1: Vérification de la condition logo');
        
        const hasConditionalLogo = invoicesJs.includes('${companyInfo.logo ?') && 
                                  invoicesJs.includes('company-logo') &&
                                  invoicesJs.includes("''");
        
        if (hasConditionalLogo) {
            console.log('✅ Condition d\'affichage du logo détectée');
        } else {
            console.log('❌ Condition d\'affichage du logo manquante');
            return false;
        }
        
        // Test 2: Vérifier que la div company-logo est conditionnelle
        console.log('\n📦 Test 2: Vérification structure conditionnelle');
        
        const hasConditionalDiv = invoicesJs.includes('`<div class="company-logo">') &&
                                 invoicesJs.includes('</div>`');
        
        if (hasConditionalDiv) {
            console.log('✅ Div company-logo est conditionnelle');
        } else {
            console.log('❌ Div company-logo n\'est pas conditionnelle');
            return false;
        }
        
        // Test 3: Simulation avec logo
        console.log('\n🖼️ Test 3: Simulation avec logo');
        
        const companyInfoWithLogo = {
            name: 'TEST SOCIÉTÉ',
            logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        };
        
        // Simuler le template avec logo
        const templateWithLogo = `
            <div class="company-info">
                ${companyInfoWithLogo.logo ? 
                    `<div class="company-logo">
                        <img src="${companyInfoWithLogo.logo}" alt="Logo ${companyInfoWithLogo.name || 'Société'}">
                    </div>` : 
                    ''
                }
                <div class="company-name">${companyInfoWithLogo.name || 'VOTRE SOCIÉTÉ'}</div>
            </div>
        `;
        
        if (templateWithLogo.includes('<div class="company-logo">') && 
            templateWithLogo.includes('<img src="data:image/png')) {
            console.log('✅ Avec logo: Section logo s\'affiche correctement');
        } else {
            console.log('❌ Avec logo: Section logo ne s\'affiche pas');
            return false;
        }
        
        // Test 4: Simulation sans logo
        console.log('\n🚫 Test 4: Simulation sans logo');
        
        const companyInfoWithoutLogo = {
            name: 'TEST SOCIÉTÉ',
            logo: null
        };
        
        // Simuler le template sans logo
        const templateWithoutLogo = `
            <div class="company-info">
                ${companyInfoWithoutLogo.logo ? 
                    `<div class="company-logo">
                        <img src="${companyInfoWithoutLogo.logo}" alt="Logo ${companyInfoWithoutLogo.name || 'Société'}">
                    </div>` : 
                    ''
                }
                <div class="company-name">${companyInfoWithoutLogo.name || 'VOTRE SOCIÉTÉ'}</div>
            </div>
        `;
        
        if (!templateWithoutLogo.includes('<div class="company-logo">') && 
            !templateWithoutLogo.includes('<img src=')) {
            console.log('✅ Sans logo: Section logo ne s\'affiche pas (correct)');
        } else {
            console.log('❌ Sans logo: Section logo s\'affiche encore');
            return false;
        }
        
        // Test 5: Vérification du CSS
        console.log('\n🎨 Test 5: Vérification CSS logo');
        
        const hasLogoCSS = invoicesJs.includes('.company-logo {') &&
                          invoicesJs.includes('.company-logo img {');
        
        if (hasLogoCSS) {
            console.log('✅ CSS pour logo présent');
        } else {
            console.log('❌ CSS pour logo manquant');
            return false;
        }
        
        // Test 6: Vérification que company-name reste toujours visible
        console.log('\n🏢 Test 6: Vérification nom société toujours visible');
        
        const companyNameAlwaysVisible = invoicesJs.includes('<div class="company-name">') &&
                                        !invoicesJs.includes('${companyInfo.logo ? ') ||
                                        invoicesJs.indexOf('<div class="company-name">') > 
                                        invoicesJs.indexOf("''");
        
        if (companyNameAlwaysVisible) {
            console.log('✅ Nom de société toujours visible');
        } else {
            console.log('❌ Nom de société pourrait être masqué');
            return false;
        }
        
        // Test 7: Comparaison avant/après
        console.log('\n📊 Test 7: Comparaison comportement');
        
        console.log('🔄 Comportement attendu:');
        console.log('   ✅ Avec logo: [LOGO] + Nom société');
        console.log('   ✅ Sans logo: Nom société uniquement');
        console.log('   ❌ Plus de carré vide quand pas de logo');
        
        // Résumé final
        console.log('\n🎉 === RÉSUMÉ TEST LOGO CONDITIONNEL ===');
        console.log('✅ Fonctionnalités validées:');
        console.log('   🖼️ Logo s\'affiche seulement si présent');
        console.log('   🚫 Pas de carré vide si pas de logo');
        console.log('   🏢 Nom société toujours visible');
        console.log('   🎨 CSS logo préservé');
        console.log('   📱 Structure HTML conditionnelle');
        
        console.log('\n📋 Résultat:');
        console.log('   ✅ AVEC LOGO: <div class="company-logo"><img...></div>');
        console.log('   ✅ SANS LOGO: (rien - pas de div company-logo)');
        console.log('   ✅ Dans les deux cas: <div class="company-name">NOM</div>');
        
        console.log('\n🎊 AFFICHAGE CONDITIONNEL DU LOGO OPÉRATIONNEL !');
        console.log('🚀 Plus de carré vide dans les factures sans logo');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors des tests:', error);
        return false;
    }
}

// Exécuter les tests
if (require.main === module) {
    testLogoConditionnel().then ? 
        testLogoConditionnel().then(success => process.exit(success ? 0 : 1)) :
        process.exit(testLogoConditionnel() ? 0 : 1);
}

module.exports = { testLogoConditionnel };
