# Feature Specification: 003 - Auditoría, Reportes PDF y Separación en 3 Sitios

**Feature Branch**: `003-auditoria-reportes-y-3-sitios`  
**Created**: 2026-11-12  
**Status**: Draft  
**Input**: Requisitos de separación limpia en 3 sitios independientes por rol conectados a la misma base de datos SQLite (Admin, Recepción y Miembro), Dashboard Principal del Administrador con métricas y alertas en tiempo real, Lista de Cambios y Aprobaciones en 2 columnas paralelas con visor forense de comprobantes, botón 'Aceptar cambio' con destrucción física de imágenes y preservación contable, botón 'Generar reporte' con descarga de PDF consolidado (`REPORTE <FECHA>.pdf`), lista de usuarios con credenciales para Admin y eliminación de inactivos > 1 mes, y vista móvil para miembros con estructura lista para rutinas y coach.

---

## 1. Objetivo y Contexto de Negocio

La Feature 003 consolida la arquitectura multi-portal y el sistema de control financiero y auditoría para GymAdminPro:
1. **Separación Estricta en 3 Sitios por Rol**: Establece 3 puntos de acceso e interfaces independientes:
   - **(A) Sitio Administrador (`/admin`)**: Web escritorio y móvil. Plataforma de mando y control total: Dashboard Principal, Control de Acceso (Check-in), Promociones y Precios, Membresías, Lista de Cambios con Reportes PDF, Usuarios (con visualización de usuario/contraseña y depuración de inactivos >1 mes), Inventario Maestro con Costos Privados y Alta de Personal (Recepción o Miembro).
   - **(B) Sitio Recepción (`/recepcion`)**: Exclusivo Web escritorio. Terminal de mostrador enfocada en agilidad operativa: Control de Acceso táctico (pantalla principal con semáforo por DNI), Renovación de Membresías, Lista de Usuarios básica (sin ver contraseñas ni eliminar), Alta de Atletas Miembros y Venta Rápida de Productos (con stock visible y agotados translúcidos, sin costos ni edición de inventario).
   - **(C) Sitio Miembro (`/miembro`)**: Exclusivo Móvil. Carnet digital del socio con QR dinámico, vigencia de días, nivel de fidelidad gamificada y promociones activas dirigidas a su rango, dejando lista la arquitectura para rutinas y alerta de coach.
2. **Auditoría Financiera y Reportes Fiscales (Etapa 3 Stitch)**:
   - **Dashboard Principal**: Telemetría en tiempo real de recaudación en Soles (`S/`), miembros activos, alertas de inventario crítico (<5 u. o agotado) y resumen de comprobantes bancarios por validar.
   - **Lista de Cambios en 2 Columnas Maestras**: Paralelas y ordenadas para "Cambios en Membresía" y "Venta de Productos", con visor modal de alta resolución y zoom para comprobantes de transferencias (Yape, Plin, BCP, bancos).
   - **Aceptación de Cambios con Purga Física**: Botón "ACEPTAR CAMBIO" que elimina definitivamente el archivo físico de imagen del comprobante del servidor y BD (Principio V de la Constitución), retira la tarjeta de la vista activa y mantiene intacto el asiento contable para balances.
   - **Generación Oficial de Reporte PDF**: Descarga del consolidado oficial `REPORTE <FECHA>.pdf` integrando (a) ganancias por membresías, (b) nuevos usuarios inscritos, (c) recaudación por productos y (d) detalle desglosado de unidades vendidas y subtotales en `S/`.

---

## 2. User Scenarios & Testing *(mandatory)*

### User Story 1 - Separación Limpia y Login Exclusivo en 3 Sitios Independientes (Priority: P1)

**Como** operador de GymAdminPro (Administrador, Recepcionista o Miembro),  
**quiero** acceder al portal web o móvil correspondiente a mi rol mediante un inicio de sesión exclusivo que rechace credenciales no autorizadas,  
**para** operar dentro de un entorno seguro, enfocado exclusivamente en mis tareas asignadas, sincronizado en tiempo real con la base de datos común SQLite.

