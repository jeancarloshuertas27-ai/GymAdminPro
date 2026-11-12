import express from 'express';
import { reporteService } from '../services/reporteService.js';
import { requireAuth } from '../utils/authMiddleware.js';

const router = express.Router();

// Middleware: Exclusivo para Administrador
router.use(requireAuth, (req, res, next) => {
  if (req.user?.rol !== 'ADMINISTRADOR') {
    return res.status(403).json({ error: 'Acceso denegado. Exclusivo para el Administrador.' });
  }
  next();
});

// GET /api/reportes/dashboard
router.get('/dashboard', (req, res, next) => {
  try {
    const data = reporteService.getDashboardMetrics();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/reportes/diario?fecha=YYYY-MM-DD
router.get('/diario', (req, res, next) => {
  try {
    const { fecha } = req.query;
    const data = reporteService.getDailyReportSummary(fecha);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
