# API Contracts: Módulo 001 - Usuarios, Roles, Fidelidad y Control de Acceso

**Base Path**: `/api`  
**Protocol**: HTTP/JSON  
**Authentication**: Header `Authorization: Bearer <token>` o cookie de sesión `session_token`  

---

## 1. Autenticación (`/api/auth`)

### `POST /api/auth/login`
Inicia sesión en el sistema y retorna el perfil con redirección según rol.

- **Request Body**:
  ```json
  {
    "username": "@admin_01",
    "password": "Password123!"
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "token": "jwt-or-session-token-string",
    "user": {
      "id": 1,
      "rol": "ADMINISTRADOR",
      "username": "@admin_01",
      "nombres": "Carlos",
      "apellidos": "Mendoza",
      "redirectTo": "/admin/usuarios"
    }
  }
  ```
- **Response 401 Unauthorized**:
  ```json
  {
    "error": "Credenciales inválidas. Verifique su usuario y contraseña."
  }
  ```

### `POST /api/auth/logout`
Cierra la sesión activa del usuario.

- **Response 200 OK**:
  ```json
  { "message": "Sesión cerrada correctamente" }
  ```

---

## 2. Padrón de Usuarios (`/api/users`)

### `GET /api/users`
Lista alfabética de usuarios con filtros por estado, búsqueda predictiva y control de privacidad según el rol del usuario autenticado.

- **Query Parameters**:
  - `search` (opcional): Filtro por nombres, apellidos, DNI o `@username`.
  - `status` (opcional): `'all' | 'active' | 'warning' | 'expired'`.
  - `page` (opcional, default `1`): Número de página.
  - `limit` (opcional, default `10`): Registros por página.
- **Response 200 OK (Rol Administrador - con contraseñas visibles)**:
  ```json
  {
    "total": 1428,
    "page": 1,
    "totalPages": 143,
    "metrics": {
      "totalPadron": 1428,
      "activos": 1180,
      "porVencer": 94,
      "vencidosPurgables": 154
    },
    "users": [
      {
        "id": 10,
        "apellidos": "Almeyda Gómez",
        "nombres": "Renzo",
        "dni": "74892103",
        "username": "@renzo.a",
        "passwordRaw": "RnzAlpha99!",
        "estadoMembresia": "ACTIVO",
        "tiempoRestante": "6 meses restantes",
        "diasRestantes": 180,
        "celular": "+51 984 221 004",
        "rutinaAsignada": "PPL Clásico // Fuerza & Hipertrofia (6 días)",
        "nivelFidelidad": "MUTANDO"
      }
    ]
  }
  ```
- **Response 200 OK (Rol Recepcionista - contraseñas omitidas)**:
  ```json
  {
    "total": 1428,
    "page": 1,
    "totalPages": 143,
    "users": [
      {
        "id": 10,
        "apellidos": "Almeyda Gómez",
        "nombres": "Renzo",
        "dni": "74892103",
        "estadoMembresia": "ACTIVO",
        "tiempoRestante": "6 meses restantes",
        "diasRestantes": 180,
        "celular": "+51 984 221 004",
        "rutinaAsignada": "PPL Clásico // Fuerza & Hipertrofia (6 días)",
        "nivelFidelidad": "MUTANDO"
      }
    ]
  }
  ```

### `GET /api/users/:id`
Retorna el detalle completo para el modal estilo carnet/pasaporte táctico ("Ver más").

- **Response 200 OK**:
  ```json
  {
    "id": 10,
    "nombres": "Renzo",
    "apellidos": "Almeyda Gómez",
    "dni": "74892103",
    "username": "@renzo.a",
    "celular": "+51 984 221 004",
    "fotoUrl": "/uploads/photos/renzo.jpg",
    "membresia": {
      "estado": "ACTIVO",
      "tiempoRestanteTexto": "1 MES Y 18 DÍAS RESTANTES",
      "colorSemaforo": "VERDE",
      "diasRestantes": 48,
      "fechaVencimiento": "2025-05-28"
    },
    "fidelidad": {
      "nivel": "MUTANDO",
      "nivelNumero": 5,
      "tiempoAcumulado": "9 meses de constancia",
      "progresoSiguientePorcentaje": 75,
      "siguienteNivel": "MAMADO/A"
    },
    "rutinaActual": "FUERZA & EMPUJE PUSH DAY",
    "puedeEliminar": false
  }
  ```

### `POST /api/users`
Registra un nuevo usuario (personal de Recepción o Miembro Atleta con membresía y pago).

- **Content-Type**: `multipart/form-data`
- **Campos para TIPO: RECEPCIÓN** (Solo Administrador):
  - `tipo`: `'reception'`
  - `nombres`, `apellidos`, `dni`, `celular`, `celular_respaldo`, `domicilio`, `username`, `password`
