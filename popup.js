import { marked } from 'marked';

document.addEventListener('DOMContentLoaded', async () => {
    const renderBtn = document.getElementById('renderBtn');
    const copyHtmlBtn = document.getElementById('copyHtml');
    const output = document.getElementById('output');

    event.preventDefault(); // Prevent the default form submission behavior
    try {
        let text = await navigator.clipboard.readText();
        text = text.replace(/\[\d+\]/g, ''); // Replace numbers between square brackets with blank
        const html = marked(text);
        output.innerHTML = html;
        const blob = new Blob([output.innerHTML], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({ 'text/html': blob });
        await navigator.clipboard.write([clipboardItem]);
    } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
    }

    renderBtn.addEventListener('click', async (event) => {
        event.preventDefault(); // Prevent the default form submission behavior
        try {
            let text = await navigator.clipboard.readText();
            text = text.replace(/\[\d+\]/g, ''); // Replace numbers between square brackets with blank
            const html = marked(text);
            output.innerHTML = html;
            const blob = new Blob([output.innerHTML], { type: 'text/html' });
            const clipboardItem = new ClipboardItem({ 'text/html': blob });
            await navigator.clipboard.write([clipboardItem]);
        } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
        }
    });

});