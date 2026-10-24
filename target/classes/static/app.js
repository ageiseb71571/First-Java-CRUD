const API_URL = '/api/products';

// DOM Elements
const productForm = document.getElementById('product-form');
const productIdInput = document.getElementById('product-id');
const productNameInput = document.getElementById('product-name');
const productPriceInput = document.getElementById('product-price');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');
const productList = document.getElementById('product-list');
const productCount = document.getElementById('product-count');
const emptyState = document.getElementById('empty-state');
const notification = document.getElementById('notification');

let isEditing = false;
let notificationTimer = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();

    productForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', resetForm);
});

// Load products from API
async function loadProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status}`);
        }
        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        showNotification(error.message, 'error');
    }
}

// Render products in table
function renderProducts(products) {
    productList.innerHTML = '';
    const count = products.length;
    productCount.textContent = `${count} product${count === 1 ? '' : 's'}`;

    if (count === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    products.forEach(product => {
        const tr = document.createElement('tr');
        const formattedPrice = typeof product.price === 'number'
            ? `$${product.price.toFixed(2)}`
            : `$${parseFloat(product.price || 0).toFixed(2)}`;

        tr.innerHTML = `
            <td>#${product.id}</td>
            <td><strong>${escapeHtml(product.name)}</strong></td>
            <td class="price-col">${formattedPrice}</td>
            <td class="text-right">
                <button class="btn btn-sm btn-edit" onclick="startEdit(${product.id}, '${escapeHtml(product.name)}', ${product.price})">Edit</button>
                <button class="btn btn-sm btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        `;
        productList.appendChild(tr);
    });
}

// Handle Form Submission (Create or Update)
async function handleFormSubmit(event) {
    event.preventDefault();

    const name = productNameInput.value.trim();
    const price = parseFloat(productPriceInput.value);

    if (!name || isNaN(price) || price < 0) {
        showNotification('Please enter a valid product name and non-negative price.', 'error');
        return;
    }

    const payload = { name, price };

    try {
        if (isEditing) {
            const id = productIdInput.value;
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to update product');
            showNotification(`Product #${id} updated successfully!`, 'success');
        } else {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to create product');
            showNotification('Product created successfully!', 'success');
        }

        resetForm();
        loadProducts();
    } catch (error) {
        console.error('Error submitting form:', error);
        showNotification(error.message, 'error');
    }
}

// Start Edit Mode
window.startEdit = function(id, name, price) {
    isEditing = true;
    productIdInput.value = id;
    productNameInput.value = name;
    productPriceInput.value = price;

    formTitle.textContent = `Edit Product #${id}`;
    submitBtn.textContent = 'Update Product';
    cancelBtn.classList.remove('hidden');

    productNameInput.focus();
};

// Reset Form to Add Mode
function resetForm() {
    isEditing = false;
    productIdInput.value = '';
    productNameInput.value = '';
    productPriceInput.value = '';

    formTitle.textContent = 'Add New Product';
    submitBtn.textContent = 'Save Product';
    cancelBtn.classList.add('hidden');
}

// Delete Product
window.deleteProduct = async function(id) {
    if (!confirm(`Are you sure you want to delete product #${id}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete product');
        showNotification(`Product #${id} deleted successfully.`, 'success');

        if (isEditing && productIdInput.value == id) {
            resetForm();
        }

        loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification(error.message, 'error');
    }
};

// Notification helper
function showNotification(message, type = 'info') {
    if (notificationTimer) {
        clearTimeout(notificationTimer);
    }

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');

    notificationTimer = setTimeout(() => {
        notification.classList.add('hidden');
    }, 4000);
}

// HTML escape helper
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
