// integrer-menu-hamburger.js - Script d'intégration automatique du menu hamburger
// Ajoute le menu hamburger à toutes les pages HTML du projet

const fs = require('fs');
const path = require('path');

class HamburgerMenuIntegrator {
    constructor() {
        this.srcDir = path.join(__dirname, 'src');
        this.scriptTag = '<script src="./js/hamburger-menu.js"></script>';
        this.results = {
            processed: 0,
            updated: 0,
            skipped: 0,
            errors: 0,
            details: []
        };
    }

    async integrate() {
        console.log('🍔 Intégration du menu hamburger dans toutes les pages...\n');

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
            console.error('❌ Erreur lors de l\'intégration:', error.message);
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
            const content = fs.readFileSync(filePath, 'utf8');

            // Vérifier si le script est déjà présent
            if (content.includes('hamburger-menu.js')) {
                console.log(`   ⏭️  Déjà intégré`);
                this.results.skipped++;
                this.results.details.push({
                    file: relativePath,
                    status: 'skipped',
                    reason: 'Déjà intégré'
                });
                return;
            }

            // Vérifier si c'est une page avec navigation
            if (!this.hasNavigation(content)) {
                console.log(`   ⏭️  Pas de navigation détectée`);
                this.results.skipped++;
                this.results.details.push({
                    file: relativePath,
                    status: 'skipped',
                    reason: 'Pas de navigation'
                });
                return;
            }

            // Intégrer le script
            const updatedContent = this.integrateScript(content);

            if (updatedContent !== content) {
                // Sauvegarder le fichier modifié
                fs.writeFileSync(filePath, updatedContent, 'utf8');
                console.log(`   ✅ Intégré avec succès`);
                this.results.updated++;
                this.results.details.push({
                    file: relativePath,
                    status: 'updated',
                    reason: 'Script ajouté'
                });
            } else {
                console.log(`   ⚠️  Aucune modification nécessaire`);
                this.results.skipped++;
                this.results.details.push({
                    file: relativePath,
                    status: 'skipped',
                    reason: 'Aucune modification nécessaire'
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

    hasNavigation(content) {
        // Vérifier la présence d'éléments de navigation
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

    integrateScript(content) {
        // Chercher où insérer le script (avant la fermeture du body ou avec les autres scripts)
        
        // Option 1: Avec les autres scripts (recommandé)
        const scriptPattern = /<script\s+src="\.\/js\/[^"]*\.js"><\/script>/g;
        const scripts = content.match(scriptPattern);
        
        if (scripts && scripts.length > 0) {
            // Insérer après le dernier script existant
            const lastScript = scripts[scripts.length - 1];
            const lastScriptIndex = content.lastIndexOf(lastScript);
            
            if (lastScriptIndex !== -1) {
                const insertPosition = lastScriptIndex + lastScript.length;
                return content.slice(0, insertPosition) + 
                       '\n    ' + this.scriptTag + 
                       content.slice(insertPosition);
            }
        }

        // Option 2: Avant la fermeture du body
        const bodyCloseIndex = content.lastIndexOf('</body>');
        if (bodyCloseIndex !== -1) {
            return content.slice(0, bodyCloseIndex) + 
                   '    ' + this.scriptTag + '\n' +
                   content.slice(bodyCloseIndex);
        }

        // Option 3: Avant la fermeture du html
        const htmlCloseIndex = content.lastIndexOf('</html>');
        if (htmlCloseIndex !== -1) {
            return content.slice(0, htmlCloseIndex) + 
                   '    ' + this.scriptTag + '\n' +
                   content.slice(htmlCloseIndex);
        }

        return content; // Aucune modification possible
    }

    displayResults() {
        console.log('='.repeat(60));
        console.log('📊 RÉSULTATS DE L\'INTÉGRATION');
        console.log('='.repeat(60));
        console.log(`📄 Fichiers traités: ${this.results.processed}`);
        console.log(`✅ Fichiers mis à jour: ${this.results.updated}`);
        console.log(`⏭️  Fichiers ignorés: ${this.results.skipped}`);
        console.log(`❌ Erreurs: ${this.results.errors}`);

        if (this.results.updated > 0) {
            console.log('\n✅ Fichiers mis à jour:');
            this.results.details
                .filter(detail => detail.status === 'updated')
                .forEach(detail => console.log(`   - ${detail.file}`));
        }

        if (this.results.skipped > 0) {
            console.log('\n⏭️  Fichiers ignorés:');
            this.results.details
                .filter(detail => detail.status === 'skipped')
                .forEach(detail => console.log(`   - ${detail.file} (${detail.reason})`));
        }

        if (this.results.errors > 0) {
            console.log('\n❌ Erreurs:');
            this.results.details
                .filter(detail => detail.status === 'error')
                .forEach(detail => console.log(`   - ${detail.file}: ${detail.reason}`));
        }

        console.log('\n🎯 Intégration terminée!');
        
        if (this.results.updated > 0) {
            console.log('\n📝 Prochaines étapes:');
            console.log('   1. Tester le menu hamburger sur différentes tailles d\'écran');
            console.log('   2. Vérifier que la navigation fonctionne correctement');
            console.log('   3. Ajuster les breakpoints si nécessaire');
            console.log('   4. Tester sur appareils tactiles');
        }
    }

    // Méthode pour créer une sauvegarde avant modification
    createBackup() {
        const backupDir = path.join(__dirname, 'backup-avant-hamburger');
        
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const htmlFiles = this.findHtmlFiles(this.srcDir);
        
        console.log('💾 Création de sauvegarde...');
        
        htmlFiles.forEach(file => {
            const relativePath = path.relative(this.srcDir, file);
            const backupPath = path.join(backupDir, relativePath);
            const backupDirPath = path.dirname(backupPath);
            
            if (!fs.existsSync(backupDirPath)) {
                fs.mkdirSync(backupDirPath, { recursive: true });
            }
            
            fs.copyFileSync(file, backupPath);
        });

        console.log(`✅ Sauvegarde créée dans: ${backupDir}\n`);
    }

    // Méthode pour restaurer depuis la sauvegarde
    restoreBackup() {
        const backupDir = path.join(__dirname, 'backup-avant-hamburger');
        
        if (!fs.existsSync(backupDir)) {
            console.log('❌ Aucune sauvegarde trouvée');
            return;
        }

        console.log('🔄 Restauration depuis la sauvegarde...');
        
        const backupFiles = this.findHtmlFiles(backupDir);
        
        backupFiles.forEach(backupFile => {
            const relativePath = path.relative(backupDir, backupFile);
            const originalPath = path.join(this.srcDir, relativePath);
            
            fs.copyFileSync(backupFile, originalPath);
        });

        console.log('✅ Restauration terminée');
    }
}

// Exécution du script
if (require.main === module) {
    const integrator = new HamburgerMenuIntegrator();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--backup')) {
        integrator.createBackup();
    } else if (args.includes('--restore')) {
        integrator.restoreBackup();
    } else {
        // Créer automatiquement une sauvegarde avant intégration
        integrator.createBackup();
        integrator.integrate().catch(console.error);
    }
}

module.exports = HamburgerMenuIntegrator;
