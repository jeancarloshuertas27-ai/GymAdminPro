# Feature Specification: Módulo 001 - Usuarios, Roles, Fidelidad y Control de Acceso

**Feature Branch**: `001-usuarios-y-acceso`

**Created**: 2026-10-25

**Status**: Ready for Planning

**Input**: User description: "Establecer el sistema de inicio de sesión por roles (Administrador, Recepcionista y Miembro), el directorio alfabético de miembros con su ficha emergente estilo documento de identidad, el cálculo automático del nivel de fidelidad gamificado y el control de ingreso rápido (Check-in) digitando el DNI en recepción."

## Clarifications

### Session 2026-10-25
- Q: ¿El rol Recepcionista puede crear únicamente usuarios de tipo Miembro o también recepcionistas? → A: Solo Miembro (la pestaña Recepción queda restringida a Administrador).
- Q: ¿Al registrar miembro con pago por Transferencia la membresía queda activa de inmediato o pendiente de aprobación? → A: Activa de inmediato para permitir el ingreso, preservando el voucher para auditoría.
- Q: ¿El semáforo Naranja en Check-in concede paso automáticamente o bloquea hasta intervención? → A: Concede el paso físico automáticamente con advertencia visual en pantalla para evitar demoras en la fila.
- Q: ¿Qué alcance tiene la pantalla móvil del Miembro en este módulo? → A: Carnet digital táctico de atleta responsivo con datos, vigencia, nivel de fidelidad y rutina asignada.
- Q: ¿Qué tipo de eliminación se ejecuta con el botón de eliminar usuario inactivo (>30d)? → A: Borrado físico definitivo (hard delete) de SQLite previa confirmación modal.
- Q: ¿Se debe permitir la modificación del DNI y @username en el modal de corrección de datos del atleta, o ambos deben ser inmutables una vez creados? → A: DNI y @username son inmutables (solo lectura); la edición se restringe a Nombres, Apellidos y Celular.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Control de Acceso y Check-in Rápido por DNI en Recepción (Priority: P1)

Como recepcionista o administrador, quiero digitar el DNI de 8 dígitos de un miembro en la pantalla táctica de recepción (mediante teclado en pantalla, teclado físico o lector óptico) para validar su ingreso instantáneamente y visualizar la respuesta del semáforo táctico (Verde, Naranja o Rojo) junto con la ficha de resumen del atleta.

**Why this priority**: Es el flujo operacional crítico del gimnasio en horas pico; sin check-in rápido, el acceso en la puerta y la operación diaria se detienen.

**Independent Test**: Puede probarse de forma independiente ingresando DNI de miembros con membresía vigente (>10 días), por vencer (1 a 10 días) y vencida, comprobando la respuesta del semáforo y el registro en el feed de ingresos.

**Acceptance Scenarios**:

1. **Given** un atleta con membresía activa con más de 10 días restantes, **When** el recepcionista ingresa su DNI de 8 dígitos y presiona "VALIDAR", **Then** el sistema muestra semáforo VERDE con mensaje "ACCESO AUTORIZADO", concede el paso y agrega el evento al feed en vivo de últimos ingresos.
2. **Given** un atleta con membresía activa pero con vencimiento entre 1 y 10 días restantes, **When** se valida su DNI, **Then** el sistema muestra semáforo NARANJA con alerta de pago ("Faltan X días (Aviso)"), ficha de atleta, concede el paso físico automáticamente para no demorar la fila, emite la advertencia visual en pantalla y registra el ingreso en el feed.
3. **Given** un atleta con membresía caducada o un DNI no registrado, **When** se valida el DNI, **Then** el sistema muestra semáforo ROJO con mensaje de acceso denegado ("Vencido hace X días" o "No registrado"), manteniendo bloqueado el paso.
4. **Given** un evento de contingencia en recepción, **When** el recepcionista pulsa "FORZAR PASO" o "PULSO MANUAL", **Then** el sistema concede el acceso inmediato y registra la autorización manual con marca de tiempo y operador en turno.

---

### User Story 2 - Directorio Alfabético y Ficha Digital Estilo Carnet de Identidad (Priority: P1)

