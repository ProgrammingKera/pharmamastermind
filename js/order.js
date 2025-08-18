let cart = [];

// Load products from sessionStorage on page load
window.onload = function() {
    fetchProducts();
    loadStoredProducts();
};

function loadStoredProducts() {
    // Load expiry products
    const expiryProducts = sessionStorage.getItem('expiryProducts');
    if (expiryProducts) {
        const products = JSON.parse(expiryProducts);
        products.forEach(product => {
            cart.push(product);
        });
        sessionStorage.removeItem('expiryProducts');
        updateCartDisplay();
        showNotification('Expiry products loaded into cart!', 'success');
    }
    
    // Load restock products
    const restockProducts = sessionStorage.getItem('restockProducts');
    if (restockProducts) {
        const products = JSON.parse(restockProducts);
        products.forEach(product => {
            cart.push(product);
        });
        sessionStorage.removeItem('restockProducts');
        updateCartDisplay();
        showNotification('Restock products loaded into cart!', 'success');
    }
}

// Fetch and display products
async function fetchProducts() {
    try {
        const res = await fetch("/api/products");
        const products = await res.json();
        displayProducts(products);
    } catch (err) {
        alert("Error fetching products: " + err.message);
    }
}

function displayProducts(products) {
    const productList = document.getElementById("product-list");
    productList.innerHTML = "";

    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <img src="${product.image_path}" alt="${product.product_name}" class="product-image" />
            <div class="product-info">
                <h4>${product.product_name}</h4>
                <p>${product.category}</p>
                <p>${product.price} Pkr</p>
                <button onclick="addToCart('${product.product_name}', ${product.price})">Add</button>
            </div>
        `;
        productList.appendChild(card);
    });
}

// Add to cart
function addToCart(name, price) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    updateCartDisplay();
}

// Update cart display
function updateCartDisplay() {
    const orderList = document.getElementById("order-list");
    const subtotalElem = document.getElementById("subtotal");
    const discountElem = document.getElementById("discount");
    const totalElem = document.getElementById("total");

    orderList.innerHTML = "";

    let subtotal = 0;

    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        const row = document.createElement("div");
        row.innerHTML = `${item.name} - ${item.quantity} x ${item.price} = ${item.quantity * item.price} Pkr`;
        orderList.appendChild(row);
    });

    const discount = 0; 
    const total = subtotal - discount;

    subtotalElem.textContent = `${subtotal} Pkr`;
    discountElem.textContent = `${discount} Pkr`;
    totalElem.textContent = `${total} Pkr`;
}

// Clear cart
document.getElementById("clear-cart").addEventListener("click", () => {
    cart = [];
    updateCartDisplay();
});


document.getElementById("confirm-order").addEventListener("click", async () => {
    if (cart.length === 0) {
        alert("Cart is empty.");
        return;
    }

    
    const orderData = {
        supplier_name: "Default Supplier", 
        expected_delivery_date: new Date().toISOString().split('T')[0], // today's date
        items: cart
    };

    try {
        const res = await fetch('/save_pharmacy_order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const data = await res.json();

        if (res.ok && data.pdf_url) {
            alert("Order placed successfully!");
            window.open(data.pdf_url, '_blank'); // open PDF
            cart = [];
            updateCartDisplay();
        } else {
            alert("Error: " + (data.error || "PDF not generated."));
        }

    } catch (error) {
        alert("Failed to confirm order: " + error.message);
    }
});


function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'error' ? '#E74C3C' : type === 'success' ? '#27AE60' : type === 'warning' ? '#F39C12' : '#3498DB'};
        color: white;
        border-radius: 8px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}
