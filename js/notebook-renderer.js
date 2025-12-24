class NotebookRenderer {
    constructor(options = {}) {
        this.marked = options.marked || window.marked;
        this.hljs = options.hljs || window.hljs;
        this.container = null;
    }

    /**
     * Loads a notebook from a URL and renders it.
     * @param {string} url - The URL of the .ipynb file.
     * @param {HTMLElement} container - The DOM element to render into.
     */
    async loadAndRender(url, container) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load notebook: ${response.statusText}`);
            const data = await response.json();
            this.render(data, container);
        } catch (error) {
            console.error('Notebook load error:', error);
            this.renderError(container, error);
        }
    }

    render(notebookData, container) {
        this.container = container;
        this.container.innerHTML = '';

        let markdownBuffer = [];
        let executionCount = 1;

        notebookData.cells.forEach((cell, index) => {
            if (cell.cell_type === 'markdown') {
                const nextCell = notebookData.cells[index + 1];
                const nextIsCode = nextCell && nextCell.cell_type === 'code';

                if (nextIsCode) {
                    markdownBuffer.push(cell.source.join(''));
                } else {
                    // Render purely markdown row if not followed by code
                    // If buffer consists of previous markdown content intended for code, 
                    // this condition shouldn't theoretically happen in valid "alternating" notebooks 
                    // unless a markdown block is interrupted. 
                    // However, we treat the current cell as standalone.

                    // If there was something in the buffer (which means it was expecting code),
                    // but we encountered another markdown cell that ISN'T followed by code...
                    // Wait, if it WAS in the buffer, it means the Previous cell saw "Next is Code".
                    // That contradicts "Current cell is Markdown".
                    // If Previous was Markdown, and it saw "Next is Code", then Current MUST be Code.
                    // So we cannot have a buffer here.

                    markdownBuffer.push(cell.source.join(''));
                    const row = this.createRow(markdownBuffer.join('\n\n'), null, null);
                    this.container.appendChild(row);
                    markdownBuffer = [];
                }
            } else if (cell.cell_type === 'code') {
                const row = this.createRow(markdownBuffer.join('\n\n'), cell, cell.execution_count || executionCount++);
                this.container.appendChild(row);
                markdownBuffer = [];
            }
        });

        // Handle trailing markdown
        if (markdownBuffer.length > 0) {
            const row = this.createRow(markdownBuffer.join('\n\n'), null, null);
            this.container.appendChild(row);
        }

        // Initialize syntax highlighting
        if (this.hljs) {
            this.container.querySelectorAll('pre code').forEach((block) => {
                this.hljs.highlightElement(block);
            });
        }

        // Initialize LaTeX rendering
        if (window.renderMathInElement) {
            window.renderMathInElement(this.container, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false }
                ],
                throwOnError: false
            });
        }

        // Initialize intersection observer for animations
        this.initAnimations();
    }

    createRow(markdownText, codeCell, executionCount) {
        const row = document.createElement('div');
        row.className = 'notebook-row';

        // Left Column: Explanation
        const explanationCol = document.createElement('div');
        explanationCol.className = 'notebook-explanation';
        if (markdownText && markdownText.trim() !== '') {
            explanationCol.innerHTML = this.renderMarkdown(markdownText);
        }

        // Right Column: Code & Output
        const codeCol = document.createElement('div');
        codeCol.className = 'notebook-code-col';

        if (codeCell) {
            // Code Input Block
            const inputBlock = document.createElement('div');
            inputBlock.className = 'code-input-wrapper';

            // Header with language and actions
            const header = document.createElement('div');
            header.className = 'code-header';
            header.innerHTML = `
                <span class="execution-count">In [${executionCount || ' '}]:</span>
                <div class="code-actions">
                    <span class="lang-tag">PYTHON</span>
                    <button class="copy-btn" title="Copy code">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
            `;

            const codeContent = codeCell.source.join('');

            const pre = document.createElement('pre');
            pre.className = 'code-block';
            const code = document.createElement('code');
            code.className = 'language-python';
            code.textContent = codeContent; // specific textContent to avoid HTML injection

            pre.appendChild(code);
            inputBlock.appendChild(header);
            inputBlock.appendChild(pre);
            codeCol.appendChild(inputBlock);

            // Add Copy functionality
            const copyBtn = header.querySelector('.copy-btn');
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(codeContent).then(() => {
                    copyBtn.classList.add('copied');
                    setTimeout(() => copyBtn.classList.remove('copied'), 2000);
                });
            });

            // Outputs
            if (codeCell.outputs && codeCell.outputs.length > 0) {
                const outputBlock = document.createElement('div');
                outputBlock.className = 'code-output-wrapper';

                // Output Header (optional, maybe just visual separation)
                const outHeader = document.createElement('div');
                outHeader.className = 'output-header';
                outHeader.innerHTML = `<span class="execution-count">Out [${executionCount || ' '}]:</span>`;
                outputBlock.appendChild(outHeader);

                const outputContent = document.createElement('div');
                outputContent.className = 'output-content';

                let hasOutput = false;
                codeCell.outputs.forEach(output => {
                    const rendered = this.renderOutput(output);
                    if (rendered) {
                        outputContent.appendChild(rendered);
                        hasOutput = true;
                    }
                });

                if (hasOutput) {
                    outputBlock.appendChild(outputContent);
                    codeCol.appendChild(outputBlock);
                }
            }
        } else {
            codeCol.style.display = 'none';
            row.style.gridTemplateColumns = '1fr';
        }

        row.appendChild(explanationCol);
        row.appendChild(codeCol);

        // Dynamic height matching: If there is an explanation, make code scrollable after its height passes explanation
        if (codeCell && markdownText && markdownText.trim() !== '') {
            const inputBlock = codeCol.querySelector('.code-input-wrapper');

            // Use ResizeObserver to keep heights in sync
            const ro = new ResizeObserver(entries => {
                for (let entry of entries) {
                    const height = entry.contentRect.height;
                    // Ensure at least 500px of code is visible, or match explanation height if it's larger
                    inputBlock.style.maxHeight = `${Math.max(500, height)}px`;
                }
            });
            ro.observe(explanationCol);
        }

        return row;
    }

    renderOutput(output) {
        const div = document.createElement('div');
        div.className = 'output-item';

        if (output.output_type === 'stream') {
            const pre = document.createElement('pre');
            pre.className = 'output-stream';
            pre.textContent = output.text.join('');
            div.appendChild(pre);
            return div;
        }

        if (output.output_type === 'execute_result' || output.output_type === 'display_data') {
            const data = output.data;

            // Image
            if (data['image/png']) {
                const img = document.createElement('img');
                img.src = 'data:image/png;base64,' + data['image/png'].replace(/\n/g, '');
                div.appendChild(img);
                return div;
            }

            // SVG
            if (data['image/svg+xml']) {
                div.innerHTML = Array.isArray(data['image/svg+xml']) ? data['image/svg+xml'].join('') : data['image/svg+xml'];
                return div;
            }

            // HTML (e.g. Pandas DataFrame)
            if (data['text/html']) {
                const htmlContent = Array.isArray(data['text/html']) ? data['text/html'].join('') : data['text/html'];
                const iframe = document.createElement('div'); // Using div instead of iframe for better cohesion if styles permit
                iframe.className = 'output-html';
                iframe.innerHTML = htmlContent;
                div.appendChild(iframe);
                return div;
            }

            // Plain Text fallback
            if (data['text/plain']) {
                const pre = document.createElement('pre');
                pre.className = 'output-text';
                pre.textContent = Array.isArray(data['text/plain']) ? data['text/plain'].join('') : data['text/plain'];
                div.appendChild(pre);
                return div;
            }
        }

        if (output.output_type === 'error') {
            const pre = document.createElement('pre');
            pre.className = 'output-error';
            // ANSI handling could be added here, but for now raw text
            pre.textContent = `${output.ename}: ${output.evalue}\n${output.traceback.join('\n')}`;
            div.appendChild(pre);
            return div;
        }

        return null;
    }

    renderError(container, error) {
        container.innerHTML = `
            <div class="notebook-error">
                <h3>Error loading notebook</h3>
                <p>${error.message}</p>
                <p class="hint">Ensure local server is running and path is correct.</p>
            </div>
        `;
    }

    renderMarkdown(text) {
        if (!this.marked) return text;

        const mathBlocks = [];
        let placeholderCounter = 0;

        // Protect display math: $$...$$
        let processedText = text.replace(/\$\$([\s\S]+?)\$\$/g, (match) => {
            const placeholder = `@@MATH_P_${placeholderCounter++}@@`;
            mathBlocks.push({ placeholder, original: match });
            return placeholder;
        });

        // Protect inline math: $...$
        processedText = processedText.replace(/(?<!\\)\$([^\$\n]+?)(?<!\\)\$/g, (match) => {
            const placeholder = `@@MATH_P_${placeholderCounter++}@@`;
            mathBlocks.push({ placeholder, original: match });
            return placeholder;
        });

        // Parse with marked
        let html = this.marked.parse(processedText);

        // Restore protected math blocks
        mathBlocks.forEach(({ placeholder, original }) => {
            // Use split/join for global replacement without regex issues
            html = html.split(placeholder).join(original);
        });

        return html;
    }

    initAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        }, { threshold: 0.1 });

        this.container.querySelectorAll('.notebook-row').forEach(row => {
            observer.observe(row);
        });
    }
}
