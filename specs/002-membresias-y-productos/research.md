# Research & Technical Decisions: 002 - Membresías, Promociones y Productos

**Branch**: `002-membresias-y-productos`  
**Date**: 2026-10-25  
**Spec**: [spec.md](./spec.md)

---

## 1. Contexto Técnico y Desafíos Clave

El Módulo 002 implementa el núcleo transaccional de GymAdminPro:
1. **Configuración de Tarifas y Promociones**: Tarifas fijas o promociones volátiles con segmentación por nivel de fidelidad e imagen de banner publicitario (16:9).
2. **Asignación y Extensión de Membresías por DNI**: Búsqueda inmediata de atletas, adición de tiempo mediante catálogo de promociones o ingreso manual de días/meses con cobro en Soles (`S/`), validando Efectivo (aprobación automática) vs Transferencia (con comprobante digital).
3. **Catálogo y Control de Inventario de Productos**: Productos en mostrador con visualización de stock, tratamiento translúcido de stock agotado (`stock = 0`) para el personal e invisibilidad total para miembros móviles, gestión de costos privados solo para el Administrador, baja lógica de productos (`activo = 0`), y terminal de venta rápida en mostrador.
4. **Circuito de Conciliación y Aprobaciones (Lista de Cambios)**: Cuando Recepción registra un cobro por transferencia (membresía o venta de productos), la operación queda en espera de validación por el Administrador. Al aprobar, se activa el beneficio y se destruye el archivo físico de la imagen (Principio Constitucional V); al rechazar una venta de producto, el stock reservado preventivamente se reintegra de forma atómica.

---

## 2. Decisiones Técnicas y Arquitectónicas

### Decisión 1: Esquema Relacional en SQLite para Catálogos y Transacciones
- **Decisión**: Extender la base de datos SQLite existente con 4 nuevas tablas normalizadas:
  1. `promociones`: Registra planes fijos y promociones volátiles con campos `tipo`, `duracion_valor`, `duracion_unidad`, `precio`, `publico_objetivo`, `fecha_limite`, `banner_url` y `activo`.
  2. `productos`: Registra los artículos comercializables con `precio_venta`, `precio_costo` (privado), `stock`, `categoria`, `imagen_url` y flag `activo` para baja lógica.
  3. `ventas_productos`: Transacciones de mostrador con `producto_id`, `cantidad`, `precio_unitario`, `total`, `metodo_pago`, `comprobante_url`, `operador_id` y `estado`.
  4. `solicitudes_membresia`: Transacciones de recarga/extensión con `usuario_id`, `promocion_id`, `dias_agregados`, `monto`, `metodo_pago`, `comprobante_url`, `operador_id` y `estado`.
- **Razón**: Conserva la simplicidad extrema requerida por la Constitución (Principio I), reutilizando el motor `better-sqlite3` ya configurado en el servidor sin dependencias de bases de datos externas.
- **Alternativas descartadas**:
  - *Guardar ventas dentro de un campo JSON en `usuarios`*: Descartado porque rompe la capacidad de hacer arqueos de caja, auditorías por operador y agregaciones contables inmediatas.
  - *Migrar a PostgreSQL*: Innecesario y contrario a AGENTS.md y al Principio I (MVP v1 sin sobreingeniería).

### Decisión 2: Reserva Preventiva de Existencias y Transacciones Atómicas en SQLite
- **Decisión**: Al realizar una venta por transferencia en mostrador (que entra a revisión del Administrador), el sistema descuenta preventivamente el stock del producto en el momento del registro mediante una transacción SQLite inmediata (`BEGIN IMMEDIATE; UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?; ... COMMIT;`). Si el Administrador rechaza la solicitud en la Lista de Cambios, se ejecuta una reversión atómica (`UPDATE productos SET stock = stock + ? WHERE id = ?`).
- **Razón**: Previene la sobreventa física en el mostrador durante el intervalo de espera en el que el Administrador verifica el dinero en la cuenta bancaria.
- **Alternativas descartadas**:
  - *No descontar stock hasta la aprobación del Administrador*: Riesgoso; otro recepcionista o el mismo mostrador podría vender en efectivo las últimas unidades físicas a otro cliente antes de que el Administrador apruebe la transferencia, generando un quiebre de stock con un cliente que ya pagó.

### Decisión 3: Máquina de Estados para Liquidación vs Conciliación en Mostrador
- **Decisión**:
  - Pagos en `EFECTIVO` (Admin o Recepción): Se aprueban y liquidan automáticamente (`estado = 'APROBADO'`). En membresías, los días se suman de inmediato; en productos, el stock se descuenta y se entrega el ticket.
  - Pagos por `TRANSFERENCIA` registrados por `RECEPCIONISTA`: Pasan al estado `PENDIENTE_APROBACION`. El comprobante gráfico (voucher, constancia Yape o Plin) se guarda temporalmente en `uploads/vouchers/`. En membresías, los días NO se aplican a la cuenta hasta que el Admin apruebe. En productos, la entrega queda retenida.
  - Pagos por `TRANSFERENCIA` registrados por `ADMINISTRADOR`: Se autoaprueban de inmediato (`estado = 'APROBADO'`), con carga de voucher opcional.
