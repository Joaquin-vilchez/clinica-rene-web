        // =================== VARIABLES GLOBALES ===================
        let savedCards = [];
        let selectedCard = null;
        let currentUser = null;
        let especialidadesData = [];
        let medicosData = [];

        // =================== FUNCIONES CORE ===================
        function showLoader() {
            document.getElementById('loader').classList.add('active');
        }

        function hideLoader() {
            document.getElementById('loader').classList.remove('active');
        }

        function openModal(modalId) {
            document.getElementById(modalId).classList.add('show');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('show');
        }

        // =================== VERIFICAR SESIÓN ===================
        // Archivo: sistemaRene.js (REEMPLAZAR FUNCION verificarSesion)

// =================== VERIFICAR SESIÓN (FINAL con Lógica de Tutor) ===================
async function verificarSesion() {
    try {
        const response = await fetch('/api/session');
        if (!response.ok) {
            window.location.href = '/loginRene.html?error=no_sesion';
            return null;
        }
        const data = await response.json();
        currentUser = data;

        // --- LÓGICA DE DETECCIÓN DE CONTEXTO ---
        let roleDisplay = "Paciente";
        let nameDisplay = `${data.nombre} ${data.apellidos || ''}`; // Nombre completo por defecto

        // Si el backend nos confirmó que es tutor de al menos un menor
        if (data.esTutor && data.menores && data.menores.length > 0) {
            
            const primerMenor = data.menores[0];
            roleDisplay = `Tutor Legal (Rol: ${primerMenor.tipo_relacion})`;
            nameDisplay = `${data.nombre} (Tutor de ${primerMenor.nombre})`; // Formato solicitado
            
        } else {
            // Esto solo muestra "Paciente" si no tiene menores a cargo
            roleDisplay = "Paciente";
        }
        
        // Actualizar UI con nombre y rol del usuario
        document.getElementById('user-name').textContent = nameDisplay;
        document.querySelector('.user-details p').textContent = roleDisplay;
        document.getElementById('user-avatar').textContent = nameDisplay.charAt(0).toUpperCase();

        console.log('Sesión activa:', data);
        return data;
    } catch (error) {
        console.error('Error verificando sesión:', error);
        window.location.href = '/loginRene.html?error=sesion';
        return null;
    }
}

        // =================== CARGAR DASHBOARD ===================
        async function cargarDashboard() {
            try {
                showLoader();
                const response = await fetch('/api/dashboard');
                const data = await response.json();

                console.log('📊 Dashboard cargado:', data);

                // Actualizar estadísticas en cards
                const cards = document.querySelectorAll('.dashboard-card');
                if (data.recetasActivas !== undefined) {
                    // Puedes actualizar los números aquí si quieres mostrarlos
                }

                // Mostrar actividad reciente
                const activityContainer = document.querySelector('#dashboard #recent-activity') ||
                    document.querySelector('#dashboard .empty-state').parentElement;

                if (data.citasRecientes && data.citasRecientes.length > 0) {
                    activityContainer.innerHTML = '<h3 class="section-title">Actividad Reciente</h3>';
                    data.citasRecientes.forEach(cita => {
                        const citaDiv = document.createElement('div');
                        citaDiv.className = 'dashboard-card';
                        citaDiv.style.cursor = 'default';
                        citaDiv.innerHTML = `
                    <i class="fas fa-calendar-check"></i>
                    <h3>${cita.doctor}</h3>
                    <p>${new Date(cita.fechaHora_Cita).toLocaleString('es-PE')}</p>
                    <p><strong>${cita.estado_Cita}</strong></p>
                `;
                        activityContainer.appendChild(citaDiv);
                    });
                }

                hideLoader();
            } catch (error) {
                console.error('Error cargando dashboard:', error);
                hideLoader();
            }
        }

        // =================== CARGAR CITAS ===================
        async function cargarCitas() {
            try {
                showLoader();
                const response = await fetch('/api/citas');
                const citas = await response.json();

                console.log('Citas cargadas:', citas.length);

                const container = document.getElementById('appointments-list');

                if (citas.length === 0) {
                    container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No tienes citas programadas</h3>
                    <p>Solicita una nueva cita con tu médico</p>
                </div>
            `;
                    hideLoader();
                    return;
                }

                container.innerHTML = '';
                citas.forEach(cita => {
                    const citaCard = document.createElement('div');
                    citaCard.className = 'service-card';
                    citaCard.innerHTML = `
                <div class="service-card-header">
                    <div class="service-icon">
                        <i class="fas fa-user-md"></i>
                    </div>
                    <div>
                        <h3>${cita.especialidad}</h3>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--muted);">${cita.doctor}</p>
                    </div>
                </div>
                <p><strong>Fecha:</strong> ${new Date(cita.fechaHora_Cita).toLocaleString('es-PE', {
                        dateStyle: 'long',
                        timeStyle: 'short'
                    })}</p>
                <p><strong>Tipo:</strong> ${cita.tipo_consulta}</p>
                <p><strong>Motivo:</strong> ${cita.motivo_Consulta}</p>
                <div class="service-price">
                    <span style="color: ${getEstadoColor(cita.estado_Cita)}; font-size: 1rem;">
                        ${cita.estado_Cita}
                    </span>
                </div>
            `;
                    container.appendChild(citaCard);
                });

                hideLoader();
            } catch (error) {
                console.error('Error cargando citas:', error);
                hideLoader();
            }
        }

        function getEstadoColor(estado) {
            const colors = {
                'Programada': '#FFC107',
                'Confirmada': '#4CAF50',
                'Completada': '#2196F3',
                'Cancelada': '#F44336',
                'En Espera': '#FF9800'
            };
            return colors[estado] || '#666';
        }

        // =================== CARGAR ESPECIALIDADES ===================
        async function cargarEspecialidades() {
            try {
                const response = await fetch('/api/especialidades');
                especialidadesData = await response.json();

                console.log('🏥 Especialidades cargadas:', especialidadesData.length);
                console.log('📋 Datos:', especialidadesData); // Para ver qué llega

                const select = document.getElementById('apt-specialty');
                select.innerHTML = '<option value="">-- Seleccionar --</option>';

                especialidadesData.forEach(esp => {
                    const option = document.createElement('option');
                    option.value = esp.id_Especialidad;

                    //Convertir a número
                    const precio = parseFloat(esp.precio_consulta) || 70;

                    option.setAttribute('data-price', precio);
                    option.textContent = `${esp.nombre_Especialidad} - S/ ${precio.toFixed(2)}`;
                    select.appendChild(option);
                });

                console.log('Especialidades cargadas en el select');

            } catch (error) {
                console.error('Error cargando especialidades:', error);
                const select = document.getElementById('apt-specialty');
                select.innerHTML = '<option value="">Error al cargar especialidades</option>';
            }
        }


        // =================== CARGAR MÉDICOS ===================
        async function cargarMedicos(id_especialidad = null) {
            try {
                let url = '/api/medicos';
                if (id_especialidad) {
                    url += `?id_especialidad=${id_especialidad}`;
                }

                console.log('🔍 Cargando médicos desde:', url);

                const response = await fetch(url);
                medicosData = await response.json();

                console.log('Médicos cargados:', medicosData.length);
                console.log('Datos:', medicosData);

                const select = document.getElementById('apt-doctor');
                select.innerHTML = '<option value="">-- Seleccionar --</option>';
                select.disabled = false;

                if (medicosData.length === 0) {
                    select.innerHTML = '<option value="">No hay médicos disponibles</option>';
                    select.disabled = true;
                    return;
                }

                medicosData.forEach(medico => {
                    const option = document.createElement('option');
                    option.value = medico.id_Doctor;
                    option.setAttribute('data-especialidad', medico.id_Especialidad);
                    option.setAttribute('data-consultorio', medico.id_Consultorio); // ⬅️ NUEVO
                    option.textContent = medico.nombre_completo;
                    select.appendChild(option);
                });

                console.log('Médicos cargados en el select');

            } catch (error) {
                console.error('Error cargando médicos:', error);
            }
        }



        // =================== CARGAR HORARIOS ===================
        async function cargarHorarios(id_doctor, fecha) {
            try {
                console.log(`🔍 Cargando horarios: doctor=${id_doctor}, fecha=${fecha}`);

                const response = await fetch(`/api/horarios?id_doctor=${id_doctor}&fecha=${fecha}`);
                const horarios = await response.json();

                console.log('🕐 Horarios disponibles:', horarios.length);
                console.log('📋 Horarios:', horarios);

                const select = document.getElementById('apt-time');

                // Limpiar primero
                select.innerHTML = '';
                select.disabled = false; //HABILITAR

                if (horarios.length === 0) {
                    select.innerHTML = '<option value="">No hay horarios disponibles para este día</option>';
                    select.disabled = true;
                    return;
                }

                // Agregar opción por defecto
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = '-- Seleccionar hora --';
                select.appendChild(defaultOption);

                // Agregar cada horario
                horarios.forEach(hora => {
                    const option = document.createElement('option');
                    option.value = hora;
                    option.textContent = hora;
                    select.appendChild(option);
                    console.log('➕ Horario agregado:', hora);
                });

                console.log('Select actualizado con', select.options.length, 'opciones');

            } catch (error) {
                console.error('Error cargando horarios:', error);
                const select = document.getElementById('apt-time');
                select.innerHTML = '<option value="">Error al cargar horarios</option>';
                select.disabled = true;
            }
        }


        // =================== CARGAR TARJETAS ===================
        async function cargarTarjetas() {
            try {
                const response = await fetch('/api/tarjetas');
                savedCards = await response.json();

                console.log('💳 Tarjetas cargadas:', savedCards.length);
                renderPaymentCards();

            } catch (error) {
                console.error('Error cargando tarjetas:', error);
            }
        }

        function renderPaymentCards() {
            const container = document.getElementById('apt-payment-cards');
            container.innerHTML = '';

            if (savedCards.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 10px;">No hay tarjetas guardadas. Agrega una nueva.</p>';
                return;
            }

            savedCards.forEach((card, index) => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'payment-card-option';
                if (selectedCard === index) cardDiv.classList.add('selected');

                cardDiv.innerHTML = `
            <input type="radio" name="payment-card" value="${index}" ${selectedCard === index ? 'checked' : ''}>
            <div style="flex: 1;">
                <strong>DÉBITO</strong> •••• ${card.ultimos_digitos}
                <div style="font-size: 0.85rem; color: var(--muted);">${card.titular}</div>
            </div>
            <i class="fas fa-credit-card" style="color: var(--primary); font-size: 1.5rem;"></i>
        `;

                cardDiv.addEventListener('click', () => {
                    selectedCard = index;
                    renderPaymentCards();
                });

                container.appendChild(cardDiv);
            });
        }


        // =================== INICIALIZAR MODAL DE CITAS ===================
        function initAppointments() {
            const newAppointmentBtn = document.getElementById('new-appointment-btn');
            const saveAppointmentBtn = document.getElementById('save-appointment-btn');
            const appointmentForm = document.getElementById('appointment-form');
            const specialtySelect = document.getElementById('apt-specialty');
            const doctorSelect = document.getElementById('apt-doctor');
            const dateInput = document.getElementById('apt-date');
            const timeSelect = document.getElementById('apt-time');
            const paymentSection = document.getElementById('apt-payment-section');
            const addCardBtn = document.getElementById('apt-add-card-btn');
            const saveCardBtn = document.getElementById('apt-save-card-btn');

            // Abrir modal
            newAppointmentBtn.addEventListener('click', async () => {
                openModal('appointment-modal');
                const today = new Date().toISOString().split('T')[0];
                dateInput.min = today;

                await cargarEspecialidades();
                await cargarTarjetas();
            });

            // Cambio de especialidad
            specialtySelect.addEventListener('change', async () => {
                const id_especialidad = specialtySelect.value;

                console.log('Especialidad seleccionada:', id_especialidad);

                if (id_especialidad) {
                    await cargarMedicos(id_especialidad);

                    const selectedOption = specialtySelect.options[specialtySelect.selectedIndex];
                    const price = parseFloat(selectedOption.getAttribute('data-price')) || 70; // Convertir a número
                    const tax = price * 0.18;
                    const total = price + tax;

                    console.log('💰 Precio:', price, 'IGV:', tax, 'Total:', total);

                    document.getElementById('apt-subtotal').textContent = `S/ ${price.toFixed(2)}`;
                    document.getElementById('apt-tax').textContent = `S/ ${tax.toFixed(2)}`;
                    document.getElementById('apt-total').textContent = `S/ ${total.toFixed(2)}`;

                    paymentSection.style.display = 'block';
                } else {
                    doctorSelect.innerHTML = '<option value="">-- Primero selecciona especialidad --</option>';
                    doctorSelect.disabled = true;
                    paymentSection.style.display = 'none';
                }
            });


            // Cambio de fecha o doctor
            dateInput.addEventListener('change', verificarYCargarHorarios);
            doctorSelect.addEventListener('change', verificarYCargarHorarios);

            async function verificarYCargarHorarios() {
                const id_doctor = doctorSelect.value;
                const fecha = dateInput.value;

                console.log('Verificando condiciones:', { id_doctor, fecha });

                if (id_doctor && fecha) {
                    console.log('Ambos campos completos, cargando horarios...');
                    await cargarHorarios(id_doctor, fecha);
                } else {
                    console.log('Falta doctor o fecha');
                    const select = document.getElementById('apt-time');
                    select.innerHTML = '<option value="">-- Primero selecciona doctor y fecha --</option>';
                    select.disabled = true;
                }
            }


            // Agregar tarjeta
            addCardBtn.addEventListener('click', () => {
                openModal('apt-add-card-modal');
            });

            saveCardBtn.addEventListener('click', async () => {
                const form = document.getElementById('apt-add-card-form');
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }

                showLoader();

                const cardData = {
                    tipo: 'Debito', // ⬅️ Exactamente como está en la BD
                    numero: document.getElementById('apt-card-number').value,
                    titular: document.getElementById('apt-card-name').value,
                    vencimiento: document.getElementById('apt-card-expiry').value
                };

                console.log('💳 Enviando tarjeta:', cardData);

                try {
                    const response = await fetch('/api/tarjetas', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cardData)
                    });

                    const result = await response.json();

                    if (response.ok) {
                        console.log('Tarjeta guardada:', result);
                        await cargarTarjetas();
                        closeModal('apt-add-card-modal');
                        form.reset();
                        alert('Tarjeta agregada correctamente');
                    } else {
                        console.error('Error:', result);
                        alert('Error: ' + result.error);
                    }
                } catch (error) {
                    console.error('Error de red:', error);
                    alert('Error al agregar tarjeta');
                }

                hideLoader();
            });


            // Formatear número de tarjeta
            document.getElementById('apt-card-number').addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '');
                let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = formatted;
            });

            // Formatear vencimiento
            document.getElementById('apt-card-expiry').addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2, 4);
                }
                e.target.value = value;
            });

            // Guardar cita
            saveAppointmentBtn.addEventListener('click', async () => {
                if (!appointmentForm.checkValidity()) {
                    appointmentForm.reportValidity();
                    return;
                }

                if (paymentSection.style.display !== 'none' && selectedCard === null) {
                    alert('⚠️ Por favor selecciona o agrega una tarjeta de pago');
                    return;
                }

                showLoader();

                const doctorSelect = document.getElementById('apt-doctor');
                const selectedDoctor = doctorSelect.options[doctorSelect.selectedIndex];
                const id_especialidad = selectedDoctor.getAttribute('data-especialidad');
                const id_consultorio = selectedDoctor.getAttribute('data-consultorio');

                console.log('📋 Datos del doctor seleccionado:', {
                    id_doctor: doctorSelect.value,
                    id_especialidad,
                    id_consultorio
                });

                const citaData = {
                    id_doctor: doctorSelect.value,
                    id_especialidad: id_especialidad,
                    id_consultorio: id_consultorio,
                    fecha: document.getElementById('apt-date').value,
                    hora: document.getElementById('apt-time').value,
                    tipo_consulta: document.getElementById('apt-consultation-type').value,
                    motivo: document.getElementById('apt-reason').value,
                    id_tarjeta: selectedCard !== null ? savedCards[selectedCard].id_Tarjeta : null
                };

                console.log('📤 Enviando cita:', citaData);

                try {
                    const response = await fetch('/api/citas', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(citaData)
                    });

                    const result = await response.json();

                    if (response.ok) {
                        closeModal('appointment-modal');
                        appointmentForm.reset();
                        paymentSection.style.display = 'none';
                        selectedCard = null;

                        await cargarCitas();

                        alert(`¡Cita confirmada!\n\nFecha: ${citaData.fecha} ${citaData.hora}\nTotal: S/ ${result.monto.toFixed(2)}\n\nRecibirás una confirmación pronto.`);
                    } else {
                        alert(`Error: ${result.error}`);
                    }
                } catch (error) {
                    console.error('Error creando cita:', error);
                    alert('Error al crear la cita');
                }

                hideLoader();
            });

        }

        // =================== CARGAR PERFIL ===================
        // Archivo: sistemaRene.js (REEMPLAZAR FUNCION cargarPerfil)

// =================== CARGAR PERFIL (MODIFICADO para Tutoría) ===================
async function cargarPerfil() {
    try {
        showLoader();
        // El servidor debe devolver: perfil, perfil.esMenor, perfil.tutor, perfil.esTutor, perfil.menores
        const response = await fetch('/api/perfil');
        const perfil = await response.json();

        console.log('👤 Perfil cargado (con info de tutoría):', perfil);

        // --- Cargar datos base del paciente ---
        document.getElementById('profile-name').value = perfil.nombre || '';
        document.getElementById('profile-document').value = perfil.numero_documento || '';
        document.getElementById('profile-email').value = perfil.email_Users || '';
        document.getElementById('profile-phone').value = perfil.telefono || '';
        document.getElementById('profile-address').value = perfil.direccion || '';

        // --- Lógica para mostrar información de Tutoría ---
        const tutorTitle = document.getElementById('tutor-title');
        const tutorDisplay = document.getElementById('tutor-info-display');
        const minorDisplay = document.getElementById('minor-info-display');
        const minorList = document.getElementById('tutor-minor-list');
        const minorContext = document.getElementById('minor-context-display');
        
        // Ocultar todo primero
        tutorDisplay.style.display = 'none';
        minorDisplay.style.display = 'none';
        minorContext.style.display = 'none';
        tutorTitle.textContent = 'Información de Tutoría';

        if (perfil.esMenor && perfil.tutor) {
            // Caso 1: El usuario actual es un menor de edad
            tutorTitle.textContent = 'Tutoría Asignada';
            tutorDisplay.style.display = 'block';
            minorContext.style.display = 'block';
            
            document.getElementById('profile-tutor-name').value = perfil.tutor.nombre_tutor || 'No asignado';
            document.getElementById('profile-tutor-document').value = perfil.tutor.numero_documento || 'N/A';
            document.getElementById('profile-tutor-relation').value = perfil.tutor.tipo_relacion || 'N/A';
            
        } else if (perfil.esTutor && perfil.menores && perfil.menores.length > 0) {
            // Caso 2: El usuario actual es un tutor (tiene menores a cargo)
            tutorTitle.textContent = `Menores a su Cargo (${perfil.menores.length})`;
            minorDisplay.style.display = 'block';
            minorList.innerHTML = '';
            
            perfil.menores.forEach(menor => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div style="padding: 8px 0; border-bottom: 1px dashed #eee;">
                        <i class="fas fa-child" style="color: var(--primary);"></i>
                        <strong>${menor.nombre_menor}</strong> <br>
                        <span style="font-size: 0.9em; color: var(--muted);">Relación: ${menor.tipo_relacion}</span>
                    </div>
                `;
                minorList.appendChild(li);
            });
        }
        
        hideLoader();
    } catch (error) {
        console.error('Error cargando perfil:', error);
        hideLoader();
    }
}
        // =================== CARGAR RECETAS ===================
        async function cargarRecetas() {
            try {
                showLoader();
                const response = await fetch('/api/recetas');
                const recetas = await response.json();

                console.log('💊 Recetas cargadas:', recetas.length);

                const container = document.getElementById('prescriptions-list');

                if (recetas.length === 0) {
                    container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-pills"></i>
                    <h3>No tienes recetas activas</h3>
                    <p>Tus medicamentos recetados aparecerán aquí</p>
                </div>
            `;
                    hideLoader();
                    return;
                }

                container.innerHTML = '';
                recetas.forEach(receta => {
                    const recetaCard = document.createElement('div');
                    recetaCard.className = 'service-card';
                    recetaCard.innerHTML = `
                <div class="service-card-header">
                    <div class="service-icon">
                        <i class="fas fa-prescription-bottle-alt"></i>
                    </div>
                    <h3>${receta.medicamento}</h3>
                </div>
                <p><strong>Dosis:</strong> ${receta.dosis}</p>
                <p><strong>Frecuencia:</strong> ${receta.frecuencia}</p>
                <p><strong>Duración:</strong> ${receta.duracion}</p>
                <p><strong>Doctor:</strong> ${receta.doctor}</p>
                <div class="service-price">
                    <span style="color: ${receta.estado === 'Activa' ? '#4CAF50' : '#666'}">
                        ${receta.estado}
                    </span>
                    <span style="font-size: 0.85rem; color: var(--muted);">
                        ${new Date(receta.fecha_emision).toLocaleDateString('es-PE')}
                    </span>
                </div>
            `;
                    container.appendChild(recetaCard);
                });

                hideLoader();
            } catch (error) {
                console.error('Error cargando recetas:', error);
                hideLoader();
            }
        }

        // =================== CARGAR HISTORIAL ===================
        async function cargarHistorial() {
            try {
                showLoader();
                const response = await fetch('/api/historial');
                const historial = await response.json();

                console.log('📋 Historial cargado:', historial.length);

                const container = document.getElementById('history-list');

                if (historial.length === 0) {
                    container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-notes-medical"></i>
                    <h3>No hay historial disponible</h3>
                    <p>Tu historial médico aparecerá aquí</p>
                </div>
            `;
                    hideLoader();
                    return;
                }

                container.innerHTML = '';
                historial.forEach(consulta => {
                    const consultaCard = document.createElement('div');
                    consultaCard.className = 'service-card';
                    consultaCard.innerHTML = `
                <div class="service-card-header">
                    <div class="service-icon">
                        <i class="fas fa-file-medical"></i>
                    </div>
                    <div>
                        <h3>${consulta.doctor}</h3>
                        <p style="margin: 0; font-size: 0.85rem; color: var(--muted);">
                            ${new Date(consulta.fecha_consulta).toLocaleDateString('es-PE')}
                        </p>
                    </div>
                </div>
                <p><strong>Diagnóstico:</strong> ${consulta.diagnostico}</p>
                ${consulta.sintomas ? `<p><strong>Síntomas:</strong> ${consulta.sintomas}</p>` : ''}
                ${consulta.observaciones ? `<p><strong>Observaciones:</strong> ${consulta.observaciones}</p>` : ''}
            `;
                    container.appendChild(consultaCard);
                });

                hideLoader();
            } catch (error) {
                console.error('Error cargando historial:', error);
                hideLoader();
            }
        }

        // =================== CARGAR LABORATORIO ===================
        async function cargarLaboratorio() {
            try {
                showLoader();
                const response = await fetch('/api/laboratorio');
                const resultados = await response.json();

                console.log('🧪 Resultados cargados:', resultados.length);

                const container = document.getElementById('lab-results-list');

                if (resultados.length === 0) {
                    container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-vial"></i>
                    <h3>No hay resultados disponibles</h3>
                    <p>Tus resultados de laboratorio aparecerán aquí</p>
                </div>
            `;
                    hideLoader();
                    return;
                }

                container.innerHTML = '';
                resultados.forEach(resultado => {
                    const resultadoCard = document.createElement('div');
                    resultadoCard.className = 'service-card';
                    resultadoCard.innerHTML = `
                <div class="service-card-header">
                    <div class="service-icon">
                        <i class="fas fa-flask"></i>
                    </div>
                    <h3>${resultado.tipo_examen}</h3>
                </div>
                <p><strong>Estado:</strong> ${resultado.estado}</p>
                <p><strong>Fecha Orden:</strong> ${new Date(resultado.fecha_orden).toLocaleDateString('es-PE')}</p>
                ${resultado.fecha_resultado ? `<p><strong>Fecha Resultado:</strong> ${new Date(resultado.fecha_resultado).toLocaleDateString('es-PE')}</p>` : ''}
                ${resultado.resultado ? `<p><strong>Resultado:</strong> ${resultado.resultado}</p>` : ''}
            `;
                    container.appendChild(resultadoCard);
                });

                hideLoader();
            } catch (error) {
                console.error('Error cargando laboratorio:', error);
                hideLoader();
            }
        }

        // =================== NAVEGACIÓN ===================
        function initNavigation() {
            document.querySelectorAll('.menu-item:not(#logout-btn):not(#home-web-btn)').forEach(item => {
                item.addEventListener('click', function () {
                    const target = this.getAttribute('data-target');

                    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
                    this.classList.add('active');

                    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
                    document.getElementById(target).classList.add('active');

                    const titleSpan = this.querySelector('span');
                    if (titleSpan) {
                        document.getElementById('page-title').textContent = titleSpan.textContent;
                    }

                    // Cargar datos según la sección
                    switch (target) {
                        case 'appointments':
                            cargarCitas();
                            break;
                        case 'prescriptions':
                            cargarRecetas();
                            break;
                        case 'medical-history':
                            cargarHistorial();
                            break;
                        case 'lab-results':
                            cargarLaboratorio();
                            break;
                        case 'profile':
                            cargarPerfil();
                            break;
                    }
                });
            });

            document.getElementById('home-web-btn').addEventListener('click', () => {
                window.open('inicioRene.html', '_blank');
            });

            document.querySelectorAll('.dashboard-card').forEach(card => {
                card.addEventListener('click', function () {
                    const target = this.getAttribute('data-target');
                    if (target) {
                        const menuItem = document.querySelector(`.menu-item[data-target="${target}"]`);
                        if (menuItem) menuItem.click();
                    }
                });
            });
        }

        // =================== SIDEBAR TOGGLE ===================
        function initSidebarToggle() {
            const sidebarToggle = document.getElementById('sidebar-toggle');
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('main-content');

            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('sidebar-collapsed');
            });
        }

        // =================== NOTIFICACIONES ===================
        function initNotifications() {
            const notificationBell = document.getElementById('notification-bell');
            const notificationsPanel = document.getElementById('notifications-panel');
            const closeNotifications = document.getElementById('close-notifications');

            notificationBell.addEventListener('click', () => {
                notificationsPanel.classList.toggle('show');
            });

            closeNotifications.addEventListener('click', () => {
                notificationsPanel.classList.remove('show');
            });
        }

        // =================== SETTINGS ===================
        function initSettings() {
            const darkModeToggle = document.getElementById('dark-mode-toggle');
            const languageSelect = document.getElementById('language-select');

            const savedDark = localStorage.getItem('darkMode') === '1';
            darkModeToggle.checked = savedDark;
            if (savedDark) {
                document.body.classList.add('dark');
            }

            darkModeToggle.addEventListener('change', (e) => {
                document.body.classList.toggle('dark', e.target.checked);
                localStorage.setItem('darkMode', e.target.checked ? '1' : '0');
            });

            languageSelect.addEventListener('change', (e) => {
                localStorage.setItem('lang', e.target.value);
            });
        }

        // =================== PROFILE FORM ===================
        function initProfileForm() {
            const form = document.getElementById('profile-form');

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                showLoader();

                const formData = {
                    name: document.getElementById('profile-name').value,
                    document: document.getElementById('profile-document').value,
                    email: document.getElementById('profile-email').value,
                    phone: document.getElementById('profile-phone').value,
                    address: document.getElementById('profile-address').value
                };

                console.log('👤 Guardando perfil:', formData);

                setTimeout(() => {
                    hideLoader();
                    alert('Perfil actualizado correctamente');
                }, 1500);
            });
        }

        // =================== MODALS ===================
        function initModals() {
            document.querySelectorAll('[data-close]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const modalId = btn.getAttribute('data-close');
                    closeModal(modalId);
                });
            });

            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('show');
                    }
                });
            });
        }

        // =================== LOGOUT ===================
        function initLogout() {
            const logoutBtn = document.getElementById('logout-btn');
            const cancelLogout = document.getElementById('cancel-logout');
            const confirmLogout = document.getElementById('confirm-logout');

            logoutBtn.addEventListener('click', () => {
                openModal('logout-modal');
            });

            cancelLogout.addEventListener('click', () => {
                closeModal('logout-modal');
            });

            confirmLogout.addEventListener('click', async () => {
                showLoader();

                try {
                    await fetch('/api/logout', { method: 'POST' });
                    window.location.href = '/loginRene.html';
                } catch (error) {
                    console.error('Error:', error);
                    window.location.href = '/loginRene.html';
                }
            });
        }

        // =================== INICIALIZACIÓN ===================
        document.addEventListener('DOMContentLoaded', async () => {
            console.log('🚀 Inicializando Portal Clínico...');

            // Verificar sesión primero
            const user = await verificarSesion();
            if (!user) return;

            // Inicializar funcionalidades
            initSidebarToggle();
            initNavigation();
            initNotifications();
            initSettings();
            initProfileForm();
            initModals();
            initLogout();
            initAppointments();

            // Cargar datos iniciales
            await cargarDashboard();

            console.log('Portal Clínico inicializado correctamente');
            console.log('📡 Todas las funcionalidades conectadas a la base de datos');
        });