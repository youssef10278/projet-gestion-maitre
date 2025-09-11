// main-simple.js - VERSION SIMPLIFIÉE POUR BUILD MACOS
const { app, BrowserWindow, ipcMain, nativeTheme, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// ===== OPTIMISATIONS PERFORMANCE ELECTRON =====
app.commandLine.appendSwitch('--max-old-space-size', '4096');
app.commandLine.appendSwitch('--js-flags', '--max-old-space-size=4096 --optimize-for-size');
app.commandLine.appendSwitch('--enable-features', 'VaapiVideoDecoder,UseSkiaRenderer');
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('--disk-cache-size', '50000000');
app.commandLine.appendSwitch('--enable-gpu-rasterization');
app.disableHardwareAcceleration();

// Variables globales
let mainWindow;
let currentLanguage = 'fr';

// Configuration de l'application
const isDev = process.env.NODE_ENV === 'development';
const isPackaged = app.isPackaged;

// ===== GESTION DES LANGUES =====
const translations = {
  fr: {
    appTitle: 'Gestion Pro - Système de Gestion Complet',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès'
  },
  en: {
    appTitle: 'Management Pro - Complete Management System',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success'
  },
  ar: {
    appTitle: 'إدارة برو - نظام إدارة شامل',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح'
  }
};

function getTranslation(key) {
  return translations[currentLanguage]?.[key] || translations['fr'][key] || key;
}

// ===== CRÉATION DE LA FENÊTRE PRINCIPALE =====
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      spellcheck: false,
      backgroundThrottling: false
    }
  });

  // Charger l'interface
  const indexPath = path.join(__dirname, 'src', 'index.html');
  mainWindow.loadFile(indexPath);

  // Afficher la fenêtre quand elle est prête
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Gestion de la fermeture
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Empêcher la navigation externe
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
}

// ===== GESTION DE L'APPLICATION =====
app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ===== HANDLERS IPC SIMPLIFIÉS =====
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-language', () => {
  return currentLanguage;
});

ipcMain.handle('set-language', (event, language) => {
  if (translations[language]) {
    currentLanguage = language;
    return true;
  }
  return false;
});

ipcMain.handle('get-translation', (event, key) => {
  return getTranslation(key);
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// Handlers pour les données (version simplifiée sans base de données)
ipcMain.handle('get-clients', async () => {
  return []; // Retourner un tableau vide pour le moment
});

ipcMain.handle('get-projects', async () => {
  return [];
});

ipcMain.handle('get-tasks', async () => {
  return [];
});

ipcMain.handle('get-invoices', async () => {
  return [];
});

// Handlers pour les statistiques
ipcMain.handle('get-dashboard-stats', async () => {
  return {
    totalClients: 0,
    activeProjects: 0,
    pendingTasks: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    completedTasks: 0
  };
});

// Handler pour les thèmes
ipcMain.handle('get-theme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

ipcMain.handle('set-theme', (event, theme) => {
  if (theme === 'system') {
    nativeTheme.themeSource = 'system';
  } else if (theme === 'dark') {
    nativeTheme.themeSource = 'dark';
  } else {
    nativeTheme.themeSource = 'light';
  }
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

// Écouter les changements de thème système
nativeTheme.on('updated', () => {
  if (mainWindow) {
    mainWindow.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
  }
});

console.log('🚀 Application Gestion Pro (Version Simplifiée) démarrée');
console.log(`📁 Répertoire de l'app: ${__dirname}`);
console.log(`🔧 Mode développement: ${isDev}`);
console.log(`📦 Application empaquetée: ${isPackaged}`);
