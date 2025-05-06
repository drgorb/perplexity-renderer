import {marked} from 'marked';

document.addEventListener('DOMContentLoaded', async () => {
    const renderBtn = document.getElementById('renderBtn');
    const output = document.getElementById('output');

    // Function to handle clipboard processing
    async function processClipboardContent(html = true) {
        try {
            const clipboardText = await navigator.clipboard.readText();
            const sanitizedText = clipboardText.replace(/\[\d+\]/g, ''); // Strip numbers in brackets
            let blob;
            let blobType;
            if (html) {
                const renderedHtml = await marked(sanitizedText); // Parse Markdown to HTML
                output.innerHTML = renderedHtml;
                // Prepare HTML for clipboard
                blobType = 'text/html';
                blob = new Blob([renderedHtml], {type: 'text/html'});
            } else {
                blobType = 'text/plain';
                blob = new Blob([sanitizedText], {type: 'text/plain'});
            }
            const clipboardItem = new ClipboardItem({[blobType]: blob});
            await navigator.clipboard.write([clipboardItem]);
        } catch (err) {
            console.error('Failed to process clipboard contents:', err);
        }
    }

    // Add event listener for re-rendering
    renderBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        await processClipboardContent(true);
        // window.close()
    });

    const copyMarkdownBtn = document.getElementById('copyMarkdownBtn');

    copyMarkdownBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        await processClipboardContent(false);
        window.close()
    });
});