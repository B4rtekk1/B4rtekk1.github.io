document.addEventListener('DOMContentLoaded', () => {
    const loader = document.querySelector('.loader-wrapper');
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 500);
    });
    const cursor = document.querySelector('.cursor-glow');

    document.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;

        requestAnimationFrame(() => {
            cursor.style.left = `${x}px`;
            cursor.style.top = `${y}px`;
        });
    });

    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + "%";
    });

    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) {
        const processNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                const fragment = document.createDocumentFragment();

                // Split by words and spaces to preserve word boundaries
                const words = text.split(/(\s+)/);

                words.forEach((word) => {
                    if (word === '') return;

                    // Create a wrapper for each word to prevent line breaks mid-word
                    const wordWrapper = document.createElement('span');
                    wordWrapper.style.display = 'inline-block';
                    wordWrapper.style.whiteSpace = 'nowrap';

                    word.split('').forEach((char) => {
                        const span = document.createElement('span');
                        span.innerText = char === ' ' ? '\u00A0' : char;
                        span.className = 'char';
                        wordWrapper.appendChild(span);
                    });

                    fragment.appendChild(wordWrapper);
                });

                node.parentNode.replaceChild(fragment, node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                Array.from(node.childNodes).forEach(processNode);
            }
        };

        Array.from(heroTitle.childNodes).forEach(processNode);

        const allChars = heroTitle.querySelectorAll('.char');
        allChars.forEach((char, i) => {
            char.style.transitionDelay = `${i * 0.03}s`;
        });
    }

    const interactables = document.querySelectorAll('a, button, .project-card, .skill-category, .contact-item, .tech-item');
    interactables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.width = '800px';
            cursor.style.height = '800px';
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.width = '600px';
            cursor.style.height = '600px';
        });
    });

    const magneticElements = document.querySelectorAll('.magnetic');

    magneticElements.forEach(el => {
        el.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            this.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
        });

        el.addEventListener('mouseleave', function () {
            this.style.transform = `translate(0px, 0px)`;
        });
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.appendChild(canvas);
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '-1';
        canvas.style.opacity = '0.3';

        let particles = [];
        const particleCount = 60;

        function resize() {
            canvas.width = hero.offsetWidth;
            canvas.height = hero.offsetHeight;
        }

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = '#3b82f6';
                ctx.fill();
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, i) => {
                p.update();
                p.draw();

                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 * (1 - dist / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });
            requestAnimationFrame(animate);
        }
        animate();
    }
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
        });
    });

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-up, .reveal-text');
    animatedElements.forEach(el => observer.observe(el));

    const navbar = document.querySelector('.navbar');
    const backToTop = document.getElementById('back-to-top');
    const navLinksContainer = document.querySelector('.nav-links');
    const menuToggle = document.getElementById('mobile-menu');
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('section');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinksContainer.classList.toggle('active');
            document.body.style.overflow = navLinksContainer.classList.contains('active') ? 'hidden' : 'initial';
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navLinksContainer.classList.remove('active');
            document.body.style.overflow = 'initial';
        });
    });

    const highlightNav = () => {
        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 150)) {
                currentSection = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').slice(1) === currentSection) {
                item.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.padding = '0.8rem 0';
            navbar.style.background = 'rgba(5, 5, 5, 0.8)';
            navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.padding = '1.5rem 0';
            navbar.style.background = 'rgba(5, 5, 5, 0.4)';
            navbar.style.boxShadow = 'none';
        }

        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }

        highlightNav();
    });

    highlightNav();

    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    const staggeredGrids = ['.work-grid', '.ioai-grid', '.skills-grid', '.contact-links', '.tech-grid'];
    staggeredGrids.forEach(gridSelector => {
        const container = document.querySelector(gridSelector);
        if (container) {
            const children = container.children;
            Array.from(children).forEach((child, index) => {
                child.style.transitionDelay = `${index * 0.1}s`;
            });
        }
    });

    // Tab Switching Logic
    const initTabs = (navSelector, contentSelector, btnClass, paneClass, dataAttr) => {
        const nav = document.querySelector(navSelector);
        if (!nav) return;

        const btns = nav.querySelectorAll(`.${btnClass}`);
        const panes = document.querySelectorAll(contentSelector);

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute(dataAttr);

                // Update buttons
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update panes
                panes.forEach(pane => {
                    pane.classList.remove('active');
                    if (pane.id === target) {
                        pane.classList.add('active');
                    }
                });
            });
        });
    };

    initTabs('#ioai-tabs-nav', '.tab-pane', 'tab-btn', 'tab-pane', 'data-tab');
    initTabs('#ioai-2025-subtabs-nav', '.subtab-pane', 'subtab-btn', 'subtab-pane', 'data-subtab');
});
