import db from '../db.js';

const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

function hydratePlantilla(plantilla, ajustesMap = null) {
  if (!plantilla) return null;

  const diasRows = db.prepare(`
    SELECT id, dia_semana, enfoque_muscular, orden_dia
    FROM rutinas_dias
    WHERE rutina_id = ?
    ORDER BY orden_dia ASC
  `).all(plantilla.id);

  const exStmt = db.prepare(`
    SELECT 
      re.id,
      re.maquina_id,
      m.numero_maquina,
      m.codigo_etiqueta,
      m.nombre,
      m.grupo_muscular,
      re.orden_secuencial,
      re.series,
      re.repeticiones,
      re.tiempo_descanso_segundos
    FROM rutinas_ejercicios re
    JOIN maquinas_ejercicios m ON re.maquina_id = m.id
    WHERE re.rutina_dia_id = ?
    ORDER BY re.orden_secuencial ASC
  `);

  let totalEjercicios = 0;
  const diasMap = new Map();

  for (const d of diasRows) {
    const ejercicios = exStmt.all(d.id).map((ex) => {
      const ajuste = ajustesMap ? ajustesMap.get(ex.id) : null;
      return {
        ...ex,
        series_original: ex.series,
        descanso_original: ex.tiempo_descanso_segundos,
        series: ajuste?.series_custom ?? ex.series,
        tiempo_descanso_segundos: ajuste?.descanso_custom_segundos ?? ex.tiempo_descanso_segundos,
        personalizado: Boolean(ajuste),
      };
    });
    totalEjercicios += ejercicios.length;
    diasMap.set(d.dia_semana, {
      id: d.id,
      dia_semana: d.dia_semana,
      enfoque_muscular: ejercicios.length === 0 ? 'REST' : (d.enfoque_muscular || 'GENERAL'),
      orden_dia: d.orden_dia,
      ejercicios,
    });
  }

  const diasCompletos = DIAS_SEMANA.map((dia, idx) => {
    if (diasMap.has(dia)) return diasMap.get(dia);
    return {
      id: null,
      dia_semana: dia,
      enfoque_muscular: 'REST',
      orden_dia: idx + 1,
      ejercicios: [],
    };
  });

  return {
    id: plantilla.id,
    nombre: plantilla.nombre,
    descripcion: plantilla.descripcion || '',
    total_ejercicios: totalEjercicios,
    created_at: plantilla.created_at,
    dias: diasCompletos,
  };
}

