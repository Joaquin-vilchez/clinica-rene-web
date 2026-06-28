// Archivo: promocionRene.js

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
        console.error('Elementos de sesión (sesion-link, logout-li, logout-link) no encontrados.');
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
        console.warn('No se pudo verificar la sesión (error de red o servidor).', error);
        sesionLink.textContent = 'Iniciar Sesion';
        sesionLink.href = '/loginRene.html';
        logoutLi.style.display = 'none';
    }
}
// ==================================================


// --- FUNCIÓN PARA MOSTRAR EL MODAL ---
function showPurchaseModal(title, price, details, validity, features) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'purchase-modal-overlay';
    
    let featuresHTML = '';
    if (features) {
        features.split('|').forEach(feature => {
            featuresHTML += `<li class="promo-feature-item-modal">✓ ${feature}</li>`;
        });
    }

    modalOverlay.innerHTML = `
        <div class="purchase-modal-content">
            <span class="purchase-modal-close">&times;</span>
            <h2 class="promo-title-modal">${title}</h2>
            <div class="promo-details-modal">
                <h4>Qué incluye:</h4>
                <p>${details}</p>
                <ul class="promo-features-modal">${featuresHTML}</ul>
                <p class="validity-modal">Válido: ${validity}</p>
            </div>
            ${price ? `<p class="promo-price-modal">Precio: ${price}</p>` : ''}
            <button class="btn btn-comprar-ahora">Comprar ahora</button>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    const closeModal = () => {
        document.body.removeChild(modalOverlay);
    };
    
    modalOverlay.querySelector('.purchase-modal-close').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    
    modalOverlay.querySelector('.btn-comprar-ahora').addEventListener('click', async () => {
        try {
            const res = await fetch('/api/session');

            if (res.ok) {
                alert('¡Gracias por tu compra! (Aquí iría la lógica de pago)');
                closeModal();
            } else {
                alert('Debes iniciar sesión para poder comprar.');
                window.location.href = '/loginRene.html'; 
            }
        } catch (error) {
            console.error("Error al verificar sesión:", error);
            alert("Error de conexión al verificar tu cuenta.");
        }
    });
}


// --- CÓDIGO PRINCIPAL DEL DOM ---
document.addEventListener('DOMContentLoaded', function () {
    
    // 1. Actualizamos el estado del header (Login/Logout)
    actualizarEstadoHeader();
    
    // 2. ELIMINAMOS LA LÓGICA DE CIERRE DE SESIÓN DUPLICADA Y BASADA EN LOCALSTORAGE AQUÍ.
    // La lógica de cierre de sesión se maneja dentro de actualizarEstadoHeader.

    // 3. Lógica del Menú de Navegación (Responsive)
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    const navbar = document.getElementById('navbar');

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
                if (navLinks) navLinks.classList.remove('active');
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

    // 4. Lógica de Animación de Carga
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
    window.addEventListener('load', checkScroll);
    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll(); 


    // 5. Datos de las Promociones (ESTRUCTURA DE DISEÑO COMPLETA DEL PORTAL)
    const promotions = [
        {
          title: "Chequeo Médico Completo",
          originalPrice: 500,
          discountedPrice: 350,
          badge: "-30%",
          dataAttr: "chequeo-completo",
          icon: "fas fa-heartbeat",
          oldPrice: "S/ 500.00",
          price: "S/ 350.00",
          details: "Incluye: Consulta con médico general, análisis de sangre completo, electrocardiograma y una evaluación nutricional.",
          validity: "Válido hasta 31 de octubre de 2025",
          features: ["Consulta General", "Electrocardiograma (ECG)", "Análisis Hematológico y Bioquímico", "Evaluación Nutricional"].join('|')
        },
        {
          title: "Pack Familiar",
          originalPrice: 600,
          discountedPrice: 450,
          badge: "-25%",
          dataAttr: "pack-familiar",
          icon: "fas fa-users",
          oldPrice: "S/ 600.00",
          price: "S/ 450.00",
          details: "Paquete de consultas para la familia. Incluye 4 consultas generales para adultos y 2 análisis clínicos básicos.",
          validity: "Válido todo el año, solo días hábiles.",
          features: ["4 Consultas Generales", "2 Análisis Clínicos Básicos", "Revisión familiar anual"].join('|')
        },
        {
          title: "Plan de Vacunación Infantil",
          originalPrice: 400,
          discountedPrice: 320,
          badge: "-20%",
          dataAttr: "vacunacion-infantil",
          icon: "fas fa-baby",
          oldPrice: "S/ 400.00",
          price: "S/ 320.00",
          details: "Paquete completo de vacunas esenciales para niños de 0 a 5 años.",
          validity: "Sujeto a stock de vacunas.",
          features: ["Aplicación de 3 vacunas esenciales", "Revisión pediátrica post-vacunación"].join('|')
        },
        {
          title: "Telemedicina Mensual",
          originalPrice: 250,
          discountedPrice: 150,
          badge: "-40%",
          dataAttr: "telemedicina-mensual",
          icon: "fas fa-laptop-medical",
          oldPrice: "S/ 250.00",
          price: "S/ 150.00",
          details: "Acceso a consultas médicas virtuales ilimitadas durante 30 días.",
          validity: "Compra válida por 30 días desde la adquisición.",
          features: ["Consultas virtuales Ilimitadas (General)", "Emisión de recetas electrónicas", "Atención 24/7 (Chat)"].join('|')
        },
        {
          title: "Limpieza Dental Profesional",
          originalPrice: 200,
          discountedPrice: 130,
          badge: "-35%",
          dataAttr: "dental-limpieza",
          icon: "fas fa-tooth",
          oldPrice: "S/ 200.00",
          price: "S/ 130.00",
          details: "Incluye: Limpieza ultrasónica, aplicación de flúor y revisión completa con odontólogo.",
          validity: "Válido hasta fin de año.",
          features: ["Limpieza Ultrasónica", "Aplicación de Flúor", "Revisión Odontológica Completa"].join('|')
        },
        {
          title: "Plan Nutricional Personalizado",
          originalPrice: 300,
          discountedPrice: 210,
          badge: "-30%",
          dataAttr: "nutricion-plan",
          icon: "fas fa-apple-alt",
          oldPrice: "S/ 300.00",
          price: "S/ 210.00",
          details: "3 consultas con nutricionista y la creación de un plan alimenticio adaptado a tus necesidades y objetivos de salud.",
          validity: "Consultas deben usarse en un plazo de 3 meses.",
          features: ["3 Consultas con Nutricionista", "Plan Alimenticio Personalizado", "Seguimiento y Ajuste de Dieta"].join('|')
        }
    ];

    // 6. Renderizado de Promociones (USANDO EL DISEÑO ORIGINAL DEL PORTAL)
    const container = document.getElementById("promotions-container");

    if (container) { 
        container.innerHTML = ''; // Limpiar el contenido existente

        promotions.forEach(promo => {
            const card = document.createElement("div");
            card.classList.add("promo-card", "loading");

            // Unir las características en un string separado por '|' para pasarlas al modal
            const featuresString = promo.features; // Ya es un string separado por '|'
            
            // Reconstrucción del diseño ORIGINAL (Con badges, íconos y la sección de precios detallada)
            card.innerHTML = `
                <h2 class="promo-title">${promo.title}</h2>
                
                <div class="price-section">
                    <p class="original-price">${promo.originalPrice ? `S/${promo.originalPrice}` : ''}</p>
                    <p class="discounted-price">${promo.discountedPrice ? `S/${promo.discountedPrice}` : 'Oferta Especial'}</p>
                </div>
                
                <p class="no-insurance">${promo.noInsuranceInfo}</p>
                
                <ul class="promo-features">
                    ${promo.features.split('|').map(f => `<li class="promo-feature-item">✓ ${f}</li>`).join('')}
                </ul>

                <p class="validity">${promo.validity}</p>
                
                <button class="btn more-info" 
                        data-title="${promo.title}" 
                        data-price="${promo.discountedPrice ? `S/${promo.discountedPrice}` : 'Oferta Especial'}"
                        data-details="${promo.details}" 
                        data-validity="${promo.validity}"
                        data-features="${featuresString}"
                        >
                    Más información
                </button>
            `;
            container.appendChild(card);
        });

        // Event listener para los botones "Más información"
        container.addEventListener('click', function(e) {
            const button = e.target.closest('.more-info');
            if (button) {
                const { title, price, details, validity, features } = button.dataset;
                showPurchaseModal(title, price, details, validity, features);
            }
        });
    } 
});