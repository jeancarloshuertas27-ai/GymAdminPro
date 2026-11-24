import db from '../db.js';
import { evaluateCheckIn, calculateFidelity, calculateRemainingTime } from '../utils/fidelity.js';

export class CheckinService {
  /**
   * Procesa el check-in de un atleta dado su DNI
   */
  static processCheckin(dni, operadorId = null) {
    const cleanDni = String(dni).trim();

    // 1. Buscar usuario con rol MIEMBRO
    const user = db.prepare(`
      SELECT u.id, u.nombres, u.apellidos, u.dni, u.foto_url,
             m.fecha_vencimiento, m.estado, m.plan_tag, m.rutina_asignada,
             rp.id AS rutina_id, rp.nombre AS plantilla_nombre,
             f.nivel_actual, f.fecha_inscripcion_original
      FROM usuarios u
      LEFT JOIN membresias m ON m.usuario_id = u.id
      LEFT JOIN miembro_rutinas_asignadas mra ON mra.usuario_id = u.id
      LEFT JOIN rutinas_plantillas rp ON rp.id = mra.rutina_id AND rp.activo = 1
      LEFT JOIN fidelidad f ON f.usuario_id = u.id
      WHERE u.dni = ? AND u.rol = 'MIEMBRO'
      ORDER BY m.id DESC LIMIT 1
    `).get(cleanDni);

    const evaluation = evaluateCheckIn(user);

    // 2. Registrar en auditoría checkins
    const insert = db.prepare(`
      INSERT INTO checkins (usuario_id, dni_ingresado, resultado, operador_id, motivo)
      VALUES (?, ?, ?, ?, ?)
    `);

    insert.run(
      user ? user.id : null,
      cleanDni,
      evaluation.resultado,
      operadorId,
      evaluation.motivo || evaluation.warningMessage || (user ? (user.plan_tag || 'MEMBRESÍA') : 'NO REGISTRADO')
    );

    // 3. Formatear respuesta enriquecida para el semáforo y tarjeta
    if (!user) {
      return {
        resultado: evaluation.resultado,
        titulo: evaluation.titulo,
        kicker: evaluation.kicker,
        motivo: evaluation.motivo,
        grantAccess: false,
      };
    }

    const fidelity = calculateFidelity(user.fecha_inscripcion_original || new Date(), user.fecha_vencimiento);
    const remaining = calculateRemainingTime(user.fecha_vencimiento);

    // Contar asistencias reales del mes en curso (hora Perú)
    const mesPeru = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }).slice(0, 7);
    const asistenciaRow = db.prepare(`
      SELECT COUNT(*) AS total
      FROM checkins
      WHERE usuario_id = ? AND strftime('%Y-%m', timestamp) = ?
        AND resultado IN ('VERDE_AUTORIZADO', 'NARANJA_AVISO', 'MANUAL_FORZADO')
    `).get(user.id, mesPeru);
    const checkinsMes = asistenciaRow ? Number(asistenciaRow.total) : 0;

    // Obtener ejercicios reales asignados para el día de hoy (si tiene plantilla asignada)
    const diaNombreRaw = new Date().toLocaleDateString('es-PE', { weekday: 'long', timeZone: 'America/Lima' });
    const diaNormalizado = diaNombreRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    let ejerciciosHoy = [];
    let enfoqueHoy = user.plantilla_nombre || user.rutina_asignada || 'SIN RUTINA ASIGNADA';

    if (user.rutina_id) {
      const diaRow = db.prepare(`
        SELECT id, enfoque_muscular
        FROM rutinas_dias
        WHERE rutina_id = ? AND dia_semana = ?
        LIMIT 1
      `).get(user.rutina_id, diaNormalizado);

      if (diaRow) {
        const esDescanso = String(diaRow.enfoque_muscular || '').toUpperCase() === 'REST';
        enfoqueHoy = esDescanso ? 'DESCANSO PROGRAMADO' : (diaRow.enfoque_muscular || enfoqueHoy);
        if (!esDescanso) {
          ejerciciosHoy = db.prepare(`
            SELECT re.series, re.repeticiones, re.tiempo_descanso_segundos,
                   m.nombre AS nombre_ejercicio, m.nombre AS maquina_nombre, m.codigo_etiqueta, m.grupo_muscular
            FROM rutinas_ejercicios re
            LEFT JOIN maquinas_ejercicios m ON m.id = re.maquina_id
            WHERE re.rutina_dia_id = ?
            ORDER BY re.orden_secuencial ASC
          `).all(diaRow.id);
        }
      }
    }

    const rutinaDisplay = user.plantilla_nombre || user.rutina_asignada || 'SIN RUTINA ASIGNADA';

    return {
      resultado: evaluation.resultado,
      titulo: evaluation.titulo,
      kicker: evaluation.kicker,
      authCode: `#AUTH-${cleanDni.slice(-5)}`,
      grantAccess: evaluation.grantAccess,
      warningMessage: evaluation.warningMessage || null,
      membresia: {
        plan_tag: user.plan_tag || 'SIN MEMBRESÍA',
        fecha_vencimiento: user.fecha_vencimiento,
        dias_restantes: remaining.totalDays,
      },
      atleta: {
        id: user.id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        nombreCompleto: `${user.nombres} ${user.apellidos}`.toUpperCase(),
        dni: user.dni,
        fotoUrl: user.foto_url || null,
        tiempoRestante: remaining.text,
        tiempoRestanteCorto: remaining.cardText,
        estadoMembresia: remaining.text,
        diasRestantes: remaining.totalDays,
        trafficColor: remaining.trafficColor,
        fechaVencimiento: user.fecha_vencimiento,
        nivelFidelidad: fidelity.name,
        planTag: user.plan_tag || 'SIN MEMBRESÍA',
        rutinaHoy: enfoqueHoy,
        rutinaAsignada: rutinaDisplay,
        ejerciciosHoy,
        checkinsMes,
        asistenciaMes: `${checkinsMes} ${checkinsMes === 1 ? 'SESIÓN ESTE MES' : 'SESIONES ESTE MES'}`,
      },
    };
  }

  /**
   * Obtiene el feed cronológico de los últimos ingresos
   */
  static getRecentCheckins(limit = 10) {
    const rows = db.prepare(`
      SELECT c.id, c.dni_ingresado, c.timestamp, c.resultado, c.motivo,
             u.nombres, u.apellidos
      FROM checkins c
      LEFT JOIN usuarios u ON u.id = c.usuario_id
      ORDER BY c.timestamp DESC, c.id DESC
      LIMIT ?
    `).all(limit);

    return rows.map(r => {
      // timestamp SQLite: 'YYYY-MM-DD HH:MM:SS' UTC (sin Z). Extraemos la parte de hora.
      const timePart = r.timestamp ? r.timestamp.split(' ')[1] || '' : '';
      return {
        id: r.id,
        timestamp: r.timestamp,
        hora: timePart ? timePart.substring(0, 8) : '',
        dni: r.dni_ingresado,
        dni_ingresado: r.dni_ingresado,
        nombres: r.nombres || '',
        apellidos: r.apellidos || '',
        nombre: r.nombres && r.apellidos
          ? `${r.nombres} ${r.apellidos}`
          : `DNI ${r.dni_ingresado}`,
        detalle: r.motivo || 'ACCESO REGISTRADO',
        resultado: r.resultado,
      };
    });
  }

  /**
   * Forzar paso o pulso manual
   */
  static forceCheckin(dni, operadorId, motivo = 'PULSO MANUAL POR RECEPCIÓN') {
    const cleanDni = dni ? String(dni).trim() : '00000000';
    const user = db.prepare('SELECT id FROM usuarios WHERE dni = ?').get(cleanDni);

    db.prepare(`
      INSERT INTO checkins (usuario_id, dni_ingresado, resultado, operador_id, motivo)
      VALUES (?, ?, 'MANUAL_FORZADO', ?, ?)
    `).run(user ? user.id : null, cleanDni, operadorId, motivo);

    return { success: true, message: 'Apertura manual concedida y registrada en auditoría.' };
  }
}