export const rutinaService = {
  /**
   * Catálogo maestro de las 25 máquinas del gimnasio
   */
  getMaquinas() {
    return db.prepare(`
      SELECT id, numero_maquina, codigo_etiqueta, nombre, grupo_muscular, descripcion_corta
      FROM maquinas_ejercicios
      ORDER BY numero_maquina ASC
    `).all();
  },

  /**
   * Lista plantillas maestras globales (nunca incluye rutinas privadas de miembros)
   */
  getPlantillas() {
    const plantillas = db.prepare(`
      SELECT id, nombre, descripcion, created_by, created_at
      FROM rutinas_plantillas
      WHERE activo = 1
      ORDER BY created_at DESC, id DESC
    `).all();

    return plantillas.map((p) => hydratePlantilla(p));
  },

  /**
   * Crea una nueva plantilla semanal desde el configurador Drag & Drop del Administrador
   */
  createPlantilla({ nombre, descripcion = '', dias = [] }, userId) {
    if (!nombre || !String(nombre).trim()) {
      throw new Error('El nombre de la rutina es obligatorio');
    }

    const cleanNombre = String(nombre).trim();
    const cleanDesc = String(descripcion || '').trim();

    db.exec('BEGIN');
    try {
      const resPlantilla = db.prepare(`
        INSERT INTO rutinas_plantillas (nombre, descripcion, created_by, activo)
        VALUES (?, ?, ?, 1)
      `).run(cleanNombre, cleanDesc, userId || null);

      const rutinaId = Number(resPlantilla.lastInsertRowid);
      const diasInputMap = new Map();
      if (Array.isArray(dias)) {
        for (const d of dias) {
          if (d?.dia_semana) {
            diasInputMap.set(String(d.dia_semana).toUpperCase(), d);
          }
        }
      }

      const insDia = db.prepare(`
        INSERT INTO rutinas_dias (rutina_id, dia_semana, enfoque_muscular, orden_dia)
        VALUES (?, ?, ?, ?)
      `);
      const insEx = db.prepare(`
        INSERT INTO rutinas_ejercicios (rutina_dia_id, maquina_id, orden_secuencial, series, repeticiones, tiempo_descanso_segundos)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      DIAS_SEMANA.forEach((diaNombre, idx) => {
        const payloadDia = diasInputMap.get(diaNombre);
        const ejercicios = Array.isArray(payloadDia?.ejercicios) ? payloadDia.ejercicios : [];
        const enfoque = ejercicios.length === 0
          ? 'REST'
          : String(payloadDia?.enfoque_muscular || 'GENERAL').trim().toUpperCase();

        const resDia = insDia.run(rutinaId, diaNombre, enfoque, idx + 1);
        const diaId = Number(resDia.lastInsertRowid);

        ejercicios.forEach((ej, exIdx) => {
          const maquinaId = Number(ej.maquina_id);
          const series = Math.max(1, parseInt(ej.series, 10) || 4);
          const reps = String(ej.repeticiones || '8-12').trim();
          const descanso = Math.max(0, parseInt(ej.tiempo_descanso_segundos, 10) || 90);
          insEx.run(diaId, maquinaId, exIdx + 1, series, reps, descanso);
        });
      });

      db.exec('COMMIT');

      const created = db.prepare('SELECT * FROM rutinas_plantillas WHERE id = ?').get(rutinaId);
      return hydratePlantilla(created);
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  },

  /**
   * Busca un atleta por DNI de 8 dígitos y retorna su rutina actual con formato "rutina: <nombre>"
   */
  buscarAtletaPorDni(dni) {
    const cleanDni = String(dni || '').trim();
    if (!/^\d{8}$/.test(cleanDni)) {
      throw new Error('Ingresa un DNI válido de 8 dígitos numéricos');
    }

    const row = db.prepare(`
      SELECT 
        u.id,
        u.nombres,
        u.apellidos,
        u.dni,
        u.foto_url,
        f.nivel_actual,
        mra.rutina_id,
        rp.nombre AS plantilla_nombre,
        mem.rutina_asignada AS membresia_rutina_texto
      FROM usuarios u
      LEFT JOIN fidelidad f ON f.usuario_id = u.id
      LEFT JOIN miembro_rutinas_asignadas mra ON mra.usuario_id = u.id
      LEFT JOIN rutinas_plantillas rp ON rp.id = mra.rutina_id AND rp.activo = 1
      LEFT JOIN (
        SELECT usuario_id, rutina_asignada
        FROM membresias
        ORDER BY id DESC
      ) mem ON mem.usuario_id = u.id
      WHERE u.dni = ? AND u.rol = 'MIEMBRO'
      LIMIT 1
    `).get(cleanDni);

    if (!row) {
      return null;
    }

    const rutinaNombre = row.plantilla_nombre || (
      row.membresia_rutina_texto && row.membresia_rutina_texto !== 'SIN RUTINA ASIGNADA'
        ? row.membresia_rutina_texto
        : null
    );

    return {
      id: row.id,
      nombres: row.nombres,
      apellidos: row.apellidos,
      dni: row.dni,
      foto_url: row.foto_url || null,
      nivel_actual: row.nivel_actual || 'NOVATO',
      rutina_id: row.rutina_id || null,
      rutina_nombre: rutinaNombre || 'Sin rutina asignada',
      rutina_etiqueta: `rutina: ${rutinaNombre || 'Sin rutina asignada'}`,
    };
  },

  /**
   * Asigna o modifica la rutina oficial de un atleta y sincroniza membresias.rutina_asignada
   */
  asignarRutinaAtleta(usuarioId, rutinaId, operadorId) {
    const atleta = db.prepare("SELECT id, nombres, apellidos FROM usuarios WHERE id = ? AND rol = 'MIEMBRO'").get(Number(usuarioId));
    if (!atleta) {
      throw new Error('Atleta no encontrado');
    }

    const plantilla = db.prepare('SELECT id, nombre FROM rutinas_plantillas WHERE id = ? AND activo = 1').get(Number(rutinaId));
    if (!plantilla) {
      throw new Error('Plantilla de rutina no encontrada');
    }

    db.prepare(`
      INSERT INTO miembro_rutinas_asignadas (usuario_id, rutina_id, asignado_por)
      VALUES (?, ?, ?)
      ON CONFLICT(usuario_id) DO UPDATE SET
        rutina_id = excluded.rutina_id,
        asignado_por = excluded.asignado_por,
        fecha_asignacion = CURRENT_TIMESTAMP
    `).run(atleta.id, plantilla.id, operadorId || null);

    db.prepare(`
      UPDATE membresias SET rutina_asignada = ? WHERE usuario_id = ?
    `).run(plantilla.nombre, atleta.id);

    return {
      message: 'Rutina asignada exitosamente.',
      usuario_id: atleta.id,
      rutina_id: plantilla.id,
      rutina_nombre: plantilla.nombre,
      rutina_etiqueta: `rutina: ${plantilla.nombre}`,
    };
  },

  /**
   * Obtiene la rutina oficial asignada al miembro (con sus ajustes personales) y sus rutinas privadas
   */
  getMiRutina(usuarioId) {
    const uid = Number(usuarioId);
    const asignacion = db.prepare(`
      SELECT rp.*
      FROM miembro_rutinas_asignadas mra
      JOIN rutinas_plantillas rp ON mra.rutina_id = rp.id
      WHERE mra.usuario_id = ? AND rp.activo = 1
      LIMIT 1
    `).get(uid);

    let rutinaAsignada = null;
    if (asignacion) {
      const ajustesRows = db.prepare(`
        SELECT rutina_ejercicio_id, series_custom, descanso_custom_segundos
        FROM miembro_rutina_ajustes
        WHERE usuario_id = ?
      `).all(uid);
      const ajustesMap = new Map(ajustesRows.map(a => [a.rutina_ejercicio_id, a]));
      rutinaAsignada = hydratePlantilla(asignacion, ajustesMap);
    }

    const privadasRows = db.prepare(`
      SELECT id, nombre, contenido_json, created_at, updated_at
      FROM miembro_rutinas_privadas
      WHERE usuario_id = ?
      ORDER BY created_at DESC, id DESC
    `).all(uid);

    const rutinasPrivadas = privadasRows.map((row) => {
      let dias = [];
      try {
        dias = JSON.parse(row.contenido_json);
      } catch {
        dias = [];
      }
      return {
        id: row.id,
        nombre: row.nombre,
        dias,
        privada: true,
        created_at: row.created_at,
      };
    });

    return {
      rutina_asignada: rutinaAsignada,
      rutinas_privadas: rutinasPrivadas,
    };
  },

  /**
   * Permite al miembro ajustar sus series y tiempo de descanso de su rutina asignada
   */
  ajustarEjercicioMiembro(usuarioId, { rutina_ejercicio_id, series_custom, descanso_custom_segundos }) {
    const uid = Number(usuarioId);
    const ejId = Number(rutina_ejercicio_id);

    const ejercicio = db.prepare('SELECT id, series, tiempo_descanso_segundos FROM rutinas_ejercicios WHERE id = ?').get(ejId);
    if (!ejercicio) {
      throw new Error('Ejercicio de rutina no encontrado');
    }

    const seriesNum = series_custom !== undefined && series_custom !== null
      ? Math.max(1, parseInt(series_custom, 10))
      : ejercicio.series;
    const descansoNum = descanso_custom_segundos !== undefined && descanso_custom_segundos !== null
      ? Math.max(0, parseInt(descanso_custom_segundos, 10))
      : ejercicio.tiempo_descanso_segundos;

    if (isNaN(seriesNum) || isNaN(descansoNum)) {
      throw new Error('Valores de series o descanso inválidos');
    }

    db.prepare(`
      INSERT INTO miembro_rutina_ajustes (usuario_id, rutina_ejercicio_id, series_custom, descanso_custom_segundos)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(usuario_id, rutina_ejercicio_id) DO UPDATE SET
        series_custom = excluded.series_custom,
        descanso_custom_segundos = excluded.descanso_custom_segundos,
        updated_at = CURRENT_TIMESTAMP
    `).run(uid, ejId, seriesNum, descansoNum);

    return {
      message: 'Ajustes de entrenamiento guardados.',
      rutina_ejercicio_id: ejId,
      series: seriesNum,
      tiempo_descanso_segundos: descansoNum,
    };
  },

  /**
   * Crea una rutina privada del miembro (aislada del catálogo global)
   */
  crearRutinaPrivada(usuarioId, { nombre, dias = [] }) {
    if (!nombre || !String(nombre).trim()) {
      throw new Error('El nombre de tu rutina personal es obligatorio');
    }

    const uid = Number(usuarioId);
    const cleanNombre = String(nombre).trim();

    // Normalizar estructura de los 6 días
    const diasMap = new Map();
    if (Array.isArray(dias)) {
      for (const d of dias) {
        if (d?.dia_semana) {
          diasMap.set(String(d.dia_semana).toUpperCase(), d);
        }
      }
    }

    const normalizedDias = DIAS_SEMANA.map((diaNombre, idx) => {
      const d = diasMap.get(diaNombre);
      const rawExs = Array.isArray(d?.ejercicios) ? d.ejercicios : [];
      const ejercicios = rawExs.map((ex, i) => ({
        maquina_id: Number(ex.maquina_id),
        numero_maquina: ex.numero_maquina,
        codigo_etiqueta: ex.codigo_etiqueta,
        nombre: ex.nombre,
        grupo_muscular: ex.grupo_muscular,
        orden_secuencial: i + 1,
        series: Math.max(1, parseInt(ex.series, 10) || 4),
        repeticiones: String(ex.repeticiones || '8-12').trim(),
        tiempo_descanso_segundos: Math.max(0, parseInt(ex.tiempo_descanso_segundos, 10) || 90),
      }));

      return {
        dia_semana: diaNombre,
        enfoque_muscular: ejercicios.length === 0 ? 'REST' : (d?.enfoque_muscular || 'PERSONAL'),
        orden_dia: idx + 1,
        ejercicios,
      };
    });

    const res = db.prepare(`
      INSERT INTO miembro_rutinas_privadas (usuario_id, nombre, contenido_json)
      VALUES (?, ?, ?)
    `).run(uid, cleanNombre, JSON.stringify(normalizedDias));

    const inserted = db.prepare('SELECT * FROM miembro_rutinas_privadas WHERE id = ?').get(Number(res.lastInsertRowid));
    return {
      id: inserted.id,
      nombre: inserted.nombre,
      dias: normalizedDias,
      privada: true,
      created_at: inserted.created_at,
    };
  },

  /**
   * Elimina una rutina privada perteneciente al miembro autenticado
   */
  eliminarRutinaPrivada(usuarioId, rutinaPrivadaId) {
    const res = db.prepare(`
      DELETE FROM miembro_rutinas_privadas WHERE id = ? AND usuario_id = ?
    `).run(Number(rutinaPrivadaId), Number(usuarioId));

    if (res.changes === 0) {
      throw new Error('Rutina privada no encontrada o no te pertenece');
    }

    return { message: 'Rutina privada eliminada.', id: Number(rutinaPrivadaId) };
  },
};
