import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth } from '../utils/authMiddleware.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Debe ingresar nombre de usuario y contraseña.' });
  }

  const cleanUser = username.trim().startsWith('@') ? username.trim() : `@${username.trim()}`;
  const user = db.prepare('SELECT * FROM usuarios WHERE username = ? COLLATE NOCASE').get(cleanUser);

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas. Verifique su usuario y contraseña.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Credenciales inválidas. Verifique su usuario y contraseña.' });
  }

  let redirectTo = '/admin/usuarios';
  if (user.rol === 'RECEPCIONISTA') {
    redirectTo = '/recepcion/checkin';
  } else if (user.rol === 'MIEMBRO') {
    redirectTo = '/miembro/carnet';
  }

  const token = `uid_${user.id}_${Date.now()}`;

  res.json({
    token,
    user: {
      id: user.id,
      rol: user.rol,
      username: user.username,
      nombres: user.nombres,
      apellidos: user.apellidos,
      dni: user.dni,
      fotoUrl: user.foto_url,
      redirectTo,
    },
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Sesión cerrada correctamente' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
