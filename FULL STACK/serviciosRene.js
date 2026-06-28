// Archivo: serviciosRene.js (VERSIÓN PROFESIONAL Y REFRACTORIZADA)

// ==================================================
// ===== FUNCIÓN CORE: ACTUALIZA EL HEADER DE SESIÓN =====
// ==================================================
async function actualizarEstadoHeader() {
    const sesionLink = document.getElementById('sesion-link');
    const logoutLi = document.getElementById('logout-li');
    const logoutLink = document.getElementById('logout-link');

    if (!sesionLink || !logoutLi || !logoutLink) {
        console.error('Elementos de sesión no encontrados en el DOM.');
        return;
    }

    try {
        const response = await fetch('/api/session');

        if (response.ok) {
            // --- USUARIO LOGUEADO ---
            const user = await response.json();
            const nombreCorto = user.nombre.split(' ')[0]; 
            
            sesionLink.textContent = `Mi Portal (${nombreCorto})`;
            sesionLink.href = '/sistemaRene.html';
            logoutLi.style.display = 'block';

            logoutLink.addEventListener('click', async function (e) {
                e.preventDefault();
                try {
                    await fetch('/api/logout', { method: 'POST' });
                    window.location.href = '/loginRene.html';
                } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                    alert('Error al cerrar sesión. Inténtelo de nuevo.');
                }
            }, { once: true }); 

        } else {
            // --- USUARIO NO LOGUEADO ---
            sesionLink.textContent = 'Iniciar Sesion';
            sesionLink.href = '/loginRene.html';
            logoutLi.style.display = 'none';
        }

    } catch (error) {
        console.warn('No se pudo verificar la sesión (servidor no disponible).', error);
        sesionLink.textContent = 'Iniciar Sesion';
        sesionLink.href = '/loginRene.html';
        logoutLi.style.display = 'none';
    }
}


// ==========================================
// 1. DATOS DE SERVICIOS (Hardcoded - idealmente vendrían de /api/public/servicios)
// ==========================================
const servicesData = [
    { 
        title: "Consulta General", 
        desc: "Atención médica general para diagnóstico y tratamiento de enfermedades comunes.", 
        price: "S/ 80.00", 
        icon: "fas fa-stethoscope",
        dataAttr: "consulta-general"
    },
    { 
        title: "Análisis de Laboratorio", 
        desc: "Exámenes completos de sangre, orina y otros análisis clínicos.", 
        price: "S/ 120.00", 
        icon: "fas fa-microscope",
        dataAttr: "laboratorio"
    },
    { 
        title: "Radiología", 
        desc: "Estudios de rayos X, ecografías y otras imágenes diagnósticas.", 
        price: "S/ 150.00", 
        icon: "fas fa-x-ray",
        dataAttr: "radiologia"
    },
    { 
        title: "Vacunación", 
        desc: "Aplicación de vacunas para niños y adultos según calendario.", 
        price: "S/ 50.00", 
        icon: "fas fa-syringe",
        dataAttr: "vacunacion"
    },
    { 
        title: "Telemedicina", 
        desc: "Consultas médicas virtuales desde la comodidad de tu hogar.", 
        price: "S/ 60.00", 
        icon: "fas fa-video",
        dataAttr: "telemedicina"
    },
    { 
        title: "Atención de Emergencia", 
        desc: "Atención médica inmediata para situaciones de urgencia.", 
        price: "S/ 200.00", 
        icon: "fas fa-ambulance",
        dataAttr: "emergencia"
    }
];

const allServices = servicesData; // Usamos esta lista para la búsqueda


