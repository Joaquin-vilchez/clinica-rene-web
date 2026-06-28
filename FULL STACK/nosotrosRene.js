// Archivo: inicioRene.js (CORREGIDO Y UNIFICADO)

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
        console.warn('Elementos de sesión no encontrados en el DOM. Verificar IDs.');
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

            // Configurar el botón de cerrar sesión (Usa la ruta correcta: /api/logout)
            logoutLink.onclick = async function (e) {
                e.preventDefault();
                try {
                    await fetch('/api/logout', { method: 'POST' });
                    window.location.href = '/loginRene.html';
                } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                    alert('Error al cerrar sesión. Inténtelo de nuevo.');
                }
            };

        } else {
            // --- USUARIO NO LOGUEADO ---
            sesionLink.textContent = 'Iniciar Sesion';
            sesionLink.href = '/loginRene.html';
            logoutLi.style.display = 'none';
        }

    } catch (error) {
        // Manejo de error de red
        console.warn('No se pudo verificar la sesión (error de red o servidor).', error);
        sesionLink.textContent = 'Iniciar Sesion';
        sesionLink.href = '/loginRene.html';
        logoutLi.style.display = 'none';
    }
}
// ==================================================


// JavaScript para el menú hamburguesa (Se mantiene el resto de tu código original)
document.addEventListener('DOMContentLoaded', function () {
    
    // ===== 1. VALIDACIÓN DE SESIÓN (Llama a la función corregida) =====
    actualizarEstadoHeader(); 
    // La lógica de cierre de sesión es manejada por la función actualizarEstadoHeader().
    // ===================================

    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    const navbar = document.getElementById('navbar');
    
    // Menú hamburguesa
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function () {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', menuToggle.classList.contains('active'));
        });
    }

    // Cerrar menú al hacer clic en un enlace
    if (navLinks) {
        const navLinksItems = document.querySelectorAll('.nav-links a');
        navLinksItems.forEach(link => {
            link.addEventListener('click', function () {
                if (menuToggle) menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
                if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Navbar scroll effect
    if (navbar) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Animación de carga de elementos
    function checkScroll() {
        const currentLoadingElements = document.querySelectorAll('.loading:not(.loaded)');
        currentLoadingElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (elementTop < windowHeight - 100) {
                element.classList.add('loaded');
            }
        });
    }

    // Verificar elementos al cargar y al hacer scroll
    window.addEventListener('load', checkScroll);
    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
});

// El código de las clases (InsuranceCarousel, MobileMenu, ScrollEffects, etc.)
// debe ser definido fuera del DOMContentLoaded (como lo tienes en tu código fuente)
// y se asume que las clases están inicializadas en otro bloque, similar a:

// try {
//     new InsuranceCarousel();
//     new MobileMenu();
//     // ... otras clases
// } catch (error) {
//     console.error('Error initializing website:', error);
// }