- **Por qué esta prioridad**: Es el pilar arquitectónico establecido en el Principio VI de la Constitución; garantiza la segregación de accesos, previene fugas de información sensible y asegura consistencia de datos entre roles.
- **Prueba Independiente**: Ingresar a `/admin` con credenciales de recepción y verificar el rechazo inmediato; ingresar a `/recepcion` con credenciales de miembro y verificar el rechazo; ingresar a `/miembro` con credenciales de miembro y verificar el acceso exitoso a su carnet móvil.

**Acceptance Scenarios**:
1. **Given** un usuario que navega a `/admin`, **When** ingresa credenciales válidas de un usuario con rol `admin`, **Then** el sistema inicia sesión y lo redirige a la vista de mando del Administrador; si intenta autenticarse con una cuenta de rol `recepcion` o `miembro`, el sistema deniega el acceso con el mensaje "Acceso exclusivo para Administradores".
2. **Given** un usuario que navega a `/recepcion`, **When** ingresa credenciales válidas de un usuario con rol `recepcion`, **Then** el sistema inicia sesión y despliega como pantalla de inicio el Control de Acceso (Check-in); si intenta autenticarse una cuenta de rol `admin` o `miembro`, el sistema deniega el acceso indicando que el portal es exclusivo para personal de mostrador.
3. **Given** un atleta que navega a `/miembro`, **When** ingresa su DNI y credenciales de rol `miembro`, **Then** el sistema inicia sesión y muestra el carnet digital interactivo adaptado para dispositivos móviles; si una cuenta `admin` o `recepcion` intenta ingresar, el sistema rechaza la solicitud.
4. **Given** cualquiera de los 3 sitios autenticados, **When** se ejecuta una acción que muta el estado (ej. check-in, extensión de días o venta de producto), **Then** los datos se persisten en la base de datos común `gymcore.db` y se reflejan de inmediato en las consultas de los otros sitios sin desfase.

---

### User Story 2 - Experiencia Operativa de Recepción en Mostrador (Priority: P1)

**Como** Recepcionista del gimnasio en el mostrador,  
**quiero** tener como pantalla inicial el Control de Acceso con semáforo por DNI, acceder a la venta rápida de productos con stock visible, gestionar membresías con promociones segmentadas por fidelidad y registrar nuevos miembros,  
**para** atender rápidamente a los clientes en fila sin distracciones ni acceso a datos financieros o administrativos privados.

- **Por qué esta prioridad**: Es el flujo operativo más frecuente y de mayor impacto en la atención diaria del gimnasio.
- **Prueba Independiente**: Autenticarse en `/recepcion`, verificar que la vista predeterminada sea el Check-in táctico, realizar una venta rápida en efectivo, registrar una extensión de membresía por transferencia y verificar que viaje a la lista de cambios del Administrador sin mostrar costos de productos ni datos de contraseñas.

**Acceptance Scenarios**:
1. **Given** que el Recepcionista inicia sesión en `/recepcion`, **When** la aplicación carga, **Then** la pantalla activa por defecto es el "Control de Acceso / Check-in Inmediato", con un campo numérico prominente para ingresar el DNI de 8 dígitos y retroalimentación visual de semáforo (Verde: Autorizado, Naranja: Por Vencer, Rojo: Denegado/Vencido).
2. **Given** que el Recepcionista ingresa a "Venta Rápida de Productos", **When** visualiza el catálogo, **Then** observa la foto, nombre, precio de venta público (`S/`) y stock numérico; los productos con stock 0 se muestran atenuados (translúcidos al 60%) con el sello "AGOTADO" y botón de venta bloqueado. El Recepcionista no puede ver precios de costo ni botones para añadir, editar o borrar productos del inventario maestro.
3. **Given** que el Recepcionista gestiona una membresía en "Agregar Tiempo de Membresía", **When** busca a un atleta por DNI y despliega el catálogo de promociones, **Then** el sistema lista únicamente las promociones válidas para el nivel de fidelidad de dicho atleta (o dirigidas a todo público), ocultando promociones de rangos superiores.
4. **Given** que el Recepcionista consulta la "Lista de Usuarios", **When** visualiza los atletas inscritos, **Then** puede ver sus nombres, DNI, estado y nivel, pero el sistema oculta las credenciales (usuario/contraseña) y no presenta ningún botón para eliminar usuarios.
5. **Given** que el Recepcionista se encuentra en el formulario "Nuevo Usuario", **When** registra una nueva alta, **Then** el rol asignado queda fijado únicamente en `miembro`, sin opción de crear cuentas administrativas o de recepción.

