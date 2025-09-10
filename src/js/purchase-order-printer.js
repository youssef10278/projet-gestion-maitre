/**
 * Système d'impression des bons de commande fournisseurs
 * Template professionnel A4 avec logo et mise en forme élégante
 */

class PurchaseOrderPrinter {
    constructor() {
        this.currentOrderData = null;
    }

    /**
     * Définit les données du bon de commande à imprimer
     */
    setOrderData(orderData) {
        this.currentOrderData = orderData;
        console.log('📄 Données de bon de commande définies pour impression:', orderData.order_number);
    }

    /**
     * Génère le contenu HTML du bon de commande pour impression
     */
    generateOrderHTML(orderData = null) {
        const data = orderData || this.currentOrderData;
        if (!data) {
            throw new Error('Aucune donnée de bon de commande disponible pour l\'impression');
        }

        // Récupérer les informations de l'entreprise
        const companyInfo = this.getCompanyInfo();
        
        // Calculer les totaux
        const totals = this.calculateTotals(data.items || []);
        
        // Générer le HTML complet
        return this.buildHTMLDocument(data, companyInfo, totals);
    }

    /**
     * Récupère les informations de l'entreprise
     */
    getCompanyInfo() {
        // Récupérer depuis les paramètres ou utiliser des valeurs par défaut
        return {
            name: 'GestionPro',
            address: 'Adresse de l\'entreprise',
            phone: 'Téléphone',
            email: 'email@entreprise.com',
            ice: 'ICE123456789'
        };
    }

    /**
     * Calcule les totaux du bon de commande
     */
    calculateTotals(items) {
        const subtotal = items.reduce((sum, item) => {
            return sum + (parseFloat(item.quantity_ordered || 0) * parseFloat(item.unit_price || 0));
        }, 0);

        return {
            subtotal: subtotal,
            total: subtotal // Pour l'instant, pas de TVA sur les bons de commande
        };
    }

    /**
     * Construit le document HTML complet
     */
    buildHTMLDocument(data, companyInfo, totals) {
        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bon de Commande ${data.order_number}</title>
    <style>
        ${this.getOrderCSS()}
    </style>
</head>
<body>
    <div class="purchase-order">
        <!-- En-tête -->
        <div class="header">
            <div class="company-info">
                <h1>${companyInfo.name}</h1>
                <p>${companyInfo.address}</p>
                <p>Tél: ${companyInfo.phone} | Email: ${companyInfo.email}</p>
                <p>ICE: ${companyInfo.ice}</p>
            </div>
            <div class="order-info">
                <h2>BON DE COMMANDE</h2>
                <p><strong>N°:</strong> ${data.order_number}</p>
                <p><strong>Date:</strong> ${this.formatDate(data.order_date)}</p>
                <p><strong>Statut:</strong> ${this.getStatusLabel(data.status)}</p>
            </div>
        </div>

        <!-- Informations fournisseur -->
        <div class="supplier-section">
            <h3>Fournisseur</h3>
            <div class="supplier-info">
                <p><strong>${data.supplier_name || 'Nom du fournisseur'}</strong></p>
                <p>${data.supplier_company || ''}</p>
                <p>Email: ${data.supplier_email || 'N/A'}</p>
                <p>Téléphone: ${data.supplier_phone || 'N/A'}</p>
            </div>
        </div>

        <!-- Détails de livraison -->
        <div class="delivery-section">
            <div class="delivery-info">
                <h4>Informations de livraison</h4>
                <p><strong>Date prévue:</strong> ${this.formatDate(data.expected_delivery_date) || 'À définir'}</p>
                <p><strong>Date réelle:</strong> ${this.formatDate(data.actual_delivery_date) || 'En attente'}</p>
            </div>
        </div>

        <!-- Articles commandés -->
        <div class="items-section">
            <h3>Articles commandés</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Référence</th>
                        <th>Désignation</th>
                        <th>Qté commandée</th>
                        <th>Qté reçue</th>
                        <th>Prix unitaire</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.generateItemsRows(data.items || [])}
                </tbody>
            </table>
        </div>

