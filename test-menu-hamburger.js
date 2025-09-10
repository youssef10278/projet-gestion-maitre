// test-menu-hamburger.js - Tests pour le menu hamburger responsive
// Validation de l'intégration et du fonctionnement du menu hamburger

const fs = require('fs');
const path = require('path');

class HamburgerMenuTester {
    constructor() {
        this.srcDir = path.join(__dirname, 'src');
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
    }

    async runAllTests() {
        console.log('🍔 Tests du menu hamburger responsive...\n');

        // Tests des fichiers
        this.testFileStructure();
        this.testCSSIntegration();
        this.testJavaScriptIntegration();
        this.testHTMLIntegration();

        // Tests de fonctionnalité
        this.testResponsiveBreakpoints();
        this.testAccessibility();
        this.testTouchOptimizations();

        // Afficher les résultats
        this.displayResults();
    }

    testFileStructure() {
        console.log('📁 Test de la structure des fichiers...');

        const requiredFiles = [
            'src/js/hamburger-menu.js',
            'src/css/input.css'
        ];

        requiredFiles.forEach(file => {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                this.pass(`✅ Fichier trouvé: ${file}`);
            } else {
                this.fail(`❌ Fichier manquant: ${file}`);
            }
        });
    }

    testCSSIntegration() {
        console.log('\n🎨 Test de l\'intégration CSS...');

        const cssPath = path.join(__dirname, 'src/css/input.css');
        if (!fs.existsSync(cssPath)) {
            this.fail('❌ Fichier CSS principal manquant');
            return;
        }

        const cssContent = fs.readFileSync(cssPath, 'utf8');

        // Test des classes CSS du menu hamburger
        const requiredClasses = [
            '.hamburger-menu-btn',
            '.hamburger-icon',
            '.hamburger-line',
            '.menu-overlay',
            '.responsive-sidebar',
            '.sidebar-close-btn'
        ];

        requiredClasses.forEach(className => {
            if (cssContent.includes(className)) {
                this.pass(`✅ Classe CSS trouvée: ${className}`);
            } else {
                this.fail(`❌ Classe CSS manquante: ${className}`);
            }
        });

        // Test des media queries responsives
        const responsiveQueries = [
            '@media (max-width: 1023px)',
            'transform: translateX(-100%)',
            'transform: translateX(0)'
        ];

        responsiveQueries.forEach(query => {
            if (cssContent.includes(query)) {
                this.pass(`✅ Media query trouvée: ${query}`);
            } else {
                this.fail(`❌ Media query manquante: ${query}`);
            }
        });

        // Test des animations
        if (cssContent.includes('transition:') && cssContent.includes('transform:')) {
            this.pass('✅ Animations CSS configurées');
        } else {
            this.warn('⚠️ Animations CSS non trouvées');
        }
    }

    testJavaScriptIntegration() {
        console.log('\n⚙️ Test de l\'intégration JavaScript...');

        const jsPath = path.join(__dirname, 'src/js/hamburger-menu.js');
        if (!fs.existsSync(jsPath)) {
            this.fail('❌ Fichier JavaScript manquant');
            return;
        }

        const jsContent = fs.readFileSync(jsPath, 'utf8');

        // Test de la classe principale
        if (jsContent.includes('class HamburgerMenu')) {
            this.pass('✅ Classe HamburgerMenu trouvée');
        } else {
            this.fail('❌ Classe HamburgerMenu manquante');
        }

        // Test des méthodes essentielles
        const requiredMethods = [
            'createHamburgerButton',
            'createOverlay',
            'setupSidebar',
            'toggleMenu',
            'openMenu',
            'closeMenu',
            'checkScreenSize',
            'initSwipeGestures'
        ];

        requiredMethods.forEach(method => {
            if (jsContent.includes(method)) {
                this.pass(`✅ Méthode trouvée: ${method}`);
            } else {
                this.fail(`❌ Méthode manquante: ${method}`);
            }
        });

        // Test des événements tactiles
        if (jsContent.includes('touchstart') && jsContent.includes('touchmove')) {
            this.pass('✅ Gestion tactile implémentée');
        } else {
            this.warn('⚠️ Gestion tactile non trouvée');
        }

        // Test de l'accessibilité
        if (jsContent.includes('aria-label') && jsContent.includes('aria-expanded')) {
            this.pass('✅ Attributs d\'accessibilité trouvés');
        } else {
            this.warn('⚠️ Attributs d\'accessibilité manquants');
        }
    }

    testHTMLIntegration() {
        console.log('\n📄 Test de l\'intégration HTML...');

        const htmlFiles = this.findHtmlFiles(this.srcDir);
        let integratedCount = 0;
        let totalWithNav = 0;

        htmlFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            
            // Vérifier si la page a une navigation
            if (this.hasNavigation(content)) {
                totalWithNav++;
                
                // Vérifier si le script est intégré
                if (content.includes('hamburger-menu.js')) {
                    integratedCount++;
                } else {
                    const fileName = path.relative(this.srcDir, file);
                    this.warn(`⚠️ Script non intégré dans: ${fileName}`);
                }
            }
        });

        if (integratedCount === totalWithNav && totalWithNav > 0) {
            this.pass(`✅ Script intégré dans toutes les pages (${integratedCount}/${totalWithNav})`);
        } else if (integratedCount > 0) {
            this.warn(`⚠️ Script partiellement intégré (${integratedCount}/${totalWithNav})`);
        } else {
            this.fail('❌ Script non intégré dans les pages');
        }
    }

    testResponsiveBreakpoints() {
        console.log('\n📱 Test des breakpoints responsives...');

        const cssPath = path.join(__dirname, 'src/css/input.css');
        if (!fs.existsSync(cssPath)) return;

        const cssContent = fs.readFileSync(cssPath, 'utf8');

        // Test du breakpoint principal
        if (cssContent.includes('max-width: 1023px')) {
            this.pass('✅ Breakpoint principal configuré (1023px)');
        } else {
            this.fail('❌ Breakpoint principal manquant');
        }

        // Test de l'affichage conditionnel
        if (cssContent.includes('display: flex !important') && cssContent.includes('display: none !important')) {
            this.pass('✅ Affichage conditionnel configuré');
        } else {
            this.warn('⚠️ Affichage conditionnel non trouvé');
        }

        // Test de la position fixe
        if (cssContent.includes('position: fixed') && cssContent.includes('z-index:')) {
            this.pass('✅ Positionnement fixe configuré');
        } else {
            this.warn('⚠️ Positionnement fixe non trouvé');
        }
    }

    testAccessibility() {
        console.log('\n♿ Test de l\'accessibilité...');

        const jsPath = path.join(__dirname, 'src/js/hamburger-menu.js');
        if (!fs.existsSync(jsPath)) return;

        const jsContent = fs.readFileSync(jsPath, 'utf8');

        // Test des attributs ARIA
        const ariaAttributes = [
            'aria-label',
            'aria-expanded',
            'aria-hidden'
        ];

        ariaAttributes.forEach(attr => {
            if (jsContent.includes(attr)) {
                this.pass(`✅ Attribut ARIA trouvé: ${attr}`);
            } else {
                this.warn(`⚠️ Attribut ARIA manquant: ${attr}`);
            }
        });

        // Test de la navigation au clavier
        if (jsContent.includes('keydown') && jsContent.includes('Escape')) {
            this.pass('✅ Navigation clavier implémentée');
        } else {
            this.warn('⚠️ Navigation clavier non trouvée');
        }

        // Test de la gestion du focus
        if (jsContent.includes('focus()')) {
            this.pass('✅ Gestion du focus implémentée');
        } else {
            this.warn('⚠️ Gestion du focus non trouvée');
        }
    }

    testTouchOptimizations() {
        console.log('\n👆 Test des optimisations tactiles...');

        const cssPath = path.join(__dirname, 'src/css/input.css');
        const jsPath = path.join(__dirname, 'src/js/hamburger-menu.js');

        if (fs.existsSync(cssPath)) {
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            
            // Test des tailles tactiles
            if (cssContent.includes('48px') || cssContent.includes('44px')) {
                this.pass('✅ Tailles tactiles optimisées');
            } else {
                this.warn('⚠️ Tailles tactiles non optimisées');
            }

            // Test des classes tactiles
            if (cssContent.includes('touch-target') || cssContent.includes('touch-feedback')) {
                this.pass('✅ Classes tactiles trouvées');
            } else {
                this.warn('⚠️ Classes tactiles non trouvées');
            }
        }

        if (fs.existsSync(jsPath)) {
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            // Test des gestes de swipe
            if (jsContent.includes('touchstart') && jsContent.includes('touchmove')) {
                this.pass('✅ Gestes de swipe implémentés');
            } else {
                this.warn('⚠️ Gestes de swipe non trouvés');
            }

            // Test du feedback haptique
            if (jsContent.includes('navigator.vibrate')) {
                this.pass('✅ Feedback haptique implémenté');
            } else {
                this.warn('⚠️ Feedback haptique non trouvé');
            }
        }
    }

    // Méthodes utilitaires
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
            'menu-manager',
            'sidebar'
        ];

        return navigationIndicators.some(indicator => 
            content.toLowerCase().includes(indicator.toLowerCase())
        );
    }

    pass(message) {
        this.results.passed++;
        this.results.details.push({ type: 'pass', message });
        console.log(message);
    }

    fail(message) {
        this.results.failed++;
        this.results.details.push({ type: 'fail', message });
        console.log(message);
    }

    warn(message) {
        this.results.warnings++;
        this.results.details.push({ type: 'warn', message });
        console.log(message);
    }

    displayResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 RÉSULTATS DES TESTS MENU HAMBURGER');
        console.log('='.repeat(60));
        console.log(`✅ Tests réussis: ${this.results.passed}`);
        console.log(`❌ Tests échoués: ${this.results.failed}`);
        console.log(`⚠️  Avertissements: ${this.results.warnings}`);
        console.log(`📈 Score: ${this.calculateScore()}%`);

        if (this.results.failed > 0) {
            console.log('\n🔧 Corrections nécessaires:');
            this.results.details
                .filter(detail => detail.type === 'fail')
                .forEach(detail => console.log(`   - ${detail.message.replace('❌ ', '')}`));
        }

        if (this.results.warnings > 0) {
            console.log('\n💡 Améliorations suggérées:');
            this.results.details
                .filter(detail => detail.type === 'warn')
                .forEach(detail => console.log(`   - ${detail.message.replace('⚠️ ', '')}`));
        }

        console.log('\n🍔 Menu hamburger ' + 
            (this.results.failed === 0 ? 'PRÊT' : 'NÉCESSITE DES CORRECTIONS'));

        if (this.results.failed === 0) {
            console.log('\n🎯 Prochaines étapes:');
            console.log('   1. Tester sur différentes tailles d\'écran');
            console.log('   2. Vérifier le comportement tactile');
            console.log('   3. Tester l\'accessibilité au clavier');
            console.log('   4. Valider sur appareils réels');
        }
    }

    calculateScore() {
        const total = this.results.passed + this.results.failed + this.results.warnings;
        if (total === 0) return 0;
        
        const weighted = this.results.passed + (this.results.warnings * 0.5);
        return Math.round((weighted / total) * 100);
    }
}

// Exécution des tests
if (require.main === module) {
    const tester = new HamburgerMenuTester();
    tester.runAllTests().catch(console.error);
}

module.exports = HamburgerMenuTester;