---

### User Story 3 - Dashboard Principal del Administrador en Tiempo Real (Priority: P1)

**Como** Administrador del gimnasio,  
**quiero** visualizar un panel de mando ejecutivo con indicadores clave en tiempo real (ingresos del día en Soles, atletas activos, alertas de stock bajo y resumen de transferencias pendientes),  
**para** supervisar el pulso financiero, operativo y de inventario del negocio en una sola pantalla.

- **Por qué esta prioridad**: Proporciona visibilidad global y rápida al dueño/administrador sin tener que navegar por múltiples módulos o realizar cálculos manuales.
- **Prueba Independiente**: Iniciar sesión en `/admin`, comprobar la tarjeta de "Ingresos del Día" con el desglose entre membresías y productos, la tarjeta de "Atletas Activos", la tarjeta de alerta de "Stock Crítico" (<5 u.) y el botón de redirección hacia la "Lista de Cambios".

**Acceptance Scenarios**:
1. **Given** que el Administrador accede a `/admin`, **When** carga el Dashboard Principal, **Then** visualiza la tarjeta bento de "Ingresos del Día" con el total en Soles (`S/`) sumando pagos aprobados de membresías y ventas de productos de la jornada, acompañado del desglose proporcional entre ambos conceptos.
2. **Given** el padrón de atletas en la base de datos, **When** se actualiza el Dashboard, **Then** la métrica de "Atletas Activos" muestra el total de socios con membresía vigente, detallando cuántos están en rango de alerta por vencer (<10 días) y cuántos nuevos atletas se inscribieron en el mes.
3. **Given** existencias en el inventario, **When** uno o más productos tengan stock menor a 5 unidades o igual a 0, **Then** la tarjeta de "Alerta Inventario / Stock Crítico" muestra la cantidad de ítems críticos y los nombres de los productos afectados, con un enlace directo para reabastecer en el Inventario Maestro.
4. **Given** que existen comprobantes de transferencias bancarias o billeteras digitales pendientes de aprobación, **When** el Administrador mira el widget de "Auditoría / Transferencias por Auditar", **Then** observa el conteo exacto de transferencias pendientes y un botón directo que lo conduce a la "Lista de Cambios & Aprobaciones".
5. **Given** el Dashboard Principal, **When** el Administrador requiere validar un socio in situ, **Then** cuenta con la barra de Check-in Táctico integrada para verificar DNI y visualizar el estado de semáforo en la misma pantalla.

---

### User Story 4 - Auditoría de Pagos en 2 Columnas Maestras y Aceptación con Purga de Fotos (Priority: P1)

**Como** Administrador del gimnasio,  
**quiero** revisar la "Lista de Cambios & Auditoría de Pagos" organizada en 2 columnas paralelas ("Cambios en Membresías" y "Venta de Productos"), examinar los comprobantes en un visor modal forense con zoom y pulsar "ACEPTAR CAMBIO",  
**para** conciliar las transferencias y ventas en caja, eliminando el archivo físico de la imagen para ahorrar espacio en servidor y manteniendo el registro contable en la base de datos.

- **Por qué esta prioridad**: Salvaguarda la integridad financiera del gimnasio, previene fraudes en recepción y da cumplimiento estricto al Principio V (Datos del usuario y recursos con respeto: purga física de comprobantes aprobados).
- **Prueba Independiente**: Abrir la vista de Lista de Cambios, verificar que se muestren las dos columnas paralelas con sus tarjetas detalladas, abrir el modal de imagen para un comprobante, presionar "ACEPTAR CAMBIO" y comprobar que la tarjeta desaparezca de la vista, que el archivo de imagen se borre del disco/servidor y que el registro contable permanezca en la base de datos.