Como administrador o recepcionista, quiero consultar la lista de usuarios ordenada estrictamente por apellidos de la A a la Z, con filtros por estado de membresía y un botón "Ver más" que despliegue una ventana emergente en formato de documento de identidad con botón de cierre "X", mostrando foto, datos personales, estado de membresía y rango de fidelidad.

**Why this priority**: Permite auditar y consultar a los atletas rápidamente, verificar su vigencia y visualizar su credencial táctica sin navegar entre múltiples pantallas.

**Independent Test**: Puede probarse de forma independiente cargando la lista de usuarios, verificando el orden alfabético por apellidos, filtrando por estado (Todos, Activos, Por Vencer, Vencidos) y abriendo el modal "Ver más" de un atleta.

**Acceptance Scenarios**:

1. **Given** la lista de usuarios en la vista de Administrador o Recepción, **When** se carga la página, **Then** los usuarios aparecen ordenados alfabéticamente por apellido paterno (A → Z estricto).
2. **Given** la lista de usuarios en vista de Administrador, **When** se visualiza la tabla, **Then** se muestran las columnas: Apellidos (con inicial destacada), Nombres, Estado de Membresía, Usuario táctico (@username), Contraseña enmascarada con botón para alternar visibilidad (ojito), botón Editar y botón "Ver más".
3. **Given** la lista de usuarios en vista de Recepcionista, **When** se visualiza la tabla, **Then** las credenciales sensibles (usuario y contraseña) permanecen ocultas, permitiendo ver estado, tiempo restante en "X meses y Y días", celular, rutina asignada, botón "Ver Ficha" y "Asignar Rutina".
4. **Given** cualquier usuario en la lista, **When** se pulsa el botón "Ver más", **Then** se abre el modal estilo carnet/pasaporte de identidad con botón 'X' arriba a la derecha, mostrando: foto (o avatar por defecto), Apellidos y Nombres, DNI, Celular, Tiempo de vigencia restante formateado en 'X meses y Y días' (Rojo <10 días, Naranja 10 días a 1 mes, Verde >1 mes), Rango de fidelidad actual con denominación y tiempo acumulado, y Rutina actual asignada.
5. **Given** el botón "Editar" en la lista de usuarios, **When** el operador abre el modal de corrección de datos de un atleta, **Then** el DNI y el `@username` se presentan como campos de solo lectura inmutables, permitiendo únicamente modificar Nombres, Apellidos y Celular.

---

### User Story 3 - Alta Rápida de Usuarios (Recepción y Miembro con Cobro) (Priority: P2)

Como administrador o recepcionista, quiero registrar un nuevo usuario según mi nivel de permisos, seleccionando el tipo correspondiente, completando datos personales, credenciales y membresía con cobro en efectivo o transferencia.

**Why this priority**: Es la puerta de entrada de nuevos ingresos comerciales y personal operativo al sistema.

**Independent Test**: Puede probarse de forma independiente completando el formulario de Recepción (como Administrador) y el formulario de Miembro con pago en efectivo y con transferencia adjuntando voucher, verificando que el usuario aparezca en el padrón con acceso inmediato.

**Acceptance Scenarios**:

1. **Given** un operador con rol Administrador en la pantalla de alta, **When** visualiza el selector superior, **Then** tiene acceso a ambas pestañas: "TIPO: RECEPCIÓN" y "TIPO: MIEMBRO".
2. **Given** un operador con rol Recepcionista en la pantalla de alta, **When** accede al módulo, **Then** la pestaña "TIPO: RECEPCIÓN" permanece oculta o restringida, permitiéndole únicamente dar de alta usuarios con rol Miembro Atleta.
3. **Given** el formulario de Recepción completado por el Administrador con Nombres, Apellidos, DNI (8 dígitos), Celular, Celular de respaldo, Domicilio, Usuario (@) y Contraseña (o generador de clave segura), **When** se pulsa "Guardar", **Then** el recepcionista queda registrado con acceso exclusivo al terminal de recepción web.
4. **Given** el formulario de Miembro completado con Nombres, Apellidos, DNI (8 dígitos), Foto (opcional), Celular, Usuario (@), Contraseña, Rutina asignada (desplegable), Tiempo de membresía (Años y Meses) y Tipo de Pago "Efectivo", **When** se pulsa "Aceptar", **Then** el miembro se registra de inmediato con su membresía calculada desde la fecha actual.
5. **Given** el formulario de Miembro con Tipo de Pago "Transferencia", **When** el operador adjunta obligatoriamente la imagen del comprobante/voucher y registra el código de operación bancaria, **Then** al presionar "Aceptar", la membresía se activa de inmediato permitiendo el ingreso del atleta, y el comprobante se almacena localmente para la auditoría y conciliación de caja.

