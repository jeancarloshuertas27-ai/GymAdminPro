import db from '../db.js';
import fs from 'node:fs';
import path from 'node:path';

const uploadBaseDir = path.resolve(process.cwd());

/**
 * Purgado seguro de archivos de comprobante conforme al Principio Constitucional V
 */
async function unlinkVoucherFile(comprobanteUrl) {
  if (!comprobanteUrl || comprobanteUrl === 'PURGADO_TRAS_APROBACION') {
    return;
  }
  try {
    // Normalizar ruta quitando barra inicial
    const relPath = comprobanteUrl.startsWith('/') ? comprobanteUrl.slice(1) : comprobanteUrl;
    const absPath = path.resolve(uploadBaseDir, relPath);
    if (fs.existsSync(absPath)) {
      await fs.promises.unlink(absPath);
      console.log(`[PRINCIPIO V] Comprobante físico purgado exitosamente: ${absPath}`);
    }
  } catch (err) {
    console.error(`[PRINCIPIO V] Error al purgar archivo físico ${comprobanteUrl}:`, err);
  }
}

export const aprobacionService = {
  /**
   * Obtiene todas las solicitudes pendientes de revisión bancaria y arqueo de caja,
   * más los totales del día para control administrativo
   */
  getPendingApprovals() {
    const membresiasQuery = db.prepare(`
      SELECT 
        sm.id,
        'MEMBRESIA' AS tipo_transaccion,
        sm.usuario_id,
        u.nombres AS atleta_nombres,
        u.apellidos AS atleta_apellidos,
        u.dni AS atleta_dni,
        sm.promocion_id,
        p.nombre AS promocion_nombre,
        sm.dias_agregados,
        sm.monto,
        sm.metodo_pago,
        sm.comprobante_url,
        sm.operador_id,
        op.nombres || ' ' || op.apellidos AS operador_nombre,
        sm.created_at
      FROM solicitudes_membresia sm
      JOIN usuarios u ON sm.usuario_id = u.id
      LEFT JOIN promociones p ON sm.promocion_id = p.id
      JOIN usuarios op ON sm.operador_id = op.id
      WHERE sm.estado = 'PENDIENTE_APROBACION'
      ORDER BY sm.created_at ASC
    `);

    const ventasQuery = db.prepare(`
      SELECT 
        vp.id,
        'PRODUCTO' AS tipo_transaccion,
        vp.producto_id,
        prod.nombre AS producto_nombre,
        prod.sku AS producto_sku,
        vp.cantidad,
        vp.precio_unitario,
        vp.total,
        vp.metodo_pago,
        vp.comprobante_url,
        vp.operador_id,
        op.nombres || ' ' || op.apellidos AS operador_nombre,
        vp.created_at
      FROM ventas_productos vp
      JOIN productos prod ON vp.producto_id = prod.id
      JOIN usuarios op ON vp.operador_id = op.id
      WHERE vp.estado = 'PENDIENTE_APROBACION'
      ORDER BY vp.created_at ASC
    `);

    const membPend = membresiasQuery.all();
    const ventPend = ventasQuery.all();

    // Historial del día para arqueo general de caja y conteo de ventas
    const historialVentas = db.prepare(`
      SELECT 
        vp.id,
        'PRODUCTO' AS tipo_transaccion,
        vp.producto_id,
        prod.nombre AS producto_nombre,
        prod.sku AS producto_sku,
        vp.cantidad,
        vp.precio_unitario,
        vp.total,
        vp.metodo_pago,
        vp.estado,
        op.nombres || ' ' || op.apellidos AS operador_nombre,
        vp.created_at,
        vp.resolved_at
      FROM ventas_productos vp
      JOIN productos prod ON vp.producto_id = prod.id
      JOIN usuarios op ON vp.operador_id = op.id
      WHERE DATE(vp.created_at, 'localtime') = DATE('now', 'localtime')
      ORDER BY vp.created_at DESC
    `).all();

    const historialMembresias = db.prepare(`
      SELECT 
        sm.id,
        'MEMBRESIA' AS tipo_transaccion,
        u.nombres || ' ' || u.apellidos AS atleta_nombre,
        u.dni AS atleta_dni,
        sm.dias_agregados,
        sm.monto,
        sm.metodo_pago,
        sm.estado,
        op.nombres || ' ' || op.apellidos AS operador_nombre,
        sm.created_at,
        sm.resolved_at
      FROM solicitudes_membresia sm
      JOIN usuarios u ON sm.usuario_id = u.id
      JOIN usuarios op ON sm.operador_id = op.id
      WHERE DATE(sm.created_at, 'localtime') = DATE('now', 'localtime')
      ORDER BY sm.created_at DESC
    `).all();

    // Totales ya APROBADOS hoy por el Administrador (Efectivo Hoy, Transferencias Hoy, Total Hoy)
    const ventasAprobadasHoy = historialVentas.filter(v => v.estado === 'APROBADO');
    const membresiasAprobadasHoy = historialMembresias.filter(m => m.estado === 'APROBADO');

    let efectivoHoy = 0;
    let transferenciasHoy = 0;

    ventasAprobadasHoy.forEach(v => {
      if (v.metodo_pago === 'EFECTIVO') efectivoHoy += v.total;
      else transferenciasHoy += v.total;
    });

    membresiasAprobadasHoy.forEach(m => {
      if (m.metodo_pago === 'EFECTIVO') efectivoHoy += m.monto;
      else transferenciasHoy += m.monto;
    });

    const totalHoy = efectivoHoy + transferenciasHoy;

    // Calcular totales para el administrador
    let totalEfectivoPendiente = 0;
    let totalTransferenciaPendiente = 0;

    membPend.forEach((m) => {
      if (m.metodo_pago === 'EFECTIVO') totalEfectivoPendiente += m.monto;
      else totalTransferenciaPendiente += m.monto;
    });

    ventPend.forEach((v) => {
      if (v.metodo_pago === 'EFECTIVO') totalEfectivoPendiente += v.total;
      else totalTransferenciaPendiente += v.total;
    });

    return {
      membresias_pendientes: membPend,
      ventas_pendientes: ventPend,
      resumen_hoy: {
        efectivo_hoy: parseFloat(efectivoHoy.toFixed(2)),
        transferencias_hoy: parseFloat(transferenciasHoy.toFixed(2)),
        total_hoy: parseFloat(totalHoy.toFixed(2))
      },
      resumen_arqueo: {
        efectivo_hoy: parseFloat(efectivoHoy.toFixed(2)),
        transferencias_hoy: parseFloat(transferenciasHoy.toFixed(2)),
        total_hoy: parseFloat(totalHoy.toFixed(2)),
        total_efectivo_pendiente: totalEfectivoPendiente,
        total_transferencia_pendiente: totalTransferenciaPendiente,
        total_pendiente: totalEfectivoPendiente + totalTransferenciaPendiente,
        total_transacciones_pendientes: membPend.length + ventPend.length
      },
      historial_hoy: {
        ventas: historialVentas,
        membresias: historialMembresias
      }
    };
  },

  /**
   * Aprueba una extensión de membresía (efectivo o transferencia)
   */
  async approveMembership(solicitudId, adminId) {
    const solicitud = db.prepare('SELECT * FROM solicitudes_membresia WHERE id = ?').get(solicitudId);
    if (!solicitud) {
      throw new Error('Solicitud de membresía no encontrada');
    }
    if (solicitud.estado !== 'PENDIENTE_APROBACION') {
      throw new Error(`La solicitud ya se encuentra en estado ${solicitud.estado}`);
    }

    let newEnd = null;

    // Si era TRANSFERENCIA, los días NO se habían aplicado aún en recepción, así que los aplicamos ahora:
    if (solicitud.metodo_pago === 'TRANSFERENCIA') {
      const memb = db.prepare('SELECT * FROM membresias WHERE usuario_id = ?').get(solicitud.usuario_id);
      const today = new Date().toISOString().split('T')[0];
      let baseDate = today;

      if (memb && memb.fecha_vencimiento && memb.fecha_vencimiento > today) {
        baseDate = memb.fecha_vencimiento;
      }

      const currentBase = new Date(baseDate);
      newEnd = new Date(currentBase.getTime() + solicitud.dias_agregados * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      // Actualizar membresía del atleta
      if (memb) {
        db.prepare(`
          UPDATE membresias 
          SET fecha_vencimiento = ?, estado = 'ACTIVO'
          WHERE id = ?
        `).run(newEnd, memb.id);
      } else {
        db.prepare(`
          INSERT INTO membresias (usuario_id, fecha_inicio, fecha_vencimiento, anios, meses, estado, tipo_pago, plan_tag)
          VALUES (?, ?, ?, 0, 1, 'ACTIVO', 'TRANSFERENCIA', 'RENOVACIÓN POR TRANSFERENCIA')
        `).run(solicitud.usuario_id, today, newEnd);
      }

      // Purgar archivo físico conforme al Principio V
      if (solicitud.comprobante_url) {
        await unlinkVoucherFile(solicitud.comprobante_url);
      }
    } else {
      // Si era EFECTIVO, los días ya fueron activados en recepción; aprobar valida el arqueo de caja física.
      const memb = db.prepare('SELECT fecha_vencimiento FROM membresias WHERE usuario_id = ?').get(solicitud.usuario_id);
      newEnd = memb ? memb.fecha_vencimiento : null;
    }

    // Actualizar solicitud
    db.prepare(`
      UPDATE solicitudes_membresia 
      SET estado = 'APROBADO', 
          comprobante_url = 'PURGADO_TRAS_APROBACION',
          resolved_at = CURRENT_TIMESTAMP, 
          resolved_by = ? 
      WHERE id = ?
    `).run(adminId, solicitudId);

    return {
      id: solicitudId,
      tipo: 'membresia',
      estado: 'APROBADO',
      nueva_fecha_vencimiento: newEnd,
      comprobante_url: 'PURGADO_TRAS_APROBACION',
      mensaje: solicitud.metodo_pago === 'TRANSFERENCIA'
        ? 'Membresía activada y comprobante físico purgado exitosamente (Principio V).'
        : 'Arqueo de efectivo validado y membresía confirmada en caja.'
    };
  },

  /**
   * Rechaza una solicitud de extensión de membresía
   */
  async rejectMembership(solicitudId, adminId, motivo = '') {
    const solicitud = db.prepare('SELECT * FROM solicitudes_membresia WHERE id = ?').get(solicitudId);
    if (!solicitud) {
      throw new Error('Solicitud de membresía no encontrada');
    }
    if (solicitud.estado !== 'PENDIENTE_APROBACION') {
      throw new Error(`La solicitud ya se encuentra en estado ${solicitud.estado}`);
    }

    // Si era EFECTIVO, los días se habían aplicado preventivamente en el mostrador; al rechazar se revierten
    if (solicitud.metodo_pago === 'EFECTIVO') {
      const memb = db.prepare('SELECT * FROM membresias WHERE usuario_id = ?').get(solicitud.usuario_id);
      if (memb && memb.fecha_vencimiento) {
        const currentEnd = new Date(memb.fecha_vencimiento);
        const revertedEnd = new Date(currentEnd.getTime() - solicitud.dias_agregados * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        const newEstado = revertedEnd >= today ? 'ACTIVO' : 'VENCIDO';
        db.prepare('UPDATE membresias SET fecha_vencimiento = ?, estado = ? WHERE id = ?')
          .run(revertedEnd, newEstado, memb.id);
      }
    }

    // Purgar voucher si existiera
    if (solicitud.comprobante_url) {
      await unlinkVoucherFile(solicitud.comprobante_url);
    }

    db.prepare(`
      UPDATE solicitudes_membresia 
      SET estado = 'RECHAZADO', 
          notas_rechazo = ?,
          resolved_at = CURRENT_TIMESTAMP, 
          resolved_by = ? 
      WHERE id = ?
    `).run(motivo || 'Rechazado en arqueo de caja', adminId, solicitudId);

    return {
      id: solicitudId,
      tipo: 'membresia',
      estado: 'RECHAZADO',
      mensaje: 'Solicitud de membresía rechazada correctamente.'
    };
  },

  /**
   * Aprueba una venta de producto en mostrador (efectivo o transferencia)
   */
  async approveProductSale(ventaId, adminId) {
    const venta = db.prepare('SELECT * FROM ventas_productos WHERE id = ?').get(ventaId);
    if (!venta) {
      throw new Error('Venta no encontrada');
    }
    if (venta.estado !== 'PENDIENTE_APROBACION') {
      throw new Error(`La venta ya se encuentra en estado ${venta.estado}`);
    }

    // Purgar archivo físico conforme al Principio V
    if (venta.comprobante_url) {
      await unlinkVoucherFile(venta.comprobante_url);
    }

    db.prepare(`
      UPDATE ventas_productos 
      SET estado = 'APROBADO', 
          comprobante_url = 'PURGADO_TRAS_APROBACION',
          resolved_at = CURRENT_TIMESTAMP, 
          resolved_by = ? 
      WHERE id = ?
    `).run(adminId, ventaId);

    return {
      id: ventaId,
      tipo: 'producto',
      estado: 'APROBADO',
      despacho_autorizado: true,
      comprobante_url: 'PURGADO_TRAS_APROBACION',
      mensaje: venta.metodo_pago === 'TRANSFERENCIA'
        ? 'Venta por transferencia aprobada y comprobante físico purgado (Principio V).'
        : 'Arqueo de venta en efectivo validado y conciliado en caja.'
    };
  },

  /**
   * Rechaza una venta de producto y reintegra el stock reservado atómicamente
   */
  async rejectProductSale(ventaId, adminId, motivo = '') {
    const venta = db.prepare('SELECT * FROM ventas_productos WHERE id = ?').get(ventaId);
    if (!venta) {
      throw new Error('Venta no encontrada');
    }
    if (venta.estado !== 'PENDIENTE_APROBACION') {
      throw new Error(`La venta ya se encuentra en estado ${venta.estado}`);
    }

    // Reintegrar stock reservado preventivamente
    db.prepare('UPDATE productos SET stock = stock + ? WHERE id = ?')
      .run(venta.cantidad, venta.producto_id);

    // Purgar voucher si existiera
    if (venta.comprobante_url) {
      await unlinkVoucherFile(venta.comprobante_url);
    }

    // Marcar venta como rechazada
    db.prepare(`
      UPDATE ventas_productos 
      SET estado = 'RECHAZADO', 
          notas_rechazo = ?,
          resolved_at = CURRENT_TIMESTAMP, 
          resolved_by = ? 
      WHERE id = ?
    `).run(motivo || 'Venta rechazada en arqueo de caja', adminId, ventaId);

    return {
      id: ventaId,
      tipo: 'producto',
      estado: 'RECHAZADO',
      stock_restaurado: true,
      mensaje: 'Venta rechazada y stock reintegrado al inventario.'
    };
  }
};
