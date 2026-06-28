// Archivo: doctorRene.js (ACTUALIZADO CON DATOS SOLICITADOS)

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


document.addEventListener('DOMContentLoaded', function () {

    // ===== 1. VALIDACIÓN DE SESIÓN (Llama a la función corregida) =====
    actualizarEstadoHeader(); 
    // ===================================

    // --- Selectores UI ---
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    const navbar = document.getElementById('navbar');
    const doctorsGrid = document.getElementById('doctors-grid');
    const filtersContainer = document.getElementById('filters');
    const modal = document.getElementById('doctor-modal');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.getElementById('closeModal');
    
    // --- Lógica del Menú Hamburguesa ---
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

    // --- Efecto Scroll Navbar ---
    if (navbar) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // --- Animación de Carga (Scroll) ---
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
    window.addEventListener('load', checkScroll);
    window.addEventListener('scroll', checkScroll, { passive: true });


    // =========================================================
    // --- DATOS DE DOCTORES (Actualizados con los datos que proporcionaste) ---
    // =========================================================
    const doctorsData = [
        {
            cmp: "DOC00003", // Dr. Juan General Soto
            name: "Dr. Juan General Soto",
            specialty: "medicina-general",
            specialtyName: "Medicina General",
            image: "https://images.pexels.com/photos/5407206/pexels-photo-5407206.jpeg?auto=compress&cs=tinysrgb&w=400",
            experience: "15 años de experiencia",
            education: "Universidad Nacional Mayor de San Marcos",
            certifications: ["Diplomado en Medicina General", "Especialización en Medicina Familiar"],
            languages: ["Español", "Inglés"],
            schedule: "Lunes a Sábado: 8:00 AM - 8:00 PM"
        },
        {
            cmp: "DOC00004", // Dra. Rosa Piel Vega
            name: "Dra. Rosa Piel Vega",
            specialty: "dermatologia",
            specialtyName: "Dermatología",
            image: "https://s3-sa-east-1.amazonaws.com/doctoralia.pe/doctor/582494/582494dc1d60d1cb291b90d6172b9aeb_large.jpg",
            experience: "10 años de experiencia",
            education: "Universidad Peruana Cayetano Heredia",
            certifications: ["Especialista en Dermatología", "Curso de Dermatología Estética"],
            languages: ["Español"],
            schedule: "Lunes a Sábado: 8:00 AM - 8:00 PM"
        },
        {
            cmp: "DOC00002", // Dr. Pedro Muelas Perez
            name: "Dr. Pedro Muelas Perez",
            specialty: "odontologia",
            specialtyName: "Odontología",
            image: "https://www.shutterstock.com/image-photo/professional-male-dentist-smiling-camera-260nw-631494977.jpg",
            experience: "12 años de experiencia",
            education: "Universidad Sideral Carrion",
            certifications: ["Especialista en Odontología", "Diplomado en Ortodoncia"],
            languages: ["Español", "Inglés"],
            schedule: "Lunes a Sábado: 8:00 AM - 8:00 PM"
        },
        {
            cmp: "DOC00005", // Dr. Luis Uro Diaz
            name: "Dr. Luis Uro Diaz",
            specialty: "urologia",
            specialtyName: "Urología",
            image: "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=400",
            experience: "18 años de experiencia",
            education: "Universidad Nacional Mayor de San Marcos",
            certifications: ["Especialista en Urología", "Maestría en Cirugía Urológica"],
            languages: ["Español", "Francés"],
            schedule: "Lunes a Sábado: 8:00 AM - 8:00 PM"
        },
        {
            cmp: "DOC00001", // Dra. Carla Nutri Salas
            name: "Dra. Carla Nutri Salas",
            specialty: "nutricion", 
            specialtyName: "Nutrición",
            image: "https://www.shutterstock.com/image-photo/nutritionist-doctor-man-holds-apple-260nw-2177514457.jpg",
            experience: "8 años de experiencia",
            education: "Universidad San Martín de Porres",
            certifications: ["Especialista en Nutrición Clínica", "Diplomado en Salud Pública"],
            languages: ["Español", "Inglés"],
            schedule: "Lunes a Sábado: 8:00 AM - 8:00 PM"
        },
    ];
    // =========================================================

    // --- Renderizar Doctores ---
    function renderDoctors(doctors) {
        if (!doctorsGrid) return;

        doctorsGrid.innerHTML = doctors.map(doctor => `
                <div class="doctor-card loading" data-specialty="${doctor.specialty}">
                    <div class="doctor-image">
                        <img src="${doctor.image}" alt="${doctor.name}">
                    </div>
                    <div class="doctor-info">
                        <div class="doctor-cmp">CMP: ${doctor.cmp}</div>
                        <h3 class="doctor-name">${doctor.name}</h3>
                        <p class="doctor-specialty">${doctor.specialtyName}</p>
                        <div class="doctor-buttons">
                            <button class="know-more-btn btn" data-cmp="${doctor.cmp}">Conoce más</button>
                            <button class="appointment-btn btn" data-cmp="${doctor.cmp}">Agendar Cita</button>
                        </div>
                    </div>
                </div>
            `).join('');

        checkScroll();
    }

    // --- Mostrar Modal Detalles ---
    function showDoctorDetails(cmp) {
        const doctor = doctorsData.find(d => d.cmp === cmp);
        if (!doctor || !modalBody || !modal) return;

        modalBody.innerHTML = `
                <img src="${doctor.image}" alt="${doctor.name}" class="modal-doctor-image">
                <div class="modal-doctor-details">
                    <h2 class="modal-doctor-name">${doctor.name}</h2>
                    <p class="modal-doctor-specialty">${doctor.specialtyName}</p>
                    <p class="modal-doctor-cmp">CMP: ${doctor.cmp}</p>
                    
                    <div class="doctor-details">
                        <h4>Experiencia:</h4>
                        <p>${doctor.experience}</p>
                        
                        <h4>Formación Académica:</h4>
                        <p>${doctor.education}</p>
                        
                        <h4>Certificaciones:</h4>
                        <ul>
                            ${doctor.certifications.map(cert => `<li>${cert}</li>`).join('')}
                        </ul>
                        
                        <h4>Idiomas:</h4>
                        <ul>
                            ${doctor.languages.map(lang => `<li>${lang}</li>`).join('')}
                        </ul>
                        
                        <h4>Horario de Atención:</h4>
                        <p>${doctor.schedule}</p>
                    </div>
                </div>
            `;

        modal.style.display = 'block';
    }

    // --- Manejar Cita (Redirección CORREGIDA) ---
    async function handleAppointment(cmp) {
        const doctor = doctorsData.find(d => d.cmp === cmp);
        if (!doctor) return;

        try {
            // Verificar sesión directamente con el servidor
            const res = await fetch('/api/session');

            if (res.ok) {
                // Si está logueado, va al sistema (opcional: pasar ID del doctor en la URL)
                window.location.href = `/sistemaRene.html?page=appointments&doctor=${cmp}`; 
            } else {
                // Si NO está logueado, lo deriva al login
                alert('Debes iniciar sesión para agendar una cita.');
                window.location.href = `/loginRene.html`; 
            }
        } catch (error) {
            console.error("Error al verificar sesión para cita:", error);
            alert("Error de conexión al verificar su cuenta.");
            window.location.href = `/loginRene.html`; // Redirige por seguridad
        }
    }

    // --- Filtros ---
    if (filtersContainer) {
        filtersContainer.addEventListener('click', function (event) {
            const button = event.target.closest('.filter-btn');
            if (!button) return;

            filtersContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const specialty = button.getAttribute('data-specialty');

            if (specialty === 'all') {
                renderDoctors(doctorsData);
            } else {
                const filteredDoctors = doctorsData.filter(doctor =>
                    doctor.specialty === specialty
                );
                renderDoctors(filteredDoctors);
            }
        });
    }

    // --- Event Delegation para botones en las tarjetas ---
    if (doctorsGrid) {
        doctorsGrid.addEventListener('click', function (event) {
            // Botón "Conoce más"
            const button = event.target.closest('.know-more-btn');
            if (button) {
                const cmp = button.dataset.cmp;
                showDoctorDetails(cmp);
            }

            // Botón "Agendar Cita"
            const appointmentButton = event.target.closest('.appointment-btn');
            if (appointmentButton) {
                const cmp = appointmentButton.dataset.cmp;
                handleAppointment(cmp); // Llama a la función asíncrona corregida
            }
        });
    }

    // --- Modal Logic ---
    if (modal) {
        if (closeModalBtn) { 
            closeModalBtn.addEventListener('click', function () {
                modal.style.display = 'none';
            });
        }

        window.addEventListener('click', function (event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // --- Carga Inicial ---
    renderDoctors(doctorsData);
});