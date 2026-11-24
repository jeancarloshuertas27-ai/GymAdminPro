import db from '../db.js';
import bcrypt from 'bcryptjs';
import { calculateFidelity, calculateRemainingTime } from '../utils/fidelity.js';

export class UserService {
  /**
   * Obtiene la lista alfabética de usuarios con filtros y métricas
   */
  static listUsers({ search = '', status = 'all', page = 1, limit = 10, currentUser = null }) {
    const isAdmin = currentUser && (currentUser.rol === 'ADMINISTRADOR' || currentUser.rol === 'ADMIN');

    // 1. Obtener métricas globales
    const allUsers = db.prepare(`
      SELECT u.id, u.rol, u.apellidos, u.nombres, u.dni, u.username, u.password_plain, u.celular, u.foto_url, u.created_at,
             m.fecha_inicio, m.fecha_vencimiento, m.plan_tag, m.rutina_asignada,
             rp.nombre AS plantilla_nombre,
             f.nivel_actual, f.fecha_inscripcion_original
      FROM usuarios u
      LEFT JOIN membresias m ON m.usuario_id = u.id
      LEFT JOIN miembro_rutinas_asignadas mra ON mra.usuario_id = u.id
      LEFT JOIN rutinas_plantillas rp ON rp.id = mra.rutina_id AND rp.activo = 1
      LEFT JOIN fidelidad f ON f.usuario_id = u.id
      WHERE u.rol = 'MIEMBRO'
      ORDER BY u.apellidos COLLATE NOCASE ASC
    `).all();

    let activosCount = 0;
    let porVencerCount = 0;
    let vencidosCount = 0;
    let vencidosPurgablesCount = 0;
    let sinRutinaCount = 0;

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

      const rutinaAsignada = user.plantilla_nombre || user.rutina_asignada || 'SIN RUTINA ASIGNADA';

      if (remaining.status === 'ACTIVE') activosCount++;
      else if (remaining.status === 'WARNING') porVencerCount++;
      else vencidosCount++;

      if (remaining.canDelete) vencidosPurgablesCount++;
      if (!user.plantilla_nombre && !user.rutina_asignada) sinRutinaCount++;

      return {
        id: user.id,
        rol: user.rol,
        apellidos: user.apellidos,
        nombres: user.nombres,
        dni: user.dni,
        username: isAdmin ? user.username : null, // Oculto para no-admins
        password_visible: isAdmin ? (user.password_plain || '') : null, // Visible para soporte admin
        passwordRaw: isAdmin ? (user.password_plain || '') : null,
        celular: user.celular,
        fotoUrl: user.foto_url || null,
        planTag: user.plan_tag || 'SIN MEMBRESÍA',
        rutinaAsignada,
        fecha_vencimiento: user.fecha_vencimiento,
        dias_inactivo: remaining.daysExpired || 0,
        puede_eliminar_inactivo: Boolean(remaining.canDelete),
        estado_membresia: remaining.status === 'ACTIVE' ? 'ACTIVO' : remaining.status === 'WARNING' ? 'POR_VENCER' : 'VENCIDO',
        estadoMembresia: remaining.status === 'ACTIVE' ? 'ACTIVO' : remaining.status === 'WARNING' ? 'POR_VENCER' : 'VENCIDO',
        tiempoRestante: remaining.text,
        tiempoRestanteCorto: remaining.cardText,
        diasRestantes: remaining.totalDays,
        trafficColor: remaining.trafficColor,
        nivelFidelidad: fidelity.name,
        canDelete: Boolean(remaining.canDelete),
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
    const totalPadron = allUsers.length;
    const tasaActivos = totalPadron > 0 ? Math.round(((activosCount + porVencerCount) / totalPadron) * 100) : 0;

    return {
      total,
      page: pageNum,
      limit: pageSize,
      totalPages,
      metrics: {
        total: totalPadron,
        totalPadron,
        activos: activosCount,
        porVencer: porVencerCount,
        vencidos: vencidosCount,
        vencidosPurgables: vencidosPurgablesCount,
        sinRutina: sinRutinaCount,
        tasaActivos: `${tasaActivos}%`,
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
             rp.nombre AS plantilla_nombre,
             f.nivel_actual, f.fecha_inscripcion_original
      FROM usuarios u
      LEFT JOIN membresias m ON m.usuario_id = u.id
      LEFT JOIN miembro_rutinas_asignadas mra ON mra.usuario_id = u.id
      LEFT JOIN rutinas_plantillas rp ON rp.id = mra.rutina_id AND rp.activo = 1
      LEFT JOIN fidelidad f ON f.usuario_id = u.id
      WHERE u.id = ?
    `).get(Number(id));

    if (!user) return null;

    const isAdmin = Boolean(currentUser && (currentUser.rol === 'ADMINISTRADOR' || currentUser.rol === 'ADMIN'));

    const remaining = user.fecha_vencimiento ? calculateRemainingTime(user.fecha_vencimiento) : {
      totalDays: 0,
      daysExpired: 99,
      text: 'SIN MEMBRESÍA',
      trafficColor: 'ROJO',
      badgeClass: 'bg-error-container text-on-error',
      canDelete: true,
    };

    const fidelity = user.fecha_inscripcion_original && user.fecha_vencimiento
      ? calculateFidelity(user.fecha_inscripcion_original, user.fecha_vencimiento)
      : { name: 'NOVATO', level: 1, months: 0, progressPercent: 0, nextLevel: 'PRINCIPIANTE', rangeLabel: '< 1 MES', summaryText: 'NIVEL: NOVATO (0 MESES)' };

    const canDelete = Boolean(remaining.canDelete);
    const rutinaReal = user.plantilla_nombre || user.rutina_asignada || 'SIN RUTINA ASIGNADA';
    const planReal = user.plan_tag || 'SIN MEMBRESÍA';

    return {
      id: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      nombreCompleto: `${user.apellidos}, ${user.nombres}`,
      dni: user.dni,
      username: isAdmin ? user.username : null,
      celular: user.celular,
      fotoUrl: user.foto_url || null,
      canDelete,
      puedeEliminar: canDelete,
      user: {
        id: user.id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        dni: user.dni,
        username: isAdmin ? user.username : null,
        celular: user.celular,
        foto_url: user.foto_url,
      },
      remaining: {
        totalDays: remaining.totalDays,
        daysExpired: remaining.daysExpired || 0,
        text: remaining.text,
        cardText: remaining.cardText,
        trafficColor: remaining.trafficColor,
        badgeClass: remaining.badgeClass,
        canDelete: remaining.canDelete,
      },
      fidelity: {
        name: fidelity.name,
        level: fidelity.level,
        rangeLabel: fidelity.rangeLabel,
        months: fidelity.months,
        progressPercent: fidelity.progressPercent,
        nextLevel: fidelity.nextLevel,
        penalized: fidelity.penalized,
        summaryText: fidelity.summaryText,
      },
      membership: {
        estado: remaining.status || 'EXPIRED',
        tiempoRestanteTexto: remaining.text,
        diasRestantes: remaining.totalDays,
        fechaVencimiento: user.fecha_vencimiento,
        fecha_vencimiento: user.fecha_vencimiento,
        plan_tag: planReal,
        rutina_asignada: rutinaReal,
      },
      membresia: {
        estado: remaining.status || 'EXPIRED',
        tiempoRestanteTexto: remaining.text,
        diasRestantes: remaining.totalDays,
        diasVencido: remaining.daysExpired || 0,
        fechaVencimiento: user.fecha_vencimiento,
        planTag: planReal,
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
      rutinaActual: rutinaReal,
    };
  }

  /**
   * Modifica nombres, apellidos, celular y opcionalmente contraseña (DNI y @username inmutables)
   */
  static updateUser(id, { nombres, apellidos, celular, password }) {
    if (!nombres || !apellidos || !celular) {
      throw new Error('Nombres, apellidos y celular son obligatorios.');
    }

    if (password !== undefined && password !== null && String(password).trim() !== '') {
      const cleanPass = String(password).trim();
      if (cleanPass.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
      }
      const passwordHash = bcrypt.hashSync(cleanPass, 10);
      db.prepare(`
        UPDATE usuarios
        SET nombres = ?, apellidos = ?, celular = ?, password_hash = ?, password_plain = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(nombres.trim(), apellidos.trim(), celular.trim(), passwordHash, cleanPass, Number(id));
    } else {
      db.prepare(`
        UPDATE usuarios
        SET nombres = ?, apellidos = ?, celular = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(nombres.trim(), apellidos.trim(), celular.trim(), Number(id));
    }

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
      throw new Error('No se puede eliminar el usuario: su membresía no tiene más de 1 mes (30 días) de vencida o registra renovaciones recientes.');
    }

    // Borrado físico en SQLite (con ON DELETE CASCADE / ON DELETE SET NULL)
    db.prepare('DELETE FROM usuarios WHERE id = ?').run(Number(id));
    return {
      success: true,
      message: 'Usuario inactivo eliminado físicamente de la base de datos con éxito. Los registros contables pasados fueron preservados de forma desvinculada.',
      usuario_id: Number(id),
      dni: detail.dni,
    };
  }
}

