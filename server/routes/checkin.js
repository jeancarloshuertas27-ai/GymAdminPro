import { Router } from 'express';
import { CheckinService } from '../services/checkinService.js';
import { requireAuth } from '../utils/authMiddleware.js';

const router = Router();

// POST /api/checkin
router.post('/', (req, res) => {
  const { dni } = req.body;
  if (!dni || String(dni).trim().length !== 8) {
    return res.status(400).json({ error: 'El DNI debe contener exactamente 8 dígitos.' });
  }

  const operadorId = req.user ? req.user.id : null;
  const result = CheckinService.processCheckin(dni, operadorId);
  res.json(result);
});

// GET /api/checkin/recent
router.get('/recent', (req, res) => {
  const feed = CheckinService.getRecentCheckins(10);
  res.json(feed);
});

// POST /api/checkin/force
router.post('/force', requireAuth, (req, res) => {
  const { dni, motivo } = req.body;
  const operadorId = req.user ? req.user.id : null;
  const result = CheckinService.forceCheckin(dni, operadorId, motivo);
  res.json(result);
});

export default router;