**Acceptance Scenarios**:
1. **Given** que el Administrador accede a "Cambios & Aprobaciones", **When** se renderiza la interfaz, **Then** la pantalla se divide en 2 columnas maestras paralelas:
   - **Columna Izquierda (Cambios en Membresías)**: Cada tarjeta muestra el nombre del atleta, DNI, quién realizó la operación (`Cambiado por: Recepción` o `Admin`), tiempo agregado (ej. `+1 Año`, `+3 Meses`, `+30 Días`), fecha y hora exacta, método de pago (`Efectivo (Caja)` o `Transferencia Yape/Plin/Banco`) e importe en Soles (`S/`).
   - **Columna Derecha (Venta de Productos)**: Cada tarjeta muestra la miniatura del producto, nombre, SKU, responsable (`Vendido por: Recepción` o `Admin`), cantidad en unidades, fecha y hora exacta, método de pago e importe en Soles (`S/`).
2. **Given** una tarjeta de membresía o producto cuyo método de pago sea transferencia bancaria o billetera digital, **When** el Administrador hace clic en "Ver imagen", **Then** se abre el modal "Auditoría Forense de Comprobante" mostrando la imagen del comprobante en alta resolución con controles interactivos de zoom (+ / - / reiniciar), datos de la operación, importe declarado y lista de verificación.
3. **Given** una tarjeta pendiente en cualquiera de las 2 columnas, **When** el Administrador hace clic en "ACEPTAR CAMBIO", **Then** el sistema ejecuta las siguientes acciones:
   - Elimina físicamente el archivo de imagen del comprobante del almacenamiento del servidor / base de datos para liberar recursos (Principio V).
   - Oculta y retira de forma inmediata la tarjeta de la vista activa de cambios pendientes con una animación fluida y notificación toast.
   - Preserva los datos numéricos y metadatos contables (monto, fecha, hora, concepto, responsable, método de pago) en la base de datos SQLite para auditorías y generación de reportes.
   - Si la operación provenía de recepción y correspondía a una extensión de membresía, activa formalmente los días de vigencia en la cuenta del atleta.

---

### User Story 5 - Generación y Descarga del Reporte Consolidado en PDF (Priority: P2)

**Como** Administrador del gimnasio,  
**quiero** hacer clic en el botón prominente "GENERAR REPORTE" en la Lista de Cambios y descargar un documento oficial en PDF titulado `REPORTE <FECHA>.pdf`,  
**para** archivar el balance contable de la jornada, conciliar ingresos y auditar el desempeño diario del gimnasio.

- **Por qué esta prioridad**: Proporciona el cierre contable físico y legal del negocio al final del turno o del día, respaldando la administración tributaria e interna.
- **Prueba Independiente**: Hacer clic en "GENERAR REPORTE", visualizar el modal de resumen consolidado, presionar "DESCARGAR 'REPORTE_<FECHA>.pdf'" y comprobar que el archivo descargado contenga las cuatro secciones obligatorias en español de Perú y con moneda Soles (`S/`).

**Acceptance Scenarios**:
1. **Given** que el Administrador está en la Lista de Cambios, **When** visualiza la pantalla, **Then** cuenta con un botón flotante destacado en la esquina inferior derecha rotulado "GENERAR REPORTE - DESCARGA PDF // CONSOLIDADO DIARIO".
2. **Given** que el Administrador presiona "GENERAR REPORTE", **When** se abre el modal de consolidación, **Then** muestra la previsualización del documento con los totales acumulados del día y el nombre del archivo previsto `REPORTE <FECHA>.pdf` (ej. `REPORTE 2026-11-12.pdf`).
3. **Given** que el Administrador confirma la descarga, **When** el sistema compila el PDF, **Then** descarga automáticamente el archivo estructurado obligatoriamente con los siguientes 4 bloques:
   - **(a) Ganancias por Membresías**: Monto total recaudado en Soles (`S/`) por renovaciones y planes de membresía del día.
   - **(b) Nuevos Usuarios Inscritos**: Cantidad de atletas dados de alta en la jornada y detalle de inscripciones.
   - **(c) Ganancias por Venta de Productos**: Monto total recaudado en Soles (`S/`) por productos en mostrador.
   - **(d) Detalle de Productos Vendidos**: Tabla pormenorizada con nombre de cada producto, unidades vendidas, precio unitario en `S/` y subtotal en `S/`.
