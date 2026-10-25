import db from '../db.js';
import { calculateFidelity, calculateRemainingTime } from '../utils/fidelity.js';

export class UserService {
  /**
   * Obtiene la lista alfabética de usuarios con filtros y métricas
   */
  static listUsers({ search = '', status = 'all', page = 1, limit = 10, currentUser = null }) {
    const isAdmin = currentUser && currentUser.rol === 'ADMINISTRADOR';

    // 1. Obtener métricas globales
    const allUsers = db.prepare(`
      SELECT u.id, u.rol, u.apellidos, u.nombres, u.dni, u.username, u.celular, u.foto_url,
             m.fecha_inicio, m.fecha_vencimiento, m.plan_tag, m.rutina_asignada,
             f.nivel_actual, f.fecha_inscripcion_original
      FROM usuarios u
      LEFT JOIN membresias m ON m.usuario_id = u.id
      LEFT JOIN fidelidad f ON f.usuario_id = u.id
      WHERE u.rol = 'MIEMBRO'
      ORDER BY u.apellidos COLLATE NOCASE ASC
    `).all();

    let activosCount = 0;
    let porVencerCount = 0;
    let vencidosPurgablesCount = 0;

    const enrichedList = allUsers.map(user => {
      const remaining = user.fecha_vencimiento ? calculateRemainingTime(user.fecha_vencimiento) : {
        totalDays: 0,
        status: 'EXPIRED',
        trafficColor: 'ROJO',
        text: 'SIN MEMBRESÍA',
        canDelete: true,
      };

      const fidelity = user.fecha_inscripcion_original && user.fecha_vencimiento
        ? calculateFidelity(user.fecha_inscripcion_original, user.fecha_vencimiento)
        : { name: 'NOVATO', level: 1 };

      if (remaining.status === 'ACTIVE') activosCount++;
      if (remaining.status === 'WARNING') porVencerCount++;
      if (remaining.canDelete) vencidosPurgablesCount++;

      return {
        id: user.id,
        apellidos: user.apellidos,
        nombres: user.nombres,
        dni: user.dni,
        username: isAdmin ? user.username : null, // Oculto para no-admins
        passwordRaw: isAdmin ? '••••••••••••' : null, // Solo Admin puede revelar
        celular: user.celular,
        fotoUrl: user.foto_url,
        planTag: user.plan_tag || 'MEMBRESÍA ACTIVA',
        rutinaAsignada: user.rutina_asignada || 'SIN RUTINA ASIGNADA',
        estadoMembresia: remaining.status === 'ACTIVE' ? 'ACTIVO' : remaining.status === 'WARNING' ? 'POR_VENCER' : 'VENCIDO',
        tiempoRestante: remaining.text,
        tiempoRestanteCorto: remaining.cardText,
        diasRestantes: remaining.totalDays,
        trafficColor: remaining.trafficColor,
        nivelFidelidad: fidelity.name,
        canDelete: remaining.canDelete,
      };
    });

    // 2. Filtrar por término de búsqueda
    let filtered = enrichedList;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(u =>
        u.apellidos.toLowerCase().includes(s) ||
        u.nombres.toLowerCase().includes(s) ||
        u.dni.includes(s) ||
        (u.username && u.username.toLowerCase().includes(s))
      );
    }

    // 3. Filtrar por pestaña de estado
    if (status === 'active') {
      filtered = filtered.filter(u => u.estadoMembresia === 'ACTIVO');
    } else if (status === 'warning') {
      filtered = filtered.filter(u => u.estadoMembresia === 'POR_VENCER');
    } else if (status === 'expired') {
      filtered = filtered.filter(u => u.estadoMembresia === 'VENCIDO');
    }

    // 4. Paginación
    const total = filtered.length;
    const pageNum = Math.max(1, Number(page));
    const pageSize = Math.max(1, Number(limit));
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (pageNum - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return {
      total,
      page: pageNum,
      limit: pageSize,
      totalPages,
      metrics: {
        totalPadron: allUsers.length,
        activos: activosCount,
        porVencer: porVencerCount,
        vencidosPurgables: vencidosPurgablesCount,
      },
      users: paginated,
    };
  }

