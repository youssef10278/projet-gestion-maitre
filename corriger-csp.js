// corriger-csp.js - Correction des problèmes de Content Security Policy
// Remplace les scripts inline par des fichiers externes

const fs = require('fs');
const path = require('path');

class CSPFixer {
    constructor() {
        this.srcDir = path.join(__dirname, 'src');
        this.results = {
            processed: 0,
            fixed: 0,
            skipped: 0,
            errors: 0,
            details: []
        };
    }

    async fixAllPages() {
        console.log('🔧 Correction des problèmes CSP...\n');

        try {
            // Trouver tous les fichiers HTML
            const htmlFiles = this.findHtmlFiles(this.srcDir);
            
            console.log(`📄 ${htmlFiles.length} fichiers HTML trouvés\n`);

            // Traiter chaque fichier
            for (const file of htmlFiles) {
                await this.processHtmlFile(file);
            }

            // Afficher les résultats
            this.displayResults();

        } catch (error) {
            console.error('❌ Erreur lors de la correction:', error.message);
        }
    }

    findHtmlFiles(dir) {
        const htmlFiles = [];
        
        const scanDirectory = (currentDir) => {
            const items = fs.readdirSync(currentDir);
            
            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    scanDirectory(fullPath);
                } else if (stat.isFile() && item.endsWith('.html')) {
                    htmlFiles.push(fullPath);
                }
            }
        };

        scanDirectory(dir);
        return htmlFiles;
    }

    async processHtmlFile(filePath) {
        this.results.processed++;
        
        try {
            const relativePath = path.relative(__dirname, filePath);
            console.log(`🔍 Traitement: ${relativePath}`);

            // Lire le contenu du fichier
            let content = fs.readFileSync(filePath, 'utf8');
            let hasChanges = false;

            // Vérifier et corriger les scripts inline de langue
            const langScriptPattern = /<script>\s*\/\/\s*Pré-chargement[\s\S]*?<\/script>/g;
            if (langScriptPattern.test(content)) {
                content = content.replace(langScriptPattern, '<script src="./js/lang-init.js"></script>');
                hasChanges = true;
                console.log('   ✅ Script de langue corrigé');
            }

            // Vérifier et corriger d'autres scripts inline problématiques
            const inlineScriptPattern = /<script>(?!.*src=)[\s\S]*?<\/script>/g;
            const inlineScripts = content.match(inlineScriptPattern);
            
            if (inlineScripts) {
                for (const script of inlineScripts) {
                    // Ignorer les scripts qui sont déjà des fichiers externes
                    if (script.includes('src=')) continue;
                    
                    // Ignorer les scripts qui contiennent seulement des commentaires
                    const scriptContent = script.replace(/<\/?script[^>]*>/g, '').trim();
                    if (!scriptContent || scriptContent.startsWith('//') || scriptContent.startsWith('/*')) continue;
                    
                    console.log('   ⚠️ Script inline détecté:', script.substring(0, 50) + '...');
                }
            }

            // Vérifier la CSP et la corriger si nécessaire
            const cspPattern = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"[^>]*>/i;
            const cspMatch = content.match(cspPattern);
            
            if (cspMatch) {
                const currentCSP = cspMatch[1];
                console.log('   📋 CSP actuelle:', currentCSP);
                
                // Vérifier si 'unsafe-inline' est nécessaire et l'ajouter temporairement
                if (!currentCSP.includes('unsafe-inline') && inlineScripts && inlineScripts.length > 0) {
                    const newCSP = currentCSP.replace('script-src \'self\'', 'script-src \'self\' \'unsafe-inline\'');
                    content = content.replace(cspPattern, `<meta http-equiv="Content-Security-Policy" content="${newCSP}">`);
                    hasChanges = true;
                    console.log('   ⚠️ CSP temporairement assouplie (à corriger)');
                }
            }

            // Sauvegarder si des changements ont été faits
            if (hasChanges) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log('   ✅ Fichier corrigé');
                this.results.fixed++;
                this.results.details.push({
                    file: relativePath,
                    status: 'fixed',
                    reason: 'Scripts inline corrigés'
                });
            } else {
                console.log('   ⏭️ Aucune correction nécessaire');
                this.results.skipped++;
                this.results.details.push({
                    file: relativePath,
                    status: 'skipped',
                    reason: 'Aucun problème détecté'
                });
            }

        } catch (error) {
            console.log(`   ❌ Erreur: ${error.message}`);
            this.results.errors++;
            this.results.details.push({
                file: path.relative(__dirname, filePath),
                status: 'error',
                reason: error.message
            });
        }

        console.log(''); // Ligne vide pour la lisibilité
    }

    displayResults() {
        console.log('='.repeat(60));
        console.log('📊 RÉSULTATS DE LA CORRECTION CSP');
        console.log('='.repeat(60));
        console.log(`📄 Fichiers traités: ${this.results.processed}`);
        console.log(`✅ Fichiers corrigés: ${this.results.fixed}`);
        console.log(`⏭️ Fichiers ignorés: ${this.results.skipped}`);
        console.log(`❌ Erreurs: ${this.results.errors}`);

        if (this.results.fixed > 0) {
            console.log('\n✅ Fichiers corrigés:');
            this.results.details
                .filter(detail => detail.status === 'fixed')
                .forEach(detail => console.log(`   - ${detail.file}`));
        }

        if (this.results.errors > 0) {
            console.log('\n❌ Erreurs:');
            this.results.details
                .filter(detail => detail.status === 'error')
                .forEach(detail => console.log(`   - ${detail.file}: ${detail.reason}`));
        }

        console.log('\n🎯 Correction CSP terminée!');
        
        if (this.results.fixed > 0) {
            console.log('\n📝 Prochaines étapes:');
            console.log('   1. Tester le menu hamburger dans le navigateur');
            console.log('   2. Vérifier la console pour d\'autres erreurs CSP');
            console.log('   3. Optimiser la CSP si nécessaire');
            console.log('   4. Tester sur différents navigateurs');
        }
    }

    // Méthode pour créer une CSP optimisée
    generateOptimalCSP() {
        return {
            'script-src': "'self'",
            'style-src': "'self' 'unsafe-inline'", // Nécessaire pour Tailwind
            'img-src': "'self' data:",
            'font-src': "'self'",
            'connect-src': "'self'",
            'default-src': "'self'"
        };
    }

    // Méthode pour appliquer une CSP optimisée
    applyOptimalCSP(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const csp = this.generateOptimalCSP();
        const cspString = Object.entries(csp).map(([key, value]) => `${key} ${value}`).join('; ');
        
        const cspPattern = /<meta\s+http-equiv="Content-Security-Policy"\s+content="[^"]*"[^>]*>/i;
        const newCSPTag = `<meta http-equiv="Content-Security-Policy" content="${cspString}">`;
        
        let newContent;
        if (cspPattern.test(content)) {
            newContent = content.replace(cspPattern, newCSPTag);
        } else {
            // Ajouter la CSP après la meta charset
            const charsetPattern = /<meta\s+charset="[^"]*"[^>]*>/i;
            if (charsetPattern.test(content)) {
                newContent = content.replace(charsetPattern, '$&\n    ' + newCSPTag);
            } else {
                // Ajouter après la balise head
                newContent = content.replace(/<head>/i, '<head>\n    ' + newCSPTag);
            }
        }
        
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ CSP optimisée appliquée à ${path.relative(__dirname, filePath)}`);
    }
}

// Exécution du script
if (require.main === module) {
    const fixer = new CSPFixer();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--optimal-csp')) {
        // Appliquer une CSP optimisée à tous les fichiers
        const htmlFiles = fixer.findHtmlFiles(fixer.srcDir);
        htmlFiles.forEach(file => fixer.applyOptimalCSP(file));
    } else {
        fixer.fixAllPages().catch(console.error);
    }
}

module.exports = CSPFixer;