// ==========================================
// 2. FUNCIÓN DE RENDERIZADO PROFESIONAL
// ==========================================
function renderServices(servicesList) {
    const servicesContent = document.getElementById('services-content');
    const noResultsMsg = document.getElementById('no-results'); 

    if (!servicesContent) return;

    // Limpiar contenido existente de manera eficiente
    servicesContent.innerHTML = ''; 

    // Mostrar/Ocultar mensaje de "No hay resultados"
    if (noResultsMsg) {
        noResultsMsg.style.display = servicesList.length === 0 ? 'block' : 'none';
    }

    // Usar fragmentos para inserción masiva (mejora rendimiento)
    const fragment = document.createDocumentFragment();

    servicesList.forEach((service, index) => {
        const card = document.createElement('div');
        // Usamos template literal para un HTML limpio y fácil de leer
        card.className = 'service-card loading'; // Añadimos loading para la animación
        
        card.innerHTML = `
            <div class="service-card-header">
                <div class="service-icon">
                    <i class="${service.icon}"></i>
                </div>
                <h3 data-i18n="service.${service.dataAttr}">${service.title}</h3>
            </div>
            <p data-i18n="service.${service.dataAttr}Desc">${service.desc}</p>
            <div class="service-price">
                <span>${service.price}</span>
                <button class="btn btn-primary btn-small service-cta-btn" data-service="${service.dataAttr}">
                    <i class="fas fa-calendar-plus"></i>
                    <span>Solicitar</span>
                </button>
            </div>
        `;
        
        // Agregar la card al fragmento
        fragment.appendChild(card);

        // Disparar animación (con un pequeño retraso para efecto)
        setTimeout(() => card.classList.add('loaded'), index * 50);
    });

    // Insertar todas las tarjetas de una vez en el DOM
    servicesContent.appendChild(fragment);
}


// ==========================================
// 3. MANEJO DE EVENTOS Y BÚSQUEDA
// ==========================================
function initServiceEvents() {
    const servicesContent = document.getElementById('services-content');
    const searchInput = document.getElementById('searchInput');

    // Evento de Búsqueda
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();

            const filteredServices = allServices.filter(service =>
                service.title.toLowerCase().includes(searchTerm) ||
                service.desc.toLowerCase().includes(searchTerm)
            );

            renderServices(filteredServices);
        });
    }
    
    // Lógica de Solicitud de Cita (Redirección o Login)
    if (servicesContent) {
        servicesContent.addEventListener('click', async function(e) {
            const button = e.target.closest('.service-cta-btn');
            
            if (button) {
                e.preventDefault(); 

                try {
                    // Verificar sesión en el servidor
                    const response = await fetch('/api/session');
                    
                    if (response.ok) {
                        // Si está logueado, redirigir al portal
                        window.location.href = '/sistemaRene.html'; 
                    } else {
                        // Si NO está logueado, pedir login
                        alert('Debes iniciar sesión para solicitar una cita.');
                        window.location.href = '/loginRene.html';
                    }
                } catch (error) {
                    console.error("Error al verificar sesión:", error);
                    // Si hay error de red, forzamos al login/registro
                    window.location.href = '/loginRene.html';
                }
            }
        });
    }
}


// ==========================================
// 4. INICIALIZACIÓN PRINCIPAL
// ==========================================
document.addEventListener('DOMContentLoaded', function () {

    // Inicializa la sesión (para el botón Iniciar Sesión/Mi Portal)
    actualizarEstadoHeader();

    // Inicializa el renderizado de todos los servicios
    renderServices(allServices);

    // Inicializa los eventos de búsqueda y clic
    initServiceEvents();

    // ==========================================
    // Lógica de Menú, Navbar y Scroll (Mantenida de tu código original)
    // ==========================================
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    const navbar = document.getElementById('navbar');

    // Funciones de utilidad para animación/scroll (Mantenidas)
    function checkScroll() {
        const currentLoadingElements = document.querySelectorAll('.loading:not(.loaded)');
        currentLoadingElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            if (elementTop < windowHeight - 50) {
                element.classList.add('loaded');
            }
        });
    }

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function () {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', menuToggle.classList.contains('active'));
        });
    }

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

    if (navbar) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    window.addEventListener('load', checkScroll);
    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();

});