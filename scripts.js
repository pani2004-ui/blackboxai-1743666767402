// Sample product data (would come from backend in real app)
const products = [
    {
        id: 1,
        name: "Organic Tomatoes",
        description: "Freshly harvested organic tomatoes from our farm",
        price: 50,
        quantity: "10 kg",
        image: "https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg",
        farmer: "Ramesh Kumar",
        location: "Karnataka"
    },
    {
        id: 2,
        name: "Basmati Rice",
        description: "Premium quality basmati rice, freshly milled",
        price: 80,
        quantity: "5 kg bags",
        image: "https://images.pexels.com/photos/2090902/pexels-photo-2090902.jpeg",
        farmer: "Priya Sharma",
        location: "Punjab"
    }
];

// Sample transaction data
const transactions = [
    {
        id: 1,
        productId: 1,
        productName: "Organic Tomatoes",
        farmer: "Ramesh Kumar",
        price: 50,
        quantity: "5 kg",
        status: "Pending",
        date: "2023-05-15",
        deliveryStatus: "Not Shipped"
    },
    {
        id: 2,
        productId: 2,
        productName: "Basmati Rice",
        farmer: "Priya Sharma",
        price: 80,
        quantity: "2 bags",
        status: "Confirmed",
        date: "2023-05-10",
        deliveryStatus: "Shipped"
    }
];

