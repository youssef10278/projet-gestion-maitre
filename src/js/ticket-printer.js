// src/js/ticket-printer.js - Système d'impression de tickets

/**
 * Classe pour la génération et l'impression de tickets de caisse
 */
class TicketPrinter {
    constructor() {
        this.lastSaleData = null;
        // Ne plus générer de numéro ici, utiliser celui de la base de données
    }

    /**
     * Stocke les données de la dernière vente pour impression
     */
    setSaleData(saleData) {
        try {
            if (!saleData) {
                console.error('setSaleData: données nulles ou undefined');
                return;
            }

            // Utiliser le numéro de ticket de la base de données
            this.lastSaleData = {
                ...saleData,
                ticketNumber: saleData.ticketNumber || saleData.ticket_number || 'N/A',
                timestamp: new Date()
            };

            console.log('✅ Données de vente stockées avec ticket:', this.lastSaleData.ticketNumber);

        } catch (error) {
            console.error('Erreur dans setSaleData:', error);
        }
    }

    /**
     * Génère le contenu HTML du ticket
     */
    generateTicketHTML(saleData = null) {
        const data = saleData || this.lastSaleData;
        if (!data) {
            throw new Error('Aucune donnée de vente disponible pour l\'impression');
        }

        // Fonction de traduction avec fallback
        const t = (key) => {
            if (window.i18n && typeof window.i18n.t === 'function') {
                return window.i18n.t(key);
            }
            // Fallbacks manuels pour les clés importantes
            const fallbacks = {
                'ticket_number': 'Ticket N°',
                'date_time': 'Date',
                'seller': 'Vendeur',
                'customer': 'Client',
                'default_client': 'Client Passager',
                'subtotal': 'Sous-total',
                'discount': 'Remise',
                'total_amount': 'TOTAL',
                'payment_method': 'Paiement',
                'amount_received': 'Reçu',
                'change_given': 'Monnaie',
                'advance_payment': 'Avance',
                'remaining_credit': 'Crédit restant',
                'thank_you_message': 'Merci pour votre visite !',
                'cash': 'Espèces',
                'check': 'Chèque',
                'credit': 'Crédit'
            };
            return fallbacks[key] || key;
        };

        const currentLang = window.i18n ? window.i18n.getCurrentLanguage() : 'fr';
        const isRTL = currentLang === 'ar';

        // Formatage de la date
        const dateTime = data.timestamp.toLocaleString(currentLang === 'ar' ? 'ar-MA' : 'fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Calculs
        const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const discount = data.discount || 0;
        const total = subtotal - discount;

        // Informations de paiement
        let paymentInfo = '';
        switch (data.paymentMethod) {
            case 'cash':
                // Utiliser les nouvelles données de rendu si disponibles
                const amountReceived = data.amountReceived || data.amountPaid || total;
                const change = data.changeAmount !== null ? data.changeAmount : (amountReceived - total);

                paymentInfo = `
                    <div class="payment-line">${t('payment_method')}: ${t('cash')}</div>
                    <div class="payment-line">${t('total_amount')}: ${total.toFixed(2)} MAD</div>
                    <div class="payment-line">${t('amount_received')}: ${amountReceived.toFixed(2)} MAD</div>
                    ${change > 0 ? `<div class="payment-line">${t('change_given')}: ${change.toFixed(2)} MAD</div>` :
                      change === 0 ? `<div class="payment-line">${t('exact_payment')}</div>` : ''}
                `;
                break;
            case 'check':
                paymentInfo = `
                    <div class="payment-line">${t('payment_method')}: ${t('check')}</div>
                    ${data.checkNumber ? `<div class="payment-line">N° Chèque: ${data.checkNumber}</div>` : ''}
                `;
                break;
            case 'credit':
                const remaining = total - (data.advanceAmount || 0);
                paymentInfo = `
                    <div class="payment-line">${t('payment_method')}: ${t('credit')}</div>
                    <div class="payment-line">Total à payer: ${total.toFixed(2)} MAD</div>
                    ${data.advanceAmount > 0 ? `<div class="payment-line">${t('advance_payment')}: ${data.advanceAmount.toFixed(2)} MAD</div>` : '<div class="payment-line">Avance: 0.00 MAD</div>'}
                    <div class="payment-line">${t('remaining_credit')}: ${remaining.toFixed(2)} MAD</div>
                    ${data.customer?.name && data.customer.name !== 'Client Passager' ? `<div class="payment-line">Client: ${data.customer.name}</div>` : ''}
                `;
                break;
            default:
                // Fallback pour méthodes non reconnues
                const methodName = data.paymentMethod === 'cash' ? t('cash') :
                                 data.paymentMethod === 'check' ? t('check') :
                                 data.paymentMethod === 'credit' ? t('credit') :
                                 data.paymentMethod;
                paymentInfo = `<div class="payment-line">${t('payment_method')}: ${methodName}</div>`;
        }

        return `
            <!DOCTYPE html>
            <html lang="${currentLang}" dir="${isRTL ? 'rtl' : 'ltr'}">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ticket ${data.ticketNumber}</title>
                <style>
                    ${this.getTicketCSS(isRTL)}
                </style>
            </head>
            <body>
                <div class="ticket">
                    <!-- En-tête -->
                    <div class="header">
                        <div class="company-name">${data.company?.name || t('company_name')}</div>
                        <div class="company-info">${data.company?.address || t('company_address')}</div>
                        <div class="company-info">Tél: ${data.company?.phone || t('company_phone').replace('Tél: ', '')}</div>
                        <div class="company-info">ICE: ${data.company?.ice || t('company_ice').replace('ICE: ', '')}</div>
                        ${data.company?.email ? `<div class="company-info">Email: ${data.company.email}</div>` : ''}
                        ${data.company?.website ? `<div class="company-info">${data.company.website}</div>` : ''}
                    </div>
                    
                    <div class="separator">================================</div>
                    
                    <!-- Informations de transaction -->
                    <div class="transaction-info">
                        <div class="info-line">${t('ticket_number')}: ${data.ticketNumber}</div>
                        <div class="info-line">${t('date_time')}: ${dateTime}</div>
                        <div class="info-line">${t('seller')}: ${data.sellerName}</div>
                        <div class="info-line">${t('customer')}: ${data.customer?.name || data.customerName || t('default_client')}</div>
                        ${data.customer?.phone ? `<div class="info-line">Tél: ${data.customer.phone}</div>` : ''}
                    </div>
                    
                    <div class="separator">================================</div>
                    
                    <!-- Articles -->
                    <div class="items">
                        ${data.items.map(item => `
                            <div class="item-line">
                                <div class="item-name">${item.name}</div>
                                <div class="item-details">
                                    <span class="quantity">${item.quantity}x</span>
                                    <span class="unit-price">${item.price.toFixed(2)}</span>
                                    <span class="total-price">${(item.quantity * item.price).toFixed(2)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="separator">--------------------------------</div>
                    
                    <!-- Totaux -->
                    <div class="totals">
                        <div class="total-line">${t('subtotal')}: ${subtotal.toFixed(2)} MAD</div>
                        ${discount > 0 ? `<div class="total-line">${t('discount')}: -${discount.toFixed(2)} MAD</div>` : ''}
                    </div>
                    
                    <div class="separator">================================</div>
                    
                    <div class="grand-total">
                        <div class="total-line grand">${t('total_amount')}: ${total.toFixed(2)} MAD</div>
                    </div>
                    
                    <div class="separator">================================</div>
                    
                    <!-- Paiement -->
                    <div class="payment">
                        ${paymentInfo}
                    </div>
                    
                    <div class="separator">================================</div>
                    
                    <!-- Pied de page -->
                    <div class="footer">
                        <div class="footer-line">${t('thank_you_message')}</div>
                    </div>
                    
                    <div class="separator">================================</div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * CSS optimisé pour impression thermique 80mm
     */
    getTicketCSS(isRTL = false) {
        return `
            @page {
                size: 80mm auto;
                margin: 0;
            }
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.2;
                color: #000;
                background: #fff;
                width: 80mm;
                margin: 0 auto;
                padding: 5mm;
                direction: ${isRTL ? 'rtl' : 'ltr'};
            }
            
            .ticket {
                width: 100%;
            }
            
            .header {
                text-align: center;
                margin-bottom: 5px;
            }
            
            .company-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 2px;
            }
            
            .company-info {
                font-size: 10px;
                margin-bottom: 1px;
            }
            
            .separator {
                text-align: center;
                font-size: 10px;
                margin: 3px 0;
                font-family: monospace;
            }
            
            .transaction-info,
            .payment,
            .footer {
                margin: 5px 0;
            }
            
            .info-line,
            .payment-line,
            .footer-line {
                font-size: 11px;
                margin-bottom: 1px;
            }
            
            .items {
                margin: 5px 0;
            }
            
            .item-line {
                margin-bottom: 2px;
            }
            
            .item-name {
                font-size: 11px;
                font-weight: bold;
                margin-bottom: 1px;
            }
            
            .item-details {
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                ${isRTL ? 'direction: ltr;' : ''}
            }
            
            .quantity {
                width: 20%;
            }
            
            .unit-price {
                width: 30%;
                text-align: center;
            }
            
            .total-price {
                width: 30%;
                text-align: right;
            }
            
            .totals {
                margin: 5px 0;
            }
            
            .total-line {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                margin-bottom: 1px;
            }
            
            .total-line.grand {
                font-size: 14px;
                font-weight: bold;
            }
            
            .footer {
                text-align: center;
                margin-top: 5px;
            }
            
            .footer-line {
                font-size: 10px;
                margin-bottom: 1px;
            }
            
            /* Styles pour impression thermique */
            @media print {
                @page {
                    size: 80mm auto;
                    margin: 0;
                }

                body {
                    width: 80mm;
                    font-size: 10px;
                    margin: 0;
                    padding: 2mm;
                }

                .separator {
                    font-size: 8px;
                    margin: 2px 0;
                }

                .company-name {
                    font-size: 13px;
                    font-weight: bold;
                }

                .company-info {
                    font-size: 9px;
                }

                .info-line,
                .payment-line,
                .footer-line {
                    font-size: 10px;
                }

                .item-name {
                    font-size: 10px;
                }

                .item-details {
                    font-size: 9px;
                }

                .total-line {
                    font-size: 10px;
                }

                .total-line.grand {
                    font-size: 12px;
                    font-weight: bold;
                }

                /* Forcer l'impression en noir et blanc */
                * {
                    color: black !important;
                    background: white !important;
                }
            }
        `;
    }

    /**
     * Exporte le ticket en PDF
     */
    async exportToPDF() {
        try {
            if (!this.lastSaleData) {
                throw new Error('Aucune donnée de vente disponible');
            }

            const ticketHTML = this.generateTicketHTML();
            const filename = `ticket_${this.lastSaleData.ticketNumber}_${Date.now()}.pdf`;

            // Utiliser l'API Electron pour générer le PDF
            if (window.api && window.api.pdf) {
                const result = await window.api.pdf.generatePDF(ticketHTML, filename);
                if (result && result.success) {
                    const fileName = result.filePath.split('\\').pop() || result.filePath.split('/').pop();
                    this.showNotification('success', `PDF sauvegardé : ${fileName}`);
                } else {
                    this.showNotification('warning', result?.message || 'Sauvegarde annulée par l\'utilisateur');
                }
            } else {
                // Fallback : ouvrir dans une nouvelle fenêtre pour impression manuelle
                const printWindow = window.open('', '_blank', 'width=400,height=600');
                if (printWindow) {
                    printWindow.document.write(ticketHTML);
                    printWindow.document.close();
                    printWindow.focus();
                    this.showNotification('info', 'Ticket ouvert dans une nouvelle fenêtre pour impression');
                } else {
                    this.showNotification('error', 'Impossible d\'ouvrir la fenêtre d\'impression');
                }
            }
        } catch (error) {
            console.error('Erreur lors de l\'export PDF:', error);
            this.showNotification('error', 'Erreur lors de la génération du PDF');
        }
    }

    /**
     * Impression directe
     */
    async printDirect() {
        try {
            if (!this.lastSaleData) {
                throw new Error('Aucune donnée de vente disponible');
            }

            const ticketHTML = this.generateTicketHTML();

            // Créer une fenêtre d'impression optimisée pour imprimante thermique
            const printWindow = window.open('', '_blank', 'width=320,height=600,scrollbars=yes');

            if (printWindow) {
                printWindow.document.write(ticketHTML);
                printWindow.document.close();

                // Attendre le chargement puis imprimer
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.focus();
                        printWindow.print();

                        // Fermer la fenêtre après impression (délai plus long pour l'impression)
                        setTimeout(() => {
                            printWindow.close();
                        }, 2000);
                    }, 500);
                };

                this.showNotification('success', 'Ticket envoyé à l\'imprimante thermique');
            } else {
                throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
            }
        } catch (error) {
            console.error('Erreur lors de l\'impression:', error);
            this.showNotification('error', 'Erreur lors de l\'impression');
        }
    }

    /**
     * Affiche une notification
     */
    showNotification(type, message) {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Instance globale
window.ticketPrinter = new TicketPrinter();
