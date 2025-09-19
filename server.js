// Simple local development server with live reload
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Handle API routes
    if (req.url === '/api/check-status' && req.method === 'POST') {
        handleStatusCheck(req, res);
        return;
    }
    
    // Handle live reload script
    if (req.url === '/livereload.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(`
            (function() {
                const ws = new WebSocket('ws://localhost:3001');
                ws.onmessage = function(event) {
                    if (event.data === 'reload') {
                        window.location.reload();
                    }
                };
                ws.onclose = function() {
                    // Reconnect after 1 second
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                };
            })();
        `);
        return;
    }
    
    // Handle static files
    let filePath = '.' + req.url;
    
    // Default to index.html for root path
    if (filePath === './') {
        filePath = './index.html';
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <head><title>404 - Not Found</title></head>
                        <body>
                            <h1>404 - File Not Found</h1>
                            <p>The requested file was not found on this server.</p>
                            <a href="/">Go back to home</a>
                        </body>
                    </html>
                `);
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Inject live reload script for HTML files
            if (mimeType === 'text/html') {
                content = content.toString();
                content = content.replace('</body>', 
                    '<script src="/livereload.js"></script></body>');
            }
            
            // Success
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
});

// Handle status check API endpoint
function handleStatusCheck(req, res) {
    let body = '';
    
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', async () => {
        try {
            // Import and run the monitor
            const { monitorStock } = require('./monitor.js');
            
            console.log('🔍 Manual status check requested via API');
            await monitorStock();
            
            // Read the updated status
            const statusData = fs.readFileSync('./status.json', 'utf8');
            const status = JSON.parse(statusData);
            
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            });
            res.end(JSON.stringify({
                success: true,
                status: status,
                timestamp: new Date().toISOString()
            }));
            
        } catch (error) {
            console.error('Error in status check API:', error);
            res.writeHead(500, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    });
}

// WebSocket server for live reload
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3001 });

// File watcher for live reload
const chokidar = require('chokidar');

// Watch for file changes
const watcher = chokidar.watch(['./*.html', './*.css', './*.js'], {
    ignored: /node_modules/,
    persistent: true
});

watcher.on('change', (path) => {
    console.log(`📝 File changed: ${path}`);
    // Notify all connected clients to reload
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send('reload');
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Local server running at http://localhost:${PORT}`);
    console.log(`🔄 Live reload enabled - changes will auto-refresh the page`);
    console.log(`📱 Open your browser and navigate to the URL above`);
    console.log(`🛑 Press Ctrl+C to stop the server`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    watcher.close();
    wss.close();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
