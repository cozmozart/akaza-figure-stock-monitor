// Stock Monitor Configuration
const CONFIG = {
    // Product to monitor
    products: [
        {
            id: 'akaza-buzzmod',
            name: 'Akaza - Demon Slayer: Kimetsu no Yaiba [BUZZmod.]',
            url: 'https://www.bigbadtoystore.com/Product/VariationDetails/186410',
            price: '$89.99',
            store: 'BigBadToyStore'
        }
    ],
    
    // Notification settings
    notificationEmail: null,
    
    // API endpoints (will be set up with GitHub Actions)
    apiBase: window.location.origin,
    
    // Check interval (in milliseconds)
    checkInterval: 5 * 60 * 1000, // 5 minutes for demo, will be hourly in production
};

// DOM elements
const elements = {
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    lastChecked: document.getElementById('lastChecked'),
    emailInput: document.getElementById('emailInput'),
    subscribeBtn: document.getElementById('subscribeBtn'),
    subscriptionStatus: document.getElementById('subscriptionStatus')
};

// Current product being monitored
const currentProduct = CONFIG.products[0];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    startMonitoring();
});

function initializeApp() {
    // Load saved email from localStorage
    const savedEmail = localStorage.getItem('notificationEmail');
    if (savedEmail) {
        elements.emailInput.value = savedEmail;
        CONFIG.notificationEmail = savedEmail;
        showSubscriptionStatus('success', `Notifications enabled for ${savedEmail}`);
    }
    
    // Initial status check
    checkStockStatus();
}

function setupEventListeners() {
    elements.subscribeBtn.addEventListener('click', handleEmailSubscription);
    elements.emailInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleEmailSubscription();
        }
    });
}

function handleEmailSubscription() {
    const email = elements.emailInput.value.trim();
    
    if (!email) {
        showSubscriptionStatus('error', 'Please enter a valid email address');
        return;
    }
    
    if (!isValidEmail(email)) {
        showSubscriptionStatus('error', 'Please enter a valid email address');
        return;
    }
    
    // Save email to localStorage
    localStorage.setItem('notificationEmail', email);
    CONFIG.notificationEmail = email;
    
    showSubscriptionStatus('success', `Notifications enabled for ${email}`);
    
    // In a real implementation, you'd send this to your backend
    console.log('Email subscription saved:', email);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showSubscriptionStatus(type, message) {
    elements.subscriptionStatus.className = `subscription-status ${type}`;
    elements.subscriptionStatus.textContent = message;
    
    // Hide after 5 seconds
    setTimeout(() => {
        elements.subscriptionStatus.style.display = 'none';
    }, 5000);
}

async function checkStockStatus() {
    try {
        updateStatus('checking', 'Checking stock...');
        
        // In production, this would call your backend API
        // For now, we'll simulate the check
        const isInStock = await simulateStockCheck();
        
        if (isInStock) {
            updateStatus('in-stock', 'IN STOCK! 🎉');
            if (CONFIG.notificationEmail) {
                await sendNotification('in-stock');
            }
        } else {
            updateStatus('out-of-stock', 'Out of Stock');
        }
        
        updateLastChecked();
        
    } catch (error) {
        console.error('Error checking stock:', error);
        updateStatus('error', 'Error checking stock');
    }
}

// Simulate stock check - in production this would be replaced with actual API call
async function simulateStockCheck() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, randomly return in-stock status
    // In production, this would parse the actual BigBadToyStore page
    return Math.random() > 0.8; // 20% chance of being in stock for demo
}

function updateStatus(status, text) {
    elements.statusDot.className = `status-dot ${status}`;
    elements.statusText.textContent = text;
}

function updateLastChecked() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    elements.lastChecked.textContent = `Last checked: ${dateString} at ${timeString}`;
}

async function sendNotification(type) {
    if (!CONFIG.notificationEmail) return;
    
    try {
        // In production, this would call your notification service
        console.log(`Sending ${type} notification to ${CONFIG.notificationEmail}`);
        
        // For demo, show a browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Akaza Figure Alert!', {
                body: 'The Akaza figure is back in stock!',
                icon: '/favicon.ico'
            });
        }
        
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

function startMonitoring() {
    // Check immediately
    checkStockStatus();
    
    // Then check at intervals
    setInterval(checkStockStatus, CONFIG.checkInterval);
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Utility function to add new products (for future expansion)
function addProduct(product) {
    CONFIG.products.push(product);
    // In a real app, you'd update the UI to show multiple products
}

// Export for potential use in other scripts
window.StockMonitor = {
    checkStockStatus,
    addProduct,
    CONFIG
};
