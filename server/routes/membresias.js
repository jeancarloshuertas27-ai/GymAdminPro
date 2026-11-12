import express from 'express';
import { membresiaService } from '../services/membresiaService.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

// GET /api/membresias/buscar/:dni
router.get('/buscar/:dni', (req, res, next) => {
  try {
    const result = membresiaService.searchByDni(req.params.dni);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/membresias/asignar
router.post('/asignar', upload.single('comprobante'), (req, res, next) => {
  try {
    const operator = req.user || { id: 1, rol: 'ADMINISTRADOR' };
    const result = membresiaService.assignMembershipTime(req.body, req.file, operator);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

