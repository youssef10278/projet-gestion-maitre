// test-interface-tactile.js - Tests pour l'interface tactile
// Script de validation des optimisations tactiles

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TouchInterfaceValidator {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
    }

    async runAllTests() {
        console.log('🧪 Démarrage des tests d\'interface tactile...\n');

        // Tests des fichiers
        this.testFileStructure();
        this.testCSSOptimizations();
        this.testHTMLStructure();
        this.testJavaScriptIntegration();

        // Tests de configuration
        this.testResponsiveDesign();
        this.testAccessibility();
        this.testPerformance();

        // Afficher les résultats
        this.displayResults();
    }

    testFileStructure() {
        console.log('📁 Test de la structure des fichiers...');

        const requiredFiles = [
            'src/css/input.css',
            'src/js/touch-interface.js',
            'src/caisse.html',
            'GUIDE-CAISSE-TACTILE.md'
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

    testCSSOptimizations() {
        console.log('\n🎨 Test des optimisations CSS...');

        const cssPath = path.join(__dirname, 'src/css/input.css');
        if (!fs.existsSync(cssPath)) {
            this.fail('❌ Fichier CSS principal manquant');
            return;
        }

        const cssContent = fs.readFileSync(cssPath, 'utf8');

        // Test des variables CSS tactiles
        const requiredVariables = [
            '--touch-target-min',
            '--touch-spacing',
            '--touch-feedback-duration'
        ];

        requiredVariables.forEach(variable => {
            if (cssContent.includes(variable)) {
                this.pass(`✅ Variable CSS trouvée: ${variable}`);
            } else {
                this.fail(`❌ Variable CSS manquante: ${variable}`);
            }
        });

        // Test des media queries tactiles
        const touchMediaQuery = '@media (hover: none) and (pointer: coarse)';
        if (cssContent.includes(touchMediaQuery)) {
            this.pass('✅ Media query tactile trouvée');
        } else {
            this.fail('❌ Media query tactile manquante');
        }

        // Test des classes tactiles
        const requiredClasses = [
            '.touch-target',
            '.touch-feedback',
            '.touch-active',
            '.interactive-element'
        ];

        requiredClasses.forEach(className => {
            if (cssContent.includes(className)) {
                this.pass(`✅ Classe CSS trouvée: ${className}`);
            } else {
                this.fail(`❌ Classe CSS manquante: ${className}`);
            }
        });

        // Test des tailles minimales
        if (cssContent.includes('min-height: var(--touch-target-min)')) {
            this.pass('✅ Tailles minimales tactiles configurées');
        } else {
            this.warn('⚠️ Tailles minimales tactiles non trouvées');
        }
    }

    testHTMLStructure() {
        console.log('\n📄 Test de la structure HTML...');

        const htmlPath = path.join(__dirname, 'src/caisse.html');
        if (!fs.existsSync(htmlPath)) {
            this.fail('❌ Fichier HTML principal manquant');
            return;
        }

        const htmlContent = fs.readFileSync(htmlPath, 'utf8');

        // Test des classes tactiles dans le HTML
        const requiredClasses = [
            'touch-target',
            'touch-feedback',
            'interactive-element',
            'main-container',
            'landscape-optimized'
        ];

        requiredClasses.forEach(className => {
            if (htmlContent.includes(className)) {
                this.pass(`✅ Classe HTML trouvée: ${className}`);
            } else {
                this.warn(`⚠️ Classe HTML non trouvée: ${className}`);
            }
        });

        // Test de l'inclusion du script tactile
        if (htmlContent.includes('touch-interface.js')) {
            this.pass('✅ Script tactile inclus dans le HTML');
        } else {
            this.fail('❌ Script tactile non inclus dans le HTML');
        }

        // Test de la meta viewport
        if (htmlContent.includes('viewport')) {
            this.pass('✅ Meta viewport trouvée');
        } else {
            this.fail('❌ Meta viewport manquante');
        }

        // Test des boutons de paiement optimisés
        const paymentButtons = [
            'validate-payment-btn',
            'cancel-sale-btn',
            'cash-payment-btn'
        ];

        paymentButtons.forEach(buttonId => {
            if (htmlContent.includes(buttonId)) {
                this.pass(`✅ Bouton de paiement trouvé: ${buttonId}`);
            } else {
                this.warn(`⚠️ Bouton de paiement non trouvé: ${buttonId}`);
            }
        });
    }

    testJavaScriptIntegration() {
        console.log('\n⚙️ Test de l\'intégration JavaScript...');

        const jsPath = path.join(__dirname, 'src/js/touch-interface.js');
        if (!fs.existsSync(jsPath)) {
            this.fail('❌ Fichier JavaScript tactile manquant');
            return;
        }

        const jsContent = fs.readFileSync(jsPath, 'utf8');

        // Test de la classe principale
        if (jsContent.includes('class TouchInterface')) {
            this.pass('✅ Classe TouchInterface trouvée');
        } else {
            this.fail('❌ Classe TouchInterface manquante');
        }

        // Test des méthodes essentielles
        const requiredMethods = [
            'detectTouchDevice',
            'handleTouchStart',
            'handleTouchEnd',
            'handleLongPress',
            'initTouchHandlers'
        ];

        requiredMethods.forEach(method => {
            if (jsContent.includes(method)) {
                this.pass(`✅ Méthode trouvée: ${method}`);
            } else {
                this.fail(`❌ Méthode manquante: ${method}`);
            }
        });

        // Test de la détection tactile
        if (jsContent.includes('ontouchstart')) {
            this.pass('✅ Détection tactile implémentée');
        } else {
            this.fail('❌ Détection tactile manquante');
        }

        // Test du feedback haptique
        if (jsContent.includes('navigator.vibrate')) {
            this.pass('✅ Feedback haptique implémenté');
        } else {
            this.warn('⚠️ Feedback haptique non trouvé');
        }
    }

    testResponsiveDesign() {
        console.log('\n📱 Test du design responsive...');

        const cssPath = path.join(__dirname, 'src/css/input.css');
        if (!fs.existsSync(cssPath)) return;

        const cssContent = fs.readFileSync(cssPath, 'utf8');

        // Test des breakpoints
        const breakpoints = [
            '@media (min-width: 768px)',
            '@media (max-width: 767px)',
            '@media (orientation: landscape)',
            '@media (orientation: portrait)'
        ];

        breakpoints.forEach(breakpoint => {
            if (cssContent.includes(breakpoint)) {
                this.pass(`✅ Breakpoint trouvé: ${breakpoint}`);
            } else {
                this.warn(`⚠️ Breakpoint non trouvé: ${breakpoint}`);
            }
        });

        // Test des adaptations spécifiques
        if (cssContent.includes('keyboard-open')) {
            this.pass('✅ Gestion clavier virtuel trouvée');
        } else {
            this.warn('⚠️ Gestion clavier virtuel non trouvée');
        }
    }

    testAccessibility() {
        console.log('\n♿ Test de l\'accessibilité...');

        const jsPath = path.join(__dirname, 'src/js/touch-interface.js');
        if (!fs.existsSync(jsPath)) return;

        const jsContent = fs.readFileSync(jsPath, 'utf8');

        // Test des améliorations d'accessibilité
        if (jsContent.includes('initAccessibility')) {
            this.pass('✅ Initialisation accessibilité trouvée');
        } else {
            this.warn('⚠️ Initialisation accessibilité non trouvée');
        }

        if (jsContent.includes('focusin') && jsContent.includes('focusout')) {
            this.pass('✅ Gestion du focus implémentée');
        } else {
            this.warn('⚠️ Gestion du focus non trouvée');
        }

        // Test des outlines
        const cssPath = path.join(__dirname, 'src/css/input.css');
        if (fs.existsSync(cssPath)) {
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            if (cssContent.includes('outline:') || cssContent.includes('focus:')) {
                this.pass('✅ Styles de focus trouvés');
            } else {
                this.warn('⚠️ Styles de focus non trouvés');
            }
        }
    }

    testPerformance() {
        console.log('\n⚡ Test des optimisations de performance...');

        const jsPath = path.join(__dirname, 'src/js/touch-interface.js');
        if (!fs.existsSync(jsPath)) return;

        const jsContent = fs.readFileSync(jsPath, 'utf8');

        // Test des optimisations
        if (jsContent.includes('passive: true') || jsContent.includes('passive: false')) {
            this.pass('✅ Événements passifs configurés');
        } else {
            this.warn('⚠️ Configuration événements passifs non trouvée');
        }

        if (jsContent.includes('debounce') || jsContent.includes('throttle')) {
            this.pass('✅ Optimisations de fréquence trouvées');
        } else {
            this.warn('⚠️ Optimisations de fréquence non trouvées');
        }

        if (jsContent.includes('MutationObserver')) {
            this.pass('✅ Observer pour contenu dynamique trouvé');
        } else {
            this.warn('⚠️ Observer pour contenu dynamique non trouvé');
        }
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
        console.log('📊 RÉSULTATS DES TESTS');
        console.log('='.repeat(60));
        console.log(`✅ Tests réussis: ${this.results.passed}`);
        console.log(`❌ Tests échoués: ${this.results.failed}`);
        console.log(`⚠️  Avertissements: ${this.results.warnings}`);
        console.log(`📈 Score: ${this.calculateScore()}%`);

        if (this.results.failed > 0) {
            console.log('\n🔧 Actions recommandées:');
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

        console.log('\n🎯 Interface tactile ' + 
            (this.results.failed === 0 ? 'PRÊTE' : 'NÉCESSITE DES CORRECTIONS'));
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
    const validator = new TouchInterfaceValidator();
    validator.runAllTests().catch(console.error);
}

module.exports = TouchInterfaceValidator;
