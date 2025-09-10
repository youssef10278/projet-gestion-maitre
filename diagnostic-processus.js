/**
 * Script de diagnostic pour identifier les processus qui bloquent les fichiers
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC DES PROCESSUS BLOQUANTS');
console.log('═'.repeat(60));
console.log('');

function checkRunningProcesses() {
    console.log('📊 PROCESSUS EN COURS D\'EXÉCUTION:');
    console.log('');
    
    const processesToCheck = [
        'electron.exe',
        'node.exe', 
        'GestionPro.exe',
        'app-builder.exe',
        'Code.exe',
        'MsMpEng.exe' // Windows Defender
    ];
    
    processesToCheck.forEach(processName => {
        try {
            const result = execSync(`tasklist /FI "IMAGENAME eq ${processName}" /FO CSV`, { encoding: 'utf8' });
            const lines = result.split('\n').filter(line => line.includes(processName));
            
            if (lines.length > 1) { // Plus que juste l'en-tête
                console.log(`🔴 ${processName} ACTIF:`);
                lines.slice(1).forEach(line => {
                    if (line.trim()) {
                        const parts = line.split(',');
                        const pid = parts[1] ? parts[1].replace(/"/g, '') : 'N/A';
                        const memory = parts[4] ? parts[4].replace(/"/g, '') : 'N/A';
                        console.log(`   PID: ${pid}, Mémoire: ${memory}`);
                    }
                });
            } else {
                console.log(`✅ ${processName} - Aucun processus actif`);
            }
        } catch (error) {
            console.log(`⚠️  ${processName} - Erreur de vérification`);
        }
    });
}

function checkFileAccess() {
    console.log('');
    console.log('📁 VÉRIFICATION D\'ACCÈS AUX FICHIERS:');
    console.log('');
    
    const criticalFiles = [
        'installateur-gestionpro/win-unpacked/resources/app.asar',
        'gestionpro-installer-final/win-unpacked/resources/app.asar',
        'database/gestion.db',
        'main.js'
    ];
    
    criticalFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            try {
                // Tenter d'ouvrir le fichier en lecture
                const fd = fs.openSync(filePath, 'r');
                fs.closeSync(fd);
                console.log(`✅ ${filePath} - Accessible`);
            } catch (error) {
                console.log(`🔴 ${filePath} - VERROUILLÉ (${error.code})`);
            }
        } else {
            console.log(`⚪ ${filePath} - N'existe pas`);
        }
    });
}

function checkDiskSpace() {
    console.log('');
    console.log('💾 ESPACE DISQUE:');
    console.log('');
    
    try {
        const result = execSync('dir /-c', { encoding: 'utf8' });
        const lines = result.split('\n');
        const lastLine = lines[lines.length - 2] || '';
        console.log(`📊 ${lastLine.trim()}`);
    } catch (error) {
        console.log('⚠️  Impossible de vérifier l\'espace disque');
    }
}

function checkPathLength() {
    console.log('');
    console.log('📏 LONGUEUR DU CHEMIN:');
    console.log('');
    
    const currentPath = process.cwd();
    console.log(`📍 Chemin actuel: ${currentPath}`);
    console.log(`📐 Longueur: ${currentPath.length} caractères`);
    
    if (currentPath.length > 120) {
        console.log('🔴 PROBLÈME: Chemin trop long (>120 caractères)');
        console.log('💡 Solution: Déplacer le projet vers un chemin plus court');
    } else {
        console.log('✅ Longueur du chemin acceptable');
    }
    
    // Vérifier les espaces et caractères spéciaux
    if (currentPath.includes(' ')) {
        console.log('⚠️  ATTENTION: Le chemin contient des espaces');
    }
    
    if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(currentPath)) {
        console.log('⚠️  ATTENTION: Le chemin contient des caractères accentués');
    }
}

function generateKillScript() {
    console.log('');
    console.log('🔧 GÉNÉRATION DU SCRIPT DE NETTOYAGE:');
    console.log('');
    
    const killScript = `@echo off
title Nettoyage Processus GestionPro
echo.
echo 🔄 Arrêt forcé des processus...
echo.

REM Arrêter tous les processus Electron
taskkill /F /IM electron.exe /T 2>nul
if %ERRORLEVEL% EQU 0 echo ✅ Processus Electron arrêtés

REM Arrêter tous les processus Node.js
taskkill /F /IM node.exe /T 2>nul
if %ERRORLEVEL% EQU 0 echo ✅ Processus Node.js arrêtés

REM Arrêter GestionPro
taskkill /F /IM GestionPro.exe /T 2>nul
if %ERRORLEVEL% EQU 0 echo ✅ GestionPro arrêté

REM Arrêter app-builder
taskkill /F /IM app-builder.exe /T 2>nul
if %ERRORLEVEL% EQU 0 echo ✅ App-builder arrêté

echo.
echo ⏳ Attente de libération des fichiers (5 secondes)...
timeout /t 5 /nobreak >nul

echo.
echo 🧹 Nettoyage des dossiers de build...

if exist "installateur-gestionpro" (
    rmdir /s /q "installateur-gestionpro" 2>nul
    if %ERRORLEVEL% EQU 0 echo ✅ installateur-gestionpro supprimé
)

if exist "gestionpro-installer-final" (
    rmdir /s /q "gestionpro-installer-final" 2>nul
    if %ERRORLEVEL% EQU 0 echo ✅ gestionpro-installer-final supprimé
)

if exist "dist" (
    rmdir /s /q "dist" 2>nul
    if %ERRORLEVEL% EQU 0 echo ✅ dist supprimé
)

echo.
echo 🎯 Nettoyage terminé ! Vous pouvez maintenant lancer la génération.
echo.
pause
`;
    
    fs.writeFileSync('nettoyer-processus.bat', killScript);
    console.log('✅ Script créé: nettoyer-processus.bat');
}

function main() {
    console.log('🚀 Diagnostic complet du système');
    console.log('');
    
    checkRunningProcesses();
    checkFileAccess();
    checkDiskSpace();
    checkPathLength();
    generateKillScript();
    
    console.log('');
    console.log('📋 RÉSUMÉ DU DIAGNOSTIC:');
    console.log('');
    console.log('🎯 PROCHAINES ÉTAPES:');
    console.log('   1. Exécutez "nettoyer-processus.bat" pour arrêter les processus');
    console.log('   2. Si le chemin est trop long, déplacez le projet');
    console.log('   3. Relancez ce diagnostic pour vérifier');
    console.log('   4. Procédez à la génération de l\'installateur');
}

main();
