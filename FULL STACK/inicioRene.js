// Archivo: inicioRene.js

// ==================================================
// ===== FUNCIÓN CORE: ACTUALIZA EL HEADER DE SESIÓN (CORREGIDA) =====
// ==================================================
/**
 * Revisa la sesión en el servidor y actualiza el botón "Iniciar Sesión" 
 * a "Mi Portal (Nombre del Usuario)" y muestra el botón "Cerrar Sesión".
 */
async function actualizarEstadoHeader() {
    const sesionLink = document.getElementById('sesion-link');
    const logoutLi = document.getElementById('logout-li');
    const logoutLink = document.getElementById('logout-link');

    if (!sesionLink || !logoutLi || !logoutLink) {
        console.error('Elementos de sesión no encontrados en el DOM.');
        return;
    }

    try {
        // Consultar al servidor si hay sesión activa (Usa la ruta correcta: /api/session)
        const response = await fetch('/api/session');

        if (response.ok) {
            // --- USUARIO LOGUEADO ---
            const user = await response.json();
            const nombreCorto = user.nombre.split(' ')[0]; // Primer nombre
            
            sesionLink.textContent = `Mi Portal (${nombreCorto})`;
            sesionLink.href = '/sistemaRene.html';
            logoutLi.style.display = 'block';

            // Configurar el botón de cerrar sesión (Ahora usa la API del servidor)
            // Usamos removeEventListener y addEventListener para actualizar el evento si la página se re-inicializa
            const handleLogout = async function (e) {
                e.preventDefault();
                try {
                    await fetch('/api/logout', { method: 'POST' }); // Llamar a la ruta correcta
                    window.location.href = '/loginRene.html';
                } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                    alert('Error al cerrar sesión. Inténtelo de nuevo.');
                }
            };
            
            // Reemplazar la versión anterior por esta.
            // Para ser robustos, removemos el listener 'click' con { once: true } que tenías.
            // En este contexto, establecer .onclick es más limpio si se llama DOMContentLoaded.
            logoutLink.onclick = handleLogout;


        } else {
            // --- USUARIO NO LOGUEADO ---
            sesionLink.textContent = 'Iniciar Sesion';
            sesionLink.href = '/loginRene.html';
            logoutLi.style.display = 'none';
        }

    } catch (error) {
        console.warn('No se pudo verificar la sesión (error de red o servidor).', error);
        sesionLink.textContent = 'Iniciar Sesion';
        sesionLink.href = '/loginRene.html';
        logoutLi.style.display = 'none';
    }
}
// ==================================================


let ticking = false;

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

class InsuranceCarousel {
    constructor() {
        this.cards = document.querySelectorAll('.insurance-card');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.currentIndex = 0;
        this.isPlaying = true;
        this.interval = null;

        this.init();
    }

    init() {
        if (this.cards.length === 0) return;

        this.prevBtn?.addEventListener('click', () => this.prev());
        this.nextBtn?.addEventListener('click', () => this.next());

        const carousel = document.querySelector('.insurance-carousel');
        carousel?.addEventListener('mouseenter', () => this.pause());
        carousel?.addEventListener('mouseleave', () => this.play());
        carousel?.addEventListener('focusin', () => this.pause());
        carousel?.addEventListener('focusout', () => this.play());

        this.startAutoPlay();
    }

    updateCards() {
        this.cards.forEach((card, index) => {
            card.classList.remove('active', 'prev');
            if (index === this.currentIndex) {
                card.classList.add('active');
            } else if (index < this.currentIndex) {
                card.classList.add('prev');
            }
        });
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.cards.length;
        this.updateCards();
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
        this.updateCards();
    }

    startAutoPlay() {
        this.interval = setInterval(() => {
            if (this.isPlaying) {
                this.next();
            }
        }, 4000);
    }

    pause() {
        this.isPlaying = false;
    }

    play() {
        this.isPlaying = true;
    }
}

class MobileMenu {
    constructor() {
        this.menuToggle = document.getElementById('menuToggle');
        this.navLinks = document.getElementById('navLinks');
        this.isOpen = false;

        this.init();
    }

    init() {
        if (!this.menuToggle || !this.navLinks) return;

        this.menuToggle.addEventListener('click', () => this.toggle());

        this.navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => this.close());
        });

        document.addEventListener('click', (e) => {
            if (!this.menuToggle.contains(e.target) && !this.navLinks.contains(e.target)) {
                this.close();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
                this.menuToggle.focus();
            }
        });
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        this.navLinks.classList.add('active');
        this.menuToggle.classList.add('active');
        this.menuToggle.setAttribute('aria-expanded', 'true');

        const firstLink = this.navLinks.querySelector('a');
        if (firstLink) {
            setTimeout(() => firstLink.focus(), 100);
        }

        document.body.style.overflow = 'hidden';
    }

    close() {
        this.isOpen = false;
        this.navLinks.classList.remove('active');
        this.menuToggle.classList.remove('active');
        this.menuToggle.setAttribute('aria-expanded', 'false');

        document.body.style.overflow = '';
    }
}

class ScrollEffects {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.scrollTopBtn = document.getElementById('scrollTop');
        this.lastScrollY = window.scrollY;

        this.init();
    }

    init() {
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateNavbar();
                    this.updateScrollTopBtn();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        this.scrollTopBtn?.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    updateNavbar() {
        if (window.scrollY > 50) {
            this.navbar?.classList.add('scrolled');
        } else {
            this.navbar?.classList.remove('scrolled');
        }
    }

    updateScrollTopBtn() {
        if (window.scrollY > 300) {
            this.scrollTopBtn?.classList.add('show');
        } else {
            this.scrollTopBtn?.classList.remove('show');
        }
    }
}

class AnimationObserver {
    constructor() {
        this.options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        this.init();
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            document.querySelectorAll('.loading').forEach(el => {
                el.classList.add('loaded');
            });
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('loaded');
                    observer.unobserve(entry.target);
                }
            });
        }, this.options);

        document.querySelectorAll('.loading').forEach(el => {
            observer.observe(el);
        });
    }
}

class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    const offset = 80;
                    const targetPosition = target.offsetTop - offset;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

class ErrorHandler {
    constructor() {
        this.init();
    }

    init() {
        window.addEventListener('error', (e) => {
            console.error('JavaScript Error:', e.error);
            
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled Promise Rejection:', e.reason);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Control de Sesión (Validación al cargar)
    // ESTO SE AJUSTA A LA FUNCIÓN CORREGIDA
    actualizarEstadoHeader(); 

    try {
        new InsuranceCarousel();
        new MobileMenu();
        new ScrollEffects();
        new AnimationObserver();
        new SmoothScroll();
        new ErrorHandler();

        if ('performance' in window && 'mark' in performance) {
            performance.mark('app-initialized');
        }

        console.log('✅ Clínica Rene website initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing website:', error);
    }
});


const preloadImage = (src) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
};