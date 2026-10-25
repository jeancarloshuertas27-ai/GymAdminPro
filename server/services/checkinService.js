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
             f.nivel_actual, f.fecha_inscripcion_original
      FROM usuarios u
      LEFT JOIN membresias m ON m.usuario_id = u.id
      LEFT JOIN fidelidad f ON f.usuario_id = u.id
      WHERE u.dni = ?
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
      evaluation.motivo || evaluation.warningMessage || (user ? user.plan_tag : 'NO REGISTRADO')
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

    return {
      resultado: evaluation.resultado,
      titulo: evaluation.titulo,
      kicker: evaluation.kicker,
      authCode: `#AUTH-${cleanDni.slice(-5)}`,
      grantAccess: evaluation.grantAccess,
      warningMessage: evaluation.warningMessage || null,
      atleta: {
        id: user.id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        nombreCompleto: `${user.nombres} ${user.apellidos}`.toUpperCase(),
        dni: user.dni,
        edad: '27 AÑOS', // Valor por defecto visual
        fotoUrl: user.foto_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        tiempoRestante: remaining.text,
        tiempoRestanteCorto: remaining.cardText,
        estadoMembresia: remaining.text,
        diasRestantes: remaining.totalDays,
        trafficColor: remaining.trafficColor,
        fechaVencimiento: user.fecha_vencimiento,
        nivelFidelidad: fidelity.name,
        planTag: user.plan_tag || 'VIP ANUAL',
        rutinaHoy: user.rutina_asignada || 'FUERZA & EMPUJE PUSH DAY',
        rutinaAsignada: user.rutina_asignada || 'FUERZA & EMPUJE PUSH DAY',
        asistenciaMes: '18 SESIONES COMPLETADAS (REGULARIDAD 94%)',
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
      const timePart = r.timestamp ? r.timestamp.split(' ')[1] || r.timestamp : '';
      return {
        id: r.id,
        hora: timePart ? timePart.substring(0, 8) : 'En vivo',
        nombre: r.nombres && r.apellidos ? `${r.nombres} ${r.apellidos}` : `DNI: ${r.dni_ingresado}`,
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

