import db from '../db.js';

export const reporteService = {
  /**
   * Obtiene métricas en tiempo real para el Bento Grid del Dashboard Administrador
   */
  getDashboardMetrics() {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Ingresos del día: Membresías y Productos (Aprobados hoy)
    const ingresosMembresiaRow = db.prepare(`
      SELECT COALESCE(SUM(monto), 0) AS total
      FROM solicitudes_membresia
      WHERE estado = 'APROBADO' 
        AND DATE(created_at, 'localtime') = DATE('now', 'localtime')
    `).get();

    const ingresosProductosRow = db.prepare(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM ventas_productos
      WHERE estado = 'APROBADO'
        AND DATE(created_at, 'localtime') = DATE('now', 'localtime')
    `).get();

    const membTotal = Number(ingresosMembresiaRow.total || 0);
    const prodTotal = Number(ingresosProductosRow.total || 0);
    const ingresosHoyTotal = membTotal + prodTotal;

    // 2. Aforo y Atletas Activos
    const activosRow = db.prepare(`
      SELECT COUNT(DISTINCT usuario_id) AS total
      FROM membresias
      WHERE fecha_vencimiento >= DATE('now', 'localtime')
    `).get();

    const porVencerRow = db.prepare(`
      SELECT COUNT(DISTINCT usuario_id) AS total
      FROM membresias
      WHERE fecha_vencimiento >= DATE('now', 'localtime')
        AND (julianday(fecha_vencimiento) - julianday(DATE('now', 'localtime'))) <= 10
    `).get();

    const nuevosMesRow = db.prepare(`
      SELECT COUNT(*) AS total
      FROM usuarios
      WHERE rol = 'MIEMBRO'
        AND strftime('%Y-%m', created_at, 'localtime') = strftime('%Y-%m', 'now', 'localtime')
    `).get();

    // 3. Alertas de Inventario / Stock Crítico (< 5 unidades)
    const stockCriticoCountRow = db.prepare(`
      SELECT COUNT(*) AS total
      FROM productos
      WHERE activo = 1 AND stock < 5
    `).get();

    const productosCriticos = db.prepare(`
      SELECT id, sku, nombre, stock, precio_venta
      FROM productos
      WHERE activo = 1 AND stock < 5
      ORDER BY stock ASC, nombre ASC
      LIMIT 4
    `).all();

    // 4. Aprobaciones Pendientes de Transferencia
    const pendingMembresias = db.prepare(`
      SELECT sm.id, 'MEMBRESIA' AS tipo, sm.monto, sm.metodo_pago, sm.created_at,
             COALESCE(u.nombres || ' ' || u.apellidos, sm.atleta_nombre_historico, 'Atleta') AS concepto,
             'Renovación' AS subtitulo
      FROM solicitudes_membresia sm
      LEFT JOIN usuarios u ON sm.usuario_id = u.id
      WHERE sm.estado = 'PENDIENTE_APROBACION'
      ORDER BY sm.created_at DESC
      LIMIT 4
    `).all();

    const pendingProductos = db.prepare(`
      SELECT vp.id, 'PRODUCTO' AS tipo, vp.total AS monto, vp.metodo_pago, vp.created_at,
             prod.nombre AS concepto,
             (vp.cantidad || ' unid. vendidas') AS subtitulo
      FROM ventas_productos vp
      JOIN productos prod ON vp.producto_id = prod.id
      WHERE vp.estado = 'PENDIENTE_APROBACION'
      ORDER BY vp.created_at DESC
      LIMIT 4
    `).all();

    const totalPendientesCount = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM solicitudes_membresia WHERE estado = 'PENDIENTE_APROBACION') +
        (SELECT COUNT(*) FROM ventas_productos WHERE estado = 'PENDIENTE_APROBACION') AS total
    `).get().total;

    return {
      fecha: todayStr,
      ingresos_hoy: {
        total: parseFloat(ingresosHoyTotal.toFixed(2)),
        membresias: parseFloat(membTotal.toFixed(2)),
        productos: parseFloat(prodTotal.toFixed(2)),
      },
      atletas: {
        total_activos: activosRow.total || 0,
        por_vencer_10d: porVencerRow.total || 0,
        nuevos_este_mes: nuevosMesRow.total || 0,
      },
      stock_critico: {
        total_items: stockCriticoCountRow.total || 0,
        items: productosCriticos,
      },
      aprobaciones: {
        total_pendientes: totalPendientesCount || 0,
        recientes: [...pendingMembresias, ...pendingProductos].slice(0, 4),
      },
    };
  },

  /**
   * Genera el consolidado diario estructurado para el reporte PDF oficial
   * @param {string} fecha YYYY-MM-DD (opcional, defaults a hoy)
   */
  getDailyReportSummary(fecha = null) {
    const targetDate = fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha) 
      ? fecha 
      : new Date().toISOString().split('T')[0];

    // (a) Reporte de ganancias por pagos de membresías en Soles
    const membresiasTransacciones = db.prepare(`
      SELECT 
        sm.id,
        COALESCE(u.nombres || ' ' || u.apellidos, sm.atleta_nombre_historico, 'Atleta no especificado') AS atleta_nombre,
        COALESCE(u.dni, sm.atleta_dni_historico, '00000000') AS atleta_dni,
        COALESCE(p.nombre, 'Membresía ' || sm.dias_agregados || ' días') AS plan_nombre,
        sm.dias_agregados,
        sm.monto,
        sm.metodo_pago,
        strftime('%H:%M', sm.created_at, 'localtime') AS hora,
        sm.estado
      FROM solicitudes_membresia sm
      LEFT JOIN usuarios u ON sm.usuario_id = u.id
      LEFT JOIN promociones p ON sm.promocion_id = p.id
      WHERE sm.estado = 'APROBADO'
        AND DATE(sm.created_at, 'localtime') = DATE(?)
      ORDER BY sm.created_at ASC
    `).all(targetDate);

    const totalMembresias = membresiasTransacciones.reduce((sum, item) => sum + Number(item.monto), 0);

    // (b) Cantidad de nuevos usuarios inscritos
    const nuevosUsuarios = db.prepare(`
      SELECT 
        id,
        nombres,
        apellidos,
        dni,
        celular,
        strftime('%H:%M', created_at, 'localtime') AS hora
      FROM usuarios
      WHERE rol = 'MIEMBRO'
        AND DATE(created_at, 'localtime') = DATE(?)
      ORDER BY created_at ASC
    `).all(targetDate);

    // (c) Ganancias por venta de productos en Soles
    const ventasProductosRaw = db.prepare(`
      SELECT 
        vp.id,
        vp.producto_id,
        prod.nombre AS producto_nombre,
        prod.sku AS producto_sku,
        vp.cantidad,
        vp.precio_unitario,
        prod.precio_costo,
        vp.total,
        vp.metodo_pago,
        strftime('%H:%M', vp.created_at, 'localtime') AS hora
      FROM ventas_productos vp
      JOIN productos prod ON vp.producto_id = prod.id
      WHERE vp.estado = 'APROBADO'
        AND DATE(vp.created_at, 'localtime') = DATE(?)
      ORDER BY vp.created_at ASC
    `).all(targetDate);

    const totalProductos = ventasProductosRaw.reduce((sum, item) => sum + Number(item.total), 0);
    const costoTotalProductos = ventasProductosRaw.reduce((sum, item) => sum + (Number(item.cantidad) * Number(item.precio_costo || 0)), 0);
    const gananciaNetaProductos = totalProductos - costoTotalProductos;

    // (d) Lista de productos vendidos agrupada (nombres, cantidades vendidas)
    const productosAgrupadosMap = new Map();
    for (const v of ventasProductosRaw) {
      if (!productosAgrupadosMap.has(v.producto_id)) {
        productosAgrupadosMap.set(v.producto_id, {
          producto_id: v.producto_id,
          nombre: v.producto_nombre,
          sku: v.producto_sku,
          cantidad_total: 0,
          precio_unitario: v.precio_unitario,
          subtotal: 0,
        });
      }
      const entry = productosAgrupadosMap.get(v.producto_id);
      entry.cantidad_total += v.cantidad;
      entry.subtotal += v.total;
    }
    const productosVendidos = Array.from(productosAgrupadosMap.values());

    return {
      fecha: targetDate,
      bloque_a_membresias: {
        total_recaudado: parseFloat(totalMembresias.toFixed(2)),
        cantidad_transacciones: membresiasTransacciones.length,
        transacciones: membresiasTransacciones,
      },
      bloque_b_nuevos_usuarios: {
        total_nuevos: nuevosUsuarios.length,
        usuarios: nuevosUsuarios,
      },
      bloque_c_productos_ganancias: {
        total_ingresos: parseFloat(totalProductos.toFixed(2)),
        costo_total: parseFloat(costoTotalProductos.toFixed(2)),
        ganancia_neta: parseFloat(gananciaNetaProductos.toFixed(2)),
        cantidad_ventas: ventasProductosRaw.length,
      },
      bloque_d_productos_detalle: productosVendidos,
      resumen_total: {
        total_ingresos_dia: parseFloat((totalMembresias + totalProductos).toFixed(2)),
      },
    };
  },
};
