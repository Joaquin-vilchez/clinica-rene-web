const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const session = require('express-session');
const nodemailer = require('nodemailer'); // Necesario para correos
const crypto = require('crypto');         // Necesario para generar tokens seguros

const app = express();

// --- CONFIGURACIÓN PRINCIPAL ---
const PORT = 3000; 

// 🛑 IMPORTANTE: Si vas a probar desde el celular, cambia 'localhost' por tu IP (ej. '192.168.1.20')
const HOST = 'localhost'; 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname))); // Sirve archivos estáticos (html, css, js)

// Configuración de Sesiones
app.use(session({
    secret: 'tu_secreto_muy_seguro_aqui',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 // 24 horas
    }
}));

// Pool de Conexión MySQL
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'sistemaRene_FINAL'
});

// --- CONFIGURACIÓN DE CORREO (SMTP) ---
// Configuración para GMAIL
const transporter = nodemailer.createTransport({
    service: 'gmail',  // Usamos el servicio predefinido de Gmail
    auth: {
        user: "joaquimvilchezquispe@gmail.com",
        pass: "mbuh bqhx lmcn onqf" // ⚠️ Recuerda borrar/cambiar esta contraseña cuando termines tu proyecto
    }
});

// Función auxiliar para enviar el correo (AQUÍ SE APLICA EL CAMBIO DEL HOST)
async function sendResetEmail(email, token, nDocumento) {
    const resetUrl = `http://${HOST}:${PORT}/resetPasswordRene.html?token=${token}`;

    const mailOptions = {
        from: '"Clínica René" <no-reply@clinicarene.com>',
        to: email,
        subject: 'Recuperar Contraseña - Clínica René',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2c7fb8;">Restablecimiento de Contraseña</h2>
                <p>Hola, usuario con documento <strong>${nDocumento}</strong>:</p>
                <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
                <p>Haz clic en el siguiente botón para crear una nueva clave (el enlace expira en 1 hora):</p>
                <div style="margin: 20px 0;">
                    <a href="${resetUrl}" style="background-color: #2c7fb8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer Contraseña</a>
                </div>
                <p style="font-size: 12px; color: #777;">Si no solicitaste esto, ignora este mensaje.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Correo enviado a: ${email}`);
    } catch (error) {
        console.error('❌ ERROR SMTP:', error);
    }
}

// Middleware de Autenticación
const checkAuth = (req, res, next) => {
    if (req.session.id_Persona) {
        next();
    } else {
        console.warn('[AUTH] Intento de acceso no autorizado');
        res.status(401).json({ error: 'No autorizado' });
    }
};

// === SCRIPT AUTOMÁTICO: HASHEAR CONTRASEÑAS ===
(async () => {
    console.log("[SERVER] Verificando contraseñas...");
    let connection;
    try {
        connection = await pool.getConnection();
        const [users] = await connection.query(
            "SELECT id_Users, pass_Users FROM usuariosClinica WHERE pass_Users IN ('123456')"
        );
        for (const user of users) {
            const hash = await bcrypt.hash(user.pass_Users, 10);
            await connection.query(
                "UPDATE usuariosClinica SET pass_Users = ? WHERE id_Users = ?",
                [hash, user.id_Users]
            );
        }
        if (users.length > 0) {
            console.log(`[SERVER] ${users.length} contraseñas hasheadas automáticamente.`);
        }
    } catch (error) {
        console.error("[SERVER] Error verificación inicial:", error.code);
    } finally {
        if (connection) connection.release();
    }
})();

// === RUTAS DE VISTAS (HTML) ===
app.get('/', (req, res) => {
    res.redirect('/loginRene.html');
});

app.get('/loginRene.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'loginRene.html'));
});

app.get('/resetPasswordRene.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'resetPasswordRene.html'));
});

app.get('/especialidadRene.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'especialidadRene.html'));
});

app.get('/sistemaRene.html', (req, res) => {
    if (req.session.id_Persona) {
        res.sendFile(path.join(__dirname, 'sistemaRene.html'));
    } else {
        res.redirect('/loginRene.html?error=no_sesion');
    }
});

// === REGISTRO DE PACIENTE CON VALIDACIÓN DE MENOR/TUTOR ===
app.post('/registro-paciente', async (req, res) => {
    const { 
        nombres, apellidoPaterno, apellidoMaterno, nDocumento, contrasena, 
        telefono, genero, fecha_nacimiento, direccion, email_personal,
        tutorNombre, tutorDocumento, tutorTelefono, tutorEmail // DATOS DEL TUTOR
    } = req.body;
    
    // 1. Validaciones básicas
    if (!nombres || !apellidoPaterno || !nDocumento || !contrasena || !genero || !fecha_nacimiento) {
        return res.redirect('/loginRene.html?error=campos_obligatorios');
    }
    
    // Función de cálculo de edad (debe estar definida en server.js o utilidades)
    const calculateAge = (dateString) => {
        const diff = Date.now() - new Date(dateString).getTime();
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const age = calculateAge(fecha_nacimiento);
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // --- 2. PROCESAR TUTOR SI ES MENOR DE EDAD ---
        let id_Persona_Tutor = null;
        if (age < 18) {
            if (!tutorNombre || !tutorDocumento) {
                await connection.rollback();
                // Retornar error específico
                return res.redirect('/loginRene.html?error=menor_sin_tutor');
            }

            // Buscar si el tutor ya existe
            let [tutorRows] = await connection.query(`
                SELECT id_Persona FROM personas WHERE numero_documento = ?
            `, [tutorDocumento]);

            if (tutorRows.length === 0) {
                // A. Insertar Persona (Tutor) si no existe. Asumimos el rol 'O' (Otro) para diferenciarlo inicialmente
                const sqlTutor = `
                    INSERT INTO personas (nombre, apellido_paterno, numero_documento, telefono, email_personal, genero, origen_registro, perfil_completo) 
                    VALUES (?, ?, ?, ?, ?, 'O', 'Web', TRUE)
                `;
                const [resultTutor] = await connection.query(sqlTutor, [
                    tutorNombre.split(' ')[0], 
                    tutorNombre.split(' ').slice(1).join(' ') || 'Tutor',
                    tutorDocumento, 
                    tutorTelefono || null, 
                    tutorEmail || null,
                ]);
                id_Persona_Tutor = resultTutor.insertId;
            } else {
                id_Persona_Tutor = tutorRows[0].id_Persona;
            }
        }

        // --- 3. INSERTAR PERSONA (PACIENTE MENOR O MAYOR) ---
        const passwordHash = await bcrypt.hash(contrasena, 10);
        const [roles] = await connection.query("SELECT id_Rol FROM rolesClinica WHERE nombre_Rol = 'Paciente'");
        if (roles.length === 0) throw new Error('Rol Paciente no encontrado');

        // Insertar Persona
        const sqlPersona = `
            INSERT INTO personas (nombre, apellido_paterno, apellido_materno, telefono, nacionalidad, numero_documento, genero, fecha_nacimiento, direccion, email_personal, origen_registro) 
            VALUES (?, ?, ?, ?, 'Peruana', ?, ?, ?, ?, ?, 'Web')
        `;
        const [resultPersona] = await connection.query(sqlPersona, [
            nombres, apellidoPaterno, apellidoMaterno, telefono || null, nDocumento, genero, fecha_nacimiento, direccion || null, email_personal || null
        ]);
        const nuevoIdPersona = resultPersona.insertId;

        // Crear Usuario
        const sqlUsuario = `INSERT INTO usuariosClinica (id_Rol, id_Persona, pass_Users, email_Users) VALUES (?, ?, ?, ?)`;
        await connection.query(sqlUsuario, [roles[0].id_Rol, nuevoIdPersona, passwordHash, email_personal || null]);

        // Crear Paciente
        await connection.query(`INSERT INTO pacientes (id_Persona) VALUES (?)`, [nuevoIdPersona]);
        const [pacRows] = await connection.query("SELECT id_Paciente FROM pacientes WHERE id_Persona = ?", [nuevoIdPersona]);
        const id_Paciente = pacRows[0].id_Paciente;

        // --- 4. REGISTRAR TUTORÍA (Si es menor) ---
        if (age < 18 && id_Persona_Tutor) {
            // La relación es entre el id_Persona del Tutor y el id_Paciente del menor
            await connection.query(`INSERT INTO tutores_menores (id_Tutor, id_Menor, tipo_relacion) VALUES (?, ?, 'Tutor Legal')`, [id_Persona_Tutor, id_Paciente]);
        }

        await connection.commit();

        // --- 5. INICIAR SESIÓN ---
        req.session.id_Persona = nuevoIdPersona;
        req.session.id_Paciente = id_Paciente;
        req.session.nombre = nombres;
        req.session.apellidos = `${apellidoPaterno} ${apellidoMaterno}`;
        res.redirect('/sistemaRene.html');

    } catch (error) {
        console.error('[REGISTRO] Error:', error);
        if (connection) await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') return res.redirect('/loginRene.html?error=dni_duplicado');
        if (error.message === 'menor_sin_tutor') return res.redirect('/loginRene.html?error=menor_sin_tutor');
        res.redirect('/loginRene.html?error=registro');
    } finally {
        if (connection) connection.release(); // Corregido: rselease() -> release()
    }
});

// === LOGIN ===
app.post('/login', async (req, res) => {
    const { nDocumento, contrasena } = req.body;
    if (!nDocumento || !contrasena) return res.redirect('/loginRene.html?error=campos_vacios');

    let connection;
    try {
        connection = await pool.getConnection();
        const sqlLogin = `
            SELECT P.id_Persona, P.nombre, P.apellido_paterno, P.apellido_materno, U.pass_Users, R.nombre_Rol
            FROM personas AS P
            JOIN usuariosClinica AS U ON P.id_Persona = U.id_Persona
            JOIN rolesClinica AS R ON U.id_Rol = R.id_Rol
            WHERE P.numero_documento = ?
        `;
        const [rows] = await connection.query(sqlLogin, [nDocumento]);

        if (rows.length === 0) return res.redirect('/loginRene.html?error=usuario_no_encontrado');

        const usuario = rows[0];
        const esCorrecta = await bcrypt.compare(contrasena, usuario.pass_Users);

        if (esCorrecta) {
            const [pacienteRows] = await connection.query("SELECT id_Paciente FROM pacientes WHERE id_Persona = ?", [usuario.id_Persona]);
            if (pacienteRows.length === 0) return res.redirect('/loginRene.html?error=no_paciente');

            req.session.id_Persona = usuario.id_Persona;
            req.session.id_Paciente = pacienteRows[0].id_Paciente;
            req.session.nombre = usuario.nombre;
            req.session.apellidos = `${usuario.apellido_paterno} ${usuario.apellido_materno}`;
            res.redirect('/sistemaRene.html');
        } else {
            res.redirect('/loginRene.html?error=contrasena_incorrecta');
        }
    } catch (error) {
        console.error('[LOGIN] Error:', error);
        res.redirect('/loginRene.html?error=servidor');
    } finally {
        if (connection) connection.release();
    }
});

// === RECUPERACIÓN DE CONTRASEÑA (FORGOT PASSWORD) ===
app.post('/forgot-password', async (req, res) => {
    const { identificador } = req.body; 

    if (!identificador) return res.status(400).json({ error: 'Faltan datos' });

    let connection;
    try {
        connection = await pool.getConnection();
        
        const [rows] = await connection.query(`
            SELECT P.id_Persona, P.numero_documento, U.email_Users
            FROM personas AS P
            JOIN usuariosClinica AS U ON P.id_Persona = U.id_Persona
            WHERE P.numero_documento = ? OR U.email_Users = ?
        `, [identificador, identificador]);

        if (rows.length > 0) {
            const user = rows[0];
            
            const resetToken = crypto.randomBytes(32).toString('hex');
            const expirationDate = new Date(Date.now() + 3600000); // 1 hora

            await connection.query('DELETE FROM reset_tokens WHERE id_Persona = ?', [user.id_Persona]);
            await connection.query(
                'INSERT INTO reset_tokens (id_Persona, token, expiration) VALUES (?, ?, ?)',
                [user.id_Persona, resetToken, expirationDate]
            );

            if (user.email_Users) {
                await sendResetEmail(user.email_Users, resetToken, user.numero_documento);
            } else {
                console.log(`[FORGOT] Usuario ${user.numero_documento} encontrado pero sin email.`);
            }
        }

        res.json({ ok: true, message: 'Si los datos son correctos, se envió el correo.' });

    } catch (error) {
        console.error('[FORGOT] Error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        if (connection) connection.release();
    }
});

// === RESTABLECER CONTRASEÑA (RESET PASSWORD) ===
app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) return res.status(400).json({ error: 'Faltan datos' });

    let connection;
    try {
        connection = await pool.getConnection();
        
        const [tokenRows] = await connection.query(
            'SELECT id_Persona FROM reset_tokens WHERE token = ? AND expiration > NOW()',
            [token]
        );

        if (tokenRows.length === 0) {
            return res.status(400).json({ error: 'El enlace expiró o no es válido.' });
        }

        const idPersona = tokenRows[0].id_Persona;
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await connection.query('UPDATE usuariosClinica SET pass_Users = ? WHERE id_Persona = ?', [hashedPassword, idPersona]);
        await connection.query('DELETE FROM reset_tokens WHERE token = ?', [token]);

        res.json({ ok: true, message: 'Contraseña actualizada con éxito.' });

    } catch (error) {
        console.error('[RESET] Error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        if (connection) connection.release();
    }
});

// === API PÚBLICA: ESPECIALIDADES ===
app.get('/api/public/especialidades', async (req, res) => {
    try {
        const [especialidades] = await pool.query(
            "SELECT * FROM especialidades WHERE estado_Especialidad = 'Activa' ORDER BY nombre_Especialidad ASC"
        );
        res.json(especialidades);
    } catch (error) {
        console.error('[API PUBLIC] Error especialidades:', error);
        res.status(500).json({ error: 'Error al obtener especialidades' });
    }
});

// === API: SESIÓN (DETECTAR TUTORÍA) ===
app.get('/api/session', checkAuth, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const id_Persona = req.session.id_Persona;

        if (!id_Persona) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        // 1. Obtener menores a cargo
        const [menores] = await connection.query(`
            SELECT P.nombre, TM.tipo_relacion
            FROM tutores_menores AS TM
            JOIN pacientes AS PAC ON TM.id_Menor = PAC.id_Paciente
            JOIN personas AS P ON PAC.id_Persona = P.id_Persona
            WHERE TM.id_Tutor = ?
        `, [id_Persona]);

        // 2. Crear respuesta con datos de tutoría
        const responseData = {
            id_Persona: id_Persona,
            id_Paciente: req.session.id_Paciente,
            nombre: req.session.nombre,
            apellidos: req.session.apellidos,
            esTutor: menores.length > 0,
            menores: menores
        };
        
        res.json(responseData);

    } catch (error) {
        console.error('[API /session] ERROR al detectar tutoría:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        if (connection) connection.release();
    }
});

// === API: LOGOUT ===
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Error al cerrar sesión' });
        res.clearCookie('connect.sid');
        res.json({ message: 'Sesión cerrada' });
    });
});

// === API: DASHBOARD ===
app.get('/api/dashboard', checkAuth, async (req, res) => {
    try {
        const id_Paciente = req.session.id_Paciente;
        const sqlProxima = `
            SELECT C.fechaHora_Cita, CONCAT(P.nombre, ' ', P.apellido_paterno) AS doctor
            FROM citas AS C
            JOIN doctores AS D ON C.id_Doctor = D.id_Doctor
            JOIN personas AS P ON D.id_Persona = P.id_Persona
            WHERE C.id_Paciente = ? AND C.fechaHora_Cita > NOW() AND C.estado_Cita NOT IN ('Cancelada', 'No Asistio')
            ORDER BY C.fechaHora_Cita ASC LIMIT 1
        `;
        const [proxima] = await pool.query(sqlProxima, [id_Paciente]);

        const sqlRecientes = `
            SELECT C.motivo_Consulta, C.fechaHora_Cita, C.estado_Cita, CONCAT(P.nombre, ' ', P.apellido_paterno) AS doctor
            FROM citas AS C
            JOIN doctores AS D ON C.id_Doctor = D.id_Doctor
            JOIN personas AS P ON D.id_Persona = P.id_Persona
            WHERE C.id_Paciente = ? ORDER BY C.fechaHora_Cita DESC LIMIT 3
        `;
        const [recientes] = await pool.query(sqlRecientes, [id_Paciente]);

        const [recetas] = await pool.query("SELECT COUNT(*) AS count FROM recetas WHERE id_Paciente = ? AND estado = 'Activa'", [id_Paciente]);
        const [labs] = await pool.query("SELECT COUNT(*) AS count FROM ordenes_laboratorio WHERE id_Paciente = ? AND estado = 'Pendiente'", [id_Paciente]);

        res.json({
            proximaCita: proxima.length > 0 ? proxima[0] : null,
            recetasActivas: recetas[0].count,
            resultadosPendientes: labs[0].count,
            citasRecientes: recientes
        });
    } catch (error) {
        console.error('[API /dashboard] ERROR:', error);
        res.status(500).json({ error: 'Error dashboard' });
    }
});

// === API: ESPECIALIDADES (PRIVADA) ===
app.get('/api/especialidades', checkAuth, async (req, res) => {
    try {
        const [especialidades] = await pool.query("SELECT * FROM especialidades WHERE estado_Especialidad = 'Activa' ORDER BY nombre_Especialidad ASC");
        res.json(especialidades);
    } catch (error) {
        res.status(500).json({ error: 'Error especialidades' });
    }
});

// === API: MÉDICOS ===
app.get('/api/medicos', checkAuth, async (req, res) => {
    try {
        const { id_especialidad } = req.query;
        let sql = `
            SELECT D.id_Doctor, CONCAT(P.nombre, ' ', P.apellido_paterno) AS nombre_completo,
                   E.nombre_Especialidad, D.id_Especialidad, MIN(H.id_Consultorio) AS id_Consultorio
            FROM doctores AS D
            JOIN personas AS P ON D.id_Persona = P.id_Persona
            JOIN especialidades AS E ON D.id_Especialidad = E.id_Especialidad
            LEFT JOIN horarios_doctores AS H ON D.id_Doctor = H.id_Doctor AND H.estado_Horario = 'Activo'
            WHERE D.estado_Doctor = 'Activo'
        `;
        const params = [];
        if (id_especialidad) {
            sql += ` AND D.id_Especialidad = ?`;
            params.push(id_especialidad);
        }
        sql += ` GROUP BY D.id_Doctor, P.nombre, P.apellido_paterno, E.nombre_Especialidad, D.id_Especialidad ORDER BY P.nombre ASC`;
        
        const [medicos] = await pool.query(sql, params);
        res.json(medicos);
    } catch (error) {
        res.status(500).json({ error: 'Error médicos' });
    }
});

// === API: HORARIOS DISPONIBLES ===
app.get('/api/horarios', checkAuth, async (req, res) => {
    const { id_doctor, fecha } = req.query;
    if (!id_doctor || !fecha) return res.status(400).json({ error: 'Faltan parámetros' });

    try {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
        const fechaObj = new Date(fecha + 'T12:00:00Z');
        const diaSemana = dias[fechaObj.getUTCDay()];

        const [horarios] = await pool.query(
            "SELECT hora_inicio, hora_fin FROM horarios_doctores WHERE id_Doctor = ? AND dia_semana = ? AND estado_Horario = 'Activo'",
            [id_doctor, diaSemana]
        );

        if (horarios.length === 0) return res.json([]);

        const [citas] = await pool.query(
            "SELECT TIME(fechaHora_Cita) AS hora_reservada FROM citas WHERE id_Doctor = ? AND DATE(fechaHora_Cita) = ? AND estado_Cita NOT IN ('Cancelada', 'No Asistio')",
            [id_doctor, fecha]
        );

        const horasReservadas = new Set(citas.map(c => c.hora_reservada.substring(0, 5)));
        const disponibles = [];

        for (const turno of horarios) {
            let [hInicio, mInicio] = turno.hora_inicio.split(':').map(Number);
            let [hFin, mFin] = turno.hora_fin.split(':').map(Number);
            let actual = new Date(); actual.setHours(hInicio, mInicio, 0, 0);
            let limite = new Date(); limite.setHours(hFin, mFin, 0, 0);

            while (actual < limite) {
                const horaSlot = actual.toTimeString().substring(0, 5);
                if (!horasReservadas.has(horaSlot)) disponibles.push(horaSlot);
                actual.setMinutes(actual.getMinutes() + 30);
            }
        }
        res.json(disponibles);
    } catch (error) {
        res.status(500).json({ error: 'Error horarios' });
    }
});

// === API: CITAS - LISTAR ===
app.get('/api/citas', checkAuth, async (req, res) => {
    try {
        const [citas] = await pool.query(`
            SELECT C.id_Cita, C.tipo_consulta, C.fechaHora_Cita, C.duracion_minutos, C.motivo_Consulta, C.estado_Cita,
                   CONCAT(PD.nombre, ' ', PD.apellido_paterno) AS doctor, E.nombre_Especialidad AS especialidad
            FROM citas AS C
            JOIN doctores AS D ON C.id_Doctor = D.id_Doctor
            JOIN personas AS PD ON D.id_Persona = PD.id_Persona
            JOIN especialidades AS E ON D.id_Especialidad = E.id_Especialidad
            WHERE C.id_Paciente = ? ORDER BY C.fechaHora_Cita DESC
        `, [req.session.id_Paciente]);
        res.json(citas);
    } catch (error) {
        res.status(500).json({ error: 'Error citas' });
    }
});

// === API: CITAS - CREAR ===
app.post('/api/citas', checkAuth, async (req, res) => {
    try {
        const { id_doctor, id_especialidad, id_consultorio, fecha, hora, tipo_consulta, motivo } = req.body;
        const fechaHora_Cita = `${fecha} ${hora}:00`;

        const [result] = await pool.query(`
            INSERT INTO citas (id_Paciente, id_Doctor, id_Consultorio, fechaHora_Cita, duracion_minutos, estado_Cita, tipo_consulta, motivo_Consulta)
            VALUES (?, ?, ?, ?, 30, 'Programada', ?, ?)
        `, [req.session.id_Paciente, id_doctor, id_consultorio, fechaHora_Cita, tipo_consulta, motivo]);

        const id_Cita = result.insertId;
        const [espRows] = await pool.query("SELECT precio_consulta FROM especialidades WHERE id_Especialidad = ?", [id_especialidad]);
        const monto = espRows.length > 0 ? espRows[0].precio_consulta : 70.00;
        const montoConIGV = monto * 1.18;

        await pool.query(`
            INSERT INTO pagos (id_Cita, id_Paciente, monto, estado_Pago, monto_Original)
            VALUES (?, ?, ?, 'Pendiente', ?)
        `, [id_Cita, req.session.id_Paciente, montoConIGV, monto]);

        res.status(201).json({ message: 'Cita creada', id_Cita, monto: montoConIGV });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Horario ocupado' });
        res.status(500).json({ error: 'Error crear cita' });
    }
});

// === API: TARJETAS ===
app.get('/api/tarjetas', checkAuth, async (req, res) => {
    try {
        const [tarjetas] = await pool.query("SELECT * FROM tarjetas_guardadas WHERE id_Paciente = ? ORDER BY fecha_registro DESC", [req.session.id_Paciente]);
        res.json(tarjetas);
    } catch (error) {
        res.status(500).json({ error: 'Error tarjetas' });
    }
});

app.post('/api/tarjetas', checkAuth, async (req, res) => {
    try {
        const { numero, titular, vencimiento } = req.body;
        if (!numero || !titular || !vencimiento) return res.status(400).json({ error: 'Faltan datos' });

        const ultimos = numero.replace(/\s/g, '').slice(-4);
        const [resDB] = await pool.query(
            "INSERT INTO tarjetas_guardadas (id_Paciente, tipo, ultimos_digitos, titular, vencimiento) VALUES (?, 'Debito', ?, ?, ?)",
            [req.session.id_Paciente, ultimos, titular, vencimiento]
        );
        res.status(201).json({ message: 'Tarjeta agregada', id_Tarjeta: resDB.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar tarjeta' });
    }
});

// === API: PERFIL (INCLUYE TUTORÍA) ===
app.get('/api/perfil', checkAuth, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const id_Persona = req.session.id_Persona;
        const id_Paciente = req.session.id_Paciente;

        if (!id_Paciente) {
            return res.status(404).json({ error: 'ID de Paciente no encontrado en la sesión.' });
        }

        // 1. Obtener datos personales del Paciente
        const [pacienteRows] = await connection.query(`
            SELECT P.nombre, P.apellido_paterno, P.apellido_materno, P.numero_documento, U.email_Users, P.telefono, P.direccion 
            FROM pacientes AS PA 
            JOIN personas AS P ON PA.id_Persona = P.id_Persona
            JOIN usuariosClinica AS U ON P.id_Persona = U.id_Persona
            WHERE PA.id_Paciente = ?
        `, [id_Paciente]);

        if (pacienteRows.length === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado.' });
        }

        let perfil = pacienteRows[0];
        
        // 2. BUSCAR INFORMACIÓN DE TUTOR (Si el usuario es el Menor)
        const [tutorRows] = await connection.query(`
            SELECT CONCAT(P.nombre, ' ', P.apellido_paterno) AS nombre_tutor, 
                   P.numero_documento, TM.tipo_relacion
            FROM tutores_menores AS TM
            JOIN personas AS P ON TM.id_Tutor = P.id_Persona
            WHERE TM.id_Menor = ?
        `, [id_Paciente]);

        if (tutorRows.length > 0) {
            perfil.esMenor = true;
            perfil.tutor = tutorRows[0];
        } else {
            perfil.esMenor = false;
        }

        // 3. BUSCAR INFORMACIÓN DE MENORES A CARGO (Si el usuario es un Tutor)
        const [menorRows] = await connection.query(`
            SELECT CONCAT(P.nombre, ' ', P.apellido_paterno) AS nombre_menor, 
                   TM.tipo_relacion
            FROM tutores_menores AS TM
            JOIN pacientes AS PAC ON TM.id_Menor = PAC.id_Paciente
            JOIN personas AS P ON PAC.id_Persona = P.id_Persona
            WHERE TM.id_Tutor = ?
        `, [id_Persona]);

        if (menorRows.length > 0) {
            perfil.esTutor = true;
            perfil.menores = menorRows;
        } else {
            perfil.esTutor = false;
        }

        res.json(perfil);

    } catch (e) {
        console.error('Error al cargar perfil detallado:', e);
        res.status(500).json({ error: 'Error al cargar el perfil' });
    } finally {
        if (connection) connection.release();
    }
});

// === API: RECETAS, HISTORIAL, LABORATORIO ===
app.get('/api/recetas', checkAuth, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT R.*, CONCAT(P.nombre, ' ', P.apellido_paterno) AS doctor
            FROM recetas AS R JOIN doctores AS D ON R.id_Doctor = D.id_Doctor JOIN personas AS P ON D.id_Persona = P.id_Persona
            WHERE R.id_Paciente = ? ORDER BY R.fecha_emision DESC
        `, [req.session.id_Paciente]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Error recetas' }); }
});

app.get('/api/historial', checkAuth, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT C.fecha_consulta, C.diagnostico, C.sintomas, C.observaciones, CONCAT(P.nombre, ' ', P.apellido_paterno) AS doctor
            FROM consultas AS C JOIN doctores AS D ON C.id_Doctor = D.id_Doctor JOIN personas AS P ON D.id_Persona = P.id_Persona
            WHERE C.id_Paciente = ? ORDER BY C.fecha_consulta DESC
        `, [req.session.id_Paciente]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Error historial' }); }
});

app.get('/api/laboratorio', checkAuth, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM ordenes_laboratorio WHERE id_Paciente = ? ORDER BY fecha_orden DESC", [req.session.id_Paciente]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Error laboratorio' }); }
});

// === MANEJO DE ERRORES ===
app.use((req, res) => res.status(404).send('Página no encontrada'));
app.use((err, req, res, next) => {
    console.error('Error global:', err);
    res.status(500).redirect('/loginRene.html?error=servidor');
});

// === INICIAR SERVIDOR ===
app.listen(PORT, () => {
    console.log(`[SERVER] Ejecutándose en: http://localhost:${PORT}`);
});