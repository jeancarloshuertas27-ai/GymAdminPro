import db from '../db.js';

/**
 * Middleware para extraer el usuario autenticado a partir del token o cabecera Authorization.
 * Para simplicidad v1, el token codifica el id de usuario o se usa un token portador simple.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  let userId = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // Formato simple: 'uid_<id>_<timestamp>' o id directo
      if (token.startsWith('uid_')) {
        userId = Number(token.split('_')[1]);
      } else {
        userId = Number(token);
      }
    } catch {
      userId = null;
    }
  }

  if (!userId) {
    req.user = null;
    return next();
  }

  const user = db.prepare('SELECT id, rol, username, nombres, apellidos, dni FROM usuarios WHERE id = ?').get(userId);
  req.user = user || null;
  next();
}

/**
 * Guard para exigir inicio de sesión activo.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autorizado. Debe iniciar sesión.' });
  }
  next();
}

/**
 * Guard para exigir uno o más roles autorizados.
 * @param {string[]} allowedRoles
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado. Por favor inicie sesión.' });
    }
    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Acceso denegado. Privilegios insuficientes para esta operación.' });
    }
    next();
  };
}
