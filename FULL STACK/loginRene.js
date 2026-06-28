const container = document.getElementById('container');
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');

const loginPanel = document.getElementById('loginPanel');
const registerPanel = document.getElementById('registerPanel');
const toRegisterMobile = document.getElementById('toRegisterMobile');
const toLoginMobile = document.getElementById('toLoginMobile');

const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

// ******* NUEVAS VARIABLES PARA RECUPERACIÓN DE CONTRASEÑA *******
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const recoveryMessage = document.getElementById('recoveryMessage');
// ******* FIN NUEVAS VARIABLES *******

// ******* NUEVAS VARIABLES PARA TUTOR Y EDAD *******
const fechaNacimientoInput = document.querySelector('input[name="fecha_nacimiento"]');
const tutorFields = document.getElementById('tutorFields'); // ID del div que contiene los campos del tutor
const tutorNombreInput = document.getElementById('tutorNombre');
const tutorDocumentoInput = document.getElementById('tutorDocumento');
// ******* FIN NUEVAS VARIABLES *******

let prevDesktopActive = false;
let lastMobileForm = 'login';

// Función para calcular la edad exacta
function getAge(dateString) {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    // Ajustar edad si aún no ha cumplido años este mes/día
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function showMobileForm(name) {
    lastMobileForm = name === 'register' ? 'register' : 'login';
    if (name === 'register') {
        registerPanel.classList.add('active');
        loginPanel.classList.remove('active');
        registerPanel.style.display = 'block';
        loginPanel.style.display = 'none';
    } else {
        loginPanel.classList.add('active');
        registerPanel.classList.remove('active');
        loginPanel.style.display = 'block';
        registerPanel.style.display = 'none';
    }
}

function applyMode() {
    if (isMobile()) {
        prevDesktopActive = container.classList.contains('active');
        container.classList.remove('active');

        // Forzar visualización correcta en móvil
        if (lastMobileForm === 'register') showMobileForm('register');
        else showMobileForm('login');

    } else {
        // Modo Desktop: Limpiar estilos inline para que CSS grid/flex funcione
        loginPanel.style.display = '';
        registerPanel.style.display = '';

        loginPanel.classList.remove('active');
        registerPanel.classList.remove('active');

        if (prevDesktopActive) container.classList.add('active');
        else container.classList.remove('active');
    }
}

// Eventos de Carga
window.addEventListener('load', applyMode);
window.addEventListener('resize', applyMode);

// ANIMACIÓN DE DESLIZAMIENTO (Desktop)
// Usamos e.preventDefault SOLO para los botones ghost (animación), NO para el submit
if (signUpButton) {
    signUpButton.addEventListener('click', (e) => {
        e.preventDefault(); // Evita reload
        if (isMobile()) showMobileForm('register');
        else container.classList.add('active');
    });
}

if (signInButton) {
    signInButton.addEventListener('click', (e) => {
        e.preventDefault(); // Evita reload
        if (isMobile()) showMobileForm('login');
        else container.classList.remove('active');
    });
}

// BOTONES MÓVILES (Switchers)
// Estos son type="button", así que no envían form. Solo cambian vista.
if (toRegisterMobile) {
    toRegisterMobile.addEventListener('click', (e) => {
        e.preventDefault();
        showMobileForm('register');
    });
}

if (toLoginMobile) {
    toLoginMobile.addEventListener('click', (e) => {
        e.preventDefault();
        showMobileForm('login');
    });
}

// MENÚ HAMBURGUESA
if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });
}


// -------------------- LÓGICA DE VALIDACIÓN DE EDAD Y TUTOR --------------------
if (fechaNacimientoInput && tutorFields) {
    fechaNacimientoInput.addEventListener('change', function() {
        const fecha = this.value;
        if (fecha) {
            const edad = getAge(fecha);
            
            if (edad < 18) {
                // Es menor: mostrar campos de tutor y hacerlos requeridos
                tutorFields.style.display = 'block';
                alert('⚠️ Atención: Por ser menor de 18 años, debe registrar los datos de un tutor legal.');
                tutorNombreInput.setAttribute('required', 'required');
                tutorDocumentoInput.setAttribute('required', 'required');
            } else {
                // Es mayor: ocultar campos de tutor y remover requerimiento
                tutorFields.style.display = 'none';
                tutorNombreInput.removeAttribute('required');
                tutorDocumentoInput.removeAttribute('required');
                tutorNombreInput.value = ''; // Limpiar por si acaso
                tutorDocumentoInput.value = '';
            }
        } else {
            // Fecha no seleccionada: Ocultar y remover requerimiento
            tutorFields.style.display = 'none';
            tutorNombreInput.removeAttribute('required');
            tutorDocumentoInput.removeAttribute('required');
        }
    });
}


// -------------------- LÓGICA OLVIDÉ CONTRASEÑA (NUEVO) --------------------

// Mostrar modal al hacer clic en el enlace
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        recoveryMessage.textContent = ''; // Limpiar mensaje anterior
        forgotPasswordForm.elements.identificador.value = ''; // Limpiar campo
        forgotPasswordModal.classList.add('visible'); // Mostrar modal
    });
}

// Cerrar modal con el botón Cancelar
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        forgotPasswordModal.classList.remove('visible'); // Ocultar modal
    });
}

// Cerrar modal haciendo click fuera del modal
if (forgotPasswordModal) {
    forgotPasswordModal.addEventListener('click', (e) => {
        if (e.target === forgotPasswordModal) {
            forgotPasswordModal.classList.remove('visible');
        }
    });
}

// Manejar el envío del formulario de recuperación
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const identificador = forgotPasswordForm.elements.identificador.value;
        recoveryMessage.textContent = 'Enviando solicitud...';
        recoveryMessage.style.color = '#333';

        try {
            const response = await fetch('/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ identificador }),
            });

            const data = await response.json();

            // Nota: Se recomienda responder con éxito incluso si el usuario no existe por seguridad.
            if (data.ok) {
                recoveryMessage.textContent = data.message;
                recoveryMessage.style.color = 'green';
                forgotPasswordForm.elements.identificador.value = ''; // Limpiar campo después de éxito
            } else {
                // Manejar errores de servidor (si la respuesta no fue ok)
                recoveryMessage.textContent = data.message || 'Error desconocido al solicitar la recuperación.';
                recoveryMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Error de red:', error);
            recoveryMessage.textContent = 'No se pudo conectar con el servidor. Intente más tarde.';
            recoveryMessage.style.color = 'red';
        }
    });
}