/**
 * Système d'impression des devis
 * Template professionnel A4 avec logo et mise en forme élégante
 */

class QuotePrinter {
    constructor() {
        this.currentQuoteData = null;
    }

    /**
     * Définit les données du devis à imprimer
     */
    setQuoteData(quoteData) {
        this.currentQuoteData = quoteData;
        console.log('📄 Données de devis définies pour impression:', quoteData.number);
    }

    /**
     * Génère le contenu HTML du devis pour impression
     */
    generateQuoteHTML(quoteData = null) {
        const data = quoteData || this.currentQuoteData;
        if (!data) {
            throw new Error('Aucune donnée de devis disponible pour l\'impression');
        }

        // Obtenir la langue actuelle
        const currentLang = localStorage.getItem('language') || 'fr';
        const isRTL = currentLang === 'ar';

        // Fonction de traduction (fallback si t() n'est pas disponible)
        const t = window.t || ((key) => key);

        // Calculer les totaux
        const lineDiscountsTotal = data.items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
        const totalSavings = lineDiscountsTotal + (data.discount_amount || 0);

        return `
            <!DOCTYPE html>
            <html lang="${currentLang}" dir="${isRTL ? 'rtl' : 'ltr'}">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Devis ${data.number}</title>
                <style>
                    ${this.getQuoteCSS(isRTL)}
                </style>
            </head>
            <body>
                <div class="quote-document">
                    <!-- En-tête avec logo et informations entreprise -->
                    <div class="header">
                        <div class="company-section">
                            <div class="company-logo">
                                <div class="logo-container">
                                    ${data.company?.logo ?
                                        `<img src="${data.company.logo}" alt="Logo ${data.company.name || 'Entreprise'}" class="company-logo-img">` :
                                        this.generateDefaultLogo(data.company?.name || 'GestionPro')
                                    }
                                </div>
                            </div>
                            <div class="company-info">
                                <h1 class="company-name">${data.company?.name || t('company_name') || 'GestionPro'}</h1>
                                <div class="company-details">
                                    <p>${data.company?.address || t('company_address') || 'Adresse de l\'entreprise'}</p>
                                    <p>Tél: ${data.company?.phone || t('company_phone')?.replace('Tél: ', '') || '0123456789'}</p>
                                    <p>ICE: ${data.company?.ice || t('company_ice')?.replace('ICE: ', '') || 'ICE123456789'}</p>
                                    ${data.company?.email ? `<p>Email: ${data.company.email}</p>` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div class="quote-title">
                            <h2>DEVIS</h2>
                            <div class="quote-number">${data.number}</div>
                        </div>
                    </div>

                    <!-- Informations client et devis -->
                    <div class="info-section">
                        <div class="client-info">
                            <h3>Client:</h3>
                            <div class="client-details">
                                <p><strong>${data.client_name}</strong></p>
                                ${data.client_phone ? `<p>Tél: ${data.client_phone}</p>` : ''}
                                ${data.client_address ? `<p>${data.client_address}</p>` : ''}
                            </div>
                        </div>
                        
                        <div class="quote-info">
                            <h3>Informations:</h3>
                            <div class="quote-details">
                                <p><strong>Date:</strong> ${this.formatDate(data.date_created)}</p>
                                <p><strong>Validité:</strong> ${this.formatDate(data.date_validity)}</p>
                                <p><strong>Durée:</strong> ${data.validity_days} jours</p>
                                <p><strong>Statut:</strong> ${this.getStatusText(data.status)}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Articles du devis -->
                    <div class="items-section">
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Désignation</th>
                                    <th>Qté</th>
                                    <th>Prix Unit.</th>
                                    <th>Total</th>
                                    <th>Remise</th>
                                    <th>Prix Final</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.items.map(item => `
                                    <tr>
                                        <td class="item-name">${item.product_name}</td>
                                        <td class="text-center">${item.quantity}</td>
                                        <td class="text-right">${item.unit_price.toFixed(2)} MAD</td>
                                        <td class="text-right">${item.line_total.toFixed(2)} MAD</td>
                                        <td class="text-right ${(item.discount_amount || 0) > 0 ? 'text-red' : ''}">
                                            ${(item.discount_amount || 0) > 0 ? `-${item.discount_amount.toFixed(2)} MAD` : '-'}
                                        </td>
                                        <td class="text-right font-bold">${(item.final_price || item.line_total).toFixed(2)} MAD</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Totaux -->
                    <div class="totals-section">
                        <div class="totals-table">
                            <div class="total-row">
                                <span>Sous-total:</span>
                                <span>${data.subtotal.toFixed(2)} MAD</span>
                            </div>
                            ${lineDiscountsTotal > 0 ? `
                                <div class="total-row discount">
                                    <span>Remises par ligne:</span>
                                    <span>-${lineDiscountsTotal.toFixed(2)} MAD</span>
                                </div>
                            ` : ''}
                            ${(data.discount_amount || 0) > 0 ? `
                                <div class="total-row discount">
                                    <span>Remise globale ${data.discount_type === 'percentage' ? `(${data.discount_value}%)` : ''}:</span>
                                    <span>-${data.discount_amount.toFixed(2)} MAD</span>
                                </div>
                            ` : ''}
                            <div class="total-row grand-total">
                                <span>TOTAL:</span>
                                <span>${data.total_amount.toFixed(2)} MAD</span>
                            </div>
                            ${totalSavings > 0 ? `
                                <div class="savings-row">
                                    <span>💰 Économies totales: ${totalSavings.toFixed(2)} MAD</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Notes et conditions -->
                    ${data.notes || data.conditions ? `
                        <div class="notes-section">
                            ${data.notes ? `
                                <div class="notes">
                                    <h3>Notes:</h3>
                                    <p>${data.notes}</p>
                                </div>
                            ` : ''}
                            ${data.conditions ? `
                                <div class="conditions">
                                    <h3>Conditions de vente:</h3>
                                    <p>${data.conditions}</p>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}

                    <!-- Pied de page -->
                    <div class="footer">
                        <div class="validity-notice">
                            <p><strong>⚠️ Ce devis est valable jusqu'au ${this.formatDate(data.date_validity)}</strong></p>
                        </div>
                        
                        <div class="signature-section">
                            <div class="signature-box">
                                <p>Signature du client:</p>
                                <div class="signature-line"></div>
                                <p class="signature-date">Date: _______________</p>
                            </div>
                            
                            <div class="company-signature">
                                <p>Pour l'entreprise:</p>
                                <div class="signature-line"></div>
                                <p class="signature-name">${data.created_by || 'GestionPro'}</p>
                            </div>
                        </div>
                        
                        <div class="footer-info">
                            <p>Devis généré le ${this.formatDate(new Date().toISOString())} par GestionPro</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * CSS professionnel pour l'impression A4
     */
    getQuoteCSS(isRTL = false) {
        return `
            @page {
                size: A4;
                margin: 20mm;
            }
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                background: #fff;
                direction: ${isRTL ? 'rtl' : 'ltr'};
            }
            
            .quote-document {
                max-width: 210mm;
                margin: 0 auto;
                background: white;
                padding: 20px;
            }
            
            /* En-tête */
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 3px solid #0891b2;
            }
            
            .company-section {
                display: flex;
                align-items: flex-start;
                gap: 15px;
            }
            
            .company-logo {
                flex-shrink: 0;
            }

            .logo-container {
                width: 70px;
                height: 70px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .company-logo-img {
                width: 70px;
                height: 70px;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .logo-placeholder {
                width: 70px;
                height: 70px;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(8, 145, 178, 0.2);
                overflow: hidden;
            }

            .logo-placeholder svg {
                width: 70px;
                height: 70px;
            }

            .logo-text {
                position: absolute;
                bottom: 8px;
                right: 8px;
                background: rgba(255, 255, 255, 0.9);
                color: #0891b2;
                font-size: 10px;
                font-weight: bold;
                padding: 2px 4px;
                border-radius: 3px;
                line-height: 1;
            }

            .logo-badge {
                position: absolute;
                bottom: -2px;
                right: -2px;
                background: #ffffff;
                color: #0891b2;
                font-size: 8px;
                font-weight: bold;
                padding: 2px 4px;
                border-radius: 6px;
                border: 1px solid #0891b2;
                line-height: 1;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            
            .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #0891b2;
                margin-bottom: 5px;
            }
            
            .company-details p {
                margin: 2px 0;
                color: #666;
                font-size: 11px;
            }
            
            .quote-title {
                text-align: right;
            }
            
            .quote-title h2 {
                font-size: 28px;
                font-weight: bold;
                color: #0891b2;
                margin-bottom: 5px;
            }
            
            .quote-number {
                font-size: 16px;
                font-weight: bold;
                color: #666;
                background: #f0f9ff;
                padding: 8px 12px;
                border-radius: 6px;
                border: 1px solid #0891b2;
            }
            
            /* Section informations */
            .info-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-bottom: 30px;
            }
            
            .client-info h3,
            .quote-info h3 {
                font-size: 14px;
                font-weight: bold;
                color: #0891b2;
                margin-bottom: 10px;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 5px;
            }
            
            .client-details p,
            .quote-details p {
                margin: 3px 0;
                font-size: 11px;
            }
            
            /* Table des articles */
            .items-section {
                margin-bottom: 30px;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            
            .items-table th {
                background: linear-gradient(135deg, #0891b2, #06b6d4);
                color: white;
                padding: 12px 8px;
                text-align: left;
                font-size: 11px;
                font-weight: bold;
                border: 1px solid #0891b2;
            }
            
            .items-table td {
                padding: 10px 8px;
                border: 1px solid #e5e7eb;
                font-size: 11px;
            }
            
            .items-table tbody tr:nth-child(even) {
                background: #f8fafc;
            }
            
            .items-table tbody tr:hover {
                background: #f0f9ff;
            }
            
            .item-name {
                font-weight: 500;
                color: #374151;
            }
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-red { color: #dc2626; }
            .font-bold { font-weight: bold; }
            
            /* Section totaux */
            .totals-section {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 30px;
            }
            
            .totals-table {
                min-width: 300px;
                border: 2px solid #0891b2;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 15px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 12px;
            }
            
            .total-row.discount {
                color: #dc2626;
                background: #fef2f2;
            }
            
            .total-row.grand-total {
                background: linear-gradient(135deg, #0891b2, #06b6d4);
                color: white;
                font-size: 16px;
                font-weight: bold;
                border-bottom: none;
            }
            
            .savings-row {
                background: #f0fdf4;
                color: #166534;
                padding: 8px 15px;
                text-align: center;
                font-size: 11px;
                font-weight: bold;
            }
            
            /* Notes et conditions */
            .notes-section {
                margin-bottom: 30px;
            }
            
            .notes,
            .conditions {
                margin-bottom: 15px;
                padding: 15px;
                background: #f8fafc;
                border-radius: 6px;
                border-left: 4px solid #0891b2;
            }
            
            .notes h3,
            .conditions h3 {
                font-size: 13px;
                color: #0891b2;
                margin-bottom: 8px;
            }
            
            .notes p,
            .conditions p {
                font-size: 11px;
                line-height: 1.5;
                color: #374151;
            }
            
            /* Pied de page */
            .footer {
                border-top: 2px solid #0891b2;
                padding-top: 20px;
            }
            
            .validity-notice {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 6px;
                padding: 12px;
                text-align: center;
                margin-bottom: 20px;
            }
            
            .validity-notice p {
                color: #92400e;
                font-size: 13px;
                font-weight: bold;
            }
            
            .signature-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-bottom: 20px;
            }
            
            .signature-box,
            .company-signature {
                text-align: center;
            }
            
            .signature-box p,
            .company-signature p {
                font-size: 11px;
                color: #666;
                margin-bottom: 5px;
            }
            
            .signature-line {
                border-bottom: 1px solid #333;
                height: 40px;
                margin: 10px 0;
            }
            
            .signature-date,
            .signature-name {
                font-size: 10px;
                color: #999;
            }
            
            .footer-info {
                text-align: center;
                font-size: 10px;
                color: #999;
                border-top: 1px solid #e5e7eb;
                padding-top: 10px;
            }
            
            /* Styles d'impression */
            @media print {
                @page {
                    size: A4;
                    margin: 15mm;
                }
                
                body {
                    font-size: 11px;
                }
                
                .quote-document {
                    margin: 0;
                    padding: 0;
                }
                
                .header {
                    margin-bottom: 25px;
                }
                
                .company-name {
                    font-size: 22px;
                }
                
                .quote-title h2 {
                    font-size: 26px;
                }
                
                .items-table th {
                    font-size: 10px;
                    padding: 8px 6px;
                }
                
                .items-table td {
                    font-size: 10px;
                    padding: 6px;
                }
                
                .total-row {
                    font-size: 11px;
                }
                
                .total-row.grand-total {
                    font-size: 14px;
                }
                
                /* Logo optimisé pour impression */
                .logo-container {
                    width: 60px;
                    height: 60px;
                }

                .company-logo-img {
                    width: 60px;
                    height: 60px;
                }

                .logo-placeholder {
                    width: 60px;
                    height: 60px;
                }

                .logo-placeholder svg {
                    width: 60px;
                    height: 60px;
                }

                .logo-text {
                    font-size: 8px;
                    bottom: 6px;
                    right: 6px;
                }

                .logo-badge {
                    font-size: 6px;
                    padding: 1px 3px;
                    bottom: -1px;
                    right: -1px;
                }

                /* Éviter les coupures de page */
                .header,
                .info-section,
                .totals-section,
                .signature-section {
                    page-break-inside: avoid;
                }

                .items-table {
                    page-break-inside: auto;
                }

                .items-table tr {
                    page-break-inside: avoid;
                }
            }
        `;
    }

    /**
     * Formate une date pour l'affichage
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    /**
     * Retourne le texte du statut
     */
    getStatusText(status) {
        const statusMap = {
            'draft': 'Brouillon',
            'sent': 'Envoyé',
            'accepted': 'Accepté',
            'rejected': 'Refusé',
            'expired': 'Expiré',
            'converted': 'Converti'
        };
        return statusMap[status] || status;
    }

    /**
     * Génère un logo par défaut basé sur le nom de l'entreprise
     */
    generateDefaultLogo(companyName) {
        // Extraire les initiales (max 3 caractères)
        const initials = companyName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 3)
            .join('');

        // Couleurs basées sur le nom de l'entreprise
        const colors = [
            { primary: '#0891b2', secondary: '#06b6d4' },
            { primary: '#7c3aed', secondary: '#a855f7' },
            { primary: '#dc2626', secondary: '#ef4444' },
            { primary: '#059669', secondary: '#10b981' },
            { primary: '#d97706', secondary: '#f59e0b' }
        ];

        const colorIndex = companyName.length % colors.length;
        const color = colors[colorIndex];

        return `
            <div class="logo-placeholder">
                <svg width="70" height="70" viewBox="0 0 100 100" fill="none">
                    <!-- Cercle principal avec dégradé -->
                    <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" stroke="#ffffff" stroke-width="2"/>

                    <!-- Motif décoratif -->
                    <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
                    <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>

                    <!-- Icônes métier -->
                    <g opacity="0.3">
                        <!-- Document -->
                        <rect x="25" y="30" width="18" height="24" rx="2" fill="#ffffff"/>
                        <rect x="28" y="34" width="12" height="1.5" fill="${color.primary}"/>
                        <rect x="28" y="38" width="10" height="1.5" fill="${color.primary}"/>
                        <rect x="28" y="42" width="8" height="1.5" fill="${color.primary}"/>

                        <!-- Graphique -->
                        <rect x="55" y="40" width="3" height="8" fill="#ffffff"/>
                        <rect x="60" y="35" width="3" height="13" fill="#ffffff"/>
                        <rect x="65" y="30" width="3" height="18" fill="#ffffff"/>
                        <rect x="70" y="38" width="3" height="10" fill="#ffffff"/>
                    </g>

                    <!-- Texte des initiales -->
                    <text x="50" y="58" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
                        ${initials}
                    </text>

                    <!-- Dégradé personnalisé -->
                    <defs>
                        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:${color.primary};stop-opacity:1" />
                            <stop offset="100%" style="stop-color:${color.secondary};stop-opacity:1" />
                        </linearGradient>
                    </defs>
                </svg>

                <!-- Badge professionnel -->
                <div class="logo-badge">${initials}</div>
            </div>
        `;
    }

    /**
     * Aperçu du devis dans une nouvelle fenêtre
     */
    async previewQuote(quoteData = null) {
        try {
            const data = quoteData || this.currentQuoteData;
            if (!data) {
                throw new Error('Aucune donnée de devis disponible');
            }

            const quoteHTML = this.generateQuoteHTML(data);
            
            // Ouvrir dans une nouvelle fenêtre pour aperçu
            const previewWindow = window.open('', '_blank', 'width=800,height=1000,scrollbars=yes');
            
            if (previewWindow) {
                previewWindow.document.write(quoteHTML);
                previewWindow.document.close();
                previewWindow.focus();
                
                console.log('👁️ Aperçu du devis ouvert:', data.number);
                this.showNotification('success', 'Aperçu du devis ouvert');
            } else {
                throw new Error('Impossible d\'ouvrir la fenêtre d\'aperçu');
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'aperçu:', error);
            this.showNotification('error', 'Erreur lors de l\'aperçu du devis');
        }
    }

    /**
     * Impression directe du devis
     */
    async printQuote(quoteData = null) {
        try {
            const data = quoteData || this.currentQuoteData;
            if (!data) {
                throw new Error('Aucune donnée de devis disponible');
            }

            const quoteHTML = this.generateQuoteHTML(data);
            
            // Ouvrir pour impression
            const printWindow = window.open('', '_blank', 'width=800,height=1000');
            
            if (printWindow) {
                printWindow.document.write(quoteHTML);
                printWindow.document.close();
                
                // Attendre le chargement puis imprimer
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.focus();
                        printWindow.print();
                        
                        // Fermer après impression
                        setTimeout(() => {
                            printWindow.close();
                        }, 2000);
                    }, 500);
                };
                
                console.log('🖨️ Devis envoyé à l\'imprimante:', data.number);
                this.showNotification('success', 'Devis envoyé à l\'imprimante');
            } else {
                throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'impression:', error);
            this.showNotification('error', 'Erreur lors de l\'impression du devis');
        }
    }

    /**
     * Export en PDF
     */
    async exportToPDF(quoteData = null) {
        try {
            const data = quoteData || this.currentQuoteData;
            if (!data) {
                throw new Error('Aucune donnée de devis disponible');
            }

            const quoteHTML = this.generateQuoteHTML(data);
            const filename = `devis_${data.number}_${Date.now()}.pdf`;

            // Utiliser l'API Electron spécialisée pour les devis
            if (window.api && window.api.pdf && window.api.pdf.generateQuotePDF) {
                const result = await window.api.pdf.generateQuotePDF(quoteHTML, filename);
                if (result && result.success) {
                    const fileName = result.filePath.split('\\').pop() || result.filePath.split('/').pop();
                    this.showNotification('success', `PDF sauvegardé : ${fileName}`);
                    console.log('📄 PDF devis généré:', fileName);
                } else {
                    this.showNotification('warning', result?.message || 'Sauvegarde annulée par l\'utilisateur');
                }
            } else if (window.api && window.api.pdf) {
                // Fallback vers l'API générique
                const result = await window.api.pdf.generatePDF(quoteHTML, filename);
                if (result && result.success) {
                    const fileName = result.filePath.split('\\').pop() || result.filePath.split('/').pop();
                    this.showNotification('success', `PDF sauvegardé : ${fileName}`);
                } else {
                    this.showNotification('warning', result?.message || 'Sauvegarde annulée par l\'utilisateur');
                }
            } else {
                // Fallback : aperçu pour impression manuelle
                await this.previewQuote(data);
                this.showNotification('info', 'Utilisez Ctrl+P pour sauvegarder en PDF depuis l\'aperçu');
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'export PDF:', error);
            this.showNotification('error', 'Erreur lors de la génération du PDF');
        }
    }

    /**
     * Affiche une notification
     */
    showNotification(type, message) {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
            // Créer une notification temporaire dans l'interface
            this.createTempNotification(type, message);
        }
    }

    /**
     * Crée une notification temporaire si showNotification n'est pas disponible
     */
    createTempNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-black' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Supprimer après 3 secondes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Instance globale
window.quotePrinter = new QuotePrinter();