        <!-- Totaux -->
        <div class="totals-section">
            <div class="totals">
                <div class="total-line">
                    <span>Sous-total:</span>
                    <span>${totals.subtotal.toFixed(2)} MAD</span>
                </div>
                <div class="total-line final-total">
                    <span><strong>Total:</strong></span>
                    <span><strong>${totals.total.toFixed(2)} MAD</strong></span>
                </div>
            </div>
        </div>

        <!-- Notes -->
        ${data.notes ? `
        <div class="notes-section">
            <h4>Notes</h4>
            <p>${data.notes}</p>
        </div>
        ` : ''}

        <!-- Pied de page -->
        <div class="footer">
            <div class="signatures">
                <div class="signature">
                    <p>Signature Acheteur</p>
                    <div class="signature-line"></div>
                    <p>Date: ___________</p>
                </div>
                <div class="signature">
                    <p>Signature Fournisseur</p>
                    <div class="signature-line"></div>
                    <p>Date: ___________</p>
                </div>
            </div>
            <div class="footer-info">
                <p>Document généré le ${this.formatDate(new Date().toISOString())} par GestionPro</p>
            </div>
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * Génère les lignes d'articles du tableau
     */
    generateItemsRows(items) {
        return items.map(item => {
            const total = (parseFloat(item.quantity_ordered || 0) * parseFloat(item.unit_price || 0));
            return `
                <tr>
                    <td>${item.product_reference || 'N/A'}</td>
                    <td>${item.product_name || 'Article sans nom'}</td>
                    <td class="text-center">${item.quantity_ordered || 0}</td>
                    <td class="text-center">${item.quantity_received || 0}</td>
                    <td class="text-right">${parseFloat(item.unit_price || 0).toFixed(2)} MAD</td>
                    <td class="text-right">${total.toFixed(2)} MAD</td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Formate une date pour l'affichage
     */
    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Retourne le libellé du statut
     */
    getStatusLabel(status) {
        const statusLabels = {
            'PENDING': 'En attente',
            'CONFIRMED': 'Confirmée',
            'SHIPPED': 'Expédiée',
            'PARTIALLY_RECEIVED': 'Partiellement reçue',
            'RECEIVED': 'Reçue',
            'CANCELLED': 'Annulée'
        };
        return statusLabels[status] || status;
    }

    /**
     * Retourne les styles CSS pour le bon de commande
     */
    getOrderCSS() {
        return `
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
                background: white;
            }

            .purchase-order {
                max-width: 210mm;
                margin: 0 auto;
                padding: 20mm;
                background: white;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #2563eb;
            }

            .company-info h1 {
                color: #2563eb;
                font-size: 24px;
                margin-bottom: 10px;
            }

            .company-info p {
                margin: 2px 0;
                color: #666;
            }

            .order-info {
                text-align: right;
            }

            .order-info h2 {
                color: #2563eb;
                font-size: 20px;
                margin-bottom: 10px;
            }

            .order-info p {
                margin: 5px 0;
            }

            .supplier-section, .delivery-section {
                margin: 20px 0;
                padding: 15px;
                background: #f8fafc;
                border-left: 4px solid #2563eb;
            }

            .supplier-section h3, .delivery-section h4 {
                color: #2563eb;
                margin-bottom: 10px;
            }

            .delivery-section {
                display: flex;
                justify-content: space-between;
            }

            .items-section {
                margin: 30px 0;
            }

            .items-section h3 {
                color: #2563eb;
                margin-bottom: 15px;
                font-size: 16px;
            }

            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }

            .items-table th,
            .items-table td {
                padding: 10px;
                text-align: left;
                border: 1px solid #e2e8f0;
            }

            .items-table th {
                background: #2563eb;
                color: white;
                font-weight: 600;
            }

            .items-table tbody tr:nth-child(even) {
                background: #f8fafc;
            }

            .text-center { text-align: center; }
            .text-right { text-align: right; }

            .totals-section {
                display: flex;
                justify-content: flex-end;
                margin: 20px 0;
            }

            .totals {
                min-width: 300px;
            }

            .total-line {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
            }

            .final-total {
                border-bottom: 2px solid #2563eb;
                font-size: 14px;
                color: #2563eb;
            }

            .notes-section {
                margin: 20px 0;
                padding: 15px;
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
            }

            .notes-section h4 {
                color: #92400e;
                margin-bottom: 10px;
            }

            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
            }

