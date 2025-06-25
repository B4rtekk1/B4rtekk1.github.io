$(document).ready(function() {
    $('#nav-toggle').click(function(e) {
        e.preventDefault();
        $(this).toggleClass('active');
        $('.nav-list').slideToggle(300);
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const contentDiv = document.getElementById("content");

    fetch("mnist_imports.md")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to load mnist.md");
            }
            return response.text();
        })
        .then((markdown) => {
            const htmlContent = marked.parse(markdown, {
                highlight: (code, lang) => {
                    const validLanguage = hljs.getLanguage(lang) ? lang : 'plaintext';
                    return hljs.highlight(code, { language: validLanguage }).value;
                },
            });

            contentDiv.innerHTML = htmlContent;

            document.querySelectorAll("pre code").forEach((block) => {
                hljs.highlightElement(block);
            });
        })
        .catch((error) => {
            contentDiv.textContent = "Nie udało się załadować pliku mnist.md.";
            console.error(error);
        });
});