// Function to render products
function renderProducts() {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card bg-white rounded-lg shadow-md overflow-hidden transition duration-300';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="text-xl font-semibold mb-2">${product.name}</h3>
                <p class="text-gray-600 mb-2">${product.description}</p>
                <div class="flex justify-between items-center">
                    <span class="text-green-600 font-bold">₹${product.price}/kg</span>
                    <span class="text-sm text-gray-500">${product.location}</span>
                </div>
                <div class="flex space-x-2 mt-4">
                    <a href="product-detail.html?id=${product.id}" class="flex-1 text-center bg-green-500 text-white py-2 rounded hover:bg-green-600 transition">View Details</a>
                    ${product.farmer === localStorage.getItem('currentUser') ? 
                    `<button onclick="deleteProduct(${product.id})" class="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition">Delete</button>` : ''}
                </div>
            </div>
        `;
        productList.appendChild(productCard);
    });
}

// Enhanced Product Service
const ProductService = {
    deleteProduct: (productId) => {
        try {
            if (!confirm('Permanently delete this product?')) return;
            
            // Validate user ownership
            const product = products.find(p => p.id === productId);
            if (!product) throw new Error('Product not found');
            if (product.farmer !== localStorage.getItem('currentUser')) {
                throw new Error('Unauthorized deletion attempt');
            }

            // Update in-memory store
            products = products.filter(p => p.id !== productId);
            
            // Update persisted store
            const savedProducts = JSON.parse(localStorage.getItem('products')) || [];
            const updatedProducts = savedProducts.filter(p => p.id !== productId);
            localStorage.setItem('products', JSON.stringify(updatedProducts));
            
            // Re-render and log
            renderProducts();
            console.log(`Product ${productId} deleted by ${localStorage.getItem('currentUser')}`);
            
            return true;
        } catch (error) {
            console.error('Deletion failed:', error);
            alert(`Deletion failed: ${error.message}`);
            return false;
        }
    },

    addProduct: (productData) => {
        try {
            // Validation
            if (!productData.name || !productData.price) {
                throw new Error('Invalid product data');
            }

            const newProduct = {
                id: Date.now(),
                createdAt: new Date().toISOString(),
                ...productData,
                farmer: localStorage.getItem('currentUser'),
                status: 'active'
            };

            // Update stores
            products.push(newProduct);
            const savedProducts = JSON.parse(localStorage.getItem('products')) || [];
            savedProducts.push(newProduct);
            localStorage.setItem('products', JSON.stringify(savedProducts));

            return newProduct;
        } catch (error) {
            console.error('Product creation failed:', error);
            throw error;
        }
    }
};

// Handle product form submission
function handleProductFormSubmit(e) {
    e.preventDefault();
    try {
        const productData = {
            name: document.getElementById('product-name').value.trim(),
            description: document.getElementById('product-desc').value.trim(),
            price: parseFloat(document.getElementById('product-price').value),
            quantity: document.getElementById('product-quantity').value.trim(),
            image: document.getElementById('product-image').value.trim(),
            location: document.getElementById('farmer-location').value.trim()
        };

        // Basic validation
        if (!productData.name || productData.name.length < 3) {
            throw new Error('Product name must be at least 3 characters');
        }
        if (isNaN(productData.price) || productData.price <= 0) {
            throw new Error('Invalid price value');
        }

        const newProduct = ProductService.addProduct(productData);
        alert(`Product "${newProduct.name}" listed successfully!`);
        window.location.href = 'index.html';
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Transaction Service
const TransactionService = {
    createOffer: (productId, offerData) => {
        try {
            // Validate
            const product = products.find(p => p.id === productId);
            if (!product) throw new Error('Product not found');
            if (!offerData.price || offerData.price <= 0) {
                throw new Error('Invalid offer price');
            }

            const newTransaction = {
                id: Date.now(),
                productId,
                productName: product.name,
                buyer: localStorage.getItem('currentUser'),
                farmer: product.farmer,
                price: parseFloat(offerData.price),
                message: offerData.message,
                status: 'pending',
                deliveryStatus: 'not_shipped',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Update transactions
            transactions.push(newTransaction);
            localStorage.setItem('transactions', JSON.stringify(transactions));

            // Notify farmer (simulated)
            console.log(`New offer created for product ${productId} by ${newTransaction.buyer}`);
            
            return newTransaction;
        } catch (error) {
            console.error('Offer creation failed:', error);
            throw error;
        }
    },

    updateDeliveryStatus: (transactionId, status) => {
        // Validate status transitions
        const validStatuses = ['not_shipped', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }

        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) throw new Error('Transaction not found');

        // Update transaction
        transaction.deliveryStatus = status;
        transaction.updatedAt = new Date().toISOString();
        
        // Persist changes
        localStorage.setItem('transactions', JSON.stringify(transactions));
        
        return transaction;
    }
};

// Enhanced negotiation form handler
function handleNegotiationForm(e) {
    e.preventDefault();
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = parseInt(urlParams.get('id'));
        
        const offerData = {
            price: document.getElementById('offer-price').value,
            message: document.getElementById('offer-message').value
        };

        const transaction = TransactionService.createOffer(productId, offerData);
        alert(`Offer of ₹${transaction.price} submitted successfully!`);
        document.getElementById('negotiation-form').reset();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Load product details
function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const product = products.find(p => p.id === productId);

    if (product) {
        document.getElementById('product-image').src = product.image;
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-desc').textContent = product.description;
        document.getElementById('product-price').textContent = product.price;
        document.getElementById('product-quantity').textContent = product.quantity;
        document.getElementById('farmer-name').textContent = product.farmer;
        document.getElementById('farmer-location').textContent = product.location;
    }
}

// Handle auth tab switching
function setupAuthTabs() {
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    loginTab.addEventListener('click', () => {
        loginTab.classList.remove('inactive-tab');
        loginTab.classList.add('active-tab');
        signupTab.classList.remove('active-tab');
        signupTab.classList.add('inactive-tab');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    });

    signupTab.addEventListener('click', () => {
        signupTab.classList.remove('inactive-tab');
        signupTab.classList.add('active-tab');
        loginTab.classList.remove('active-tab');
        loginTab.classList.add('inactive-tab');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    });
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('currentUser', email);
    alert('Login successful! Redirecting to home page...');
    window.location.href = 'index.html';
}

// Handle signup form submission
function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('currentUser', email);
    localStorage.setItem('userType', document.getElementById('account-type').value);
    alert('Account created successfully! Redirecting to home page...');
    window.location.href = 'index.html';
}

// Logout function
function logout() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userType');
    window.location.href = 'index.html';
}

// Update auth link in navigation
function updateAuthLink() {
    const authLink = document.getElementById('auth-link');
    if (authLink) {
        authLink.innerHTML = localStorage.getItem('loggedIn') === 'true' ? 
            `<a href="#" onclick="logout()" class="hover:underline">Logout</a>` : 
            `<a href="auth.html" class="hover:underline">Login</a>`;
    }
}

// Render transactions
function renderTransactions() {
    const transactionsList = document.getElementById('transactions-list');
    transactionsList.innerHTML = '';

    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${transaction.productName}</div>
                        <div class="text-sm text-gray-500">${transaction.quantity}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${transaction.farmer}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">₹${transaction.price}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${transaction.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 
                      transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}">
                    ${transaction.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button class="text-green-600 hover:text-green-900 mr-3">View</button>
                ${transaction.status === 'Pending' ? 
                    '<button class="text-red-600 hover:text-red-900 mr-3">Cancel</button>' : ''}
                ${transaction.status === 'Confirmed' ? 
                    `<span class="text-blue-600">${transaction.deliveryStatus}</span>` : ''}
            </td>
        `;
        transactionsList.appendChild(row);
    });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Load saved transactions
    const savedTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
    if (savedTransactions.length > 0) {
        transactions.push(...savedTransactions);
    }
    updateAuthLink();
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        renderProducts();
        
        const savedProducts = JSON.parse(localStorage.getItem('products')) || [];
        if (savedProducts.length > 0) {
            products.push(...savedProducts);
            renderProducts();
        }
    }

    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleProductFormSubmit);
    }

    const negotiationForm = document.getElementById('negotiation-form');
    if (negotiationForm) {
        negotiationForm.addEventListener('submit', handleNegotiationForm);
    }

    if (window.location.pathname.includes('product-detail.html')) {
        loadProductDetails();
    }

    if (window.location.pathname.includes('auth.html')) {
        setupAuthTabs();
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        document.getElementById('signup-form').addEventListener('submit', handleSignup);
    }

    if (window.location.pathname.includes('transaction.html')) {
        renderTransactions();
    }
});