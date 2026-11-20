import { Router } from 'express';
import { rutinaService } from '../services/rutinaService.js';
import { requireAuth, requireRole } from '../utils/authMiddleware.js';

const router = Router();

// GET /api/rutinas/maquinas - Catálogo maestro de 25 máquinas (Admin, Recepción y Miembro)
router.get('/maquinas', requireAuth, (req, res, next) => {
  try {
    const maquinas = rutinaService.getMaquinas();
    res.json({ maquinas });
  } catch (err) {
    next(err);
  }
});

// GET /api/rutinas/plantillas - Listado de plantillas oficiales (Admin y Recepción)
router.get('/plantillas', requireAuth, requireRole(['ADMINISTRADOR', 'RECEPCIONISTA']), (req, res, next) => {
  try {
    const plantillas = rutinaService.getPlantillas();
    res.json({ plantillas });
  } catch (err) {
    next(err);
  }
});

// POST /api/rutinas/plantillas - Crear nueva rutina desde configurador Drag & Drop (Solo Admin)
router.post('/plantillas', requireAuth, requireRole(['ADMINISTRADOR']), (req, res) => {
  try {
    const plantilla = rutinaService.createPlantilla(req.body || {}, req.user.id);
    res.status(201).json({
      message: 'Rutina guardada correctamente',
      plantilla,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/rutinas/plantillas/:id - Modificar rutina existente desde configurador (Solo Admin)
router.put('/plantillas/:id', requireAuth, requireRole(['ADMINISTRADOR']), (req, res) => {
  try {
    const plantilla = rutinaService.updatePlantilla(req.params.id, req.body || {});
    res.json({
      message: 'Rutina actualizada correctamente',
      plantilla,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/rutinas/buscar-atleta/:dni - Buscar socio por DNI y ver rutina actual (Admin y Recepción)
router.get('/buscar-atleta/:dni', requireAuth, requireRole(['ADMINISTRADOR', 'RECEPCIONISTA']), (req, res) => {
  try {
    const atleta = rutinaService.buscarAtletaPorDni(req.params.dni);
    if (!atleta) {
      return res.status(404).json({ error: 'No se encontró ningún miembro registrado con ese DNI.' });
    }
    res.json({ atleta });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/rutinas/asignar - Asignar o modificar rutina oficial a un miembro (Admin y Recepción)
router.put('/asignar', requireAuth, requireRole(['ADMINISTRADOR', 'RECEPCIONISTA']), (req, res) => {
  try {
    const { usuario_id, rutina_id } = req.body || {};
    const result = rutinaService.asignarRutinaAtleta(usuario_id, rutina_id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/rutinas/mi-rutina - Obtener rutina oficial con ajustes + rutinas privadas (Solo Miembro)
router.get('/mi-rutina', requireAuth, requireRole(['MIEMBRO']), (req, res, next) => {
  try {
    const data = rutinaService.getMiRutina(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/rutinas/mi-rutina/ajustar-ejercicio - Personalizar series y descanso (Solo Miembro)
router.patch('/mi-rutina/ajustar-ejercicio', requireAuth, requireRole(['MIEMBRO']), (req, res) => {
  try {
    const result = rutinaService.ajustarEjercicioMiembro(req.user.id, req.body || {});
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/rutinas/privadas - Guardar rutina personal privada (Solo Miembro)
router.post('/privadas', requireAuth, requireRole(['MIEMBRO']), (req, res) => {
  try {
    const rutina = rutinaService.crearRutinaPrivada(req.user.id, req.body || {});
    res.status(201).json({
      message: 'Rutina personal privada guardada.',
      rutina,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/rutinas/privadas/:id - Eliminar rutina personal privada (Solo Miembro propietario)
router.delete('/privadas/:id', requireAuth, requireRole(['MIEMBRO']), (req, res) => {
  try {
    const result = rutinaService.eliminarRutinaPrivada(req.user.id, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;
