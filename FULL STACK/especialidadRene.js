// Archivo: especialidadRene.js (CORREGIDO Y UNIFICADO)

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


// --- Variables Globales y Selectores ---
let allEspecialidades = [];
const searchInput = document.getElementById('searchInput');
const filterBtn = document.getElementById('filterBtn');
const filterModal = document.getElementById('filterModal');
const closeFilter = document.getElementById('closeFilter');
const applyFilter = document.getElementById('applyFilter');
const clearFilter = document.getElementById('clearFilter');
const especialidadesGrid = document.getElementById('especialidadesGrid');
const noResults = document.getElementById('noResults');
const filterOptionsContainer = document.querySelector('.filter-options');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const navbar = document.getElementById('navbar');

// --- Carga Dinámica de Especialidades (Función se mantiene para funcionalidad) ---
async function cargarEspecialidades() {
    try {
        const response = await fetch('/api/public/especialidades');
        if (!response.ok) throw new Error('No se pudo cargar la lista de especialidades.');
        
        allEspecialidades = await response.json();
        renderizarGrid(allEspecialidades);
        
        if (filterOptionsContainer) {
            renderizarFiltros(allEspecialidades);
        }
        
        // Quitar el estado 'loading'
        document.querySelector('h1.loading')?.classList.remove('loading');
        document.querySelector('.search-filter-container.loading')?.classList.remove('loading');

    } catch (error) {
        console.error("Error al cargar especialidades:", error);
        if (especialidadesGrid) {
            especialidadesGrid.innerHTML = `<p class="text-center text-red-500 col-span-full">Error al cargar las especialidades. Intente más tarde.</p>`;
        }
    }
}

// Funciones de renderizado (crearCardHTML, getIconForEspecialidad, renderizarGrid, renderizarFiltros)
// ... (Estas funciones se mantienen sin cambios, solo se listan para contexto)
function crearCardHTML(esp) {
    const { 
        id_Especialidad, 
        nombre_Especialidad, 
        descripcion_Especialidad, 
        detalles_Especialidad
    } = esp;
    
    const nombreLimpio = nombre_Especialidad.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const imgSrc = getIconForEspecialidad(nombreLimpio);

    const detallesList = (detalles_Especialidad || "")
        .split(';')
        .filter(detalle => detalle.trim().length > 0)
        .map(detalle => `<li>${detalle.trim().replace('•', '').trim()}</li>`) 
        .join('');
    
    const descripcionCorta = (descripcion_Especialidad || 'Información no disponible.').substring(0, 80) + '...';

    return `
        <div class="especialidad-card loaded" data-especialidad="${nombreLimpio}">
            <div class="especialidad-icon">
                <img src="${imgSrc}" alt="${nombre_Especialidad}" onerror="...">
            </div>
            <h3>${nombre_Especialidad}</h3>
            
            <p>${descripcionCorta}</p>
            
            ${detallesList.length > 0 ? 
                `<ul class="detalles-list">${detallesList}</ul>` 
                : ''} 
            
            <p class="precio-consulta">&nbsp;</p> 
            
            <button class="btn informacion-btn solicitar-cita-btn" data-especialidad-id="${id_Especialidad}">
                Solicitar Cita
            </button> 
        </div>
    `;
}

function getIconForEspecialidad(nombre) {
    const map = {
        'medicina general': '/IMG_RENE/medGeneral.jpg',
        'dermatologia': '/IMG_RENE/dermatologia.jpg',
        'odontologia': '/IMG_RENE/odontologia.png',
        'urologia': '/IMG_RENE/urologia.jpg',
        'nutricion': '/IMG_RENE/nutricion.jpg',
        'cardiologia': 'https://placehold.co/150x100/0284c7/white?text=Cardio' 
    };
    return map[nombre] || `https://placehold.co/150x100/0284c7/white?text=${nombre.charAt(0).toUpperCase()}`;
}

