// Service Worker for website blocking functionality
const CACHE_NAME = 'pomotron-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  // Add other assets to cache
];

let isBlocking = false;
let blockedSites = [];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - handle website blocking
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only block HTTP/HTTPS requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Check if blocking is active and site is blocked
  if (isBlocking && isBlockedSite(url.hostname)) {
    event.respondWith(
      new Response(generateBlockedPageHTML(url.hostname), {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      })
    );
    return;
  }
  
  // Default fetch behavior
  event.respondWith(fetch(event.request));
});

// Message handler
self.addEventListener('message', (event) => {
  const { type, sites } = event.data;
  
  switch (type) {
    case 'ACTIVATE_BLOCKING':
      isBlocking = true;
      blockedSites = sites || [];
      console.log('Service Worker: Blocking activated for', blockedSites);
      break;
      
    case 'DEACTIVATE_BLOCKING':
      isBlocking = false;
      blockedSites = [];
      console.log('Service Worker: Blocking deactivated');
      break;
  }
});

// Helper function to check if a site is blocked
function isBlockedSite(hostname) {
  const normalizedHostname = hostname.toLowerCase().replace(/^www\./, '');
  return blockedSites.some(site => {
    const normalizedSite = site.toLowerCase().replace(/^www\./, '');
    return normalizedHostname === normalizedSite || normalizedHostname.endsWith('.' + normalizedSite);
  });
}

// Generate blocked page HTML
function generateBlockedPageHTML(hostname) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Focus Mode Active - Pomotron</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #0F0F23 0%, #1A1B3A 50%, #2D2D44 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 20px;
        }
        
        .container {
          max-width: 500px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 2px solid #FF6B9D;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 0 30px rgba(255, 107, 157, 0.3);
        }
        
        .logo {
          font-family: 'Orbitron', monospace;
          font-size: 2rem;
          font-weight: bold;
          color: #FF6B9D;
          text-shadow: 0 0 10px #FF6B9D;
          margin-bottom: 20px;
        }
        
        .blocked-site {
          background: rgba(255, 107, 157, 0.2);
          padding: 10px 20px;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: bold;
          color: #FFB347;
        }
        
        .message {
          margin: 20px 0;
          line-height: 1.6;
        }
        
        .btn {
          background: linear-gradient(135deg, #FF6B9D, #8B5FBF);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          margin: 10px;
          transition: all 0.3s ease;
        }
        
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(255, 107, 157, 0.5);
        }
        
        .motivational {
          margin-top: 30px;
          font-style: italic;
          color: #4ECDC4;
          opacity: 0.8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">POMOTRON</div>
        <h1>🎯 Focus Mode Active</h1>
        
        <div class="blocked-site">${hostname}</div>
        
        <div class="message">
          <p>This website is blocked during your focus session.</p>
          <p>Stay on track and achieve your goals!</p>
        </div>
        
        <a href="/" class="btn">Return to Pomotron</a>
        
        <div class="motivational">
          "The successful warrior is the average man with laser-like focus."<br>
          — Bruce Lee
        </div>
      </div>
    </body>
    </html>
  `;
}
