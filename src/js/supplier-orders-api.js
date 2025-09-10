// src/js/supplier-orders-api.js - API pour la gestion des commandes fournisseurs

/**
 * API pour la gestion des commandes fournisseurs
 * Utilise une approche temporaire avec localStorage en attendant l'API database
 */
class SupplierOrdersAPI {

    constructor() {
        this.storageKey = 'supplier_orders';
        this.itemsStorageKey = 'supplier_order_items';
        this.initializeStorage();
    }

    /**
     * Initialise le stockage local
     */
    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.itemsStorageKey)) {
            localStorage.setItem(this.itemsStorageKey, JSON.stringify([]));
        }
    }

    /**
     * Récupère toutes les commandes du localStorage
     */
    getAllOrders() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch (error) {
            console.error('Erreur lors de la lecture des commandes:', error);
            return [];
        }
    }

    /**
     * Sauvegarde les commandes dans le localStorage
     */
    saveOrders(orders) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(orders));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des commandes:', error);
        }
    }

    /**
     * Récupère tous les articles du localStorage
     */
    getAllOrderItems() {
        try {
            return JSON.parse(localStorage.getItem(this.itemsStorageKey) || '[]');
        } catch (error) {
            console.error('Erreur lors de la lecture des articles:', error);
            return [];
        }
    }

    /**
     * Sauvegarde les articles dans le localStorage
     */
    saveOrderItems(items) {
        try {
            localStorage.setItem(this.itemsStorageKey, JSON.stringify(items));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des articles:', error);
        }
    }

    /**
     * Génère un ID unique
     */
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Crée une nouvelle commande fournisseur
     */
    async createOrder(orderData) {
        try {
            const orderNumber = window.supplierOrdersDB.generateOrderNumber();
            const orderId = this.generateId();

            const newOrder = {
                id: orderId,
                order_number: orderNumber,
                supplier_id: orderData.supplier_id,
                status: orderData.status || 'PENDING',
                order_date: orderData.order_date || new Date().toISOString().split('T')[0],
                expected_delivery_date: orderData.expected_delivery_date || null,
                actual_delivery_date: null,
                total_amount: 0,
                notes: orderData.notes || '',
                created_by: orderData.created_by || 'Utilisateur',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Sauvegarder la commande d'abord
            const orders = this.getAllOrders();
            orders.push(newOrder);
            this.saveOrders(orders);

            // Ajouter les lignes de commande
            if (orderData.items && orderData.items.length > 0) {
                for (const item of orderData.items) {
                    await this.addOrderItem(orderId, item);
                }
            }

            // Recalculer le total après avoir ajouté les articles
            await this.updateOrderTotal(orderId);

            return { id: orderId, order_number: orderNumber };
        } catch (error) {
            console.error('Erreur lors de la création de la commande:', error);
            throw error;
        }
    }

    /**
     * Ajoute un article à une commande
     */
    async addOrderItem(orderId, itemData) {
        try {
            const totalPrice = itemData.quantity_ordered * itemData.unit_price;
            const itemId = this.generateId();

            const newItem = {
                id: itemId,
                order_id: orderId,
                product_id: itemData.product_id || null,
                product_name: itemData.product_name,
                product_reference: itemData.product_reference || '',
                quantity_ordered: itemData.quantity_ordered,
                quantity_received: 0,
                unit_price: itemData.unit_price,
                total_price: totalPrice,
                notes: itemData.notes || '',
                created_at: new Date().toISOString()
            };

            const items = this.getAllOrderItems();
            items.push(newItem);
            this.saveOrderItems(items);

            return { id: itemId };
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'article:', error);
            throw error;
        }
    }

    /**
     * Met à jour le total d'une commande
     */
    async updateOrderTotal(orderId) {
        try {
            const items = this.getAllOrderItems();
            const orderItems = items.filter(item => item.order_id === orderId);
            const total = orderItems.reduce((sum, item) => {
                const itemTotal = parseFloat(item.total_price) || 0;
                return sum + itemTotal;
            }, 0);

            const orders = this.getAllOrders();
            const orderIndex = orders.findIndex(order => order.id === orderId);

            if (orderIndex !== -1) {
                orders[orderIndex].total_amount = total;
                orders[orderIndex].updated_at = new Date().toISOString();
                this.saveOrders(orders);
                console.log(`💰 Total mis à jour pour la commande ${orderId}: ${total.toFixed(2)} MAD`);
            }

            return total;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du total:', error);
            throw error;
        }
    }

    /**
     * Récupère toutes les commandes avec filtres
     */
    async getOrders(filters = {}) {
        try {
            let orders = this.getAllOrders();
            const items = this.getAllOrderItems();

            // Enrichir les commandes avec les informations des fournisseurs
            if (window.api && window.api.suppliers) {
                try {
                    const suppliers = await window.api.suppliers.getAll();
                    orders = orders.map(order => {
                        const supplier = suppliers.find(s => s.id == order.supplier_id);
                        return {
                            ...order,
                            supplier_name: supplier ? supplier.name : 'Fournisseur inconnu',
                            supplier_company: supplier ? supplier.company : '',
                            items_count: items.filter(item => item.order_id === order.id).length
                        };
                    });
                } catch (error) {
                    console.warn('Impossible de charger les fournisseurs:', error);
                    // Fallback sans informations fournisseur
                    orders = orders.map(order => ({
                        ...order,
                        supplier_name: 'Fournisseur inconnu',
                        supplier_company: '',
                        items_count: items.filter(item => item.order_id === order.id).length
                    }));
                }
            }

            // Appliquer les filtres
            if (filters.supplier_id) {
                orders = orders.filter(order => order.supplier_id == filters.supplier_id);
            }

            if (filters.status) {
                orders = orders.filter(order => order.status === filters.status);
            }

            if (filters.date_from) {
                orders = orders.filter(order => order.order_date >= filters.date_from);
            }

            if (filters.date_to) {
                orders = orders.filter(order => order.order_date <= filters.date_to);
            }

            // Trier par date décroissante
            orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

            return orders;
        } catch (error) {
            console.error('Erreur lors de la récupération des commandes:', error);
            throw error;
        }
    }

    /**
     * Récupère une commande avec ses détails
     */
    async getOrderDetails(orderId) {
        try {
            console.log('🔍 Recherche commande avec ID:', orderId, 'type:', typeof orderId);

            const orders = this.getAllOrders();
            console.log('📋 Commandes disponibles:', orders.map(o => ({ id: o.id, type: typeof o.id, number: o.order_number })));

            // Comparaison flexible pour gérer les types string/number
            const order = orders.find(o => o.id == orderId || o.id === parseInt(orderId) || parseInt(o.id) === parseInt(orderId));

            if (!order) {
                console.error('❌ Commande non trouvée avec ID:', orderId);
                console.error('📋 IDs disponibles:', orders.map(o => o.id));
                throw new Error('Commande non trouvée');
            }

            console.log('✅ Commande trouvée:', order.order_number);

            // Enrichir avec les informations du fournisseur
            if (window.api && window.api.suppliers) {
                try {
                    const supplier = await window.api.suppliers.getById(order.supplier_id);
                    if (supplier) {
                        order.supplier_name = supplier.name;
                        order.supplier_company = supplier.company;
                        order.supplier_email = supplier.email;
                        order.supplier_phone = supplier.phone;
                    }
                } catch (error) {
                    console.warn('Impossible de charger les détails du fournisseur:', error);
                }
            }

            // Récupérer les articles de la commande
            const allItems = this.getAllOrderItems();
            const items = allItems.filter(item => item.order_id == orderId || item.order_id === parseInt(orderId) || parseInt(item.order_id) === parseInt(orderId));

            console.log('📦 Articles trouvés pour la commande:', items.length);

            // Enrichir les articles avec les informations des produits
            if (window.api && window.api.products) {
                try {
                    for (const item of items) {
                        if (item.product_id) {
                            const product = await window.api.products.getById(item.product_id);
                            if (product) {
                                item.product_name_db = product.name;
                                item.product_reference_db = product.reference;
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Impossible de charger les détails des produits:', error);
                }
            }

            return { ...order, items };
        } catch (error) {
            console.error('Erreur lors de la récupération des détails:', error);
            throw error;
        }
    }

    /**
     * Met à jour une commande existante
     */
    async updateOrder(orderId, orderData) {
        try {
            console.log(`🔄 Début mise à jour commande: ${orderId}`);

            const orders = this.getAllOrders();
            const orderIndex = orders.findIndex(order => order.id === orderId);

            if (orderIndex === -1) {
                throw new Error('Commande introuvable');
            }

            const existingOrder = orders[orderIndex];

            // Vérifier si la commande peut être modifiée
            if (existingOrder.status === 'RECEIVED' || existingOrder.status === 'CANCELLED') {
                throw new Error('Impossible de modifier une commande reçue ou annulée');
            }

            // Mettre à jour les informations de base de la commande
            const updatedOrder = {
                ...existingOrder,
                supplier_id: orderData.supplier_id || existingOrder.supplier_id,
                order_date: orderData.order_date || existingOrder.order_date,
                expected_delivery_date: orderData.expected_delivery_date || existingOrder.expected_delivery_date,
                status: orderData.status || existingOrder.status,
                notes: orderData.notes !== undefined ? orderData.notes : existingOrder.notes,
                updated_at: new Date().toISOString()
            };

            // Sauvegarder la commande mise à jour
            orders[orderIndex] = updatedOrder;
            this.saveOrders(orders);

            // Mettre à jour les articles si fournis
            if (orderData.items && Array.isArray(orderData.items)) {
                // Supprimer les anciens articles
                await this.removeAllOrderItems(orderId);

                // Ajouter les nouveaux articles
                for (const item of orderData.items) {
                    await this.addOrderItem(orderId, item);
                }
            }

            // Recalculer le total
            await this.updateOrderTotal(orderId);

            console.log(`✅ Commande ${orderId} mise à jour avec succès`);
            return { id: orderId, success: true };

        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour de la commande:', error);
            throw error;
        }
    }

    /**
     * Supprime tous les articles d'une commande
     */
    async removeAllOrderItems(orderId) {
        try {
            const items = this.getAllOrderItems();
            const filteredItems = items.filter(item => item.order_id !== orderId);
            this.saveOrderItems(filteredItems);
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression des articles:', error);
            throw error;
        }
    }

    /**
     * Met à jour le statut d'une commande avec gestion automatique du stock
     */
    async updateOrderStatus(orderId, status, notes = '') {
        try {
            console.log(`🔄 Début mise à jour statut: ${orderId} → ${status}`);

            const orders = this.getAllOrders();
            const orderIndex = orders.findIndex(order => order.id === orderId);

            if (orderIndex === -1) {
                throw new Error('Commande non trouvée');
            }

            const oldStatus = orders[orderIndex].status;
            console.log(`📋 Statut actuel: ${oldStatus}, nouveau: ${status}`);

            // Mettre à jour le statut
            orders[orderIndex].status = status;
            orders[orderIndex].notes = notes;
            orders[orderIndex].updated_at = new Date().toISOString();

            // Ajouter la date de livraison si le statut est RECEIVED
            if (status === 'RECEIVED') {
                orders[orderIndex].actual_delivery_date = new Date().toISOString().split('T')[0];
            }

            this.saveOrders(orders);
            console.log(`💾 Commande sauvegardée avec nouveau statut`);

            // Gérer l'impact sur le stock SEULEMENT si le statut change vraiment
            if (oldStatus !== status) {
                console.log(`🔄 Gestion de l'impact sur le stock...`);
                await this.updateStockOnStatusChange(orderId, status, oldStatus);
            } else {
                console.log(`ℹ️ Statut inchangé, pas de mise à jour du stock`);
            }

            console.log(`✅ Statut mis à jour: ${oldStatus} → ${status} pour commande ${orderId}`);
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour du statut:', error);
            throw error;
        }
    }

    /**
     * Supprime une commande
     */
    async deleteOrder(orderId) {
        try {
            // Supprimer les articles
            const items = this.getAllOrderItems();
            const filteredItems = items.filter(item => item.order_id !== orderId);
            this.saveOrderItems(filteredItems);

            // Supprimer la commande
            const orders = this.getAllOrders();
            const filteredOrders = orders.filter(order => order.id !== orderId);
            this.saveOrders(filteredOrders);

            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression de la commande:', error);
            throw error;
        }
    }

    /**
     * Récupère les statistiques des commandes
     */
    async getOrdersStatistics() {
        try {
            const orders = this.getAllOrders();

            // Filtrer les commandes des 30 derniers jours
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentOrders = orders.filter(order =>
                new Date(order.order_date) >= thirtyDaysAgo
            );

            const stats = {
                total_orders: recentOrders.length,
                pending_orders: recentOrders.filter(o => o.status === 'PENDING').length,
                confirmed_orders: recentOrders.filter(o => o.status === 'CONFIRMED').length,
                shipped_orders: recentOrders.filter(o => o.status === 'SHIPPED').length,
                received_orders: recentOrders.filter(o => o.status === 'RECEIVED').length,
                total_value: recentOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
                pending_value: recentOrders
                    .filter(o => ['PENDING', 'CONFIRMED', 'SHIPPED'].includes(o.status))
                    .reduce((sum, o) => sum + (o.total_amount || 0), 0)
            };

            return stats;
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            return {
                total_orders: 0,
                pending_orders: 0,
                confirmed_orders: 0,
                shipped_orders: 0,
                received_orders: 0,
                total_value: 0,
                pending_value: 0
            };
        }
    }

    /**
     * Crée des données de test pour démonstration
     */
    async createTestData() {
        try {
            // Vérifier s'il y a déjà des commandes
            const existingOrders = this.getAllOrders();
            if (existingOrders.length > 0) {
                console.log('Des commandes existent déjà, pas de création de données de test');
                return;
            }

            console.log('🔧 Création de données de test pour les commandes...');

            // Récupérer les fournisseurs existants
            let suppliers = [];
            if (window.api && window.api.suppliers) {
                try {
                    suppliers = await window.api.suppliers.getAll();
                } catch (error) {
                    console.warn('Impossible de charger les fournisseurs pour les données de test');
                }
            }

            if (suppliers.length === 0) {
                console.log('Aucun fournisseur trouvé, impossible de créer des données de test');
                return;
            }

            // Créer quelques commandes de test
            const testOrders = [
                {
                    supplier_id: suppliers[0].id,
                    status: 'PENDING',
                    order_date: new Date().toISOString().split('T')[0],
                    expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    notes: 'Commande de test - produits urgents',
                    items: [
                        { product_name: 'Produit Test 1', product_reference: 'REF001', quantity_ordered: 10, unit_price: 25.50 },
                        { product_name: 'Produit Test 2', product_reference: 'REF002', quantity_ordered: 5, unit_price: 45.00 }
                    ]
                },
                {
                    supplier_id: suppliers[0].id,
                    status: 'CONFIRMED',
                    order_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    expected_delivery_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    notes: 'Commande confirmée par le fournisseur',
                    items: [
                        { product_name: 'Produit Test 3', product_reference: 'REF003', quantity_ordered: 20, unit_price: 15.75 }
                    ]
                }
            ];

            // Si il y a plusieurs fournisseurs, utiliser le deuxième pour la diversité
            if (suppliers.length > 1) {
                testOrders.push({
                    supplier_id: suppliers[1].id,
                    status: 'RECEIVED',
                    order_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    expected_delivery_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    actual_delivery_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    notes: 'Commande livrée et réceptionnée',
                    items: [
                        { product_name: 'Produit Test 4', product_reference: 'REF004', quantity_ordered: 15, unit_price: 32.00 },
                        { product_name: 'Produit Test 5', product_reference: 'REF005', quantity_ordered: 8, unit_price: 28.50 }
                    ]
                });
            }

            // Créer les commandes de test
            for (const orderData of testOrders) {
                const result = await this.createOrder(orderData);
                console.log(`📦 Commande de test créée: ${result.order_number}`);
            }

            console.log('✅ Données de test créées avec succès');

            // Forcer le rechargement des commandes si on est sur l'onglet commandes
            if (window.loadOrders && typeof window.loadOrders === 'function') {
                setTimeout(() => {
                    if (window.activeTab === 'orders') {
                        window.loadOrders();
                    }
                }, 500);
            }
        } catch (error) {
            console.error('Erreur lors de la création des données de test:', error);
        }
    }

    /**
     * Vide toutes les données de commandes (pour les tests)
     */
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.itemsStorageKey);
        this.initializeStorage();
        console.log('🗑️ Toutes les données de commandes ont été supprimées');
    }

    /**
     * Recrée les données de test (utile pour les tests)
     */
    async recreateTestData() {
        this.clearAllData();
        await this.createTestData();
    }

    /**
     * Récupère tous les produits disponibles pour les commandes
     */
    async getAvailableProducts() {
        try {
            if (window.api && window.api.products) {
                const products = await window.api.products.getAll();
                return products.map(product => ({
                    id: product.id,
                    name: product.name,
                    reference: product.reference || '',
                    current_stock: product.stock || 0,
                    purchase_price: product.purchase_price || 0,
                    sale_price: product.price || 0,
                    category: product.category || '',
                    alert_threshold: product.alert_threshold || 0
                }));
            }
            return [];
        } catch (error) {
            console.error('Erreur lors de la récupération des produits:', error);
            return [];
        }
    }

    /**
     * Met à jour le stock lors du changement de statut de commande
     */
    async updateStockOnStatusChange(orderId, newStatus, oldStatus = null) {
        try {
            console.log(`📊 Mise à jour du stock pour commande ${orderId}: ${oldStatus} → ${newStatus}`);

            const orderDetails = await this.getOrderDetails(orderId);
            if (!orderDetails) {
                console.warn('⚠️ Commande non trouvée');
                return false;
            }

            if (!orderDetails.items || orderDetails.items.length === 0) {
                console.warn('⚠️ Aucun article trouvé dans la commande');
                return false;
            }

            console.log(`📦 ${orderDetails.items.length} articles trouvés dans la commande`);

            // S'assurer que les articles ont des product_id
            await this.ensureProductIds(orderDetails);

            // Logique selon le changement de statut
            if (newStatus === 'CONFIRMED' && oldStatus !== 'CONFIRMED') {
                console.log('➕ Ajout au stock lors de la confirmation');
                await this.addStockFromOrder(orderDetails);

                // Notification utilisateur
                if (window.showNotification) {
                    const itemsWithProductId = orderDetails.items.filter(item => item.product_id);
                    const totalQuantity = itemsWithProductId.reduce((sum, item) => sum + item.quantity_ordered, 0);
                    window.showNotification(`✅ Stock mis à jour: ${itemsWithProductId.length} produit(s), ${totalQuantity} unités ajoutées`, 'success');
                }
            } else if (newStatus === 'CANCELLED' && oldStatus === 'CONFIRMED') {
                console.log('➖ Retrait du stock lors de l\'annulation');
                await this.removeStockFromOrder(orderDetails);

                // Notification utilisateur
                if (window.showNotification) {
                    const itemCount = orderDetails.items.filter(item => item.product_id).length;
                    window.showNotification(`Stock ajusté: ${itemCount} produit(s) retiré(s)`, 'info');
                }
            } else if (oldStatus === 'CONFIRMED' && newStatus !== 'CONFIRMED' && newStatus !== 'SHIPPED' && newStatus !== 'RECEIVED') {
                console.log('➖ Retrait du stock car plus confirmée');
                await this.removeStockFromOrder(orderDetails);

                // Notification utilisateur
                if (window.showNotification) {
                    const itemCount = orderDetails.items.filter(item => item.product_id).length;
                    window.showNotification(`Stock ajusté: ${itemCount} produit(s) retiré(s)`, 'info');
                }
            } else {
                console.log(`ℹ️ Pas de changement de stock nécessaire pour ${oldStatus} → ${newStatus}`);
            }

            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour du stock:', error);
            throw error;
        }
    }

    /**
     * Ajoute le stock depuis une commande confirmée
     */
    async addStockFromOrder(orderDetails) {
        try {
            console.log('📈 Ajout du stock depuis la commande confirmée');
            console.log('📋 Détails de la commande:', orderDetails);

            if (!orderDetails.items || orderDetails.items.length === 0) {
                console.warn('⚠️ Aucun article trouvé dans la commande');
                return;
            }

            for (const item of orderDetails.items) {
                console.log('🔍 Traitement de l\'article:', item);

                if (!item.product_id) {
                    console.warn('⚠️ Article sans product_id, ignoré:', item);
                    continue;
                }

                if (!item.quantity_ordered || item.quantity_ordered <= 0) {
                    console.warn('⚠️ Quantité invalide pour l\'article:', item);
                    continue;
                }

                // CRÉATION PROFESSIONNELLE DE LOTS
                if (window.api && window.api.stockLots && window.api.products) {
                    try {
                        // Vérifier l'existence du produit
                        const product = await window.api.products.getById(item.product_id);
                        if (!product) {
                            console.warn(`⚠️ Produit ${item.product_id} non trouvé, article ignoré`);
                            continue;
                        }

                        console.log(`🔍 Produit trouvé: ${product.name}`);
                        console.log(`📊 Stock actuel: ${product.stock}`);

                        // CRÉER UN NOUVEAU LOT PROFESSIONNEL
                        const lotSuccess = await this.createLotFromOrder(item, orderDetails);

                        if (lotSuccess) {
                            console.log(`✅ SUCCÈS: Lot créé pour ${product.name}`);
                            console.log(`📦 Quantité ajoutée: ${item.quantity_ordered}`);

                            // Forcer le rafraîchissement de l'interface
                            this.refreshAllInterfaces();
                        } else {
                            console.error(`❌ ÉCHEC: Impossible de créer le lot pour ${product.name}`);

                            // Fallback: mise à jour directe si la création de lot échoue
                            console.log(`🔄 Fallback: Mise à jour directe du stock...`);
                            await this.updateProductStockDirectly(item.product_id, item.quantity_ordered, 'ADD');
                        }

                    } catch (productError) {
                        console.error(`❌ Erreur lors du traitement du produit ${item.product_id}:`, productError);
                    }
                } else {
                    console.error('❌ API stockLots ou products non disponible !');

                    // Fallback: mise à jour directe si stockLots n'est pas disponible
                    if (window.api && window.api.products) {
                        console.log(`🔄 Fallback: Mise à jour directe du stock...`);
                        await this.updateProductStockDirectly(item.product_id, item.quantity_ordered, 'ADD');
                    }
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout du stock:', error);
            console.error('📋 Détails de l\'erreur:', error.message);
            throw error;
        }
    }

    /**
     * Retire le stock lors de l'annulation d'une commande
     */
    async removeStockFromOrder(orderDetails) {
        try {
            console.log('📉 Retrait du stock suite à l\'annulation');
            console.log('📋 Détails de la commande:', orderDetails);

            if (!orderDetails.items || orderDetails.items.length === 0) {
                console.warn('⚠️ Aucun article trouvé dans la commande');
                return;
            }

            for (const item of orderDetails.items) {
                console.log('🔍 Traitement de l\'article:', item);

                if (!item.product_id) {
                    console.warn('⚠️ Article sans product_id, ignoré:', item);
                    continue;
                }

                if (!item.quantity_ordered || item.quantity_ordered <= 0) {
                    console.warn('⚠️ Quantité invalide pour l\'article:', item);
                    continue;
                }

                // GESTION PROFESSIONNELLE DES LOTS LORS DE L'ANNULATION
                if (window.api && window.api.stockLots && window.api.products) {
                    try {
                        // Vérifier l'existence du produit
                        const product = await window.api.products.getById(item.product_id);
                        if (!product) {
                            console.warn(`⚠️ Produit ${item.product_id} non trouvé, article ignoré`);
                            continue;
                        }

                        console.log(`🔍 Produit trouvé: ${product.name}`);
                        console.log(`📊 Stock actuel: ${product.stock}`);

                        // RETIRER DU STOCK VIA LES LOTS (FIFO)
                        const removalSuccess = await this.removeStockFromLots(item, orderDetails);

                        if (removalSuccess) {
                            console.log(`✅ SUCCÈS: Stock retiré des lots pour ${product.name}`);
                            console.log(`📦 Quantité retirée: ${item.quantity_ordered}`);
                        } else {
                            console.error(`❌ ÉCHEC: Impossible de retirer des lots pour ${product.name}`);

                            // Fallback: mise à jour directe si le retrait des lots échoue
                            console.log(`🔄 Fallback: Mise à jour directe du stock...`);
                            await this.updateProductStockDirectly(item.product_id, item.quantity_ordered, 'SUBTRACT');
                        }

                    } catch (productError) {
                        console.error(`❌ Erreur lors du traitement du produit ${item.product_id}:`, productError);
                    }
                } else {
                    console.warn('⚠️ API stockLots ou products non disponible');

                    // Fallback: mise à jour directe si stockLots n'est pas disponible
                    if (window.api && window.api.products) {
                        console.log(`🔄 Fallback: Mise à jour directe du stock...`);
                        await this.updateProductStockDirectly(item.product_id, item.quantity_ordered, 'SUBTRACT');
                    }
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors du retrait du stock:', error);
            console.error('📋 Détails de l\'erreur:', error.message);
            throw error;
        }
    }

    /**
     * S'assurer que tous les articles ont des product_id
     */
    async ensureProductIds(orderDetails) {
        try {
            console.log('🔍 Vérification des product_id...');

            if (!window.api || !window.api.products) {
                console.warn('⚠️ API products non disponible');
                return;
            }

            let hasChanges = false;

            for (const item of orderDetails.items) {
                if (!item.product_id && item.product_name) {
                    console.log(`🔍 Recherche du produit: ${item.product_name}`);

                    try {
                        // Chercher le produit par nom
                        const products = await window.api.products.getAll();
                        const matchingProduct = products.find(p =>
                            p.name.toLowerCase() === item.product_name.toLowerCase() ||
                            (item.product_reference && p.reference === item.product_reference)
                        );

                        if (matchingProduct) {
                            item.product_id = matchingProduct.id;
                            hasChanges = true;
                            console.log(`✅ Produit trouvé: ${item.product_name} → ID ${matchingProduct.id}`);
                        } else {
                            console.warn(`⚠️ Produit non trouvé: ${item.product_name}`);

                            // Créer le produit automatiquement
                            const newProduct = await window.api.products.create({
                                name: item.product_name,
                                reference: item.product_reference || '',
                                purchase_price: item.unit_price || 0,
                                price: (item.unit_price || 0) * 1.3, // Marge de 30%
                                stock: 0,
                                category: 'Fournisseur',
                                description: `Produit créé automatiquement depuis commande ${orderDetails.order_number || orderDetails.id}`
                            });

                            if (newProduct && newProduct.id) {
                                item.product_id = newProduct.id;
                                hasChanges = true;
                                console.log(`✅ Produit créé automatiquement: ${item.product_name} → ID ${newProduct.id}`);
                            }
                        }
                    } catch (productError) {
                        console.error(`❌ Erreur lors de la recherche/création du produit ${item.product_name}:`, productError);
                    }
                }
            }

            // Sauvegarder les changements si nécessaire
            if (hasChanges) {
                console.log('💾 Sauvegarde des product_id mis à jour...');
                const orders = this.getAllOrders();
                const orderIndex = orders.findIndex(order => order.id === orderDetails.id);
                if (orderIndex !== -1) {
                    orders[orderIndex].items = orderDetails.items;
                    this.saveOrders(orders);
                    console.log('✅ Product_id sauvegardés');
                }
            }

        } catch (error) {
            console.error('❌ Erreur lors de la vérification des product_id:', error);
        }
    }

    /**
     * Mettre à jour le stock d'un produit directement dans la table products
     * Cette fonction garantit que le stock est mis à jour partout dans le système
     */
    async updateProductStockDirectly(productId, quantity, operation = 'ADD') {
        try {
            console.log(`🔄 MISE À JOUR DIRECTE DU STOCK PRINCIPAL`);
            console.log(`📦 Produit: ${productId}`);
            console.log(`📊 Quantité: ${quantity}`);
            console.log(`⚙️ Opération: ${operation}`);

            if (!window.api || !window.api.products) {
                console.error('❌ API products non disponible');
                return false;
            }

            // Récupérer le produit actuel
            const product = await window.api.products.getById(productId);
            if (!product) {
                console.error(`❌ Produit ${productId} non trouvé`);
                return false;
            }

            const currentStock = parseInt(product.stock) || 0;
            let newStock;

            if (operation === 'ADD') {
                newStock = currentStock + parseInt(quantity);
                console.log(`➕ AJOUT: ${currentStock} + ${quantity} = ${newStock}`);
            } else if (operation === 'SUBTRACT') {
                newStock = Math.max(0, currentStock - parseInt(quantity));
                console.log(`➖ RETRAIT: ${currentStock} - ${quantity} = ${newStock}`);
            } else {
                console.error(`❌ Opération inconnue: ${operation}`);
                return false;
            }

            console.log(`📊 CHANGEMENT DE STOCK: ${currentStock} → ${newStock}`);

            // Mettre à jour le produit avec le nouveau stock
            const updateData = {
                id: productId,
                name: product.name,
                barcode: product.barcode || '',
                purchase_price: product.purchase_price || 0,
                price_retail: product.price_retail || 0,
                price_wholesale: product.price_wholesale || 0,
                price_carton: product.price_carton || 0,
                stock: newStock,
                alert_threshold: product.alert_threshold || 0,
                category: product.category || '',
                description: product.description || '',
                image_url: product.image_url || ''
            };

            console.log(`💾 Mise à jour du produit avec données complètes:`, updateData);
            const updateResult = await window.api.products.update(updateData);

            if (updateResult && updateResult.success) {
                console.log(`✅ STOCK MIS À JOUR AVEC SUCCÈS !`);
                console.log(`📊 Nouveau stock: ${newStock}`);

                // Vérifier que la mise à jour a bien eu lieu
                const verificationProduct = await window.api.products.getById(productId);
                console.log(`🔍 Vérification - Stock actuel: ${verificationProduct.stock}`);

                if (parseInt(verificationProduct.stock) === newStock) {
                    console.log(`✅ CONFIRMATION: Stock correctement mis à jour partout !`);
                    return true;
                } else {
                    console.error(`❌ ERREUR: Stock non mis à jour (attendu: ${newStock}, actuel: ${verificationProduct.stock})`);
                    return false;
                }
            } else {
                console.error('❌ Échec de la mise à jour du stock');
                console.error('Résultat:', updateResult);
                return false;
            }

        } catch (error) {
            console.error('❌ ERREUR lors de la mise à jour directe du stock:', error);
            return false;
        }
    }

    /**
     * Forcer le rafraîchissement de toutes les interfaces
     */
    refreshAllInterfaces() {
        try {
            console.log('🔄 Rafraîchissement des interfaces...');

            // Rafraîchir la page produits si elle existe
            if (window.loadProducts && typeof window.loadProducts === 'function') {
                console.log('📦 Rafraîchissement de la page produits');
                window.loadProducts();
            }

            // Rafraîchir la page stocks si elle existe
            if (window.loadStock && typeof window.loadStock === 'function') {
                console.log('📊 Rafraîchissement de la page stocks');
                window.loadStock();
            }

            // Rafraîchir la caisse si elle existe
            if (window.loadCashRegister && typeof window.loadCashRegister === 'function') {
                console.log('💰 Rafraîchissement de la caisse');
                window.loadCashRegister();
            }

            // Déclencher un événement personnalisé pour notifier les autres composants
            if (window.dispatchEvent) {
                const event = new CustomEvent('stockUpdated', {
                    detail: { source: 'supplierOrder' }
                });
                window.dispatchEvent(event);
                console.log('📡 Événement stockUpdated déclenché');
            }

        } catch (error) {
            console.warn('⚠️ Erreur lors du rafraîchissement des interfaces:', error);
        }
    }

    /**
     * Créer un lot professionnel à partir d'une commande fournisseur
     */
    async createLotFromOrder(item, orderDetails) {
        try {
            console.log(`
🏭 ========================================
   CRÉATION LOT PROFESSIONNEL
========================================`);
            console.log(`📦 Produit: ${item.product_name} (ID: ${item.product_id})`);
            console.log(`📊 Quantité: ${item.quantity_ordered}`);
            console.log(`💰 Prix d'achat: ${item.unit_price} MAD`);
            console.log(`🏢 Fournisseur: ${orderDetails.supplier_name || 'N/A'}`);
            console.log(`📋 Commande: ${orderDetails.order_number || orderDetails.id}`);

            // Générer un numéro de lot unique
            const lotNumber = this.generateLotNumber(orderDetails, item);
            console.log(`🏷️ Numéro de lot: ${lotNumber}`);

            // Préparer les données du lot
            const lotData = {
                product_id: item.product_id,
                lot_number: lotNumber,
                quantity: item.quantity_ordered,
                purchase_price: item.unit_price || 0,
                purchase_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
                supplier_id: orderDetails.supplier_id || null,
                status: 'AVAILABLE',
                notes: `Lot créé depuis commande fournisseur ${orderDetails.order_number || orderDetails.id} - ${orderDetails.supplier_name || 'Fournisseur'}`
            };

            console.log(`📋 Données du lot:`, lotData);

            // Créer le lot via l'API
            console.log(`🚀 Création du lot...`);
            const newLot = await window.api.stockLots.createLot(lotData);
            console.log(`📥 Lot créé:`, newLot);

            if (!newLot || !newLot.id) {
                console.error(`❌ Échec de la création du lot`);
                return false;
            }

            // Enregistrer le mouvement d'entrée
            console.log(`📝 Enregistrement du mouvement d'entrée...`);
            const movementData = {
                product_id: item.product_id,
                lot_id: newLot.id,
                movement_type: 'IN',
                quantity: item.quantity_ordered,
                unit_cost: item.unit_price || 0,
                reference_type: 'PURCHASE',
                notes: `Entrée depuis commande fournisseur ${orderDetails.order_number || orderDetails.id}`
            };

            console.log(`📋 Données du mouvement:`, movementData);
            const movementResult = await window.api.stockLots.recordMovement(movementData);
            console.log(`📥 Mouvement enregistré:`, movementResult);

            console.log(`✅ LOT CRÉÉ AVEC SUCCÈS !`);
            console.log(`🏷️ Lot: ${lotNumber}`);
            console.log(`📦 Quantité: ${item.quantity_ordered}`);
            console.log(`💰 Valeur: ${(item.quantity_ordered * item.unit_price).toFixed(2)} MAD`);
            console.log(`========================================`);

            return true;

        } catch (error) {
            console.error(`❌ ERREUR lors de la création du lot:`, error);
            console.error(`📋 Détails:`, error.message);
            return false;
        }
    }

    /**
     * Générer un numéro de lot unique
     */
    generateLotNumber(orderDetails, item) {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
        const orderRef = (orderDetails.order_number || orderDetails.id).slice(-6);
        const productRef = item.product_id.toString().padStart(3, '0');

        return `LOT-${dateStr}-${orderRef}-${productRef}`;
    }

    /**
     * Retirer du stock en utilisant la méthode FIFO (First In, First Out)
     */
    async removeStockFromLots(item, orderDetails) {
        try {
            console.log(`
🔄 ========================================
   RETRAIT STOCK FIFO DEPUIS LOTS
========================================`);
            console.log(`📦 Produit: ${item.product_name} (ID: ${item.product_id})`);
            console.log(`📊 Quantité à retirer: ${item.quantity_ordered}`);

            // Récupérer tous les lots disponibles pour ce produit (triés par date)
            const lots = await window.api.stockLots.getProductLots(item.product_id, false);
            console.log(`📋 Lots disponibles: ${lots.length}`);

            if (!lots || lots.length === 0) {
                console.warn(`⚠️ Aucun lot disponible pour le produit ${item.product_id}`);
                return false;
            }

            // Filtrer les lots avec du stock disponible et les trier par date (FIFO)
            const availableLots = lots
                .filter(lot => lot.quantity > 0 && lot.status === 'AVAILABLE')
                .sort((a, b) => new Date(a.purchase_date) - new Date(b.purchase_date));

            console.log(`📦 Lots avec stock: ${availableLots.length}`);

            if (availableLots.length === 0) {
                console.warn(`⚠️ Aucun lot avec stock disponible pour le produit ${item.product_id}`);
                return false;
            }

            let quantityToRemove = item.quantity_ordered;
            let lotsProcessed = 0;

            // Retirer du stock en suivant la méthode FIFO
            for (const lot of availableLots) {
                if (quantityToRemove <= 0) break;

                const quantityFromThisLot = Math.min(quantityToRemove, lot.quantity);
                console.log(`📦 Retrait de ${quantityFromThisLot} depuis lot ${lot.lot_number} (disponible: ${lot.quantity})`);

                // Enregistrer le mouvement de sortie
                const movementData = {
                    product_id: item.product_id,
                    lot_id: lot.id,
                    movement_type: 'OUT',
                    quantity: quantityFromThisLot,
                    unit_cost: lot.purchase_price,
                    reference_type: 'ADJUSTMENT',
                    notes: `Annulation commande fournisseur ${orderDetails.order_number || orderDetails.id} - ${orderDetails.supplier_name || 'Fournisseur'}`
                };

                try {
                    await window.api.stockLots.recordMovement(movementData);
                    console.log(`✅ Mouvement enregistré pour lot ${lot.lot_number}`);

                    quantityToRemove -= quantityFromThisLot;
                    lotsProcessed++;

                } catch (movementError) {
                    console.error(`❌ Erreur lors de l'enregistrement du mouvement pour lot ${lot.lot_number}:`, movementError);
                    return false;
                }
            }

            if (quantityToRemove > 0) {
                console.warn(`⚠️ Stock insuffisant dans les lots. Manque: ${quantityToRemove} unités`);
                console.log(`📊 Quantité retirée: ${item.quantity_ordered - quantityToRemove}/${item.quantity_ordered}`);
                return false;
            }

            console.log(`✅ RETRAIT FIFO RÉUSSI !`);
            console.log(`📦 Quantité totale retirée: ${item.quantity_ordered}`);
            console.log(`📋 Lots traités: ${lotsProcessed}`);
            console.log(`========================================`);

            return true;

        } catch (error) {
            console.error(`❌ ERREUR lors du retrait FIFO:`, error);
            console.error(`📋 Détails:`, error.message);
            return false;
        }
    }
}

// Exposition de l'API
window.supplierOrdersAPI = new SupplierOrdersAPI();

// Exposition des fonctions utiles pour les tests
window.recreateOrderTestData = () => window.supplierOrdersAPI.recreateTestData();
window.clearOrderData = () => window.supplierOrdersAPI.clearAllData();

// FONCTION DE DIAGNOSTIC COMPLÈTE
window.diagnosticComplet = async () => {
    console.log(`
🔍 ========================================
   DIAGNOSTIC COMPLET DU SYSTÈME
========================================`);

    try {
        // 1. Vérifier les APIs disponibles
        console.log(`\n1️⃣ VÉRIFICATION DES APIs`);
        console.log(`- window.api: ${window.api ? '✅' : '❌'}`);
        console.log(`- window.api.products: ${window.api?.products ? '✅' : '❌'}`);
        console.log(`- window.api.stockLots: ${window.api?.stockLots ? '✅' : '❌'}`);
        console.log(`- window.supplierOrdersAPI: ${window.supplierOrdersAPI ? '✅' : '❌'}`);

        // 2. Lister les commandes existantes
        console.log(`\n2️⃣ COMMANDES EXISTANTES`);
        const orders = window.supplierOrdersAPI.getAllOrders();
        console.log(`Nombre de commandes: ${orders.length}`);

        if (orders.length > 0) {
            const lastOrder = orders[orders.length - 1];
            console.log(`Dernière commande:`, lastOrder);
            console.log(`- ID: ${lastOrder.id}`);
            console.log(`- Statut: ${lastOrder.status}`);
            console.log(`- Articles: ${lastOrder.items?.length || 0}`);

            if (lastOrder.items && lastOrder.items.length > 0) {
                console.log(`\n📦 DÉTAIL DES ARTICLES:`);
                lastOrder.items.forEach((item, index) => {
                    console.log(`  Article ${index + 1}:`);
                    console.log(`  - Nom: ${item.product_name}`);
                    console.log(`  - Product ID: ${item.product_id || '❌ MANQUANT'}`);
                    console.log(`  - Quantité: ${item.quantity_ordered}`);
                    console.log(`  - Prix: ${item.unit_price}`);
                });
            }
        }

        // 3. Vérifier les produits
        console.log(`\n3️⃣ PRODUITS DISPONIBLES`);
        if (window.api?.products) {
            const products = await window.api.products.getAll();
            console.log(`Nombre de produits: ${products.length}`);

            if (products.length > 0) {
                console.log(`Premier produit:`, products[0]);
                console.log(`- ID: ${products[0].id}`);
                console.log(`- Nom: ${products[0].name}`);
                console.log(`- Stock: ${products[0].stock}`);
            }
        }

        // 4. Test de mise à jour directe
        console.log(`\n4️⃣ TEST DE MISE À JOUR DIRECTE`);
        if (window.api?.products) {
            const products = await window.api.products.getAll();
            if (products.length > 0) {
                const testProduct = products[0];
                console.log(`Test avec produit: ${testProduct.name} (ID: ${testProduct.id})`);
                console.log(`Stock avant test: ${testProduct.stock}`);

                // Test d'ajout de 1 unité
                const success = await window.supplierOrdersAPI.updateProductStockDirectly(testProduct.id, 1, 'ADD');
                console.log(`Résultat du test: ${success ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);

                // Vérifier le résultat
                const updatedProduct = await window.api.products.getById(testProduct.id);
                console.log(`Stock après test: ${updatedProduct.stock}`);

                // Remettre le stock comme avant
                await window.supplierOrdersAPI.updateProductStockDirectly(testProduct.id, 1, 'SUBTRACT');
                console.log(`Stock remis à l'original`);
            }
        }

        console.log(`\n✅ DIAGNOSTIC TERMINÉ`);
        console.log(`========================================`);

    } catch (error) {
        console.error(`❌ Erreur lors du diagnostic:`, error);
    }
};

// FONCTION POUR DIAGNOSTIQUER LES COMMANDES SANS ARTICLES
window.diagnosticCommandes = async () => {
    console.log(`
🔍 ========================================
   DIAGNOSTIC DES COMMANDES
========================================`);

    try {
        const orders = window.supplierOrdersAPI.getAllOrders();
        console.log(`📦 Total des commandes: ${orders.length}`);

        let commandesSansArticles = 0;
        let commandesAvecArticles = 0;

        orders.forEach((order, index) => {
            const nbArticles = order.items ? order.items.length : 0;
            console.log(`\n📋 Commande ${index + 1}:`);
            console.log(`  - ID: ${order.id}`);
            console.log(`  - Numéro: ${order.order_number}`);
            console.log(`  - Statut: ${order.status}`);
            console.log(`  - Articles: ${nbArticles}`);

            if (nbArticles === 0) {
                commandesSansArticles++;
                console.log(`  ❌ PROBLÈME: Aucun article !`);
            } else {
                commandesAvecArticles++;
                console.log(`  ✅ OK: ${nbArticles} articles`);

                // Afficher les détails des articles
                order.items.forEach((item, itemIndex) => {
                    console.log(`    Article ${itemIndex + 1}:`);
                    console.log(`      - Nom: ${item.product_name}`);
                    console.log(`      - Product ID: ${item.product_id || '❌ MANQUANT'}`);
                    console.log(`      - Quantité: ${item.quantity_ordered}`);
                });
            }
        });

        console.log(`\n📊 RÉSUMÉ:`);
        console.log(`  - Commandes avec articles: ${commandesAvecArticles}`);
        console.log(`  - Commandes SANS articles: ${commandesSansArticles}`);

        if (commandesSansArticles > 0) {
            console.log(`\n❌ PROBLÈME MAJEUR: ${commandesSansArticles} commandes n'ont pas d'articles !`);
            console.log(`   Cela explique pourquoi le stock n'est pas mis à jour.`);
        }

        console.log(`========================================`);

    } catch (error) {
        console.error(`❌ Erreur lors du diagnostic des commandes:`, error);
    }
};

// FONCTION DE TEST SIMPLE POUR L'API PRODUCTS
window.testApiProducts = async (productId = 23) => {
    console.log(`
🧪 ========================================
   TEST DE L'API PRODUCTS
========================================`);

    try {
        console.log(`📦 Test avec produit ID: ${productId}`);

        // Récupérer le produit
        const product = await window.api.products.getById(productId);
        console.log(`📋 Produit trouvé:`, product);
        console.log(`📊 Stock actuel: ${product.stock}`);

        // Tester la mise à jour
        const newStock = parseInt(product.stock) + 1;
        console.log(`🔄 Test: ${product.stock} → ${newStock}`);

        const success = await window.supplierOrdersAPI.updateProductStockDirectly(productId, 1, 'ADD');
        console.log(`📥 Résultat: ${success ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);

        // Vérifier le résultat
        const updatedProduct = await window.api.products.getById(productId);
        console.log(`📊 Nouveau stock: ${updatedProduct.stock}`);

        if (parseInt(updatedProduct.stock) === newStock) {
            console.log(`🎉 PARFAIT ! L'API products fonctionne maintenant !`);

            // Remettre le stock original
            await window.supplierOrdersAPI.updateProductStockDirectly(productId, 1, 'SUBTRACT');
            console.log(`🔄 Stock remis à l'original`);

            return true;
        } else {
            console.error(`❌ PROBLÈME: Stock non mis à jour correctement`);
            return false;
        }

    } catch (error) {
        console.error(`❌ Erreur lors du test:`, error);
        return false;
    }
};

// FONCTION DE TEST COMPLET DU SYSTÈME
window.testSystemeComplet = async () => {
    console.log(`
🧪 ========================================
   TEST COMPLET DU SYSTÈME
========================================`);

    try {
        // 1. Tester l'API products
        console.log(`\n1️⃣ TEST API PRODUCTS`);
        const apiProductsOk = await window.testApiProducts();

        if (!apiProductsOk) {
            console.error(`❌ ARRÊT: L'API products ne fonctionne pas !`);
            return;
        }

        console.log(`✅ API products fonctionne !`);

        // 2. Créer une commande de test avec articles
        console.log(`\n2️⃣ CRÉATION COMMANDE DE TEST`);

        const products = await window.api.products.getAll();
        if (products.length === 0) {
            console.error(`❌ Aucun produit disponible pour le test`);
            return;
        }

        const testProduct = products[0];
        console.log(`📦 Produit de test: ${testProduct.name} (ID: ${testProduct.id})`);
        console.log(`📊 Stock avant: ${testProduct.stock}`);

        const testOrderData = {
            supplier_id: 1,
            order_date: new Date().toISOString().split('T')[0],
            status: 'PENDING',
            notes: 'Commande de test automatique',
            items: [
                {
                    product_id: testProduct.id,
                    product_name: testProduct.name,
                    product_reference: testProduct.barcode || '',
                    quantity_ordered: 5,
                    unit_price: testProduct.purchase_price || 10
                }
            ]
        };

        console.log(`📋 Données de la commande:`, testOrderData);

        const orderResult = await window.supplierOrdersAPI.createOrder(testOrderData);
        console.log(`📥 Résultat création:`, orderResult);

        if (!orderResult || !orderResult.id) {
            console.error(`❌ Échec de la création de commande`);
            return;
        }

        console.log(`✅ Commande créée: ${orderResult.id}`);

        // 3. Vérifier que la commande a bien des articles
        const orderDetails = await window.supplierOrdersAPI.getOrderDetails(orderResult.id);
        console.log(`📦 Articles dans la commande: ${orderDetails.items?.length || 0}`);

        if (!orderDetails.items || orderDetails.items.length === 0) {
            console.error(`❌ PROBLÈME: La commande créée n'a pas d'articles !`);
            return;
        }

        // 4. Tester le changement de statut
        console.log(`\n3️⃣ TEST CHANGEMENT DE STATUT`);

        const statusResult = await window.supplierOrdersAPI.updateOrderStatus(orderResult.id, 'CONFIRMED', 'Test automatique');
        console.log(`📥 Résultat changement statut:`, statusResult);

        // 5. Vérifier le stock après
        const productAfter = await window.api.products.getById(testProduct.id);
        console.log(`📊 Stock après: ${productAfter.stock}`);

        const expectedStock = parseInt(testProduct.stock) + 5;
        if (parseInt(productAfter.stock) === expectedStock) {
            console.log(`🎉 SUCCÈS TOTAL ! Le système fonctionne parfaitement !`);
            console.log(`📈 Stock: ${testProduct.stock} + 5 = ${productAfter.stock}`);
        } else {
            console.error(`❌ ÉCHEC: Stock non mis à jour (attendu: ${expectedStock}, actuel: ${productAfter.stock})`);
        }

        console.log(`\n✅ TEST COMPLET TERMINÉ`);
        console.log(`========================================`);

    } catch (error) {
        console.error(`❌ Erreur lors du test complet:`, error);
    }
};

// FONCTION DE TEST SPÉCIFIQUE POUR LES LOTS
window.testSystemeLots = async () => {
    console.log(`
🧪 ========================================
   TEST COMPLET DU SYSTÈME DE LOTS
========================================`);

    try {
        // 1. Vérifier l'API stockLots
        console.log(`\n1️⃣ VÉRIFICATION API STOCKLOTS`);
        if (!window.api?.stockLots) {
            console.error(`❌ API stockLots non disponible !`);
            return;
        }
        console.log(`✅ API stockLots disponible`);

        // 2. Sélectionner un produit de test
        const products = await window.api.products.getAll();
        if (products.length === 0) {
            console.error(`❌ Aucun produit disponible`);
            return;
        }

        const testProduct = products[0];
        console.log(`\n2️⃣ PRODUIT DE TEST`);
        console.log(`📦 Produit: ${testProduct.name} (ID: ${testProduct.id})`);
        console.log(`📊 Stock initial: ${testProduct.stock}`);

        // 3. Créer une commande de test avec lots
        console.log(`\n3️⃣ CRÉATION COMMANDE AVEC LOTS`);

        const testOrderData = {
            supplier_id: 1,
            order_date: new Date().toISOString().split('T')[0],
            status: 'PENDING',
            notes: 'Test automatique du système de lots',
            items: [
                {
                    product_id: testProduct.id,
                    product_name: testProduct.name,
                    product_reference: testProduct.barcode || '',
                    quantity_ordered: 10,
                    unit_price: testProduct.purchase_price || 15
                }
            ]
        };

        const orderResult = await window.supplierOrdersAPI.createOrder(testOrderData);
        if (!orderResult?.id) {
            console.error(`❌ Échec création commande`);
            return;
        }

        console.log(`✅ Commande créée: ${orderResult.id}`);

        // 4. Confirmer la commande (doit créer un lot)
        console.log(`\n4️⃣ CONFIRMATION COMMANDE (CRÉATION LOT)`);

        const confirmResult = await window.supplierOrdersAPI.updateOrderStatus(orderResult.id, 'CONFIRMED', 'Test lots');
        console.log(`📥 Résultat confirmation: ${confirmResult ? '✅' : '❌'}`);

        // 5. Vérifier que le lot a été créé
        console.log(`\n5️⃣ VÉRIFICATION CRÉATION LOT`);

        const lots = await window.api.stockLots.getProductLots(testProduct.id, false);
        console.log(`📋 Lots du produit: ${lots.length}`);

        // Chercher le lot créé (par numéro de commande dans les notes OU par date récente)
        const newLot = lots.find(lot =>
            (lot.notes && lot.notes.includes(orderResult.id)) ||
            (lot.notes && lot.notes.includes(orderResult.order_number)) ||
            (lot.lot_number && lot.lot_number.includes(orderResult.order_number?.slice(-6)))
        );

        if (newLot) {
            console.log(`✅ Lot créé trouvé: ${newLot.lot_number}`);
            console.log(`📦 Quantité: ${newLot.quantity}`);
            console.log(`💰 Prix: ${newLot.purchase_price} MAD`);
            console.log(`📋 Notes: ${newLot.notes}`);
        } else {
            console.warn(`⚠️ Lot non trouvé par recherche, mais le stock a été mis à jour`);
            console.log(`📋 Lots disponibles:`, lots.map(l => ({
                lot_number: l.lot_number,
                quantity: l.quantity,
                notes: l.notes?.substring(0, 50) + '...'
            })));
        }

        // 6. Vérifier le stock mis à jour
        const productAfter = await window.api.products.getById(testProduct.id);
        console.log(`\n6️⃣ VÉRIFICATION STOCK`);
        console.log(`📊 Stock avant: ${testProduct.stock}`);
        console.log(`📊 Stock après: ${productAfter.stock}`);

        const expectedStock = parseInt(testProduct.stock) + 10;
        if (parseInt(productAfter.stock) === expectedStock) {
            console.log(`🎉 SUCCÈS TOTAL ! Le système de lots fonctionne parfaitement !`);
            console.log(`📈 Stock: ${testProduct.stock} + 10 = ${productAfter.stock}`);
            console.log(`🏷️ Lot créé: ${newLot?.lot_number || 'N/A'}`);
        } else {
            console.error(`❌ ÉCHEC: Stock non mis à jour correctement`);
            console.error(`Attendu: ${expectedStock}, Actuel: ${productAfter.stock}`);
        }

        console.log(`\n✅ TEST SYSTÈME LOTS TERMINÉ`);
        console.log(`========================================`);

    } catch (error) {
        console.error(`❌ Erreur lors du test système lots:`, error);
    }
};

// FONCTION POUR TRACER LE CHANGEMENT DE STATUT
window.tracerChangementStatut = async (orderId, nouveauStatut) => {
    console.log(`
🔍 ========================================
   TRAÇAGE CHANGEMENT DE STATUT
========================================`);

    try {
        console.log(`📋 Commande: ${orderId}`);
        console.log(`🔄 Nouveau statut: ${nouveauStatut}`);

        // 1. Récupérer la commande avant changement
        console.log(`\n1️⃣ ÉTAT AVANT CHANGEMENT`);
        const orderBefore = await window.supplierOrdersAPI.getOrderDetails(orderId);
        if (!orderBefore) {
            console.error(`❌ Commande ${orderId} non trouvée !`);
            return;
        }

        console.log(`- Statut actuel: ${orderBefore.status}`);
        console.log(`- Nombre d'articles: ${orderBefore.items?.length || 0}`);

        // Vérifier les stocks avant
        if (orderBefore.items) {
            console.log(`\n📦 STOCKS AVANT:`);
            for (const item of orderBefore.items) {
                if (item.product_id) {
                    const product = await window.api.products.getById(item.product_id);
                    console.log(`  - ${item.product_name}: ${product?.stock || 'N/A'} unités`);
                }
            }
        }

        // 2. Effectuer le changement
        console.log(`\n2️⃣ CHANGEMENT DE STATUT EN COURS...`);
        const result = await window.supplierOrdersAPI.updateOrderStatus(orderId, nouveauStatut, 'Test de traçage');
        console.log(`Résultat: ${result ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);

        // 3. Vérifier l'état après
        console.log(`\n3️⃣ ÉTAT APRÈS CHANGEMENT`);
        const orderAfter = await window.supplierOrdersAPI.getOrderDetails(orderId);
        console.log(`- Nouveau statut: ${orderAfter.status}`);

        // Vérifier les stocks après
        if (orderAfter.items) {
            console.log(`\n📦 STOCKS APRÈS:`);
            for (const item of orderAfter.items) {
                if (item.product_id) {
                    const product = await window.api.products.getById(item.product_id);
                    console.log(`  - ${item.product_name}: ${product?.stock || 'N/A'} unités`);
                }
            }
        }

        console.log(`\n✅ TRAÇAGE TERMINÉ`);
        console.log(`========================================`);

    } catch (error) {
        console.error(`❌ Erreur lors du traçage:`, error);
    }
};

// Fonction de test pour vérifier la mise à jour du stock
window.testStockUpdate = async (orderId) => {
    try {
        console.log('🧪 Test de mise à jour du stock pour commande:', orderId);

        const orderDetails = await window.supplierOrdersAPI.getOrderDetails(orderId);
        if (!orderDetails) {
            console.error('❌ Commande non trouvée');
            return;
        }

        console.log('📋 Détails de la commande:', orderDetails);
        console.log('📦 Articles:', orderDetails.items);

        // Vérifier les product_id
        await window.supplierOrdersAPI.ensureProductIds(orderDetails);

        // Tester la mise à jour du stock
        await window.supplierOrdersAPI.updateStockOnStatusChange(orderId, 'CONFIRMED', 'PENDING');

        console.log('✅ Test terminé');
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    }
};

// Fonction de test pour la mise à jour directe du stock
window.testDirectStockUpdate = async (productId, quantity) => {
    try {
        console.log(`🧪 TEST DE MISE À JOUR DIRECTE DU STOCK`);
        console.log(`📦 Produit ID: ${productId}`);
        console.log(`📊 Quantité à ajouter: ${quantity}`);
        console.log(`=====================================`);

        // Vérifier le stock avant
        const productBefore = await window.api.products.getById(productId);
        if (!productBefore) {
            console.error(`❌ Produit ${productId} non trouvé !`);
            return;
        }

        console.log(`📋 Produit: ${productBefore.name}`);
        console.log(`📊 Stock AVANT: ${productBefore.stock}`);

        // Mettre à jour directement
        const result = await window.supplierOrdersAPI.updateProductStockDirectly(productId, quantity, 'ADD');

        // Vérifier le stock après
        const productAfter = await window.api.products.getById(productId);
        console.log(`📊 Stock APRÈS: ${productAfter.stock}`);

        const expectedStock = parseInt(productBefore.stock) + parseInt(quantity);
        console.log(`🎯 Stock attendu: ${expectedStock}`);

        if (parseInt(productAfter.stock) === expectedStock) {
            console.log(`✅ SUCCÈS ! Le stock a été correctement mis à jour !`);
            console.log(`🎉 ${productBefore.stock} + ${quantity} = ${productAfter.stock}`);
        } else {
            console.error(`❌ ÉCHEC ! Le stock n'a pas été mis à jour correctement.`);
            console.error(`Attendu: ${expectedStock}, Actuel: ${productAfter.stock}`);
        }

        console.log(`=====================================`);
        console.log(`✅ Test terminé, résultat: ${result}`);
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    }
};

// Fonction pour tester avec une vraie commande
window.testRealOrderStock = async () => {
    try {
        console.log(`🧪 TEST AVEC UNE VRAIE COMMANDE`);
        console.log(`=====================================`);

        // Créer une commande de test
        const testOrder = {
            supplier_id: 'TEST_SUPPLIER',
            status: 'PENDING',
            order_date: new Date().toISOString().split('T')[0],
            notes: 'Test de mise à jour du stock',
            items: [
                {
                    product_id: 1, // Remplacer par un ID de produit existant
                    product_name: 'Produit Test',
                    quantity_ordered: 5,
                    unit_price: 10.00
                }
            ]
        };

        console.log(`📦 Commande de test:`, testOrder);

        // Vérifier le stock avant
        const productBefore = await window.api.products.getById(testOrder.items[0].product_id);
        console.log(`📊 Stock AVANT: ${productBefore.stock}`);

        // Simuler la confirmation de commande
        await window.supplierOrdersAPI.addStockFromOrder(testOrder);

        // Vérifier le stock après
        const productAfter = await window.api.products.getById(testOrder.items[0].product_id);
        console.log(`📊 Stock APRÈS: ${productAfter.stock}`);

        const expectedStock = parseInt(productBefore.stock) + testOrder.items[0].quantity_ordered;
        if (parseInt(productAfter.stock) === expectedStock) {
            console.log(`✅ SUCCÈS ! La commande a correctement mis à jour le stock !`);
        } else {
            console.error(`❌ ÉCHEC ! Le stock n'a pas été mis à jour par la commande.`);
        }

    } catch (error) {
        console.error('❌ Erreur lors du test de commande:', error);
    }
};

// Créer des données de test au chargement (seulement si nécessaire)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.supplierOrdersAPI.createTestData();
        }, 2000);
    });
} else {
    setTimeout(() => {
        window.supplierOrdersAPI.createTestData();
    }, 2000);
}