---

### User Story 4 - Escalafón de Fidelidad Gamificada y Purga de Inactivos (Priority: P2)

Como administrador, quiero que el sistema calcule automáticamente la categoría de fidelidad de cada miembro según su antigüedad ininterrumpida de permanencia, aplicando la penalización de reinicio a "NOVATO" si cae en impago por más de 2 semanas, y habilitando el botón de eliminación física solo si lleva más de 1 mes (30 días) sin renovar.

**Why this priority**: Fomenta la retención de atletas mediante gamificación y mantiene limpia la base de datos eliminando registros inactivos prolongados.

**Independent Test**: Puede probarse de forma independiente evaluando atletas con distintas antigüedades (1 mes, 4 meses, 9 meses, 1.5 años, etc.) comprobando su rango visual, simulando más de 14 días de impago para verificar el reinicio a NOVATO, y comprobando la presencia del botón "Eliminar usuario" en el modal de ficha solo para miembros vencidos con más de 30 días ejecutando borrado físico tras confirmación.

**Acceptance Scenarios**:

1. **Given** un miembro con membresía pagada de forma ininterrumpida, **When** se calcula su antigüedad, **Then** el sistema asigna la denominación exacta del escalafón:
   - <= 1 mes: **NOVATO** (Nivel 01)
   - > 1 mes y <= 3 meses: **PRINCIPIANTE** (Nivel 02)
   - > 3 meses y <= 5 meses: **PROMEDIO** (Nivel 03)
   - > 5 meses y <= 8 meses: **EN PROGRESO** (Nivel 04)
   - > 8 meses y <= 12 meses: **MUTANDO** (Nivel 05)
   - > 1 año y <= 2 años: **MAMADO/A** (Nivel 06)
   - > 2 años y <= 4 años: **DIOS/A GRIEGO/A** (Nivel 07)
   - > 4 años: **ANIMAL** (Nivel APEX)
2. **Given** un atleta cuya membresía venció hace más de 14 días corridos (2 semanas) sin pago de renovación, **When** se evalúa su fidelidad o renueva posteriormente, **Then** su escalafón se reinicia a **NOVATO**.
3. **Given** el modal "Ver más" de un miembro, **When** el atleta tiene una membresía activa o vencida hace menos de 30 días, **Then** el botón "Eliminar usuario de la base de datos" permanece oculto o deshabilitado con mensaje explicativo de protección de datos.
4. **Given** el modal "Ver más" de un miembro en rol Administrador, **When** el atleta lleva más de 1 mes (>30 días) sin renovar, **Then** el botón "Eliminar usuario de la base de datos" aparece activo y destacado en color rojo; al pulsarlo, el sistema despliega un diálogo modal de confirmación ("¿Está seguro de eliminar permanentemente a este atleta? Esta acción no se puede deshacer.") y tras confirmar, ejecuta el borrado físico definitivo (hard delete) del registro en la base de datos SQLite.

---

### User Story 5 - Autenticación Multi-Rol y Acceso del Miembro en Móvil (Priority: P3)

Como usuario del sistema (Administrador, Recepcionista o Miembro), quiero iniciar sesión con mis credenciales únicas (usuario @ y contraseña) para ser redirigido a mi entorno autorizado correspondiente (Web escritorio o vista Móvil).

**Why this priority**: Garantiza la seguridad por separación de roles y privilegios de acceso.

**Independent Test**: Puede probarse autenticando un Administrador (redirigido a Admin Master Suite), un Recepcionista (redirigido a Terminal Recepción) y un Miembro en dispositivo móvil (redirigido a su Carnet Digital Táctico).

