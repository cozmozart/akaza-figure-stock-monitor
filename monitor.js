// Stock Monitor Backend Script
// This script will be run by GitHub Actions to check stock status

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    products: [
        {
            id: 'akaza-buzzmod',
            name: 'Akaza - Demon Slayer: Kimetsu no Yaiba [BUZZmod.]',
            url: 'https://www.bigbadtoystore.com/Product/VariationDetails/186410',
            price: '$154.99',
            store: 'BigBadToyStore',
            selectors: {
                // These selectors will need to be updated based on actual BigBadToyStore HTML
                inStockIndicator: '.add-to-cart-button',
                outOfStockIndicator: '.out-of-stock, .sold-out',
                priceSelector: '.price'
            }
        }
    ],
    
    // File to store current status
    statusFile: 'status.json',
    
    // Email notification settings (will be configured via environment variables)
    email: {
        service: 'gmail', // or other email service
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        to: process.env.NOTIFICATION_EMAIL
    }
};

// Main monitoring function
async function monitorStock() {
    console.log('🔍 Starting stock monitoring...');
    
    try {
        for (const product of CONFIG.products) {
            console.log(`Checking ${product.name}...`);
            
            const stockStatus = await checkProductStock(product);
            const previousStatus = await getPreviousStatus(product.id);
            
            console.log(`Status: ${stockStatus.inStock ? 'IN STOCK' : 'OUT OF STOCK'}`);
            
            // Save current status
            await saveStatus(product.id, stockStatus);
            
            // Send notification if status changed from out-of-stock to in-stock
            if (previousStatus && !previousStatus.inStock && stockStatus.inStock) {
                console.log('🎉 Product is back in stock! Sending notification...');
                await sendNotification(product, stockStatus);
            }
        }
        
        console.log('✅ Monitoring complete');
        
    } catch (error) {
        console.error('❌ Error during monitoring:', error);
        process.exit(1);
    }
}