- **Razón**: Satisface estrictamente las clarificaciones 1, 2 y los principios de control de caja del negocio sin burocracia adicional para el Administrador.

### Decisión 4: Purgado Seguro de Archivos Físicos tras Aprobación (Principio V)
- **Decisión**: Cuando el Administrador pulsa "Aprobar" en una solicitud pendiente dentro de la pantalla de Cambios & Aprobaciones, el controlador backend:
  1. Actualiza el estado a `APROBADO`.
  2. Si es membresía, suma los días a la tabla `membresias` del atleta.
  3. Si es producto, autoriza el despacho definitivo.
  4. Obtiene la ruta del archivo `comprobante_url` en disco.
  5. Si el archivo existe en `uploads/vouchers/`, lo elimina usando `fs.promises.unlink()`.
  6. Actualiza `comprobante_url = 'PURGADO_TRAS_APROBACION'` en la base de datos, reteniendo los metadatos numéricos (monto, fecha, operador, usuario, ticket) para auditoría.
- **Razón**: Cumple estrictamente con el Principio Constitucional V: "Al aprobar un registro en la lista de cambios y aprobaciones, el sistema DEBE eliminar del servidor y base de datos el archivo de imagen del comprobante de transferencia para optimizar espacio, conservando únicamente los metadatos numéricos y referencias para auditoría y reportes".
- **Alternativas descartadas**:
  - *Conservar permanentemente las imágenes de vouchers en disco*: Viola explícitamente el Principio V y saturaría el almacenamiento del servidor con capturas de pantalla pesadas.

### Decisión 5: Seguridad y Filtrado de Datos por Nivel de Privilegio
- **Decisión**:
  - El campo `precio_costo` de la tabla `productos` y el cálculo de margen comercial (`((precio_venta - precio_costo) / precio_venta) * 100`) se omiten o censuran en las respuestas de la API (`SELECT id, nombre, descripcion, precio_venta, stock, imagen_url, categoria, activo ...`) cuando el usuario autenticado tiene rol `RECEPCIONISTA` o `MIEMBRO`.
  - La consulta de productos para la app móvil de miembros excluye automáticamente cualquier producto con `stock = 0` o `activo = 0`.
  - En la vista de mostrador de Admin y Recepción, los productos con `stock = 0` se envían pero el frontend los estiliza de forma translúcida (opacidad al 60%) con el sello visual `AGOTADO // SIN STOCK DISPONIBLE`, bloqueando el botón de venta directa.
  - La eliminación de productos por el Admin no borra físicamente la fila en SQLite; ejecuta un `UPDATE productos SET activo = 0 WHERE id = ?` (baja lógica), asegurando que las ventas históricas mantengan integridad referencial.
- **Razón**: Cumple con los Criterios de Éxito SC-005, SC-006, SC-007 y las maquetas de Stitch.

### Decisión 6: Reutilización de Layouts y Fidelidad a `stitch-referencias/`
- **Decisión**: Integrar fielmente los componentes Tailwind de los archivos `code.html`:
  - `admin_gesti_n_de_membres_as_y_promociones_1`: Formulario "FORJA DE PLANES Y TARIFAS" (campos nombre, duración + select MESES/DIAS, precio en S/, selector público objetivo, selector tipo tarifa fija vs volátil, upload de banner 16:9 con preview en vivo) y grilla de promociones activas.
  - `admin_gesti_n_de_membres_as_y_promociones_2`: Buscador por DNI de 8 dígitos, ficha táctica del atleta con tiempo restante actual y saldo de días, y modal emergente "AGREGAR TIEMPO DE MEMBRESÍA" con tabs (Elegir Promoción vs Manual meses/días), radios de pago Efectivo vs Transferencia con zona de subida de voucher.
  - `admin_manejo_de_productos_con_modales_agregar_y_vender`: Vista de inventario maestro con KPIs superiores (Valor en stock, SKUs activos), grilla de productos con tags y telemetría de costos/márgenes (solo admin), productos con stock 0 translúcidos con badge inclinado `AGOTADO // SIN STOCK DISPONIBLE`, barra flotante inferior con botones `[+] AGREGAR PRODUCTOS` (modal azul) y `[$] VENDER PRODUCTO` (modal verde).
  - `recepci_n_venta_r_pida_de_productos_2`: Terminal POS de caja recepción con métricas de turno (ventas turno, base caja chica, arqueo TX), chips de filtro por categoría (Todos, Suplementos, Bebidas, Snacks, Accesorios), grilla de productos con PVP oficial y botón `AGREGAR`, y modal de venta rápida.
  - `admin_aprobaciones`: Panel táctico de Cambios & Aprobaciones que lista las solicitudes pendientes de membresías y ventas por transferencia, permitiendo previsualizar el voucher adjunto, aprobar (con purgado físico) o rechazar (con reposición automática de stock).