**Acceptance Scenarios**:

1. **Given** un usuario con rol Administrador, **When** inicia sesión con credenciales válidas, **Then** accede a la suite completa web (Dashboard, Lista de usuarios con contraseñas visibles, alta de recepción y miembros).
2. **Given** un usuario con rol Recepcionista, **When** inicia sesión en web de escritorio, **Then** accede directamente a la pantalla principal "Control de Acceso & Check-In", sin acceso a ver contraseñas de otros usuarios.
3. **Given** un usuario con rol Miembro, **When** inicia sesión desde un dispositivo móvil con su usuario y contraseña, **Then** accede a una pantalla móvil responsiva con su Carnet Digital Táctico de Atleta, donde visualiza su foto/avatar, nombres, DNI, estado y días restantes de membresía con semáforo cromático, su nivel de fidelidad actual con denominación y tiempo acumulado, y el nombre de su rutina actual asignada.

---

### Edge Cases

- **DNI duplicado**: Si se intenta registrar un nuevo usuario con un DNI que ya existe en la base de datos, el sistema rechaza la operación informando que el documento ya se encuentra registrado.
- **Formato estricto de DNI**: El campo DNI solo permite exactamente 8 caracteres numéricos. Cualquier entrada de longitud distinta o caracteres no numéricos es rechazada en la interfaz y en el guardado.
- **Búsqueda sin coincidencias**: Cuando el filtro o barra de búsqueda por Apellido, Nombre o DNI no arroja resultados, se muestra un mensaje informativo táctico "No se encontraron atletas en el padrón".
- **Comprobante de pago inválido o corrupto**: Si al subir el comprobante de transferencia el archivo excede los 5MB o no es un formato permitido (JPG, PNG, PDF), el sistema alerta al operador antes de enviar el formulario.
- **Acceso con DNI incompleto en torniquete**: Si se presiona "VALIDAR" con menos de 8 dígitos en la pantalla de check-in, el botón no se activa o el sistema indica visualmente "DNI requiere 8 dígitos".
- **Intento de alteración de DNI o @username en edición**: El modal de corrección de datos mantiene el DNI y el nombre de usuario bloqueados en modo solo lectura, previniendo colisiones de claves únicas y alteraciones en los registros históricos de check-in.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE autenticar usuarios mediante identificador de usuario (`@username`) y contraseña, redirigiendo automáticamente según el rol: Administrador (Web/Móvil), Recepcionista (Web Escritorio) y Miembro (Móvil).
- **FR-002**: El sistema DEBE proveer en la pantalla de Recepción un módulo de Check-In táctico que permita ingresar el DNI de 8 dígitos mediante teclado numérico en pantalla, teclado físico o escáner óptico.
- **FR-003**: El módulo de Check-In DEBE evaluar la vigencia del miembro y mostrar el semáforo de acceso correspondiente:
  - **VERDE**: Membresía activa con más de 10 días restantes. Desbloquea paso ("Acceso Autorizado").
  - **NARANJA**: Membresía activa con 1 a 10 días restantes. Desbloquea paso automáticamente para no demorar la fila, emitiendo alerta visual de advertencia ("Faltan X días (Aviso) / Alerta Pago").
  - **ROJO**: Membresía vencida o DNI no registrado. Mantiene bloqueado el torniquete ("Acceso Denegado").
