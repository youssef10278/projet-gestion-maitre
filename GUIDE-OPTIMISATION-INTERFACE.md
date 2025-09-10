
# Guide d'Optimisation Interface - GestionPro

## 1. Debounce pour les recherches

Ajouter dans vos fichiers JS :

```javascript
// Fonction debounce pour optimiser les recherches
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utilisation pour la recherche
const debouncedSearch = debounce((searchTerm) => {
    loadProducts(searchTerm);
}, 300);

// Dans l'event listener
searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});
```

## 2. Pagination des listes

```javascript
const ITEMS_PER_PAGE = 50;
let currentPage = 1;

function displayItemsWithPagination(items) {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageItems = items.slice(startIndex, endIndex);
    
    // Afficher seulement les éléments de la page
    displayItems(pageItems);
    
    // Créer les boutons de pagination
    createPaginationButtons(items.length);
}
```

## 3. Loading states

```javascript
function showLoading() {
    const loader = document.createElement('div');
    loader.className = 'loading-spinner';
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.querySelector('.loading-spinner');
    if (loader) loader.remove();
}
```

## 4. Virtualisation pour grandes listes

Pour les listes de plus de 500 éléments, utiliser la virtualisation :

```javascript
function createVirtualList(items, container, itemHeight = 50) {
    const visibleItems = Math.ceil(container.clientHeight / itemHeight);
    let scrollTop = 0;
    
    function renderVisibleItems() {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleItems, items.length);
        
        // Render seulement les éléments visibles
        const fragment = document.createDocumentFragment();
        for (let i = startIndex; i < endIndex; i++) {
            const item = createItemElement(items[i]);
            item.style.position = 'absolute';
            item.style.top = (i * itemHeight) + 'px';
            fragment.appendChild(item);
        }
        
        container.innerHTML = '';
        container.appendChild(fragment);
    }
    
    container.addEventListener('scroll', () => {
        scrollTop = container.scrollTop;
        renderVisibleItems();
    });
    
    renderVisibleItems();
}
```

## Application Immédiate

1. Ajouter debounce aux champs de recherche
2. Limiter l'affichage à 50-100 éléments
3. Ajouter des spinners de chargement
4. Utiliser la pagination pour les grandes listes
