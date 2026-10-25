import db from '../db.js';
import bcrypt from 'bcryptjs';

export class UserCreationService {
  static createUser({
    tipo,
    nombres,
    apellidos,
    dni,
    celular,
    celular_respaldo,
    domicilio,
    username,
    password,
    fotoFile,
    voucherFile,
    numero_operacion,
    rutina,
    anios,
    meses,
    tipo_pago,
    currentUser,
  }) {
    // 1. Validaciones básicas
    if (!tipo || !['reception', 'member'].includes(tipo)) {
      throw new Error("El tipo de usuario debe ser 'reception' o 'member'.");
    }

    if (!nombres || !apellidos || !dni || !celular || !username || !password) {
      throw new Error('Todos los campos obligatorios deben ser completados.');
    }

    const cleanDni = String(dni).trim();
    if (!/^\d{8}$/.test(cleanDni)) {
      throw new Error('El DNI debe tener exactamente 8 dígitos numéricos.');
    }

    const cleanUsername = username.trim().startsWith('@') ? username.trim() : `@${username.trim()}`;

    // 2. Comprobar permisos de rol
    if (tipo === 'reception') {
      if (!currentUser || currentUser.rol !== 'ADMINISTRADOR') {
        throw new Error('Solo un Administrador puede registrar personal de Recepción.');
      }
      if (!celular_respaldo || !domicilio) {
        throw new Error('Celular de respaldo y Domicilio son obligatorios para personal de Recepción.');
      }
    }

    // 3. Comprobar unicidad de DNI y username
    const existingDni = db.prepare('SELECT id FROM usuarios WHERE dni = ?').get(cleanDni);
    if (existingDni) {
      throw new Error('El DNI ya se encuentra registrado en el padrón.');
    }

    const existingUser = db.prepare('SELECT id FROM usuarios WHERE username = ? COLLATE NOCASE').get(cleanUsername);
    if (existingUser) {
      throw new Error('El nombre de usuario ya está en uso. Elija otro.');
    }

    const passHash = bcrypt.hashSync(password, 10);
    const fotoUrl = fotoFile ? `uploads/photos/${fotoFile.filename}` : null;

    // 4. Inserción de usuario
    const rol = tipo === 'reception' ? 'RECEPCIONISTA' : 'MIEMBRO';
    const insertUser = db.prepare(`
      INSERT INTO usuarios (rol, username, password_hash, nombres, apellidos, dni, celular, celular_respaldo, domicilio, foto_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertUser.run(
      rol,
      cleanUsername,
      passHash,
      nombres.trim(),
      apellidos.trim(),
      cleanDni,
      celular.trim(),
      celular_respaldo ? celular_respaldo.trim() : null,
      domicilio ? domicilio.trim() : null,
      fotoUrl
    );

    const newUserId = Number(result.lastInsertRowid);

    // 5. Si es Miembro, registrar membresía y registro inicial de fidelidad
    if (rol === 'MIEMBRO') {
      const now = new Date();
      const numYears = Math.max(0, parseInt(anios || 0, 10));
      const numMonths = Math.max(0, parseInt(meses || 0, 10));

      const expDate = new Date(now);
      expDate.setFullYear(expDate.getFullYear() + numYears);
      expDate.setMonth(expDate.getMonth() + numMonths);

      const fechaInicioStr = now.toISOString().split('T')[0];
      const fechaVencStr = expDate.toISOString().split('T')[0];

      const tipoPagoUpper = String(tipo_pago || 'EFECTIVO').toUpperCase();
      let voucherUrl = null;

      if (tipoPagoUpper === 'TRANSFERENCIA') {
        if (!voucherFile) {
          throw new Error('Debe adjuntar obligatoriamente el comprobante/voucher de pago por transferencia.');
        }
        voucherUrl = `uploads/vouchers/${voucherFile.filename}`;
      }

      db.prepare(`
        INSERT INTO membresias (usuario_id, fecha_inicio, fecha_vencimiento, anios, meses, estado, tipo_pago, comprobante_url, numero_operacion, plan_tag, rutina_asignada)
        VALUES (?, ?, ?, ?, ?, 'ACTIVO', ?, ?, ?, ?, ?)
      `).run(
        newUserId,
        fechaInicioStr,
        fechaVencStr,
        numYears,
        numMonths,
        tipoPagoUpper,
        voucherUrl,
        numero_operacion ? String(numero_operacion).trim() : null,
        numYears > 0 ? 'VIP ANUAL' : 'MEMBRESÍA MENSUAL',
        rutina || 'PPL Clásico // Fuerza & Hipertrofia (6 días)'
      );

      db.prepare(`
        INSERT INTO fidelidad (usuario_id, fecha_inscripcion_original, meses_continuos, nivel_actual, ultimo_reinicio)
        VALUES (?, ?, 0, 'NOVATO', NULL)
      `).run(newUserId, fechaInicioStr);
    }

    return {
      success: true,
      message: `${rol === 'RECEPCIONISTA' ? 'Personal de recepción' : 'Atleta'} registrado exitosamente con membresía activada.`,
      user: {
        id: newUserId,
        rol,
        dni: cleanDni,
        username: cleanUsername,
      },
    };
  }
}