- **FR-004**: El sistema DEBE registrar cada evento de Check-in en un feed cronológico en vivo en la pantalla de recepción, indicando hora, nombre del atleta, estado y resultado.
- **FR-005**: El sistema DEBE listar a los usuarios en orden alfabético estricto por Apellidos (A → Z), con paginación y buscador predictivo por Apellidos, Nombres, DNI y `@username`.
- **FR-006**: La tabla de usuarios en vista Administrador DEBE mostrar: inicial en avatar, Apellidos, Nombres, Estado de membresía (pill de color), Usuario táctico, Contraseña enmascarada con botón para alternar visibilidad, botón Editar y botón "Ver más". El modal de edición activado por el botón Editar DEBE permitir modificar únicamente Nombres, Apellidos y Celular, manteniendo el DNI y el `@username` como identificadores inmutables de solo lectura.
- **FR-007**: La tabla de usuarios en vista Recepcionista DEBE ocultar las columnas de usuario y contraseña, mostrando: Apellidos y Nombres, DNI, Estado de membresía, Tiempo restante en formato "X meses y Y días", Celular, Rutina asignada, botón "Ver Ficha" y botón "Asignar Rutina".
- **FR-008**: Al presionar "Ver más" o "Ver Ficha", el sistema DEBE abrir una ventana modal con diseño de documento de identidad / carnet táctico con botón de cierre "X" en la esquina superior derecha, mostrando: foto (o avatar), Apellidos, Nombres, DNI, Celular, Tiempo restante formateado en "X meses y Y días" con semáforo cromático (Rojo <10 días, Naranja 10 días a 1 mes, Verde >1 mes), Escalafón de Fidelidad con nivel y tiempo acumulado, y Rutina actual asignada.
- **FR-009**: El sistema DEBE calcular automáticamente el escalafón de fidelidad del miembro según los meses ininterrumpidos:
  - Nivel 01: NOVATO (<= 1 mes)
  - Nivel 02: PRINCIPIANTE (1 a 3 meses)
  - Nivel 03: PROMEDIO (3 a 5 meses)
  - Nivel 04: EN PROGRESO (5 a 8 meses)
  - Nivel 05: MUTANDO (8 a 12 meses)
  - Nivel 06: MAMADO/A (1 a 2 años)
  - Nivel 07: DIOS/A GRIEGO/A (2 a 4 años)
  - Nivel APEX: ANIMAL (> 4 años)
- **FR-010**: El sistema DEBE reiniciar automáticamente el rango de fidelidad a "NOVATO" si el atleta permanece más de 14 días corridos (2 semanas) en estado de impago tras la fecha de caducidad.
- **FR-011**: El sistema DEBE mostrar el botón "Eliminar usuario de la base de datos" en el modal de ficha únicamente para miembros con membresía vencida por más de 30 días (>1 mes sin renovar) y bajo el rol Administrador. Tras confirmar en el diálogo modal de confirmación, el sistema ejecuta un borrado físico definitivo (hard delete) en la base de datos.
- **FR-012**: El sistema DEBE proveer un formulario de alta rápida de usuarios. La pestaña "TIPO: RECEPCIÓN" es exclusiva del rol Administrador; los usuarios con rol Recepcionista únicamente pueden visualizar y utilizar la pestaña "TIPO: MIEMBRO".
- **FR-013**: El formulario de personal de Recepción DEBE solicitar como campos obligatorios: Nombres, Apellidos, DNI (8 dígitos), Celular, Celular de respaldo, Domicilio, Nombre de usuario (@) y Contraseña (con botón generador de clave segura).
- **FR-014**: El formulario de Miembro DEBE solicitar: Nombres, Apellidos, DNI (8 dígitos), Celular, Foto de atleta (opcional), Nombre de usuario (@), Contraseña, Rutina asignada (desplegable), Tiempo de membresía (Años y Meses) y Tipo de Pago (Efectivo o Transferencia).
- **FR-015**: Si se selecciona Tipo de Pago "Transferencia", el formulario DEBE exigir obligatoriamente la carga del archivo de imagen del comprobante/voucher y el registro del Código o Número de Operación. Al guardar, la membresía queda activa de inmediato para permitir el acceso, y el comprobante se conserva para la auditoría de caja.
- **FR-016**: El sistema DEBE proveer una vista web móvil para el rol Miembro que muestre su Carnet Digital Táctico con foto/avatar, nombres, DNI, estado de vigencia, nivel en el escalafón de fidelidad y rutina actual asignada.
- **FR-017**: Todo el producto, textos en pantalla, validaciones y reportes DEBEN estar en español de Perú, con moneda Soles (`S/`) y DNI de 8 dígitos numéricos.

---

### Key Entities *(include if feature involves data)*