- **Campos para TIPO: MIEMBRO** (Administrador y Recepcionista):
  - `tipo`: `'member'`
  - `nombres`, `apellidos`, `dni`, `celular`, `username`, `password`
  - `foto`: Archivo de imagen (opcional)
  - `rutina`: Nombre de rutina asignada
  - `anios`: Número entero (ej. `1`)
  - `meses`: Número entero (ej. `0`)
  - `tipo_pago`: `'efectivo' | 'transferencia'`
  - `voucher`: Archivo de imagen (obligatorio si `tipo_pago == 'transferencia'`)
  - `numero_operacion`: Código bancario si `tipo_pago == 'transferencia'`
- **Response 201 Created**:
  ```json
  {
    "success": true,
    "message": "Usuario registrado exitosamente con membresía activa.",
    "user": { "id": 15, "dni": "72849102", "username": "@atleta_94" }
  }
  ```
- **Response 400 Bad Request**:
  ```json
  { "error": "El DNI ya se encuentra registrado en el padrón." }
  ```

### `PUT /api/users/:id`
Corrección de datos de atleta desde el modal de edición. El DNI y el `@username` son inmutables.

- **Request Body**:
  ```json
  {
    "nombres": "Renzo Martín",
    "apellidos": "Almeyda Gómez",
    "celular": "+51 984 221 005"
  }
  ```
- **Response 200 OK**:
  ```json
  { "success": true, "message": "Datos de atleta actualizados correctamente." }
  ```

### `DELETE /api/users/:id`
Elimina físicamente a un usuario de la base de datos (requiere rol Administrador y >30 días de caducidad).

- **Response 200 OK**:
  ```json
  { "success": true, "message": "Usuario eliminado físicamente de la base de datos." }
  ```
- **Response 403 Forbidden**:
  ```json
  { "error": "No permitido: el usuario no supera los 30 días de vencimiento requeridos para purga." }
  ```

---

## 3. Control de Acceso y Check-In (`/api/checkin`)

### `POST /api/checkin`
Valida el DNI de 8 dígitos ingresado en la terminal de recepción y retorna el resultado del semáforo táctico.

- **Request Body**:
  ```json
  { "dni": "72849102" }
  ```
- **Response 200 OK (Verde - Autorizado)**:
  ```json
  {
    "resultado": "VERDE_AUTORIZADO",
    "titulo": "ACCESO AUTORIZADO",
    "kicker": "RESPUESTA RELÉ // PASO CONCEDIDO",
    "authCode": "#AUTH-89102",
    "atleta": {
      "nombres": "Mateo Valdivia Roca",
      "dni": "72849102",
      "edad": "27 AÑOS",
      "fotoUrl": "/uploads/photos/mateo.jpg",
      "estadoMembresia": "48 DÍAS RESTANTES (VENCE: 28/05/2025)",
      "nivelFidelidad": "MUTANDO",
      "planTag": "VIP ANUAL",
      "rutinaHoy": "FUERZA & EMPUJE PUSH DAY",
      "asistenciaMes": "18 SESIONES COMPLETADAS (94%)"
    }
  }
  ```
- **Response 200 OK (Naranja - Aviso de Pago)**:
  ```json
  {
    "resultado": "NARANJA_AVISO",
    "titulo": "ACCESO CONCEDIDO (AVISO DE PAGO)",
    "kicker": "RESPUESTA RELÉ // PASO CONCEDIDO",
    "authCode": "#AUTH-89103",
    "alerta": "Faltan 8 días para el vencimiento de su membresía."
  }
  ```
- **Response 200 OK (Rojo - Denegado)**:
  ```json
  {
    "resultado": "ROJO_DENEGADO",
    "titulo": "ACCESO DENEGADO",
    "kicker": "RESPUESTA RELÉ // PASO BLOQUEADO",
    "motivo": "Membresía vencida hace 12 días o DNI no registrado."
  }
  ```

### `GET /api/checkin/recent`
Retorna el feed en vivo de los últimos ingresos para el panel derecho de recepción.

- **Response 200 OK**:
  ```json
  [
    {
      "id": 401,
      "hora": "19:42:01",
      "nombre": "Mateo Valdivia Roca",
      "detalle": "VIP • 48 DÍAS REST.",
      "resultado": "VERDE_AUTORIZADO"
    },
    {
      "id": 400,
      "hora": "19:38:15",
      "nombre": "Carla Benavides S.",
      "detalle": "FALTAN 8 DÍAS (AVISO)",
      "resultado": "NARANJA_AVISO"
    }
  ]
  ```

### `POST /api/checkin/force`
Apertura manual o forzada por el recepcionista.

- **Request Body**:
  ```json
  {
    "dni": "72849102",
    "motivo": "Apertura forzada manual por falla de lector o cortesía de administración"
  }
  ```
- **Response 200 OK**:
  ```json
  { "success": true, "message": "Paso forzado registrado en auditoría." }
  ```

