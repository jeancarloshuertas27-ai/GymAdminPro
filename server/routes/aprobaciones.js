import express from 'express';
import { aprobacionService } from '../services/aprobacionService.js';

const router = express.Router();

// Middleware: Exclusivo para Administrador
router.use((req, res, next) => {
  if (req.user?.rol !== 'ADMINISTRADOR') {
    return res.status(403).json({ error: 'Acceso denegado. Exclusivo para el Administrador.' });
  }
  next();
});

// GET /api/aprobaciones
router.get('/', (req, res, next) => {
  try {
    const data = aprobacionService.getPendingApprovals();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/aprobaciones/:tipo/:id/aprobar
router.post('/:tipo/:id/aprobar', async (req, res, next) => {
  try {
    const { tipo, id } = req.params;
    const adminId = req.user?.id || 1;

    let result;
    if (tipo === 'membresia') {
      result = await aprobacionService.approveMembership(Number(id), adminId);
    } else if (tipo === 'producto') {
      result = await aprobacionService.approveProductSale(Number(id), adminId);
    } else {
      return res.status(400).json({ error: 'Tipo de transacción no válido. Use membresia o producto.' });
    }

    res.json({
      message: 'Transacción aprobada con éxito. Los beneficios fueron aplicados y el comprobante gráfico ha sido purgado del servidor.',
      ...result
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/aprobaciones/:tipo/:id/rechazar
router.post('/:tipo/:id/rechazar', async (req, res, next) => {
  try {
    const { tipo, id } = req.params;
    const adminId = req.user?.id || 1;
    const { motivo } = req.body || {};

    let result;
    if (tipo === 'membresia') {
      result = await aprobacionService.rejectMembership(Number(id), adminId, motivo);
    } else if (tipo === 'producto') {
      result = await aprobacionService.rejectProductSale(Number(id), adminId, motivo);
    } else {
      return res.status(400).json({ error: 'Tipo de transacción no válido. Use membresia o producto.' });
    }

    res.json({
      message: 'Transacción rechazada correctamente.',
      ...result
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

