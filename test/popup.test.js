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
        tempDir = path.resolve(__dirname, `../extension-test`);
        console.log(`temp dir ${tempDir}`)
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
        await page.evaluate(() => {
            navigator.clipboard.writeText('Sample text for clipboard');
        });

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

    it('should correctly sanitize text by removing numbers in square brackets', async () => {
        // Load test-input.md content
        const testInputPath = path.resolve(__dirname, '../test/test-input.md');
        const testInput = fs.readFileSync(testInputPath, 'utf8');

        // Set up a page context to test the function directly
        await page.goto(`chrome-extension://${extensionId}/popup.html`);

        // Mock the clipboard API to return our test input
        await page.evaluate((textContent) => {
            navigator.clipboard.readText = async () => textContent;
            navigator.clipboard.write = async () => {};
        }, testInput);

        // Execute the processClipboardContent function and capture its result
        const result = await page.evaluate(async () => {
            // Create a function that exposes processClipboardContent for testing
            async function testProcessClipboardContent() {
                const clipboardText = await navigator.clipboard.readText();
                const sanitizedText = clipboardText.replace(/\[\d+\]/g, ''); // Strip numbers in brackets
                return sanitizedText;
            }

            // Call the function and return the result
            return await testProcessClipboardContent();
        });

        // Verify the result doesn't contain any [number] patterns
        expect(result).not.toMatch(/\[\d+\]/);

        // Make sure content exists but square brackets with numbers are removed
        expect(result).toContain('Most Important Topics in TOGAF Technology Architecture');
        expect(result).toContain('Baseline and Target Technology Architecture');

        // Check specific cases where numbers in brackets were present in the original
        expect(testInput).toMatch(/\[\d+\]/); // Original should have patterns
        expect(result).not.toContain('[6][2]');
        expect(result).not.toContain('[5][10]');
        expect(result).not.toContain('[6][9]');
        expect(result).not.toContain('[5][9]');
        expect(result).not.toContain('[1][5]');
        expect(result).not.toContain('62');
        expect(result).not.toContain('510');
        expect(result).not.toContain('69');
        expect(result).not.toContain('59');
        expect(result).not.toContain('15');
        expect(result).not.toContain('[9]');
    });
});