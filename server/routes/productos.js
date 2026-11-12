import express from 'express';
import db from '../db.js';
import { productoService } from '../services/productoService.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

// GET /api/productos/ventas-turno (Métrica en vivo para mostrador de recepción y arqueo)
router.get('/ventas-turno', (req, res, next) => {
  try {
    const row = db.prepare(`
      SELECT 
        COALESCE(SUM(total), 0) as total_ventas,
        COUNT(id) as total_transacciones
      FROM ventas_productos
      WHERE DATE(created_at, 'localtime') = DATE('now', 'localtime')
        AND estado != 'RECHAZADO'
    `).get();

    res.json({
      total_ventas: parseFloat((row.total_ventas || 0).toFixed(2)),
      total_transacciones: row.total_transacciones || 0
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/productos
router.get('/', (req, res, next) => {
  try {
    const role = req.user?.rol || 'INVITADO';
    const productos = productoService.listProducts(role);
    res.json(productos);
  } catch (err) {
    next(err);
  }
});

// POST /api/productos (Admin only)
router.post('/', upload.single('imagen'), (req, res, next) => {
  try {
    if (req.user?.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Acceso denegado. Solo el Administrador puede agregar productos al inventario.' });
    }

    const nuevoProducto = productoService.createProduct(req.body, req.file);
    res.status(201).json({
      message: 'Producto registrado exitosamente en el inventario',
      producto: nuevoProducto
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/productos/:id (Admin only)
router.put('/:id', upload.single('imagen'), (req, res, next) => {
  try {
    if (req.user?.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Acceso denegado. Solo el Administrador puede editar productos.' });
    }

    const updated = productoService.updateProduct(Number(req.params.id), req.body, req.file);
    res.json({
      message: 'Producto actualizado correctamente',
      producto: updated
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/productos/:id (Admin only - Baja Lógica)
router.delete('/:id', (req, res, next) => {
  try {
    if (req.user?.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Acceso denegado. Solo el Administrador puede eliminar productos.' });
    }

    const result = productoService.softDeleteProduct(Number(req.params.id));
    res.json({
      message: 'Producto dado de baja lógicamente del inventario. El histórico se mantiene intacto.',
      ...result
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/productos/vender (Admin y Recepción)
router.post('/vender', upload.single('comprobante'), (req, res, next) => {
  try {
    const operator = req.user || { id: 2, rol: 'RECEPCIONISTA' };
    const result = productoService.sellProduct(req.body, req.file, operator);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