// Check stock status for a specific product
async function checkProductStock(product) {
    return new Promise((resolve, reject) => {
        const url = new URL(product.url);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const stockStatus = parseStockStatus(data, product);
                    resolve(stockStatus);
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

// Parse HTML to determine stock status
function parseStockStatus(html, product) {
    const timestamp = new Date().toISOString();
    
    // Extract product information
    const productTitle = extractProductTitle(html);
    const productDescription = extractProductDescription(html);
    
    // BigBadToyStore specific parsing
    // These selectors may need to be updated based on the actual page structure
    const inStockIndicators = [
        'Add to Cart',
        'add-to-cart',
        'In Stock',
        'in-stock'
    ];
    
    const outOfStockIndicators = [
        'Out of Stock',
        'out-of-stock',
        'Sold Out',
        'sold-out',
        'Pre-order',
        'pre-order'
    ];
    
    const lowerHtml = html.toLowerCase();
    
    // Check for out of stock indicators first
    for (const indicator of outOfStockIndicators) {
        if (lowerHtml.includes(indicator.toLowerCase())) {
            return {
                inStock: false,
                status: 'out-of-stock',
                message: 'Out of Stock',
                timestamp,
                price: extractPrice(html) || product.price,
                title: productTitle || product.name,
                description: productDescription || 'Product description not available'
            };
        }
    }
    
    // Check for in stock indicators
    for (const indicator of inStockIndicators) {
        if (lowerHtml.includes(indicator.toLowerCase())) {
            return {
                inStock: true,
                status: 'in-stock',
                message: 'In Stock',
                timestamp,
                price: extractPrice(html) || product.price,
                title: productTitle || product.name,
                description: productDescription || 'Product description not available'
            };
        }
    }
    
    // Default to out of stock if we can't determine
    return {
        inStock: false,
        status: 'unknown',
        message: 'Status Unknown',
        timestamp,
        price: product.price,
        title: productTitle || product.name,
        description: productDescription || 'Product description not available'
    };
}

// Extract price from HTML
function extractPrice(html) {
    const priceRegex = /\$[\d,]+\.?\d*/g;
    const matches = html.match(priceRegex);
    return matches ? matches[0] : null;
}

// Extract product title from HTML
function extractProductTitle(html) {
    try {
        // Try multiple selectors for product title
        const titleSelectors = [
            /<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)<\/h1>/i,
            /<h1[^>]*>([^<]+)<\/h1>/i,
            /<title[^>]*>([^<]+)<\/title>/i,
            /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i
        ];
        
        for (const selector of titleSelectors) {
            const match = html.match(selector);
            if (match && match[1]) {
                let title = match[1].trim();
                // Clean up the title
                title = title.replace(/&amp;/g, '&')
                           .replace(/&lt;/g, '<')
                           .replace(/&gt;/g, '>')
                           .replace(/&quot;/g, '"')
                           .replace(/&#39;/g, "'");
                return title;
            }
        }
    } catch (error) {
        console.warn('Error extracting product title:', error.message);
    }
    return null;
}

// Extract product description from HTML
function extractProductDescription(html) {
    try {
        // Try multiple selectors for product description
        const descriptionSelectors = [
            /<div[^>]*class="[^"]*product-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<p[^>]*class="[^"]*product-description[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
            /<meta[^>]*name="description"[^>]*content="([^"]+)"/i,
            /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i
        ];
        
        for (const selector of descriptionSelectors) {
            const match = html.match(selector);
            if (match && match[1]) {
                let description = match[1].trim();
                // Clean up HTML tags and entities
                description = description.replace(/<[^>]*>/g, ' ')
                                       .replace(/&amp;/g, '&')
                                       .replace(/&lt;/g, '<')
                                       .replace(/&gt;/g, '>')
                                       .replace(/&quot;/g, '"')
                                       .replace(/&#39;/g, "'")
                                       .replace(/\s+/g, ' ')
                                       .trim();
                
                // Limit description length
                if (description.length > 200) {
                    description = description.substring(0, 200) + '...';
                }
                
                return description;
            }
        }
    } catch (error) {
        console.warn('Error extracting product description:', error.message);
    }
    return null;
}

// Get previous status from file
async function getPreviousStatus(productId) {
    try {
        if (fs.existsSync(CONFIG.statusFile)) {
            const data = fs.readFileSync(CONFIG.statusFile, 'utf8');
            const statuses = JSON.parse(data);
            return statuses[productId];
        }
    } catch (error) {
        console.warn('Could not read previous status:', error.message);
    }
    return null;
}

// Save current status to file
async function saveStatus(productId, status) {
    try {
        let statuses = {};
        
        if (fs.existsSync(CONFIG.statusFile)) {
            const data = fs.readFileSync(CONFIG.statusFile, 'utf8');
            statuses = JSON.parse(data);
        }
        
        statuses[productId] = status;
        
        fs.writeFileSync(CONFIG.statusFile, JSON.stringify(statuses, null, 2));
        console.log(`Status saved for ${productId}`);
        
    } catch (error) {
        console.error('Error saving status:', error);
    }
}

// Send email notification
async function sendNotification(product, stockStatus) {
    if (!CONFIG.email.user || !CONFIG.email.pass || !CONFIG.email.to) {
        console.log('Email not configured, skipping notification');
        return;
    }
    
    try {
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransporter({
            service: CONFIG.email.service,
            auth: {
                user: CONFIG.email.user,
                pass: CONFIG.email.pass
            }
        });
        
        const mailOptions = {
            from: CONFIG.email.user,
            to: CONFIG.email.to,
            subject: `🎉 ${product.name} is BACK IN STOCK!`,
            html: `
                <h2>Great news! Your monitored item is back in stock!</h2>
                <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>${product.name}</h3>
                    <p><strong>Price:</strong> ${stockStatus.price}</p>
                    <p><strong>Store:</strong> ${product.store}</p>
                    <p><strong>Status:</strong> ${stockStatus.message}</p>
                    <p><strong>Checked at:</strong> ${new Date(stockStatus.timestamp).toLocaleString()}</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${product.url}" 
                       style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Buy Now on ${product.store}
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                    This notification was sent by your Akaza Figure Stock Monitor.
                </p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log('✅ Notification email sent successfully');
        
    } catch (error) {
        console.error('❌ Error sending notification:', error);
    }
}

// Run the monitor if this script is executed directly
if (require.main === module) {
    monitorStock();
}

module.exports = {
    monitorStock,
    checkProductStock,
    parseStockStatus
};
