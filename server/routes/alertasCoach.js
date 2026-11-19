import { Router } from 'express';
import { alertaCoachService } from '../services/alertaCoachService.js';
import { requireAuth, requireRole } from '../utils/authMiddleware.js';

const router = Router();

// POST /api/alertas-coach - Miembro llama a coach indicando máquina
router.post('/', requireAuth, requireRole(['MIEMBRO']), (req, res) => {
  try {
    const alerta = alertaCoachService.crearAlerta(req.user.id, req.body || {});
    res.status(201).json({
      message: 'Alerta enviada a Recepción.',
      alerta,
    });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// GET /api/alertas-coach/mi-alerta - Consulta de alerta activa del miembro autenticado
router.get('/mi-alerta', requireAuth, requireRole(['MIEMBRO']), (req, res, next) => {
  try {
    const alerta = alertaCoachService.getMiAlertaActiva(req.user.id);
    res.json({ alerta });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/alertas-coach/:id/cancelar - Cancelación voluntaria por el miembro
router.patch('/:id/cancelar', requireAuth, requireRole(['MIEMBRO']), (req, res) => {
  try {
    const result = alertaCoachService.cancelarAlertaMiembro(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// GET /api/alertas-coach/pendientes - Sondeo en vivo desde Recepción y Administrador
router.get('/pendientes', requireAuth, requireRole(['RECEPCIONISTA', 'ADMINISTRADOR']), (req, res, next) => {
  try {
    const alertas = alertaCoachService.listarAlertasPendientes();
    res.json({ alertas });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/alertas-coach/:id/atender - Recepción o Admin marcan la alerta como atendida
router.patch('/:id/atender', requireAuth, requireRole(['RECEPCIONISTA', 'ADMINISTRADOR']), (req, res) => {
  try {
    const result = alertaCoachService.atenderAlerta(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

export default router;