function renderizarGrid(especialidades) {
    if (!especialidadesGrid) return; 
    especialidadesGrid.innerHTML = ''; 
    if (especialidades.length === 0) {
        noResults.classList.add('show');
        return;
    }
    noResults.classList.remove('show');
    especialidades.forEach(esp => {
        especialidadesGrid.innerHTML += crearCardHTML(esp);
    });
}

function renderizarFiltros(especialidades) {
    if (!filterOptionsContainer) return; 
    filterOptionsContainer.innerHTML = ''; 
    const nombresUnicos = [...new Set(especialidades.map(esp => esp.nombre_Especialidad))];

    nombresUnicos.forEach(nombre => {
        const nombreLimpio = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        filterOptionsContainer.innerHTML += `
            <div class="filter-option">
                <input type="checkbox" id="filter-${nombreLimpio}" value="${nombreLimpio}">
                <label for="filter-${nombreLimpio}">${nombre}</label>
            </div>
        `;
    });
}

function filterEspecialidades() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const checkedFilters = Array.from(document.querySelectorAll('.filter-option input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);

    const cards = document.querySelectorAll('.especialidad-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const especialidad = card.getAttribute('data-especialidad');
        const cardText = card.textContent.toLowerCase();

        const matchesSearch = searchTerm === '' || cardText.includes(searchTerm);
        const matchesFilter = checkedFilters.length === 0 || checkedFilters.includes(especialidad);

        if (matchesSearch && matchesFilter) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    if (noResults) {
        if (visibleCount === 0) {
            noResults.classList.add('show');
        } else {
            noResults.classList.remove('show');
        }
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', function () {

    // 1. CONTROL DE SESIÓN (Llama a la función corregida)
    actualizarEstadoHeader(); 
    
    // ===== LÓGICA PARA EL BOTÓN DE CITA (CORREGIDA - Verifica la sesión por API) =====
    if (especialidadesGrid) {
        especialidadesGrid.addEventListener('click', async function(e) {
            if (e.target.classList.contains('solicitar-cita-btn')) {
                e.preventDefault(); 
                
                try {
                    // Verificar sesión directamente con el servidor
                    const res = await fetch('/api/session');

                    if (res.ok) {
                        // Si hay sesión, redirige al sistema.
                        window.location.href = '/sistemaRene.html';
                    } else {
                        // Si NO hay sesión, redirige al login
                        alert('Debes iniciar sesión para solicitar una cita.');
                        window.location.href = '/loginRene.html';
                    }
                } catch (error) {
                    console.error("Error al verificar sesión:", error);
                    alert("Error al verificar la sesión. Intente recargar la página.");
                }
            }
        });
    }
    // ========================================


    // Búsqueda
    if (searchInput) {
        searchInput.addEventListener('input', filterEspecialidades);
    }

    // Modal de filtros
    if (filterBtn) {
        filterBtn.addEventListener('click', () => filterModal.classList.add('active'));
    }
    if (closeFilter) {
        closeFilter.addEventListener('click', () => filterModal.classList.remove('active'));
    }
    if (filterModal) {
        filterModal.addEventListener('click', (e) => {
            if (e.target === filterModal) filterModal.classList.remove('active');
        });
    }

    // Aplicar filtros
    if (applyFilter) {
        applyFilter.addEventListener('click', () => {
            filterEspecialidades();
            filterModal.classList.remove('active');
        });
    }

    // Limpiar filtros
    if (clearFilter) {
        clearFilter.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.filter-option input[type="checkbox"]');
            checkboxes.forEach(checkbox => checkbox.checked = false);
            if (searchInput) searchInput.value = '';
            filterEspecialidades();
        });
    }

    // Menú hamburguesa
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function () {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', menuToggle.classList.contains('active'));
        });
    }

    // Cerrar menú al hacer clic
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

    // --- Iniciar Carga de Datos ---
    if (especialidadesGrid) { 
        cargarEspecialidades();
    }
});