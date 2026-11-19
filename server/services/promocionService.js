import db from '../db.js';

export function normalizeTier(tier) {
  if (!tier) return 'TODOS';
  const t = String(tier).toUpperCase().trim();
  if (t === 'TODOS') return 'TODOS';
  if (t.includes('DIOS')) return 'DIOS_GRIEGO';
  if (t.includes('ANIMAL')) return 'ANIMAL';
  if (t.includes('MAMAD')) return 'MAMADO';
  if (t.includes('MUTAN')) return 'MUTANDO';
  if (t.includes('PROGRESO')) return 'EN_PROGRESO';
  if (t.includes('PROMEDIO')) return 'PROMEDIO';
  if (t.includes('PRINCIPIANTE')) return 'PRINCIPIANTE';
  if (t.includes('NOVATO')) return 'NOVATO';
  return 'NOVATO';
}

const TIER_ORDER = {
  'TODOS': 0,
  'NOVATO': 1,
  'PRINCIPIANTE': 2,
  'PROMEDIO': 3,
  'EN_PROGRESO': 4,
  'MUTANDO': 5,
  'MAMADO': 6,
  'DIOS_GRIEGO': 7,
  'ANIMAL': 8
};

export function canMemberAccessPromo(userFidelityLevel, promoRequiredLevel) {
  if (!promoRequiredLevel || promoRequiredLevel === 'TODOS') {
    return true;
  }
  const normPromo = normalizeTier(promoRequiredLevel);
  if (normPromo === 'TODOS') return true;

  const normUser = normalizeTier(userFidelityLevel);
  const userRank = TIER_ORDER[normUser] !== undefined ? TIER_ORDER[normUser] : 1;
  const requiredRank = TIER_ORDER[normPromo] !== undefined ? TIER_ORDER[normPromo] : 0;
  return userRank >= requiredRank;
}

export const promocionService = {
  listPromotions(role, userFidelity = null) {
    const rows = db.prepare('SELECT * FROM promociones WHERE activo = 1 ORDER BY created_at DESC').all();
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

    if (role === 'MIEMBRO') {
      return rows.filter((p) => {
        if (p.fecha_limite && p.fecha_limite < today) {
          return false;
        }
        return canMemberAccessPromo(userFidelity, p.publico_objetivo);
      });
    }

    // Admin o Recepcionista consultando para un miembro específico (nivel_miembro pasado)
    if (userFidelity !== null) {
      return rows.filter((p) => {
        if (p.fecha_limite && p.fecha_limite < today) {
          return false;
        }
        return canMemberAccessPromo(userFidelity, p.publico_objetivo);
      });
    }

    // Sin filtro: Admin ve todo para gestión
    return rows;
  },

  listActivePromosForMember(userId) {
    const fid = db.prepare('SELECT nivel_actual FROM fidelidad WHERE usuario_id = ?').get(Number(userId));
    const nivelActual = fid?.nivel_actual || 'NOVATO';
    const promociones = this.listPromotions('MIEMBRO', nivelActual);
    return {
      nivel_actual: nivelActual,
      promociones
    };
  },

  createPromotion(data, bannerFile = null) {
    const {
      tipo,
      nombre,
      duracion_valor,
      duracion_unidad,
      precio,
      fecha_limite,
      publico_objetivo
    } = data;

    if (!nombre || !nombre.trim()) {
      throw new Error('El nombre de la promoción es obligatorio');
    }

    const durValor = parseInt(duracion_valor, 10);
    if (isNaN(durValor) || durValor <= 0) {
      throw new Error('La vigencia numérica debe ser un entero mayor a 0');
    }

    const durUnidad = (duracion_unidad || 'MESES').toUpperCase();
    if (durUnidad !== 'MESES' && durUnidad !== 'DIAS') {
      throw new Error("La unidad de vigencia debe ser 'MESES' o 'DIAS'");
    }

    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum < 0) {
      throw new Error('El precio debe ser un número positivo en Soles (S/)');
    }

    const tipoVal = tipo === 'PROMOCION_VOLATIL' ? 'PROMOCION_VOLATIL' : 'TARIFA_FIJA';
    const targetAudience = publico_objetivo || 'TODOS';

    let bannerUrl = null;
    if (bannerFile) {
      bannerUrl = `/uploads/banners/${bannerFile.filename}`;
    }

    const stmt = db.prepare(`
      INSERT INTO promociones (tipo, nombre, duracion_valor, duracion_unidad, precio, fecha_limite, publico_objetivo, banner_url, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      tipoVal,
      nombre.trim(),
      durValor,
      durUnidad,
      precioNum,
      fecha_limite || null,
      targetAudience,
      bannerUrl
    );

    return db.prepare('SELECT * FROM promociones WHERE id = ?').get(result.lastInsertRowid);
  },

  archivePromotion(id) {
    const promo = db.prepare('SELECT * FROM promociones WHERE id = ?').get(id);
    if (!promo) {
      throw new Error('Promoción no encontrada');
    }

    db.prepare('UPDATE promociones SET activo = 0 WHERE id = ?').run(id);
    return { id, activo: 0 };
  }
};

