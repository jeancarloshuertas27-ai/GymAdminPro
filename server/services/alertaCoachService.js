import db from '../db.js';

export const alertaCoachService = {
  /**
   * Crea una nueva solicitud de asistencia presencial en sala desde la app del Miembro
   */
  crearAlerta(usuarioId, { maquina_numero, motivo = 'Asistencia en sala' }) {
    const cleanMaquina = String(maquina_numero || '').trim();
    if (!cleanMaquina) {
      const err = new Error('Por favor indica el número de máquina o estación en la que te encuentras.');
      err.status = 400;
      throw err;
    }

    const uid = Number(usuarioId);
    const existente = db.prepare(`
      SELECT id, maquina_numero FROM alertas_coach WHERE usuario_id = ? AND estado = 'PENDIENTE' LIMIT 1
    `).get(uid);

    if (existente) {
      const err = new Error('Ya tienes una solicitud de coach pendiente en sala');
      err.status = 409;
      throw err;
    }

    const cleanMotivo = String(motivo || 'Asistencia en sala').trim();
    const res = db.prepare(`
      INSERT INTO alertas_coach (usuario_id, maquina_numero, motivo, estado)
      VALUES (?, ?, ?, 'PENDIENTE')
    `).run(uid, cleanMaquina, cleanMotivo);

    return db.prepare(`
      SELECT 
        ac.id, ac.usuario_id, u.nombres || ' ' || u.apellidos AS miembro_nombre,
        u.dni AS miembro_dni, ac.maquina_numero, ac.motivo, ac.estado, ac.created_at
      FROM alertas_coach ac
      JOIN usuarios u ON ac.usuario_id = u.id
      WHERE ac.id = ?
    `).get(Number(res.lastInsertRowid));
  },

  /**
   * Consulta si el miembro autenticado tiene una solicitud activa en espera
   */
  getMiAlertaActiva(usuarioId) {
    return db.prepare(`
      SELECT id, usuario_id, maquina_numero, motivo, estado, created_at
      FROM alertas_coach
      WHERE usuario_id = ? AND estado = 'PENDIENTE'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(Number(usuarioId)) || null;
  },

  /**
   * Permite al propio socio cancelar su solicitud si fue enviada por error o ya se resolvió
   */
  cancelarAlertaMiembro(alertaId, usuarioId) {
    const res = db.prepare(`
      UPDATE alertas_coach
      SET estado = 'CANCELADA', atendido_at = CURRENT_TIMESTAMP
      WHERE id = ? AND usuario_id = ? AND estado = 'PENDIENTE'
    `).run(Number(alertaId), Number(usuarioId));

    if (res.changes === 0) {
      const err = new Error('Solicitud pendiente no encontrada.');
      err.status = 404;
      throw err;
    }

    return {
      message: 'Solicitud de coach cancelada.',
      estado: 'CANCELADA',
    };
  },

  /**
   * Lista todas las alertas pendientes para mostrar en vivo en Recepción y Administración
   */
  listarAlertasPendientes() {
    return db.prepare(`
      SELECT 
        ac.id,
        ac.usuario_id,
        u.nombres || ' ' || u.apellidos AS miembro_nombre,
        u.dni AS miembro_dni,
        ac.maquina_numero,
        ac.motivo,
        ac.estado,
        ac.created_at
      FROM alertas_coach ac
      JOIN usuarios u ON ac.usuario_id = u.id
      WHERE ac.estado = 'PENDIENTE'
      ORDER BY ac.created_at ASC
    `).all();
  },

  /**
   * Marca una alerta como atendida tras avisar al coach en sala
   */
  atenderAlerta(alertaId, operadorId) {
    const res = db.prepare(`
      UPDATE alertas_coach
      SET estado = 'ATENDIDA',
          atendido_por = ?,
          atendido_at = CURRENT_TIMESTAMP
      WHERE id = ? AND estado = 'PENDIENTE'
    `).run(Number(operadorId), Number(alertaId));

    if (res.changes === 0) {
      const err = new Error('Alerta pendiente no encontrada o ya atendida.');
      err.status = 404;
      throw err;
    }

    return {
      message: 'Alerta marcada como atendida.',
      estado: 'ATENDIDA',
    };
  },
};
