import express from 'express';
import { promocionService } from '../services/promocionService.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

// GET /api/promociones/para-miembro
// Retorna promociones vigentes (fecha_limite no vencida) aplicables al nivel del socio
router.get('/para-miembro', (req, res, next) => {
  try {
    if (!req.user || req.user.rol !== 'MIEMBRO') {
      return res.status(403).json({ error: 'Acceso exclusivo para miembros autenticados.' });
    }
    const result = promocionService.listActivePromosForMember(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/promociones
// Query param opcional: nivel_miembro=PRINCIPIANTE (para que Admin/Recepción filtren
// las promos disponibles para un miembro específico al agregar tiempo)
router.get('/', (req, res, next) => {
  try {
    const role = req.user?.rol || 'INVITADO';

    let fidelityToFilter;
    if (role === 'MIEMBRO') {
      // El propio miembro ve solo sus promos accesibles
      const result = promocionService.listActivePromosForMember(req.user.id);
      return res.json(result.promociones);
    } else if (req.query.nivel_miembro) {
      // Admin o Recepción consultando promos para un miembro específico
      fidelityToFilter = req.query.nivel_miembro;
    } else {
      // Sin filtro: Admin ve todo (listado de gestión)
      fidelityToFilter = null;
    }

    const promociones = promocionService.listPromotions(role, fidelityToFilter);
    res.json(promociones);
  } catch (err) {
    next(err);
  }
});

// POST /api/promociones (Admin only)
router.post('/', upload.single('banner'), (req, res, next) => {
  try {
    if (req.user?.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Acceso denegado. Solo el Administrador puede gestionar promociones.' });
    }

    const nuevaPromo = promocionService.createPromotion(req.body, req.file);
    res.status(201).json({
      message: 'Promoción creada y publicada exitosamente en el catálogo',
      promocion: nuevaPromo
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/promociones/:id/archivar (Admin only)
router.patch('/:id/archivar', (req, res, next) => {
  try {
    if (req.user?.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Acceso denegado. Solo el Administrador puede archivar tarifas.' });
    }

    const result = promocionService.archivePromotion(Number(req.params.id));
    res.json({
      message: 'Tarifa archivada correctamente.',
      ...result
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/promociones/:id/estado (Admin only) - Activar o desactivar promoción
router.patch('/:id/estado', (req, res, next) => {
  try {
    if (req.user?.rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Acceso denegado. Solo el Administrador puede activar o desactivar promociones.' });
    }

    const { activo } = req.body || {};
    const result = promocionService.togglePromotionStatus(Number(req.params.id), activo);
    res.json({
      message: result.activo === 1 ? 'Promoción activada correctamente.' : 'Promoción desactivada correctamente.',
      ...result
    });
  } catch (err) {
    next(err);
  }
});

export default router;

