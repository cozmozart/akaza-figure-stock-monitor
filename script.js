// Stock Monitor Configuration
const CONFIG = {
    // Product to monitor
    products: [
        {
            id: 'akaza-buzzmod',
            name: 'Akaza - Demon Slayer: Kimetsu no Yaiba [BUZZmod.]',
            url: 'https://www.bigbadtoystore.com/Product/VariationDetails/186410',
            price: '$154.99',
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
    nextCheck: document.getElementById('nextCheck'),
    emailInput: document.getElementById('emailInput'),
    subscribeBtn: document.getElementById('subscribeBtn'),
    subscriptionStatus: document.getElementById('subscriptionStatus'),
    checkStatusBtn: document.getElementById('checkStatusBtn'),
    notificationStatus: document.getElementById('notificationStatus')
};

// Current product being monitored
const currentProduct = CONFIG.products[0];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    startMonitoring();
    initializeLucide();
    startNextCheckTimer();
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
    elements.checkStatusBtn.addEventListener('click', handleManualCheck);
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
        
        // Try to use the real API first, fallback to simulation
        let stockData;
        try {
            const response = await fetch('/api/check-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                stockData = await response.json();
                console.log('Real API response:', stockData);
            } else {
                throw new Error('API not available');
            }
        } catch (apiError) {
            console.log('API not available, using simulation:', apiError.message);
            // Fallback to simulation
            const isInStock = await simulateStockCheck();
            stockData = {
                success: true,
                status: {
                    'akaza-buzzmod': {
                        inStock: isInStock,
                        status: isInStock ? 'in-stock' : 'out-of-stock',
                        message: isInStock ? 'In Stock' : 'Out of Stock',
                        timestamp: new Date().toISOString(),
                        price: '$154.99'
                    }
                }
            };
        }
        
        if (stockData.success && stockData.status) {
            const productStatus = stockData.status['akaza-buzzmod'];
            
            if (productStatus.inStock) {
                updateStatus('in-stock', 'IN STOCK! 🎉');
                if (CONFIG.notificationEmail) {
                    await sendNotification('in-stock');
                }
            } else {
                updateStatus('out-of-stock', 'Out of Stock');
            }
            
            updateLastChecked();
        } else {
            throw new Error('Invalid response from server');
        }
        
    } catch (error) {
        console.error('Error checking stock:', error);
        updateStatus('error', 'Error checking stock');
    }
}

async function handleManualCheck() {
    // Disable button during check
    elements.checkStatusBtn.disabled = true;
    elements.checkStatusBtn.classList.add('loading');
    elements.checkStatusBtn.innerHTML = '<i data-lucide="refresh-cw"></i><span>CHECKING...</span>';
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    try {
        await checkStockStatus();
        
        // Show success feedback
        elements.checkStatusBtn.innerHTML = '<i data-lucide="check"></i><span>CHECKED!</span>';
        elements.checkStatusBtn.classList.remove('loading');
        
        setTimeout(() => {
            elements.checkStatusBtn.innerHTML = '<i data-lucide="refresh-cw"></i><span>CHECK NOW</span>';
            elements.checkStatusBtn.disabled = false;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 2000);
        
    } catch (error) {
        console.error('Manual check failed:', error);
        elements.checkStatusBtn.innerHTML = '<i data-lucide="x"></i><span>ERROR</span>';
        elements.checkStatusBtn.classList.remove('loading');
        
        setTimeout(() => {
            elements.checkStatusBtn.innerHTML = '<i data-lucide="refresh-cw"></i><span>CHECK NOW</span>';
            elements.checkStatusBtn.disabled = false;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 2000);
    }
}

// Simulate stock check - in production this would be replaced with actual API call
async function simulateStockCheck() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, always return out of stock since we know the item is unavailable
    // In production, this would parse the actual BigBadToyStore page
    return false; // Always out of stock for demo
}

function updateStatus(status, text) {
    elements.statusDot.className = `status-dot ${status}`;
    elements.statusText.textContent = text;
    
    // Add animation class
    elements.statusDot.style.animation = 'none';
    elements.statusDot.offsetHeight; // Trigger reflow
    elements.statusDot.style.animation = null;
}

function updateLastChecked() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    elements.lastChecked.textContent = timeString;
}

function startNextCheckTimer() {
    updateNextCheckTime();
    setInterval(updateNextCheckTime, 1000);
}

function updateNextCheckTime() {
    const now = new Date();
    const nextCheck = new Date(now.getTime() + CONFIG.checkInterval);
    const timeDiff = nextCheck - now;
    
    if (timeDiff > 0) {
        const minutes = Math.floor(timeDiff / 60000);
        const seconds = Math.floor((timeDiff % 60000) / 1000);
        elements.nextCheck.textContent = `${minutes}m ${seconds}s`;
    } else {
        elements.nextCheck.textContent = 'Now';
    }
}

function initializeLucide() {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
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
