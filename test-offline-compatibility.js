const fs = require('fs');
const path = require('path');

console.log('🔍 Test de compatibilité hors ligne - GestionPro');
console.log('================================================\n');

class OfflineCompatibilityTester {
    constructor() {
        this.srcDir = path.join(__dirname, 'src');
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            issues: []
        };
    }

    async runAllTests() {
        console.log('🚀 Démarrage des tests de compatibilité hors ligne...\n');

        // Test 1: Vérifier l'absence de CDN
        await this.testNoCDNUsage();
        
        // Test 2: Vérifier la présence du CSS compilé
        await this.testCompiledCSSExists();
        
        // Test 3: Vérifier la taille du CSS
        await this.testCSSSize();
        
        // Test 4: Vérifier les liens CSS dans chaque page
        await this.testCSSLinksInPages();
        
        // Test 5: Vérifier les ressources locales
        await this.testLocalResources();

        // Afficher les résultats
        this.displayResults();
    }

    async testNoCDNUsage() {
        console.log('📡 Test 1: Vérification absence de CDN...');
        
        const htmlFiles = this.findHtmlFiles(this.srcDir);
        let cdnFound = false;
        
        for (const file of htmlFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const fileName = path.relative(this.srcDir, file);
            
            if (content.includes('cdn.tailwindcss.com')) {
                this.results.issues.push(`❌ CDN Tailwind trouvé dans ${fileName}`);
                cdnFound = true;
            }
            
            if (content.includes('cdnjs.cloudflare.com')) {
                this.results.issues.push(`❌ CDN Cloudflare trouvé dans ${fileName}`);
                cdnFound = true;
            }
            
            if (content.includes('unpkg.com')) {
                this.results.issues.push(`❌ CDN unpkg trouvé dans ${fileName}`);
                cdnFound = true;
            }
        }
        
        this.results.total++;
        if (!cdnFound) {
            this.results.passed++;
            console.log('✅ Aucun CDN externe détecté');
        } else {
            this.results.failed++;
            console.log('❌ CDN externes détectés');
        }
        console.log('');
    }

    async testCompiledCSSExists() {
        console.log('📄 Test 2: Vérification du CSS compilé...');
        
        const cssPath = path.join(this.srcDir, 'css', 'output.css');
        this.results.total++;
        
        if (fs.existsSync(cssPath)) {
            this.results.passed++;
            console.log('✅ Fichier CSS compilé trouvé');
        } else {
            this.results.failed++;
            this.results.issues.push('❌ Fichier CSS compilé manquant');
            console.log('❌ Fichier CSS compilé manquant');
        }
        console.log('');
    }

    async testCSSSize() {
        console.log('📏 Test 3: Vérification de la taille du CSS...');
        
        const cssPath = path.join(this.srcDir, 'css', 'output.css');
        this.results.total++;
        
        if (fs.existsSync(cssPath)) {
            const stats = fs.statSync(cssPath);
            const sizeKB = Math.round(stats.size / 1024);
            
            if (stats.size > 10000) { // Plus de 10KB
                this.results.passed++;
                console.log(`✅ Taille CSS valide: ${sizeKB} KB`);
            } else {
                this.results.failed++;
                this.results.issues.push(`❌ CSS trop petit: ${sizeKB} KB`);
                console.log(`❌ CSS trop petit: ${sizeKB} KB`);
            }
        } else {
            this.results.failed++;
            this.results.issues.push('❌ Impossible de vérifier la taille - fichier manquant');
            console.log('❌ Impossible de vérifier la taille - fichier manquant');
        }
        console.log('');
    }

    async testCSSLinksInPages() {
        console.log('🔗 Test 4: Vérification des liens CSS...');
        
        const htmlFiles = this.findHtmlFiles(this.srcDir);
        let allPagesHaveCSS = true;
        
        for (const file of htmlFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const fileName = path.relative(this.srcDir, file);
            
            if (!content.includes('./css/output.css')) {
                this.results.issues.push(`❌ Lien CSS manquant dans ${fileName}`);
                allPagesHaveCSS = false;
            }
        }
        
        this.results.total++;
        if (allPagesHaveCSS) {
            this.results.passed++;
            console.log(`✅ Toutes les pages (${htmlFiles.length}) ont le CSS local`);
        } else {
            this.results.failed++;
            console.log('❌ Certaines pages n\'ont pas le CSS local');
        }
        console.log('');
    }

    async testLocalResources() {
        console.log('🏠 Test 5: Vérification des ressources locales...');
        
        const requiredFiles = [
            'css/output.css',
            'css/common.css',
            'css/hamburger-menu.css',
            'js/i18n.js',
            'locales/fr.json',
            'locales/ar.json'
        ];
        
        let allResourcesExist = true;
        
        for (const file of requiredFiles) {
            const filePath = path.join(this.srcDir, file);
            if (!fs.existsSync(filePath)) {
                this.results.issues.push(`❌ Ressource manquante: ${file}`);
                allResourcesExist = false;
            }
        }
        
        this.results.total++;
        if (allResourcesExist) {
            this.results.passed++;
            console.log('✅ Toutes les ressources locales sont présentes');
        } else {
            this.results.failed++;
            console.log('❌ Certaines ressources locales sont manquantes');
        }
        console.log('');
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

    displayResults() {
        console.log('📊 RÉSULTATS DES TESTS');
        console.log('======================');
        console.log(`Total des tests: ${this.results.total}`);
        console.log(`✅ Réussis: ${this.results.passed}`);
        console.log(`❌ Échoués: ${this.results.failed}`);
        console.log(`📈 Taux de réussite: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
        
        if (this.results.issues.length > 0) {
            console.log('\n🔍 PROBLÈMES DÉTECTÉS:');
            this.results.issues.forEach(issue => console.log(`  ${issue}`));
        }
        
        console.log('\n' + '='.repeat(50));
        
        if (this.results.failed === 0) {
            console.log('🎉 TOUS LES TESTS SONT PASSÉS!');
            console.log('✅ L\'application fonctionne parfaitement hors ligne');
        } else {
            console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
            console.log('🔧 Veuillez corriger les problèmes listés ci-dessus');
        }
    }
}

// Exécuter les tests
const tester = new OfflineCompatibilityTester();
tester.runAllTests().catch(console.error);
