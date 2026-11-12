import db from '../db.js';

/**
 * Sanitiza las propiedades de producto según el rol del usuario solicitante
 */
export function sanitizeProductForRole(product, role) {
  if (!product) return null;
  const p = { ...product };

  if (role === 'MIEMBRO') {
    if (p.stock === 0) return null; // Miembros no ven productos agotados
    delete p.precio_costo;
    delete p.margen_porcentaje;
    return p;
  }

  if (role === 'RECEPCIONISTA') {
    delete p.precio_costo;
    delete p.margen_porcentaje;
    return p;
  }

  if (role === 'ADMINISTRADOR') {
    const costo = p.precio_costo || 0;
    const pvp = p.precio_venta || 0;
    p.margen_porcentaje = pvp > 0 ? parseFloat((((pvp - costo) / pvp) * 100).toFixed(1)) : 0.0;
    return p;
  }

  delete p.precio_costo;
  delete p.margen_porcentaje;
  return p;
}

export const productoService = {
  listProducts(role = 'INVITADO') {
    const rows = db.prepare('SELECT * FROM productos WHERE activo = 1 ORDER BY id ASC').all();
    return rows
      .map((p) => sanitizeProductForRole(p, role))
      .filter((p) => p !== null);
  },

  getProductById(id, role = 'ADMINISTRADOR') {
    const row = db.prepare('SELECT * FROM productos WHERE id = ? AND activo = 1').get(id);
    if (!row) {
      throw new Error('Producto no encontrado');
    }
    return sanitizeProductForRole(row, role);
  },

  createProduct(data, imageFile = null) {
    const { nombre, descripcion, precio_venta, precio_costo, stock, categoria, sku } = data;

    if (!nombre || !nombre.trim()) {
      throw new Error('El nombre del producto es obligatorio');
    }

    const pvp = parseFloat(precio_venta);
    if (isNaN(pvp) || pvp < 0) {
      throw new Error('El precio de venta público (PVP) debe ser un número positivo en Soles (S/)');
    }

    const costo = parseFloat(precio_costo || 0);
    if (isNaN(costo) || costo < 0) {
      throw new Error('El precio de costo debe ser un número positivo');
    }

    const stockQty = parseInt(stock, 10);
    if (isNaN(stockQty) || stockQty < 0) {
      throw new Error('El stock inicial no puede ser negativo');
    }

    let imagenUrl = 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80';
    if (imageFile) {
      imagenUrl = `/uploads/productos/${imageFile.filename}`;
    }

    const finalSku = sku && sku.trim() ? sku.trim() : `SKU-${Date.now().toString().slice(-6)}`;
    const finalCategoria = categoria || 'GENERAL';

    const stmt = db.prepare(`
      INSERT INTO productos (sku, nombre, descripcion, precio_venta, precio_costo, stock, categoria, imagen_url, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      finalSku,
      nombre.trim(),
      descripcion ? descripcion.trim() : '',
      pvp,
      costo,
      stockQty,
      finalCategoria,
      imagenUrl
    );

    return this.getProductById(Number(result.lastInsertRowid), 'ADMINISTRADOR');
  },

  updateProduct(id, data, imageFile = null) {
    const existing = db.prepare('SELECT * FROM productos WHERE id = ? AND activo = 1').get(id);
    if (!existing) {
      throw new Error('Producto no encontrado para actualizar');
    }

    const nombre = data.nombre ? data.nombre.trim() : existing.nombre;
    const descripcion = data.descripcion !== undefined ? data.descripcion.trim() : existing.descripcion;
    const precio_venta = data.precio_venta !== undefined ? parseFloat(data.precio_venta) : existing.precio_venta;
    const precio_costo = data.precio_costo !== undefined ? parseFloat(data.precio_costo) : existing.precio_costo;
    const stock = data.stock !== undefined ? parseInt(data.stock, 10) : existing.stock;
    const categoria = data.categoria || existing.categoria;

    if (isNaN(precio_venta) || precio_venta < 0) {
      throw new Error('El precio de venta debe ser positivo en Soles (S/)');
    }
    if (isNaN(precio_costo) || precio_costo < 0) {
      throw new Error('El precio de costo debe ser positivo');
    }
    if (isNaN(stock) || stock < 0) {
      throw new Error('El stock no puede ser negativo');
    }

    let imagenUrl = existing.imagen_url;
    if (imageFile) {
      imagenUrl = `/uploads/productos/${imageFile.filename}`;
    }

    db.prepare(`
      UPDATE productos 
      SET nombre = ?, descripcion = ?, precio_venta = ?, precio_costo = ?, stock = ?, categoria = ?, imagen_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nombre, descripcion, precio_venta, precio_costo, stock, categoria, imagenUrl, id);

    return this.getProductById(id, 'ADMINISTRADOR');
  },

  deleteProduct(id) {
    const existing = db.prepare('SELECT * FROM productos WHERE id = ? AND activo = 1').get(id);
    if (!existing) {
      throw new Error('Producto no encontrado');
    }

    // Baja lógica preservando históricos en ventas_productos
    db.prepare('UPDATE productos SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    return {
      message: 'Producto dado de baja lógica del catálogo con éxito.',
      id: Number(id),
      activo: 0
    };
  },

  softDeleteProduct(id) {
    return this.deleteProduct(id);
  },

  sellProduct(params, voucherFile, operatorUser) {
    const { producto_id, cantidad, metodo_pago } = params;

    const prodId = Number(producto_id);
    const qty = parseInt(cantidad, 10);

    if (isNaN(qty) || qty <= 0) {
      throw new Error('La cantidad a vender debe ser mayor a 0');
    }

    const payMethod = metodo_pago === 'TRANSFERENCIA' ? 'TRANSFERENCIA' : 'EFECTIVO';

    if (payMethod === 'TRANSFERENCIA' && !voucherFile && operatorUser.rol === 'RECEPCIONISTA') {
      throw new Error('La captura de transferencia bancaria es obligatoria en recepción');
    }

    let comprobanteUrl = null;
    if (voucherFile) {
      comprobanteUrl = `/uploads/vouchers/${voucherFile.filename}`;
    }

    // Transacción atómica en SQLite para descuento preventivo
    const product = db.prepare('SELECT * FROM productos WHERE id = ? AND activo = 1').get(prodId);
    if (!product) {
      throw new Error('Producto no disponible para la venta');
    }

    if (product.stock < qty) {
      throw new Error(`Stock insuficiente. Máximo disponible: ${product.stock} unidades.`);
    }

    // Descontar existencias preventivamente
    db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?').run(qty, prodId);

    const total = parseFloat((product.precio_venta * qty).toFixed(2));
    
    // Toda venta (Efectivo o Transferencia) se registra primero en Cambios y Aprobaciones en espera de aprobación
    // para que el Administrador pueda auditar y verificar personalmente el ingreso
    const isPending = true;
    const estado = 'PENDIENTE_APROBACION';

    const stmt = db.prepare(`
      INSERT INTO ventas_productos (producto_id, cantidad, precio_unitario, total, metodo_pago, comprobante_url, operador_id, estado, resolved_at, resolved_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
    `);

    const insertParams = [
      prodId,
      qty,
      product.precio_venta,
      total,
      payMethod,
      comprobanteUrl,
      operatorUser.id,
      estado
    ];

    const res = stmt.run(...insertParams);

    const updatedProduct = db.prepare('SELECT stock FROM productos WHERE id = ?').get(prodId);

    return {
      message: isPending
        ? (payMethod === 'TRANSFERENCIA'
            ? 'Venta por transferencia registrada. Stock reservado preventivamente; entrega en espera de aprobación del Administrador.'
            : 'Venta en efectivo registrada en mostrador y enviada a la Lista de Cambios y Aprobaciones para arqueo del Administrador.')
        : 'Venta procesada con éxito y liquidada en caja',
      venta: {
        id: Number(res.lastInsertRowid),
        producto_id: prodId,
        cantidad: qty,
        total,
        metodo_pago: payMethod,
        estado,
        despacho_autorizado: payMethod === 'EFECTIVO' || !isPending,
        stock_restante: updatedProduct.stock
      }
    };
  }
};
