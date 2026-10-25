# Quickstart & Validation Guide: Módulo 001 - Usuarios, Roles, Fidelidad y Control de Acceso

**Feature**: `001-usuarios-y-acceso`  
**Purpose**: Guía de verificación paso a paso para validar de extremo a extremo las capacidades funcionales del módulo en el navegador.

---

## 1. Prerrequisitos y Arranque Local

1. **Instalación de dependencias**:
   ```bash
   npm install
   ```
2. **Inicialización y seed de datos de prueba en SQLite**:
   ```bash
   npm run db:seed
   ```
   *Carga usuarios iniciales para pruebas*:
   - Administrador: `@admin_01` (clave: `Admin2026!`)
   - Recepcionista: `@recep_carlos` (clave: `Recep2026!`)
   - Atleta Activo (>10d): Mateo Valdivia Roca (`DNI: 72849102`, 48 días restantes)
   - Atleta Por Vencer (1-10d): Carla Benavides Castro (`DNI: 70918234`, 8 días restantes)
   - Atleta Vencido (>30d purgable): Andrés Mejía Loyola (`DNI: 71220944`, vencido hace 45 días)
3. **Iniciar entorno de desarrollo (Frontend + Backend)**:
   ```bash
   npm run dev
   ```
   - Abre en el navegador `http://localhost:5173`.

---

## 2. Escenarios de Validación de Usuario

### Escenario 1: Control de Acceso y Check-In Rápido (Recepcionista)
1. Iniciar sesión como `@recep_carlos`.
2. Verificar que el sistema redirige automáticamente al **Terminal de Recepción** (`/recepcion/checkin`).
3. **Prueba Verde (Paso Concedido)**:
   - Digitar en el teclado táctil numérico el DNI `72849102` y pulsar **VALIDAR**.
   - **Resultado esperado**: Semáforo VERDE con mensaje `"ACCESO AUTORIZADO"`, ficha de atleta de Mateo Valdivia con nivel `MUTANDO`, y nuevo registro en el feed de "Últimos Ingresos".
4. **Prueba Naranja (Aviso de Pago)**:
   - Digitar el DNI `70918234` y pulsar **VALIDAR**.
   - **Resultado esperado**: Semáforo NARANJA con `"Faltan 8 días (Aviso)"`, torniquete concediendo el paso físico automáticamente, y aviso de cobro en pantalla.
5. **Prueba Rojo (Acceso Denegado)**:
   - Digitar el DNI `71220944` o un DNI inexistente (`00000000`).
   - **Resultado esperado**: Semáforo ROJO con mensaje `"ACCESO DENEGADO"`, torniquete bloqueado.
6. **Prueba Pulso Manual**:
   - Pulsar el botón **"PULSO MANUAL"** o **"FORZAR PASO"**.
   - **Resultado esperado**: Registro de apertura manual registrado con el operador Carlos Mendoza.

---

### Escenario 2: Directorio Alfabético y Ficha Modal "Ver Más" (Administrador)
1. Iniciar sesión como `@admin_01`.
2. Verificar redirección a la **Admin Master Suite** (`/admin/usuarios`).
3. **Verificación de Orden Alfabético**:
   - Comprobar que los atletas se presentan ordenados estrictamente por apellidos de la A a la Z (`Almeyda Gómez`, `Benavides Castro`, `Guzmán Prado`, etc.).
4. **Verificación de Privacidad y Contraseñas**:
   - Comprobar que las contraseñas aparecen enmascaradas (`••••••••••••`) con un botón de ojo que permite revelar la clave.
5. **Apertura de Ficha de Identidad**:
   - Pulsar el botón **"VER MÁS"** de cualquier atleta.
   - **Resultado esperado**: Se despliega el modal táctico estilo carnet de identidad con botón de cierre "X", foto/avatar, DNI, vigencia restante en formato `"X meses y Y días"`, insignia de rango de fidelidad y rutina asignada.

---

### Escenario 3: Edición de Datos con Inmutabilidad de DNI y Usuario
1. En la tabla de usuarios, presionar el botón **"EDITAR"** de un atleta.
2. Comprobar que se abre el modal "Corrección de datos de atleta".
3. **Resultado esperado**:
   - Los campos **DNI** y **Nombre de usuario (@)** están deshabilitados / bloqueados en solo lectura.
   - Modificar Apellidos, Nombres o Celular y pulsar **Guardar**.
   - Los cambios se reflejan inmediatamente en la tabla sin alterar el DNI ni el usuario.

---

### Escenario 4: Alta Rápida de Miembro con Pago por Transferencia
1. Navegar a **"NUEVO USUARIO"** (`/admin/nuevo-usuario`).
2. Seleccionar la pestaña **"TIPO: MIEMBRO"**.
3. Completar Nombres, Apellidos, DNI (`88889999`), Celular, Usuario (`@nuevo_atleta`) y Contraseña.
4. Seleccionar Tiempo de Membresía: `1 AÑOS Y 0 MESES`.
5. Marcar Tipo de Pago **"Transferencia"**:
   - Comprobar que se despliega la sección obligatoria para adjuntar voucher y número de operación.
   - Adjuntar una imagen de comprobante y escribir código de operación `OP-54321`.
6. Presionar **"Aceptar"**.
7. **Resultado esperado**:
   - Notificación de éxito en pantalla.
   - El nuevo miembro queda activo inmediatamente en el padrón con membresía vigente de 1 año.
   - El DNI `88889999` ya puede hacer check-in exitoso en recepción arrojando semáforo VERDE.

---

### Escenario 5: Eliminación de Usuario Vencido (>30 días)
1. En la lista de usuarios, buscar al usuario con más de 30 días vencido (ej. Andrés Mejía Loyola, vencido hace 45 días).
2. Abrir su modal **"VER MÁS"**.
3. **Resultado esperado**:
   - El botón **"ELIMINAR USUARIO DE LA BASE DE DATOS"** aparece habilitado en color rojo.
   - Al presionarlo, surge un diálogo de confirmación: *"¿Está seguro de eliminar a este usuario permanentemente? Esta acción no se puede deshacer"*.
   - Al confirmar, el atleta es eliminado físicamente de la base de datos y desaparece del padrón.

---

### Escenario 6: Vista Móvil del Miembro
1. Conmutar el navegador a emulación de dispositivo móvil (ej. 390x844 px).
2. Iniciar sesión con un usuario atleta (ej. `@atleta_94`).
3. **Resultado esperado**:
   - Vista móvil con su Carnet Digital Táctico: nombres, DNI, días restantes de membresía con semáforo cromático, denominación de fidelidad y nombre de su rutina actual asignada.