  /**
   * Obtiene la ficha de atleta para el modal "Ver más"
   */
  static getUserDetail(id, currentUser = null) {
    const user = db.prepare(`
      SELECT u.id, u.rol, u.username, u.nombres, u.apellidos, u.dni, u.celular, u.foto_url,
             m.fecha_inicio, m.fecha_vencimiento, m.plan_tag, m.rutina_asignada,
             f.nivel_actual, f.fecha_inscripcion_original
      FROM usuarios u
      LEFT JOIN membresias m ON m.usuario_id = u.id
      LEFT JOIN fidelidad f ON f.usuario_id = u.id
      WHERE u.id = ?
    `).get(Number(id));

    if (!user) return null;

    const remaining = user.fecha_vencimiento ? calculateRemainingTime(user.fecha_vencimiento) : {
      totalDays: 0,
      daysExpired: 99,
      text: 'SIN MEMBRESÍA',
      trafficColor: 'ROJO',
      canDelete: true,
    };

    const fidelity = user.fecha_inscripcion_original && user.fecha_vencimiento
      ? calculateFidelity(user.fecha_inscripcion_original, user.fecha_vencimiento)
      : { name: 'NOVATO', level: 1, months: 0, progressPercent: 0, nextLevel: 'PRINCIPIANTE' };

    const isAdmin = currentUser && currentUser.rol === 'ADMINISTRADOR';

    return {
      id: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      nombreCompleto: `${user.apellidos}, ${user.nombres}`,
      dni: user.dni,
      username: user.username,
      celular: user.celular,
      fotoUrl: user.foto_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      membresia: {
        estado: remaining.status || 'EXPIRED',
        tiempoRestanteTexto: remaining.text,
        diasRestantes: remaining.totalDays,
        diasVencido: remaining.daysExpired || 0,
        fechaVencimiento: user.fecha_vencimiento,
        planTag: user.plan_tag || 'PLAN ANUAL TITANIUM',
        trafficColor: remaining.trafficColor,
      },
      fidelidad: {
        nivel: fidelity.name,
        nivelNumero: fidelity.level,
        tiempoAcumulado: `${fidelity.months} meses de constancia`,
        progresoSiguientePorcentaje: fidelity.progressPercent,
        siguienteNivel: fidelity.nextLevel,
        penalizado: fidelity.penalized,
      },
      rutinaActual: user.rutina_asignada || 'HIPERTROFIA & FUERZA - PUSH DAY',
      puedeEliminar: isAdmin && remaining.canDelete, // Solo si >30 días vencido bajo rol Admin
    };
  }

  /**
   * Modifica nombres, apellidos y celular (DNI y @username inmutables)
   */
  static updateUser(id, { nombres, apellidos, celular }) {
    if (!nombres || !apellidos || !celular) {
      throw new Error('Nombres, apellidos y celular son obligatorios.');
    }

    db.prepare(`
      UPDATE usuarios
      SET nombres = ?, apellidos = ?, celular = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nombres.trim(), apellidos.trim(), celular.trim(), Number(id));

    return { success: true, message: 'Datos del atleta actualizados correctamente.' };
  }

  /**
   * Borrado físico definitivo (hard delete) si >30 días de vencimiento
   */
  static deleteUser(id, currentUser) {
    if (!currentUser || currentUser.rol !== 'ADMINISTRADOR') {
      throw new Error('Solo un Administrador tiene privilegios para eliminar usuarios.');
    }

    const detail = this.getUserDetail(id, currentUser);
    if (!detail) {
      throw new Error('Usuario no encontrado.');
    }

    if (!detail.puedeEliminar) {
      throw new Error('Protocolo de purga denegado: el usuario no tiene más de 30 días de membresía vencida.');
    }

    // Borrado físico en SQLite (con ON DELETE CASCADE)
    db.prepare('DELETE FROM usuarios WHERE id = ?').run(Number(id));
    return { success: true, message: 'Usuario eliminado permanentemente de la base de datos.' };
  }
}

