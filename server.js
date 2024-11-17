const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();

// Serve the index.html at the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Puppeteer Proxy with header spoofing
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URL parameter is required.');
    }

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Necessary for some environments
        });
        const page = await browser.newPage();

        // Set spoofed headers to look like the request is coming from Poki
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            request.continue({
                headers: {
                    ...request.headers(),
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': 'https://poki.com/',
                },
            });
        });

        // Navigate to the target URL
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        // Get the rendered HTML
        const content = await page.content();

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
