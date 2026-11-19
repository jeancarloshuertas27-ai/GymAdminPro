import { Router } from 'express';
import { asistenteIaService } from '../services/asistenteIaService.js';
import { requireAuth, requireRole } from '../utils/authMiddleware.js';

const router = Router();

// POST /api/asistente-ia/consultar - Consulta biomecánica y de máquinas (Solo Miembro)
router.post('/consultar', requireAuth, requireRole(['MIEMBRO']), async (req, res) => {
  try {
    const result = await asistenteIaService.consultarAsistente(req.user.id, req.body || {});
    res.json(result);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

export default router;
