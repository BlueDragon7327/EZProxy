const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();

// Serve the index.html at the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Puppeteer Proxy
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URL parameter is required.');
    }

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // Intercept and modify requests
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (request.isNavigationRequest() && request.url().includes('poki.com')) {
                request.continue({
                    headers: {
                        ...request.headers(),
                        referer: 'https://poki.com',
                    },
                });
            } else {
                request.continue();
            }
        });

        // Spoof `window.location` and other properties
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(window, 'location', {
                get: () => ({
                    href: 'https://poki.com',
                    origin: 'https://poki.com',
                    protocol: 'https:',
                    host: 'poki.com',
                    hostname: 'poki.com',
                    pathname: '/',
                    search: '',
                    hash: '',
                }),
            });
        });

        // Navigate to the target URL
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        // Get the rendered HTML
        let content = await page.content();

        // Replace any instances of 'poki.com' with the proxy URL in content
        content = content.replace(/https:\/\/poki\.com/g, req.protocol + '://' + req.get('host') + '/proxy?url=https://poki.com');

        await browser.close();

        res.send(content);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error loading the URL.');
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