- **Usuario**:
  - `id`: Identificador único del sistema.
  - `rol`: Tipo de cuenta (`ADMINISTRADOR`, `RECEPCIONISTA`, `MIEMBRO`).
  - `username`: Nombre de usuario único (prefijo `@`).
  - `password_hash`: Credencial cifrada.
  - `nombres`: Nombres del usuario.
  - `apellidos`: Apellidos completos.
  - `dni`: Documento Nacional de Identidad (exactamente 8 dígitos numéricos).
  - `celular`: Teléfono móvil principal (formato local +51).
  - `celular_respaldo`: Teléfono de emergencia (requerido para staff de recepción).
  - `domicilio`: Dirección de residencia (requerido para staff de recepción).
  - `foto_url`: Imagen de perfil / biometría del atleta (opcional).
  - `created_at`: Fecha y hora de registro.

- **Membresia**:
  - `id`: Identificador único de la membresía.
  - `usuario_id`: Relación con el atleta.
  - `fecha_inicio`: Fecha de activación.
  - `fecha_vencimiento`: Fecha calculada de fin de vigencia.
  - `anios`: Cantidad de años contratados.
  - `meses`: Cantidad de meses contratados.
  - `estado`: Estado actual (`ACTIVO`, `POR_VENCER`, `VENCIDO`).
  - `tipo_pago`: Método de pago (`EFECTIVO`, `TRANSFERENCIA`).
  - `comprobante_url`: Archivo de voucher de transferencia (obligatorio si es transferencia).
  - `numero_operacion`: Código de operación bancaria.

- **Fidelidad**:
  - `usuario_id`: Relación con el miembro.
  - `fecha_inscripcion_original`: Fecha inicial de ingreso al gimnasio.
  - `meses_permanencia_continua`: Meses ininterrumpidos acumulados.
  - `nivel_actual`: Rango actual (`NOVATO`, `PRINCIPIANTE`, `PROMEDIO`, `EN_PROGRESO`, `MUTANDO`, `MAMADO`, `DIOS_GRIEGO`, `ANIMAL`).
  - `ultimo_reinicio`: Fecha de la última penalización a NOVATO por impago >2 semanas.

- **RegistroCheckin**:
  - `id`: Identificador único del evento de ingreso.
  - `usuario_id`: Miembro que ingresa (si fue reconocido).
  - `dni_ingresado`: DNI digitado en el lector/pantalla.
  - `timestamp`: Fecha y hora exacta del check-in.
  - `resultado`: Semáforo resultante (`VERDE_AUTORIZADO`, `NARANJA_AVISO`, `ROJO_DENEGADO`, `MANUAL_FORZADO`).
  - `operador_id`: Recepcionista en turno que atiende la terminal.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El personal de recepción puede validar el DNI de un atleta y observar el semáforo en pantalla en menos de 2 segundos desde la pulsación de "VALIDAR".
- **SC-002**: El 100% de los usuarios listados en la vista de administración o recepción se muestran ordenados alfabéticamente por apellido de forma estricta.
- **SC-003**: Cero contraseñas o nombres de usuario de miembros son expuestos en pantalla a usuarios con rol Recepcionista.
- **SC-004**: El cálculo del escalafón de fidelidad y la penalización de reinicio por más de 14 días de impago se ejecutan con 100% de precisión matemática y temporal.
- **SC-005**: El botón de eliminación de usuario solo está visible y disponible cuando el miembro acumula más de 30 días naturales con membresía vencida, impidiendo borrados accidentales de cuentas vigentes.
- **SC-006**: Cualquier usuario no técnico puede completar el registro de un nuevo miembro con membresía y pago en menos de 90 segundos a través del formulario táctico.

---

## Assumptions

- Todos los textos, mensajes de error y etiquetas se redactan exclusivamente en español de Perú.
- El identificador principal en sala es el DNI peruano de 8 dígitos numéricos.
- La pantalla de recepción asume una resolución de escritorio o tablet con soporte para interacción táctil o ratón/teclado.
- La gestión de rutinas detalladas (ejercicios por bloque, series y repeticiones) utiliza opciones base para asignación en el formulario de miembro y ficha, integrándose con el módulo especializado de rutinas.
- La moneda utilizada para cualquier visualización comercial es Soles (`S/`).