4. **Given** que no existen ventas o movimientos en algún rubro, **When** se genera el reporte, **Then** el reporte refleja con claridad `S/ 0.00` y 0 registros en dicho bloque sin presentar errores ni campos vacíos.

---

### User Story 6 - Gestión Administrativa de Usuarios y Depuración de Inactivos > 1 Mes (Priority: P2)

**Como** Administrador del gimnasio,  
**quiero** ver la lista completa de usuarios con sus credenciales de acceso (usuario y contraseña) visibles para soporte, y contar con un botón "Eliminar" disponible para aquellos usuarios que lleven más de 1 mes inactivos,  
**para** gestionar el soporte de cuentas a miembros y personal y depurar registros abandonados del padrón de socios.

- **Por qué esta prioridad**: Otorga al Administrador control total sobre las cuentas de acceso y mantiene limpia la base de datos de socios que abandonaron el gimnasio.
- **Prueba Independiente**: Ingresar a "Usuarios & Fidelidad" como Admin, comprobar que se visualicen los nombres de usuario y contraseñas; ubicar un usuario con membresía vencida hace más de 30 días y comprobar que el botón "Eliminar" esté habilitado y procese la baja tras confirmación; ubicar un usuario activo o vencido hace menos de 30 días y verificar que no permita su eliminación accidental.

**Acceptance Scenarios**:
1. **Given** el Administrador en la "Lista de Usuarios & Fidelidad", **When** consulta las fichas de los usuarios registrados, **Then** la tabla exhibe de forma explícita las columnas o detalles de credenciales (Nombre de usuario y Contraseña/PIN) para permitir asistencia inmediata en mostrador.
2. **Given** un usuario cuya última membresía haya vencido hace más de 30 días calendario y no registre ingresos recientes, **When** el Administrador revisa su registro, **Then** el sistema presenta un botón activo de "Eliminar Usuario Inactivo".
3. **Given** un usuario activo o con membresía vencida hace menos de 30 días, **When** el Administrador revisa su registro, **Then** el botón de eliminación permanece deshabilitado o con un mensaje indicando que el socio no cumple la condición de inactividad mayor a 1 mes.
4. **Given** que el Administrador presiona "Eliminar Usuario Inactivo", **When** confirma la acción en el cuadro de diálogo de advertencia, **Then** el sistema procesa la depuración del socio [NEEDS CLARIFICATION: ¿Baja lógica desvinculando credenciales o eliminación física si no tiene historial contable?] y actualiza la lista en pantalla.

---

### User Story 7 - Sitio Miembro Móvil y Preparación de Módulos Futuros (Priority: P3)

**Como** Miembro del gimnasio que accede desde su smartphone,  
**quiero** visualizar mi carnet digital con código QR de acceso, estado de membresía, nivel de fidelidad gamificada y catálogo de promociones activas para mi nivel, con accesos preparados para mis rutinas y llamada a coach,  
**para** disfrutar de una experiencia ágil de auto-servicio desde mi teléfono móvil.

- **Por qué esta prioridad**: Entrega valor directo al atleta en su dispositivo móvil y deja los cimientos listos para la Feature 004 (Rutinas y App Miembro).
- **Prueba Independiente**: Ingresar a `/miembro` con credenciales de atleta, verificar el renderizado del carnet digital, el código QR de acceso táctico, el nivel de fidelidad, las promociones activas elegibles y los accesos preparados a rutinas.

**Acceptance Scenarios**:
1. **Given** un socio que inicia sesión en `/miembro`, **When** carga su portal, **Then** la interfaz se presenta en formato vertical optimizado para teléfonos móviles, mostrando su nombre, DNI, foto de perfil, carnet digital con código QR dinámico de acceso y contador de días restantes.
2. **Given** un socio con nivel de fidelidad asignado (ej. "Novato", "Principiante", "Mutando", "Dios Griego"), **When** consulta su panel, **Then** visualiza su insignia de rango, puntos de combate y la lista de promociones activas que corresponden a su nivel.
3. **Given** la navegación inferior del Sitio Miembro, **When** el atleta revisa las opciones disponibles, **Then** cuenta con accesos directos estructurados para "Carnet", "Promociones", "Mi Rutina" y "Llamar Coach" (dejando la estructura de navegación lista para la integración completa de rutinas y ejercicios en la Etapa 4).

