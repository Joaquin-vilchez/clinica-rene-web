// commonRene.js - Lógica mejorada para manejar la sesión en la cabecera y en el panel de usuario

document.addEventListener('DOMContentLoaded', async () => {
    
    // Función para obtener iniciales
    const getInitials = (nombres, apellidos) => {
        const n = nombres ? nombres[0] : '';
        const a = apellidos ? apellidos.split(' ')[0][0] : '';
        return (n + a).toUpperCase();
    };

    try {
        const response = await fetch('/me');
        const userData = await response.json();
        const isLogged = response.status === 200;

        // ===================================
        // 1. Manejo del enlace de Navegación (para páginas públicas)
        // ===================================
        const sesionLink = document.getElementById('sesion-link');
        if (sesionLink) {
            if (isLogged) {
                // Si está logueado: Muestra nombre y enlace de salida
                const nombreUsuario = userData.nombres.split(' ')[0] || 'Mi Cuenta'; 
                sesionLink.textContent = `Hola, ${nombreUsuario}`;
                sesionLink.href = '/sistemaRene.html';
                
                // Agregar enlace de Logout
                const logoutLink = document.createElement('a');
                logoutLink.textContent = ' (Salir)';
                logoutLink.href = '#';
                logoutLink.style.marginLeft = '5px';
                logoutLink.style.fontSize = '0.9em';
                logoutLink.onclick = async (e) => {
                    e.preventDefault();
                    await fetch('/logout', { method: 'POST' }); 
                    window.location.href = '/loginRene.html';
                };
                sesionLink.parentNode.appendChild(logoutLink);

            } else {
                // Si no está logueado: Redirigir la raíz a login (ya cubierto por server.js)
            }
        }
        
        // ===================================
        // 2. Manejo del Panel de Usuario (sistemaRene.html)
        // ===================================
        const userDisplay = document.getElementById('user-name-display');
        if (userDisplay) {
            if (isLogged) {
                // Actualizar la información en el sidebar
                document.getElementById('user-name-display').textContent = `${userData.nombres} ${userData.apellidos}`;
                document.getElementById('user-role-display').textContent = userData.rol || 'Usuario';
                document.getElementById('user-avatar-initials').textContent = getInitials(userData.nombres, userData.apellidos);

                // Asignar función de Logout al botón del sidebar
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', async () => {
                        // Aquí puedes añadir la lógica del modal de confirmación si existe
                        // Por simplicidad, llamaremos directamente al logout
                        const confirmLogout = confirm('¿Estás seguro de que deseas cerrar tu sesión?');
                        if (confirmLogout) {
                            await fetch('/logout', { method: 'POST' });
                            window.location.href = '/loginRene.html';
                        }
                    });
                }

            } else {
                // Si intenta acceder al panel sin sesión, redirigir al login (Seguridad)
                if (window.location.pathname === '/sistemaRene.html') {
                     window.location.href = '/loginRene.html?error=session_expired';
                }
            }
        }
        
        // ===================================
        // 3. Redirección automática en loginRene.html
        // ===================================
        if (window.location.pathname === '/loginRene.html' && isLogged) {
            window.location.href = '/sistemaRene.html';
        }

    } catch (error) {
        console.error('Error al verificar la sesión con el servidor:', error);
        // Si el servidor falla, forzar la redirección en el panel para evitar errores
        if (window.location.pathname === '/sistemaRene.html') {
            window.location.href = '/loginRene.html?error=server_error';
        }
    }
});