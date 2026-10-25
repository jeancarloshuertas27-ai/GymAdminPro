import { Router } from 'express';
import { UserService } from '../services/userService.js';
import { UserCreationService } from '../services/userCreationService.js';
import { requireAuth, requireRole } from '../utils/authMiddleware.js';
import { upload } from '../utils/upload.js';

const router = Router();

// GET /api/users - Lista con orden A-Z estricto por apellidos
router.get('/', (req, res) => {
  const { search, status, page, limit } = req.query;
  const result = UserService.listUsers({
    search: search || '',
    status: status || 'all',
    page: page || 1,
    limit: limit || 10,
    currentUser: req.user,
  });
  res.json(result);
});

// GET /api/users/:id - Ficha de atleta para modal carnet
router.get('/:id', (req, res) => {
  const user = UserService.getUserDetail(req.params.id, req.user);
  if (!user) {
    return res.status(404).json({ error: 'Atleta no encontrado.' });
  }
  res.json(user);
});

// POST /api/users - Alta de Recepción o Miembro
router.post(
  '/',
  requireAuth,
  upload.fields([
    { name: 'foto', maxCount: 1 },
    { name: 'voucher', maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const files = req.files || {};
      const fotoFile = files.foto ? files.foto[0] : null;
      const voucherFile = files.voucher ? files.voucher[0] : null;

      const result = UserCreationService.createUser({
        ...req.body,
        fotoFile,
        voucherFile,
        currentUser: req.user,
      });

      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// PUT /api/users/:id - Corrección de datos (DNI y @username inmutables)
router.put('/:id', requireAuth, (req, res) => {
  try {
    const result = UserService.updateUser(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/users/:id - Purga física de SQLite (>30d vencido, solo Admin)
router.delete('/:id', requireAuth, requireRole(['ADMINISTRADOR']), (req, res) => {
  try {
    const result = UserService.deleteUser(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