---

### Edge Cases

- **Intento de acceso cruzado entre sitios**: Si un usuario autenticado como recepcionista intenta forzar la URL `/admin`, el sistema intercepta la navegación, destruye la sesión no autorizada o redirige a `/recepcion` con mensaje de alerta.
- **Comprobante de pago con formato inválido o corrupto**: Si al registrar un pago por transferencia el archivo subido se corrompe o no es una imagen válida, el visor modal muestra un estado de error legible y permite al Administrador solicitar un nuevo comprobante o rechazar el cambio.
- **Pérdida de conectividad al aceptar cambio**: Si ocurre un fallo de red durante el clic en "Aceptar cambio", la transacción no debe quedar a medias: la foto no se destruye a menos que la base de datos confirme la aprobación contable.
- **Generación de reporte sin transacciones en la fecha**: Si se genera el reporte PDF en un día feriado o sin ventas, el PDF debe compilarse correctamente mostrando S/ 0.00 en ganancias, 0 nuevos miembros y una nota informativa de "Sin movimientos registrados en la fecha".
- **Eliminación de usuario con pagos históricos**: Si un usuario inactivo hace más de 1 mes tiene compras o renovaciones registradas en meses anteriores, su eliminación no debe romper las relaciones en reportes contables pasados (preservando integridad referencial en SQLite).
- **Concurrencia entre Recepción y Administrador**: Si Recepción registra una venta o membresía por transferencia mientras el Administrador tiene abierta la pantalla de cambios, el nuevo registro debe reflejarse en tiempo real o mediante actualización instantánea sin recarga forzada.

---

## 3. Requirements *(mandatory)*

### Functional Requirements

#### Bloque A: Separación en 3 Sitios Independientes
- **FR-001**: El sistema DEBE ofrecer 3 puntos de entrada web independientes: `/admin` para el Sitio Administrador, `/recepcion` para el Sitio Recepción y `/miembro` para el Sitio Miembro.
- **FR-002**: Cada sitio DEBE contar con su propio formulario y flujo de inicio de sesión exclusivo, validando el rol del usuario contra la base de datos SQLite y rechazando inmediatamente credenciales que no correspondan al portal en uso.
- **FR-003**: El Sitio Administrador (`/admin`) DEBE incluir la barra de navegación completa con acceso a: (1) Dashboard Principal, (2) Control de Acceso (Check-in), (3) Manejar Promociones / Precios, (4) Manejar Membresías, (5) Lista de Cambios y Reporte PDF, (6) Lista de Usuarios (con credenciales visibles y botón de eliminar inactivos >1 mes), (7) Manejar Productos (Inventario Maestro con Costos Privados, CRUD y ventas) y (8) Agregar Usuario Nuevo (roles Recepción o Miembro).
- **FR-004**: El Sitio Recepción (`/recepcion`) DEBE presentar por defecto la pantalla de "Control de Acceso / Check-in" con semáforo por DNI (Verde, Naranja y Rojo) y restringir su menú únicamente a: (1) Control de Acceso, (2) Manejar Membresías, (3) Lista de Usuarios (sin credenciales visibles y sin botón de eliminación), (4) Agregar Miembro Nuevo (únicamente rol Miembro) y (5) Venta Rápida de Productos.
- **FR-005**: En el Sitio Recepción, la vista de productos DEBE mostrar existencias y atenuar de forma translúcida (con sello "AGOTADO") los productos con stock 0, ocultando totalmente el precio de costo privado y deshabilitando cualquier función de creación, edición o eliminación de productos.
- **FR-006**: El Sitio Miembro (`/miembro`) DEBE desplegar una interfaz adaptada exclusivamente a dispositivos móviles, presentando el carnet digital interactivo, código QR dinámico de acceso, vigencia de membresía, nivel de fidelidad gamificada y promociones activas segmentadas, dejando preparadas las secciones para rutinas y alerta de coach.
- **FR-007**: Los 3 sitios DEBEN conectarse al mismo backend Node.js y a la misma base de datos compartida SQLite (`server/gymcore.db`), garantizando consistencia inmediata de saldos, stock y membresías.

