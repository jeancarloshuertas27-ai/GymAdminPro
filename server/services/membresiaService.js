import db from '../db.js';

/**
 * Calcula la nueva fecha de vencimiento sumando días a la fecha base
 * Si la membresía actual sigue vigente (fecha > hoy), se suma sobre la fecha actual de vencimiento.
 * Si ya venció o no tiene, se suma a partir de hoy.
 */
export function calculateNewExpirationDate(currentExpiration, daysToAdd, today = new Date().toISOString().split('T')[0]) {
  const wasActive = currentExpiration && currentExpiration > today;
  let baseDate = today;
  if (wasActive) {
    baseDate = currentExpiration;
  }
  const base = new Date(baseDate);
  const result = new Date(base.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  return {
    newExpirationDate: result.toISOString().split('T')[0],
    baseUsed: baseDate,
    wasActive: !!wasActive
  };
}

export const membresiaService = {
  searchByDni(dni) {
    if (!dni || dni.trim().length !== 8) {
      throw new Error('El DNI a consultar debe contener exactamente 8 dígitos');
    }

    const usuario = db.prepare(`
      SELECT 
        u.id, 
        u.nombres, 
        u.apellidos, 
        u.dni, 
        u.foto_url, 
        u.rol,
        f.nivel_actual AS nivel_fidelidad
      FROM usuarios u
      LEFT JOIN fidelidad f ON u.id = f.usuario_id
      WHERE u.dni = ?
    `).get(dni);

    if (!usuario) {
      throw new Error(`No se encontró ningún atleta con el DNI ${dni}`);
    }

    const memb = db.prepare(`
      SELECT * FROM membresias 
      WHERE usuario_id = ? 
      ORDER BY fecha_vencimiento DESC 
      LIMIT 1
    `).get(usuario.id);

    const today = new Date().toISOString().split('T')[0];
    let diasRestantes = 0;
    let estado = 'VENCIDO';
    let fechaVencimiento = null;
    let planTag = 'SIN MEMBRESÍA';

    if (memb && memb.fecha_vencimiento) {
      fechaVencimiento = memb.fecha_vencimiento;
      planTag = memb.plan_tag || 'MEMBRESÍA ACTIVA';
      const diffMs = new Date(memb.fecha_vencimiento) - new Date(today);
      diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24));
      estado = diasRestantes > 10 ? 'ACTIVO' : diasRestantes > 0 ? 'POR_VENCER' : 'VENCIDO';
    }

    return {
      usuario,
      membresia_actual: {
        id: memb ? memb.id : null,
        fecha_inicio: memb ? memb.fecha_inicio : today,
        fecha_vencimiento: fechaVencimiento,
        dias_restantes: diasRestantes,
        estado,
        plan_tag: planTag
      }
    };
  },

  assignMembershipTime(params, voucherFile, operatorUser) {
    const {
      usuario_id,
      modo,
      promocion_id,
      cantidad_tiempo,
      unidad_tiempo,
      monto,
      metodo_pago
    } = params;

    const userId = Number(usuario_id);
    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(userId);
    if (!usuario) {
      throw new Error('Atleta no encontrado');
    }

    let diasAgregados = 0;
    let planTag = 'RECARGA MANUAL';
    let promoId = null;

    if (modo === 'PROMO' && promocion_id) {
      promoId = Number(promocion_id);
      const promo = db.prepare('SELECT * FROM promociones WHERE id = ?').get(promoId);
      if (!promo) {
        throw new Error('Promoción no encontrada');
      }
      planTag = promo.nombre;
      if (promo.duracion_unidad === 'MESES') {
        diasAgregados = promo.duracion_valor === 12 ? 365 : promo.duracion_valor * 30;
      } else {
        diasAgregados = promo.duracion_valor;
      }
    } else {
      const qty = parseInt(cantidad_tiempo, 10);
      if (isNaN(qty) || qty <= 0) {
        throw new Error('La cantidad de tiempo manual debe ser mayor a 0');
      }
      const unit = (unidad_tiempo || 'MESES').toUpperCase();
      if (unit === 'MESES') {
        diasAgregados = qty * 30;
        planTag = `PASE MANUAL (${qty} MESES)`;
      } else {
        diasAgregados = qty;
        planTag = `PASE MANUAL (${qty} DÍAS)`;
      }
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum < 0) {
      throw new Error('El importe debe ser un número válido en Soles (S/)');
    }

    const payMethod = metodo_pago === 'TRANSFERENCIA' ? 'TRANSFERENCIA' : 'EFECTIVO';
    let comprobanteUrl = null;
    if (voucherFile) {
      comprobanteUrl = `/uploads/vouchers/${voucherFile.filename}`;
    }

    const isReception = operatorUser.rol === 'RECEPCIONISTA' || params.origen === 'RECEPCION';

    // Caso 1: Transferencia en Recepción (Obligatorio voucher y queda pendiente de validación bancaria)
    if (payMethod === 'TRANSFERENCIA' && isReception) {
      if (!voucherFile) {
        throw new Error('La subida del comprobante es obligatoria para transferencias en Recepción');
      }

      const stmt = db.prepare(`
        INSERT INTO solicitudes_membresia (usuario_id, promocion_id, dias_agregados, monto, metodo_pago, comprobante_url, operador_id, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE_APROBACION')
      `);
      const res = stmt.run(userId, promoId, diasAgregados, montoNum, payMethod, comprobanteUrl, operatorUser.id);

      return {
        message: 'Comprobante de transferencia remitido a la Lista de Cambios y Aprobaciones.',
        transaccion: {
          id: Number(res.lastInsertRowid),
          usuario_id: userId,
          dias_agregados: diasAgregados,
          monto: montoNum,
          metodo_pago: payMethod,
          estado: 'PENDIENTE_APROBACION'
        }
      };
    }

    // Caso 2: Pago en Efectivo (o asignación directa por Administrador)
    // El atleta recibe sus días de inmediato para no ser bloqueado en torniquete
    const memb = db.prepare('SELECT * FROM membresias WHERE usuario_id = ? ORDER BY fecha_vencimiento DESC LIMIT 1').get(userId);
    const today = new Date().toISOString().split('T')[0];
    const { newExpirationDate } = calculateNewExpirationDate(memb ? memb.fecha_vencimiento : null, diasAgregados, today);

    if (memb) {
      db.prepare(`
        UPDATE membresias 
        SET fecha_vencimiento = ?, plan_tag = ?, estado = 'ACTIVO'
        WHERE id = ?
      `).run(newExpirationDate, planTag, memb.id);
    } else {
      db.prepare(`
        INSERT INTO membresias (usuario_id, fecha_inicio, fecha_vencimiento, anios, meses, estado, tipo_pago, plan_tag)
        VALUES (?, ?, ?, 0, 1, 'ACTIVO', ?, ?)
      `).run(userId, today, newExpirationDate, payMethod, planTag);
    }

    // Toda solicitud de recarga entra primero en estado PENDIENTE_APROBACION
    // para que el Administrador audite y apruebe en Cambios y Aprobaciones
    const isPendingApproval = true;
    const initialEstado = 'PENDIENTE_APROBACION';

    const stmt = db.prepare(`
      INSERT INTO solicitudes_membresia (usuario_id, promocion_id, dias_agregados, monto, metodo_pago, comprobante_url, operador_id, estado, resolved_at, resolved_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
    `);
    
    const insertParams = [
      userId,
      promoId,
      diasAgregados,
      montoNum,
      payMethod,
      comprobanteUrl,
      operatorUser.id,
      initialEstado
    ];
    const res = stmt.run(...insertParams);

    // Calcular nuevo saldo de días
    const diffMs = new Date(newExpirationDate) - new Date(today);
    const nuevoSaldo = Math.round(diffMs / (1000 * 60 * 60 * 24));

    return {
      message: isPendingApproval
        ? 'Tiempo de membresía registrado y activado en mostrador. Pendiente de verificación de efectivo por Administración.'
        : 'Tiempo de membresía agregado y liquidado exitosamente en caja',
      transaccion: {
        id: Number(res.lastInsertRowid),
        usuario_id: userId,
        dias_agregados: diasAgregados,
        monto: montoNum,
        metodo_pago: payMethod,
        estado: initialEstado,
        nueva_fecha_vencimiento: newExpirationDate,
        nuevo_saldo_dias: nuevoSaldo
      }
    };
  }
};
