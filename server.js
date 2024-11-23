const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();

// Serve the index.html at the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Puppeteer Proxy with header spoofing and cookie setting
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

        // Set Poki-specific cookies if the target URL is Poki
        if (targetUrl.includes('poki.com')) {
            const pokiCookies = [
                {
                    name: 'poki_experiments',
                    value: '%7B%22currentAB%22%3A%22c-87965a9f%22%2C%22activeTests%22%3A%5B%221482e0d9%22%2C%222316fb42%22%2C%2246f40048%22%2C%2275cf7192%22%2C%227b494404%22%2C%2287965a9f%22%2C%228d1608d2%22%2C%22959a0db8%22%2C%22a33ffd62%22%2C%22be7bb646%22%5D%7D',
                    domain: 'poki.com',
                    path: '/',
                    expires: new Date('2025-05-22T16:56:29Z').getTime() / 1000,
                    httpOnly: false,
                    secure: true,
                    sameSite: 'Lax',
                },
                {
                    name: 'poki_uid',
                    value: 'Z0JPjRcRUgW0tPQrl4NR0g',
                    domain: 'poki.com',
                    path: '/',
                    expires: new Date('2025-05-22T16:56:29Z').getTime() / 1000,
                    httpOnly: false,
                    secure: false,
                    sameSite: 'Lax',
                },
                {
                    name: 'poki_uid_new',
                    value: '1',
                    domain: 'poki.com',
                    path: '/',
                    expires: new Date('2025-05-22T16:56:29Z').getTime() / 1000,
                    httpOnly: false,
                    secure: false,
                    sameSite: 'Lax',
                },
                {
                    name: 'poki_uid_version',
                    value: '1',
                    domain: 'poki.com',
                    path: '/',
                    expires: new Date('2025-05-22T16:56:29Z').getTime() / 1000,
                    httpOnly: false,
                    secure: false,
                    sameSite: 'Lax',
                },
                {
                    name: 'poki_uid_ttl',
                    value: '15552000',
                    domain: 'poki.com',
                    path: '/',
                    expires: new Date('2025-05-22T16:56:29Z').getTime() / 1000,
                    httpOnly: false,
                    secure: false,
                    sameSite: 'Lax',
                },
                {
                    name: 'poki_session',
                    value: '{"id":"Z0JPjRlmairFa0axO6I65g","expire":1732400789534,"tab_id":"Z0JPjX3LnKa8o0cQPNmw2A","depth":1,"count":1,"page":{"path":"/","type":"home","id":0,"start":1732398989256,"pageview_id":"Z0JPjeZJHsHXvuNDzBOm4Q"},"previous_page":{},"landing_page":{"path":"/","type":"home","id":0,"start":1732398989256,"pageview_id":"Z0JPjeZJHsHXvuNDzBOm4Q"},"referrer_domain":""}',
                    domain: 'poki.com',
                    path: '/',
                    expires: new Date('2025-05-22T16:56:29Z').getTime() / 1000,
                    httpOnly: false,
                    secure: false,
                    sameSite: 'Lax',
                },
            ];
            await page.setCookie(...pokiCookies);
        }

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
