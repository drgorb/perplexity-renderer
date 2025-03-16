const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

describe('Chrome Extension', () => {
    let browser;
    let page;
    let tempDir;
    let extensionId;

    beforeAll(async () => {
        console.log("starting beforeAll");
        // Create a directory with a timestamp in the root of the project
        const timestamp = Date.now();
        tempDir = path.resolve(__dirname, `../extension-${timestamp}`);
        fs.mkdirSync(tempDir);

        // Copy the necessary files and directories to the temporary directory
        const filesToCopy = ['icons', 'manifest.json', 'popup.html', 'styles.css'];
        filesToCopy.forEach(file => {
            const src = path.resolve(__dirname, `../${file}`);
            const dest = path.join(tempDir, file);
            if (fs.lstatSync(src).isDirectory()) {
                fs.cpSync(src, dest, { recursive: true });
            } else {
                fs.copyFileSync(src, dest);
            }
            console.log(`Copied ${file} to ${dest}`);
        });

        // Copy the contents of the dist directory
        const distDir = path.resolve(__dirname, '../dist');
        fs.readdirSync(distDir).forEach(file => {
            const src = path.join(distDir, file);
            const dest = path.join(tempDir, file);
            fs.copyFileSync(src, dest);
            console.log(`Copied ${file} to ${dest}`);
        });

        console.log('Launching browser...');
        browser = await puppeteer.launch({
            headless: false,
            args: [
                `--disable-extensions-except=${tempDir}`,
                `--load-extension=${tempDir}`
            ]
        });

        page = await browser.newPage();
        // Capture console messages from the browser context
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        // Get the extension ID by parsing the chrome://extensions/ page
        await page.goto('chrome://extensions/');
        // Add a delay to ensure the extension has enough time to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        extensionId = await page.evaluate(async () => {
            console.log("looking for extension ID");
            const extensionName = 'PerplexityRenderer';
            const extensionsManager = document.querySelector('extensions-manager');
            if (!extensionsManager) {
                console.log('extensions-manager not found');
                return null;
            }
            let shadowRoot = extensionsManager.shadowRoot;
            if (!shadowRoot) {
                console.log('shadowRoot not found');
                return null;
            }
            const extensionsItemList = shadowRoot.querySelector('extensions-item-list');
            if (!extensionsItemList) {
                console.log('extensions-item-list not found');
                return null;
            }
            shadowRoot = extensionsItemList.shadowRoot;
            const element = shadowRoot.querySelector('extensions-item');
            console.log(`found ${element}`);
            return element ? element.getAttribute('id') : null;
        });

        if (!extensionId) {
            throw new Error('Extension ID not found');
        } else {
            console.log(`extension id ${extensionId}`)
        }
    }, 20000); // Timeout set to 20 seconds

    afterAll(async () => {
        if (browser) {
            console.log('Closing browser...');
            await browser.close();
        }
        // Clean up the temporary directory
        fs.rmSync(tempDir, { recursive: true });
    });

    it('should load popup.html and execute popup.bundle.js without errors', async () => {
        const consoleMessages = [];
        page.on('console', msg => consoleMessages.push(msg.text()));

        console.log('Opening extension popup...');
        await page.goto(`chrome-extension://${extensionId}/popup.html`);

        // Wait for the popup to be fully loaded
        await page.waitForSelector('body', { visible: true });

        console.log('Checking console messages...');
        consoleMessages.forEach(msg => console.log('Console message:', msg));
        expect(consoleMessages).not.toContain(expect.stringContaining('Failed to load popup.bundle.js'));

        // Additional logging to check if popup.html is loaded correctly
        const content = await page.content();
        console.log('Popup content:', content);
    }, 60000);
});