            .signatures {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
            }

            .signature {
                text-align: center;
                width: 200px;
            }

            .signature-line {
                height: 1px;
                background: #333;
                margin: 40px 0 10px 0;
            }

            .footer-info {
                text-align: center;
                color: #666;
                font-size: 10px;
            }

            @media print {
                .purchase-order {
                    padding: 0;
                    box-shadow: none;
                }
                
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `;
    }

    /**
     * Aperçu du bon de commande dans une nouvelle fenêtre
     */
    async previewOrder(orderData = null) {
        try {
            const data = orderData || this.currentOrderData;
            if (!data) {
                throw new Error('Aucune donnée de bon de commande disponible');
            }

            const orderHTML = this.generateOrderHTML(data);

            // Ouvrir dans une nouvelle fenêtre pour aperçu
            const previewWindow = window.open('', '_blank', 'width=800,height=1000,scrollbars=yes');

            if (previewWindow) {
                previewWindow.document.write(orderHTML);
                previewWindow.document.close();
                previewWindow.focus();

                console.log('👁️ Aperçu du bon de commande ouvert:', data.order_number);
                this.showNotification('success', 'Aperçu du bon de commande ouvert');
            } else {
                throw new Error('Impossible d\'ouvrir la fenêtre d\'aperçu');
            }

        } catch (error) {
            console.error('❌ Erreur lors de l\'aperçu:', error);
            this.showNotification('error', 'Erreur lors de l\'ouverture de l\'aperçu');
        }
    }

    /**
     * Impression directe du bon de commande
     */
    async printOrder(orderData = null) {
        try {
            const data = orderData || this.currentOrderData;
            if (!data) {
                throw new Error('Aucune donnée de bon de commande disponible');
            }

            const orderHTML = this.generateOrderHTML(data);

            // Ouvrir pour impression
            const printWindow = window.open('', '_blank', 'width=800,height=1000');

            if (printWindow) {
                printWindow.document.write(orderHTML);
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

                console.log('🖨️ Bon de commande envoyé à l\'imprimante:', data.order_number);
                this.showNotification('success', 'Bon de commande envoyé à l\'imprimante');
            } else {
                throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
            }

        } catch (error) {
            console.error('❌ Erreur lors de l\'impression:', error);
            this.showNotification('error', 'Erreur lors de l\'impression du bon de commande');
        }
    }

    /**
     * Export en PDF
     */
    async exportToPDF(orderData = null) {
        try {
            const data = orderData || this.currentOrderData;
            if (!data) {
                throw new Error('Aucune donnée de bon de commande disponible');
            }

            const orderHTML = this.generateOrderHTML(data);
            const filename = `bon_commande_${data.order_number}_${Date.now()}.pdf`;

            // Utiliser l'API Electron spécialisée pour les documents A4
            if (window.api && window.api.pdf && window.api.pdf.generateQuotePDF) {
                const result = await window.api.pdf.generateQuotePDF(orderHTML, filename);
                if (result && result.success) {
                    const fileName = result.filePath.split('\\').pop() || result.filePath.split('/').pop();
                    this.showNotification('success', `PDF sauvegardé : ${fileName}`);
                    console.log('📄 PDF bon de commande généré:', fileName);
                } else {
                    this.showNotification('warning', result?.message || 'Sauvegarde annulée par l\'utilisateur');
                }
            } else if (window.api && window.api.pdf) {
                // Fallback vers l'API générique
                const result = await window.api.pdf.generatePDF(orderHTML, filename);
                if (result && result.success) {
                    const fileName = result.filePath.split('\\').pop() || result.filePath.split('/').pop();
                    this.showNotification('success', `PDF sauvegardé : ${fileName}`);
                } else {
                    this.showNotification('warning', result?.message || 'Sauvegarde annulée par l\'utilisateur');
                }
            } else {
                // Fallback : aperçu pour impression manuelle
                await this.previewOrder(data);
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
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Créer une instance globale
window.purchaseOrderPrinter = new PurchaseOrderPrinter();

console.log('📄 PurchaseOrderPrinter initialisé');
