$(document).ready(function() {
    $('#nav-toggle').click(function(e) {
        e.preventDefault();
        $(this).toggleClass('active');
        $('.nav-list').slideToggle(300);
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const contentDiv = document.getElementById("content");

    fetch("assets/code/linear.py")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Nie udało się wczytać pliku linear.py");
            }
            return response.text();
        })
        .then((pythonCode) => {
            const pre = document.createElement("pre");
            const code = document.createElement("code");
            code.className = "language-python";
            code.textContent = pythonCode;
            pre.appendChild(code);
            contentDiv.appendChild(pre);
            hljs.highlightElement(code);
        })
        .catch((error) => {
            contentDiv.textContent = "Nie udało się załadować pliku linear.py: " + error.message;
            console.error(error);
        });
});