#### Bloque B: Auditoría, Aprobaciones y Reportes PDF del Administrador
- **FR-008**: El Dashboard Principal del Administrador DEBE calcular y presentar en tiempo real: (a) Ingresos del día en Soles (`S/`) desglosados entre membresías y productos, (b) Atletas activos totales, indicando alertas por vencer (<10 días) y nuevos del mes, (c) Alerta de productos con stock crítico (<5 unidades o agotados) con enlace directo al inventario, y (d) Widget de comprobantes de transferencia pendientes de auditar.
- **FR-009**: La vista de "Lista de Cambios & Auditoría de Pagos" DEBE estructurarse visualmente en 2 columnas maestras paralelas y ordenadas:
  - **Columna 1: Cambios en Membresías**: Exhibiendo usuario afectado, quién hizo el cambio (`Cambiado por: Recepción` o `Admin`), tiempo agregado (días/meses), fecha y hora exacta, método de pago (Efectivo o Transferencia) e importe en Soles (`S/`).
  - **Columna 2: Venta de Productos**: Exhibiendo miniatura del producto, nombre, SKU, vendedor (`Vendido por: Recepción` o `Admin`), unidades vendidas, fecha y hora exacta, método de pago e importe en Soles (`S/`).
- **FR-010**: En ambas columnas de la Lista de Cambios, para cualquier operación con método de pago por transferencia (banco o billetera digital), el sistema DEBE proveer un botón visible "Ver imagen" que despliegue el modal visor con imagen en alta resolución y controles de zoom forense.
- **FR-011**: Cada tarjeta en espera de aprobación DEBE contar con un botón "ACEPTAR CAMBIO". Al ser presionado por el Administrador, el sistema DEBE:
  - (1) Eliminar físicamente el archivo de imagen del comprobante del servidor/base de datos para optimizar espacio (Principio V de la Constitución).
  - (2) Ocultar de inmediato la tarjeta de la vista activa de cambios pendientes en pantalla.
  - (3) Preservar los registros contables y metadatos de la operación en la base de datos SQLite para balances y reportes.
- **FR-012**: La Lista de Cambios DEBE disponer de un botón prominente "GENERAR REPORTE" que abra la previsualización del balance diario y permita compilar y descargar un archivo PDF oficial titulado `REPORTE <FECHA>.pdf` (ej. `REPORTE 2026-11-12.pdf`).
- **FR-013**: El documento PDF generado DEBE consolidar obligatoriamente cuatro secciones en español de Perú y moneda Soles (`S/`):
  - (a) Ganancias consolidadas por membresías y renovaciones del día en `S/`.
  - (b) Cantidad de nuevos usuarios inscritos en la jornada.
  - (c) Ganancias consolidadas por venta de productos en mostrador del día en `S/`.
  - (d) Lista detallada de productos vendidos indicando nombre, unidades vendidas, precio unitario y subtotal en `S/`.
- **FR-014**: En la Lista de Usuarios del Administrador, el sistema DEBE mostrar el nombre de usuario y contraseña/PIN de cada cuenta para soporte administrativo, y proveer un botón "Eliminar Usuario Inactivo" habilitado estrictamente para aquellos socios cuya membresía registre más de 1 mes de vencida sin actividad reciente.

---

### Clarification Needs & Questions

- **[NEEDS CLARIFICATION: depuración_usuarios_inactivos]**: En la eliminación de usuarios inactivos > 1 mes desde el Sitio Administrador, ¿cómo debe proceder el sistema con el registro del usuario si tiene asistencias o transacciones contables pasadas en la base de datos?
- **[NEEDS CLARIFICATION: rango_fechas_reporte_pdf]**: Al hacer clic en el botón "Generar reporte", ¿el reporte PDF debe generarse por defecto con los datos exclusivos del día en curso (fecha actual del sistema) o debe permitir al Administrador seleccionar una fecha específica del calendario para reimprimir reportes de días anteriores?
- **[NEEDS CLARIFICATION: envoltorio_sitio_miembro_escritorio]**: Si un usuario abre la ruta del Sitio Miembro (`/miembro`) desde un navegador de escritorio, ¿el sistema debe renderizar la vista contenida dentro de un marco de simulación móvil (mockup de smartphone centrado como en Stitch) o debe expandirse a pantalla completa de forma responsiva?

