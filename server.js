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
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Necessary for some environments
        });
        const page = await browser.newPage();

        // Spoof headers to bypass restrictions
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
            'Referer': 'https://poki.com',
        });

        // Navigate to the target URL
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        // Get the rendered HTML
        let content = await page.content();

        // Replace Poki references in content
        content = content.replace(/https:\/\/poki\.com/g, req.protocol + '://' + req.get('host'));

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
