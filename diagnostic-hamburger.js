// diagnostic-hamburger.js - Diagnostic du menu hamburger
// Vérifie tous les aspects du menu hamburger

const fs = require('fs');
const path = require('path');

class HamburgerDiagnostic {
    constructor() {
        this.srcDir = path.join(__dirname, 'src');
        this.issues = [];
        this.warnings = [];
        this.success = [];
    }

    async runDiagnostic() {
        console.log('🔍 Diagnostic du menu hamburger...\n');

        // Tests de base
        this.checkFileStructure();
        this.checkJavaScriptSyntax();
        this.checkCSSIntegration();
        this.checkHTMLIntegration();
        this.checkCSPConfiguration();

        // Afficher les résultats
        this.displayResults();
    }

    checkFileStructure() {
        console.log('📁 Vérification de la structure des fichiers...');

        const requiredFiles = [
            'src/js/hamburger-menu.js',
            'src/css/input.css',
            'src/css/output.css'
        ];

        requiredFiles.forEach(file => {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                this.success.push(`✅ ${file} (${stats.size} bytes)`);
            } else {
                this.issues.push(`❌ Fichier manquant: ${file}`);
            }
        });
    }

    checkJavaScriptSyntax() {
        console.log('\n⚙️ Vérification de la syntaxe JavaScript...');

        const jsPath = path.join(__dirname, 'src/js/hamburger-menu.js');
        if (!fs.existsSync(jsPath)) {
            this.issues.push('❌ hamburger-menu.js introuvable');
            return;
        }

        try {
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            // Vérifications de base
            if (jsContent.includes('class HamburgerMenu')) {
                this.success.push('✅ Classe HamburgerMenu trouvée');
            } else {
                this.issues.push('❌ Classe HamburgerMenu manquante');
            }

            if (jsContent.includes('DOMContentLoaded')) {
                this.success.push('✅ Initialisation DOMContentLoaded trouvée');
            } else {
                this.issues.push('❌ Initialisation DOMContentLoaded manquante');
            }

            if (jsContent.includes('window.hamburgerMenu')) {
                this.success.push('✅ Exposition globale configurée');
            } else {
                this.warnings.push('⚠️ Exposition globale non trouvée');
            }

            // Vérifier les méthodes critiques
            const criticalMethods = [
                'createHamburgerButton',
                'toggleMenu',
                'checkScreenSize'
            ];

            criticalMethods.forEach(method => {
                if (jsContent.includes(method)) {
                    this.success.push(`✅ Méthode ${method} trouvée`);
                } else {
                    this.issues.push(`❌ Méthode ${method} manquante`);
                }
            });

            // Vérifier la syntaxe avec une regex simple
            const syntaxIssues = this.checkBasicSyntax(jsContent);
            if (syntaxIssues.length > 0) {
                syntaxIssues.forEach(issue => this.issues.push(`❌ Syntaxe: ${issue}`));
            } else {
                this.success.push('✅ Syntaxe JavaScript basique OK');
            }

        } catch (error) {
            this.issues.push(`❌ Erreur lecture JS: ${error.message}`);
        }
    }

    checkBasicSyntax(content) {
        const issues = [];
        
        // Vérifier les accolades
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            issues.push(`Accolades non équilibrées (${openBraces} ouvertes, ${closeBraces} fermées)`);
        }

        // Vérifier les parenthèses
        const openParens = (content.match(/\(/g) || []).length;
        const closeParens = (content.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            issues.push(`Parenthèses non équilibrées (${openParens} ouvertes, ${closeParens} fermées)`);
        }

        // Vérifier les points-virgules manquants (basique)
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed.length > 0 && 
                !trimmed.startsWith('//') && 
                !trimmed.startsWith('/*') && 
                !trimmed.endsWith(';') && 
                !trimmed.endsWith('{') && 
                !trimmed.endsWith('}') &&
                !trimmed.includes('if ') &&
                !trimmed.includes('else') &&
                !trimmed.includes('for ') &&
                !trimmed.includes('while ') &&
                !trimmed.includes('function ') &&
                !trimmed.includes('class ') &&
                trimmed.includes('=')) {
                issues.push(`Ligne ${index + 1}: Point-virgule possiblement manquant`);
            }
        });

        return issues.slice(0, 5); // Limiter à 5 erreurs pour éviter le spam
    }

    checkCSSIntegration() {
        console.log('\n🎨 Vérification de l\'intégration CSS...');

        const cssPath = path.join(__dirname, 'src/css/input.css');
        if (!fs.existsSync(cssPath)) {
            this.issues.push('❌ input.css introuvable');
            return;
        }

        try {
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            
            const requiredClasses = [
                '.hamburger-menu-btn',
                '.hamburger-icon',
                '.menu-overlay',
                '.responsive-sidebar'
            ];

            requiredClasses.forEach(className => {
                if (cssContent.includes(className)) {
                    this.success.push(`✅ Classe CSS ${className} trouvée`);
                } else {
                    this.issues.push(`❌ Classe CSS ${className} manquante`);
                }
            });

            // Vérifier la compilation CSS
            const outputCssPath = path.join(__dirname, 'src/css/output.css');
            if (fs.existsSync(outputCssPath)) {
                const outputCss = fs.readFileSync(outputCssPath, 'utf8');
                if (outputCss.includes('hamburger-menu-btn')) {
                    this.success.push('✅ CSS compilé contient les styles hamburger');
                } else {
                    this.warnings.push('⚠️ CSS compilé ne contient pas les styles hamburger');
                }
            } else {
                this.warnings.push('⚠️ output.css non trouvé');
            }

        } catch (error) {
            this.issues.push(`❌ Erreur lecture CSS: ${error.message}`);
        }
    }

    checkHTMLIntegration() {
        console.log('\n📄 Vérification de l\'intégration HTML...');

        const htmlFiles = this.findHtmlFiles(this.srcDir);
        let integratedCount = 0;

        htmlFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const fileName = path.relative(this.srcDir, file);
                
                if (content.includes('hamburger-menu.js')) {
                    integratedCount++;
                    this.success.push(`✅ Script intégré dans ${fileName}`);
                } else if (this.hasNavigation(content)) {
                    this.warnings.push(`⚠️ Script non intégré dans ${fileName}`);
                }
            } catch (error) {
                this.issues.push(`❌ Erreur lecture ${file}: ${error.message}`);
            }
        });

        if (integratedCount > 0) {
            this.success.push(`✅ Script intégré dans ${integratedCount} pages`);
        } else {
            this.issues.push('❌ Script non intégré dans aucune page');
        }
    }

    checkCSPConfiguration() {
        console.log('\n🔒 Vérification de la configuration CSP...');

        const htmlFiles = this.findHtmlFiles(this.srcDir);
        
        htmlFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const fileName = path.relative(this.srcDir, file);
                
                const cspMatch = content.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"[^>]*>/i);
                
                if (cspMatch) {
                    const csp = cspMatch[1];
                    
                    if (csp.includes("script-src 'self'")) {
                        this.success.push(`✅ CSP correcte dans ${fileName}`);
                    } else if (csp.includes("'unsafe-inline'")) {
                        this.warnings.push(`⚠️ CSP avec unsafe-inline dans ${fileName}`);
                    } else {
                        this.issues.push(`❌ CSP problématique dans ${fileName}: ${csp}`);
                    }
                } else {
                    this.warnings.push(`⚠️ Pas de CSP dans ${fileName}`);
                }
                
                // Vérifier les scripts inline
                const inlineScripts = content.match(/<script>(?!.*src=)[\s\S]*?<\/script>/g);
                if (inlineScripts && inlineScripts.length > 0) {
                    this.warnings.push(`⚠️ Scripts inline détectés dans ${fileName} (${inlineScripts.length})`);
                }
                
            } catch (error) {
                this.issues.push(`❌ Erreur CSP ${file}: ${error.message}`);
            }
        });
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

    hasNavigation(content) {
        const navigationIndicators = [
            '<aside',
            '<nav',
            'main-nav',
            'sidebar'
        ];

        return navigationIndicators.some(indicator => 
            content.toLowerCase().includes(indicator.toLowerCase())
        );
    }

    displayResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 RÉSULTATS DU DIAGNOSTIC');
        console.log('='.repeat(60));

        if (this.success.length > 0) {
            console.log('\n✅ SUCCÈS:');
            this.success.forEach(item => console.log(`   ${item}`));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️ AVERTISSEMENTS:');
            this.warnings.forEach(item => console.log(`   ${item}`));
        }

        if (this.issues.length > 0) {
            console.log('\n❌ PROBLÈMES:');
            this.issues.forEach(item => console.log(`   ${item}`));
        }

        console.log('\n📈 RÉSUMÉ:');
        console.log(`   ✅ Succès: ${this.success.length}`);
        console.log(`   ⚠️ Avertissements: ${this.warnings.length}`);
        console.log(`   ❌ Problèmes: ${this.issues.length}`);

        if (this.issues.length === 0) {
            console.log('\n🎯 DIAGNOSTIC: Menu hamburger semble correctement configuré');
            console.log('\n📝 PROCHAINES ÉTAPES:');
            console.log('   1. Ouvrir la page dans le navigateur');
            console.log('   2. Ouvrir les outils de développement (F12)');
            console.log('   3. Vérifier la console pour les erreurs');
            console.log('   4. Tester le redimensionnement de la fenêtre');
        } else {
            console.log('\n🔧 ACTIONS REQUISES:');
            console.log('   1. Corriger les problèmes listés ci-dessus');
            console.log('   2. Relancer le diagnostic');
            console.log('   3. Tester dans le navigateur');
        }
    }
}

// Exécution du diagnostic
if (require.main === module) {
    const diagnostic = new HamburgerDiagnostic();
    diagnostic.runDiagnostic().catch(console.error);
}

module.exports = HamburgerDiagnostic;