---

### Key Entities *(include if feature involves data)*

- **PortalSession**: Representa la sesión autenticada activa, vinculando el token de autenticación con el portal en uso (`admin`, `recepcion`, `miembro`), validando restricciones de acceso y rol.
- **ApprovalAudit**: Registro de cambios y aprobaciones pendientes o históricas, asociando el tipo de movimiento (`MEMBRESIA` o `PRODUCTO`), usuario afectado, operador responsable (`admin` o `recepcion`), método de pago (`EFECTIVO` o `TRANSFERENCIA`), ruta o enlace temporal del comprobante fotográfico, estado (`PENDIENTE`, `APROBADO`, `RECHAZADO`), fecha/hora y montos en `S/`.
- **DailyReportSummary**: Estructura consolidada de balance fiscal diario conteniendo recaudación de membresías en `S/`, altas de nuevos miembros, recaudación de productos en `S/`, detalle pormenorizado de unidades vendidas y fecha de emisión para la compilación del PDF oficial.
- **ProductStockAlert**: Entidad de telemetría de inventario que monitoriza productos con existencias en niveles críticos (<5 unidades o 0 unidades), alertando al Dashboard y gobernando la atenuación visual en mostrador.

---

## 4. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los intentos de inicio de sesión cruzados (ej. rol recepción ingresando a `/admin` o miembro ingresando a `/recepcion`) son rechazados de forma inmediata con mensaje explicativo sin exponer datos del portal.
- **SC-002**: Al iniciar sesión en `/recepcion`, el tiempo de despliegue de la pantalla de Check-in con el campo de búsqueda de DNI listo para entrada no excede 1.5 segundos en red local.
- **SC-003**: En el Dashboard Principal del Administrador, las métricas de ingresos en `S/`, atletas activos y alerta de stock crítico se actualizan de forma sincronizada con la base de datos en menos de 1 segundo tras registrarse cualquier venta o extensión en mostrador.
- **SC-004**: Al hacer clic en "ACEPTAR CAMBIO", el archivo de imagen de la transferencia es borrado físicamente del servidor en el 100% de los casos exitosos, y la tarjeta desaparece visualmente de la lista de pendientes en menos de 500 milisegundos sin recargar la página.
- **SC-005**: Al pulsar "DESCARGAR REPORTE", la compilación y descarga del PDF `REPORTE <FECHA>.pdf` conteniendo las 4 secciones contables consolidadas toma menos de 3 segundos.
- **SC-006**: Los usuarios inactivos con más de 30 días de vencimiento son identificables inmediatamente por el Administrador, y la acción de eliminación no puede ejecutarse sobre usuarios activos o con membresías vigentes.

---

## 5. Assumptions

- **A-001**: Los 3 sitios (`/admin`, `/recepcion`, `/miembro`) se sirven desde la misma aplicación web React mediante enrutamiento modular dedicado, compartiendo los servicios de API y el estado centralizado.
- **A-002**: La moneda del sistema es invariablemente Soles (`S/`) y el documento nacional de identidad peruano (DNI) consta invariablemente de 8 dígitos numéricos.
- **A-003**: El servidor local Node.js cuenta con permisos del sistema de archivos para almacenar temporalmente los comprobantes de transferencias en un directorio designado (ej. `uploads/vouchers/`) y para eliminarlos físicamente cuando el Administrador acepta el cambio.
- **A-004**: La librería de generación de PDF en el navegador o backend (ej. `jspdf` con `jspdf-autotable`) opera sin dependencias externas de internet una vez instalada en el proyecto.
- **A-005**: Las funcionalidades detalladas de rutinas guiadas, tracking de ejercicios y botón de llamada a coach corresponden a la Feature 004, por lo que en esta etapa el Sitio Miembro deja establecida su arquitectura, navegación y vistas base sin la lógica interna de entrenamientos complejos.
