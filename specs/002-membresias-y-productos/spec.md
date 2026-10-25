# Feature Specification: 002 - Membresías, Promociones y Productos

**Feature Branch**: `002-membresias-y-productos`  
**Created**: 2026-10-25  
**Status**: Draft  
**Input**: Requisitos de gestión de promociones y precios (solo Admin), gestión de membresías y renovación por DNI con comprobantes de pago (Admin y Recepción), y catálogo/inventario de productos con stock, control de costos privados y terminal de venta rápida con actualización de existencias y registro en lista de cambios.

---

## 1. Objetivo y Contexto de Negocio

El Módulo 002 consolida el motor comercial y transaccional de GymAdminPro en mostrador y administración:
1. **Promociones y Precios**: Permite al Administrador diseñar y publicar tarifas periódicas o campañas promocionales especiales (volátiles o fijas), fijando duración, precio en Soles (`S/`), gráfica publicitaria y segmentación por nivel de fidelidad gamificada (abierto a todos o restringido a atletas desde cierto rango).
2. **Manejo y Asignación de Membresías**: Facilita la localización inmediata de atletas por su DNI (8 dígitos) tanto para Recepción como para Administrador, permitiendo extender su vigencia mediante la selección de una promoción activa del catálogo o mediante la adición manual de meses/días con su respectivo importe en Soles (`S/`), validando el método de pago (Efectivo con liquidación inmediata o Transferencia bancaria/billetera digital con comprobante adjunto registrado en la lista de cambios).
3. **Catálogo e Inventario de Productos**: Ofrece un control visual de productos en mostrador (suplementos, bebidas, accesorios) con alertas de stock agotado (mostrado de forma translúcida y con sello de agotado para el personal, e invisible para la app móvil de miembros), alta y edición de productos con costo privado visible solo para el Administrador, y una ventana emergente de venta rápida para Recepción y Administrador que descuenta existencias en tiempo real y remite la transacción para auditoría contable.

---

## 2. Roles y Privilegios de Usuario

- **Administrador (Web Escritorio y Móvil)**:
  - Crear, editar, archivar y fijar tarifas y promociones con imagen, duración, precio (`S/`) y segmentación de fidelidad.
  - Localizar atletas por DNI y agregar tiempo de membresía (efectivo o transferencia con comprobante opcional).
  - Gestionar el inventario maestro de productos: agregar nuevos productos definiendo precio de costo privado (invisible para Recepción) y precio público, editar productos existentes, eliminar productos y ajustar existencias.
  - Vender productos en mostrador con descuento automático de stock y registro de auditoría.
- **Recepcionista (Web Escritorio)**:
  - Localizar atletas por DNI y abrir la ventana emergente para agregar tiempo de membresía (efectivo con liquidación instantánea o transferencia con subida **obligatoria** de captura/comprobante hacia la Lista de Cambios y Aprobaciones).
  - Visualizar la grilla de productos con PVP al público y stock disponible (los productos con stock 0 se muestran translúcidos).
  - Vender productos en mostrador mediante la ventana emergente dedicada (restringido únicamente a productos con stock > 0, registrando efectivo o transferencia con comprobante obligatorio).
  - **Restricciones**: No puede crear ni modificar promociones, no puede ver el precio de costo de los productos, no puede agregar nuevos productos ni eliminarlos.
- **Miembro (App Móvil)**:
  - Visualizar las promociones activas que coincidan con su nivel de fidelidad o que estén dirigidas a todo público.
  - Visualizar la tienda de productos disponibles; aquellos productos cuyo stock llegue a 0 **dejan de mostrarse** en su catálogo móvil.

---

## 3. Escenarios de Usuario y Criterios de Aceptación (Historias de Usuario)

### Historia de Usuario 1 (HU1) - Gestión de Promociones y Precios Maestros (Prioridad: P1)
**Como** Administrador del gimnasio,  
**quiero** crear y configurar planes de membresía fijos y promociones especiales con duración, precio en Soles (`S/`), nivel de fidelidad requerido e imagen publicitaria,  
**para** ofrecer tarifas atractivas en mostrador y en la aplicación móvil de los atletas.

- **Por qué esta prioridad**: Establece el catálogo comercial base con el que operan las renovaciones de membresías y las ofertas dirigidas a los miembros según su constancia.
- **Prueba Independiente**: Se puede verificar accediendo al formulario de "Forja de Planes y Tarifas", completando los datos de una promoción (ej. "Plan Trimestre Hipertrofia // 3 meses // S/ 320.00 // Nivel: Principiante") con su imagen, guardándola y confirmando que aparece en el catálogo de promociones activas.

**Escenarios de Aceptación**:
1. **Given** que el usuario ha iniciado sesión como Administrador y está en "Membresías & Promociones", **When** ingresa el nombre de la promoción, la vigencia (cantidad y unidad meses/días), el precio en Soles (`S/`), el público objetivo ("Todos" o un escalafón de fidelidad específico: Novato, Principiante, Promedio, En Progreso, Mutando, Mamado/a, Dios/a Griego/a, Animal) y sube una imagen de banner publicitario, **Then** el sistema almacena la promoción y la muestra inmediatamente en la sección de "Promociones y Precios Activos".
2. **Given** un atleta cuyo nivel de fidelidad actual no alcanza el nivel requerido por una promoción exclusiva, **When** consulte el catálogo desde su aplicación, **Then** el sistema no le exhibe dicha promoción restringida, mostrándole únicamente las promociones para "Todos" o aptas para su nivel.
3. **Given** una promoción activa en el catálogo, **When** el Administrador hace clic en la acción de archivar o dar de baja, **Then** la promoción queda inhabilitada para nuevas asignaciones sin afectar las membresías ya adquiridas anteriormente.

---

### Historia de Usuario 2 (HU2) - Asignación y Extensión de Membresías por DNI (Prioridad: P1)
**Como** Recepcionista o Administrador,  
**quiero** buscar a un atleta por su DNI de 8 dígitos y abrir una ventana emergente para asignarle tiempo de membresía (eligiendo una promoción activa o agregando meses/días manualmente),  
**para** renovar o extender su vigencia registrando el pago en efectivo o transferencia.

- **Por qué esta prioridad**: Es la operación diaria crítica en caja para mantener a los atletas al día y habilitar su ingreso en el control de acceso.
- **Prueba Independiente**: Digitar un DNI existente en el buscador, verificar que se cargue la ficha del atleta con su tiempo restante actual, hacer clic en "Agregar tiempo de membresía", seleccionar una opción de pago y verificar el incremento proyectado de vigencia.

**Escenarios de Aceptación**:
1. **Given** un operador en el módulo de membresías, **When** digita un DNI válido de 8 dígitos y presiona "Buscar", **Then** el sistema presenta la ficha del atleta mostrando sus nombres, apellidos, DNI, estado de vigencia actual (días restantes y fecha de vencimiento) y habilita el botón "Agregar tiempo de membresía".
2. **Given** que se abre la ventana emergente de asignación de tiempo, **When** el operador selecciona la pestaña "Elegir Promoción Activa" y escoge un plan del desplegable (o pasa a "Agregar Meses / Días" e introduce una cantidad personalizada y precio en S/), **Then** la ventana calcula dinámicamente el nuevo saldo total proyectado de días y el importe final a cobrar en Soles (`S/`).
3. **Given** que el operador selecciona el método de pago "Efectivo", **When** confirma la asignación, **Then** el sistema liquida y aprueba la operación de forma automática e inmediata, extendiendo la fecha de vencimiento del atleta en el acto.
4. **Given** que el operador selecciona el método de pago "Transferencia", **When** el rol es Recepcionista, **Then** el sistema exige de forma obligatoria adjuntar la foto o captura de pantalla del comprobante bancario (voucher/Yape/Plin); al confirmar, la operación se registra en la "Lista de Cambios y Aprobaciones" en estado pendiente para revisión del Administrador.
5. **Given** que el rol es Administrador y selecciona "Transferencia", **When** confirma la operación, **Then** la subida del archivo de comprobante es opcional y puede autoaprobar la extensión de la membresía.

---

### Historia de Usuario 3 (HU3) - Catálogo e Inventario de Productos (Prioridad: P2)
**Como** Administrador o Recepcionista,  
**quiero** visualizar la grilla de productos disponibles con su imagen, nombre, precio público en Soles (`S/`) y existencias en stock, identificando claramente los productos agotados,  
**para** tener visibilidad en tiempo real del inventario del gimnasio y ofrecerlos a los clientes.

- **Por qué esta prioridad**: Garantiza la transparencia del stock físico y evita ofrecer o vender productos inexistentes en el mostrador.
- **Prueba Independiente**: Visualizar la grilla de productos con stock > 0 en estado normal, y verificar que los productos con stock = 0 se muestren con estilo translúcido (opacidad reducida), sello de "AGOTADO" y queden ocultos para los clientes en la app móvil.

**Escenarios de Aceptación**:
1. **Given** la vista del inventario de productos, **When** el Administrador o Recepcionista navega por el catálogo, **Then** cada tarjeta muestra la imagen del producto, su nombre comercial, el precio de venta público en Soles (`S/`) y el indicador numérico de stock disponible.
2. **Given** un producto cuyo stock disponible es 0 unidades, **When** se visualiza en la terminal de mostrador (Admin y Recepción), **Then** la tarjeta se presenta de forma translúcida (opacidad atenuada) con una etiqueta distintiva de "AGOTADO // SIN STOCK DISPONIBLE" y se bloquea su selección para nuevas ventas directas.
3. **Given** un producto con stock 0 unidades, **When** un Miembro consulta el catálogo de productos desde su teléfono móvil, **Then** el sistema filtra y excluye dicho producto para no exhibirlo a los clientes finales.
4. **Given** un usuario con rol Recepcionista en la grilla de productos, **When** visualiza las tarjetas de producto, **Then** el sistema oculta completamente el campo de "Precio de Costo Privado" y el margen comercial, mostrándole exclusivamente el PVP al público.

---

### Historia de Usuario 4 (HU4) - Aprovisionamiento, Edición y Baja de Productos por el Administrador (Prioridad: P2)
**Como** Administrador,  
**quiero** registrar nuevos productos mediante el botón azul "Agregar productos" (definiendo foto, nombre, descripción, precio público, costo privado y stock), así como editar y eliminar productos existentes,  
**para** mantener actualizado el inventario comercial y controlar los márgenes de ganancia.

- **Por qué esta prioridad**: Permite la entrada de nueva mercadería y el mantenimiento del catálogo con datos confidenciales de costos.
- **Prueba Independiente**: Abrir el modal "Agregar productos", completar los campos requeridos incluyendo el costo privado, guardar y comprobar la presencia del producto en el inventario con sus opciones de edición y eliminación activas.

**Escenarios de Aceptación**:
1. **Given** que el usuario es Administrador, **When** hace clic en el botón azul "[+] AGREGAR PRODUCTOS", **Then** se despliega la ventana emergente con los campos: Fotografía del producto (JPG/PNG), Nombre del producto, Descripción técnica/beneficios, Precio de Venta Público (PVP en `S/`), Precio de Costo Privado (en `S/`, señalado como invisible para recepción) y Stock inicial disponible.
2. **Given** el formulario de nuevo producto completo con datos válidos, **When** el Administrador presiona "Guardar Producto en Inventario", **Then** el producto queda persistido en la base de datos y se añade a la grilla con su stock correspondiente.
3. **Given** un producto existente, **When** el Administrador hace clic en la acción de editar, **Then** puede modificar el nombre, descripción, precio público, costo privado, imagen y existencias en stock.
4. **Given** un producto registrado, **When** el Administrador presiona el botón de eliminar y confirma la acción en el diálogo de advertencia, **Then** el producto es eliminado del catálogo activo.
5. **Given** un usuario con rol Recepcionista, **When** ingresa a la vista de productos, **Then** el botón azul "[+] AGREGAR PRODUCTOS" y las opciones de editar y eliminar no están visibles ni disponibles.

---

### Historia de Usuario 5 (HU5) - Venta Rápida de Productos en Mostrador (Prioridad: P1)
**Como** Recepcionista o Administrador en mostrador,  
**quiero** pulsar el botón verde "Vender producto" para abrir una ventana emergente de venta rápida, seleccionando el producto, la cantidad y el método de pago,  
**para** despachar productos a los atletas, restar automáticamente el stock y registrar la transacción.

- **Por qué esta prioridad**: Representa el flujo de caja diario por venta de mostrador (bebidas, suplementos, accesorios).
- **Prueba Independiente**: Abrir el modal "Vender producto", constatar que el desplegable solo incluya productos con stock > 0, fijar una cantidad dentro del límite permitido, elegir Efectivo o Transferencia con comprobante, presionar "Vender" y verificar que el stock en el catálogo se reduce en la cantidad vendida.

**Escenarios de Aceptación**:
1. **Given** un usuario con rol Administrador o Recepcionista, **When** presiona el botón verde "[$] VENDER PRODUCTO", **Then** se abre la ventana emergente "Venta de Producto en Mostrador".
2. **Given** el desplegable "PRODUCTO A VENDER", **When** el operador revisa las opciones disponibles, **Then** solo se listan los productos que tienen stock mayor a cero (`stock > 0`), mostrando el nombre, precio unitario en `S/` y unidades disponibles.
3. **Given** un producto seleccionado con stock $N$, **When** el operador ajusta el campo "CANTIDAD VENDIDA", **Then** el valor solo se puede fijar entre 1 y el stock máximo disponible ($N$), recalculando el monto total en Soles (`S/`) en tiempo real.
4. **Given** que se selecciona el método de pago "Efectivo", **When** se pulsa el botón "VENDER", **Then** el sistema descuenta de inmediato la cantidad vendida del inventario de SQLite, registra la venta como liquidada en caja y muestra confirmación de venta exitosa.
5. **Given** que se selecciona el método de pago "Transferencia", **When** el operador intenta procesar la venta, **Then** el sistema exige la subida obligatoria de la imagen de comprobante bancario o billetera digital (Yape/Plin) y envía la operación a la lista de cambios para verificación administrativa, descontando el stock preventivamente.

---

## 4. Requisitos Funcionales

- **RF-001**: El sistema DEBE restringir la creación, edición y archivado de promociones y precios exclusivamente a usuarios con rol `ADMINISTRADOR`.
- **RF-002**: Toda promoción o plan creado DEBE contener: nombre comercial, vigencia numérica, unidad de vigencia (`MESES` o `DIAS`), precio expresado en Soles (`S/`), público objetivo (`TODOS` o nivel de fidelidad mínimo: `NOVATO`, `PRINCIPIANTE`, `PROMEDIO`, `EN PROGRESO`, `MUTANDO`, `MAMADO/A`, `DIOS/A GRIEGO/A`, `ANIMAL`) y fotografía de banner publicitario.
- **RF-003**: El buscador de membresías DEBE permitir la consulta por DNI de 8 dígitos numéricos exactos y presentar en pantalla la ficha del atleta con nombres, apellidos, DNI, días restantes y fecha de vencimiento actual.
- **RF-004**: La ventana emergente de asignación de membresía DEBE admitir dos modalidades: (a) selección de una promoción activa del catálogo, o (b) carga manual de tiempo indicando cantidad de meses o días junto con el importe personalizado en Soles (`S/`).
- **RF-005**: Al extender una membresía existente que aún cuenta con días activos, el sistema DEBE sumar los nuevos días a la vigencia remanente a partir de la fecha de caducidad actual, proyectando con exactitud la nueva fecha y saldo total de días.
- **RF-006**: En la asignación de membresía o venta de productos con método de pago `EFECTIVO`, el sistema DEBE registrar la operación como aprobada y liquidada automáticamente en mostrador.
- **RF-007**: En la asignación de membresía con método de pago `TRANSFERENCIA`, el sistema DEBE requerir la carga obligatoria de un archivo de comprobante (JPG, PNG o PDF) cuando la acción la realice un `RECEPCIONISTA`, derivando la transacción a la `Lista de Cambios y Aprobaciones` en estado pendiente; para un `ADMINISTRADOR`, la subida de comprobante es opcional y puede autoaprobarse.
- **RF-008**: La grilla de productos DEBE mostrarse en formato de tarjetas cuadradas/rectangulares conteniendo imagen del producto, nombre, precio de venta al público en Soles (`S/`) y stock numérico disponible.
- **RF-009**: Todo producto con stock igual a 0 (`stock = 0`) DEBE renderizarse con estilo visual translúcido (opacidad atenuada al 60%), sello de "AGOTADO // SIN STOCK DISPONIBLE" y bloqueo de selección en mostrador para Administrador y Recepcionista.
- **RF-010**: Los productos con stock igual a 0 DEBEN filtrarse y no exhibirse en absoluto en la interfaz móvil consultada por los atletas con rol `MIEMBRO`.
- **RF-011**: El sistema DEBE reservar la visualización y edición del "Precio de Costo Privado" de los productos exclusivamente para el rol `ADMINISTRADOR`, manteniéndolo completamente oculto para el rol `RECEPCIONISTA` y `MIEMBRO`.
- **RF-012**: El modal de nuevo producto (azul "[+] AGREGAR PRODUCTOS") DEBE estar disponible únicamente para el Administrador y capturar: fotografía, nombre, descripción, precio público (`S/`), costo privado (`S/`) y stock inicial.
- **RF-013**: El Administrador DEBE disponer de controles para editar cualquier campo del producto y para eliminar productos del inventario activo previa confirmación.
- **RF-014**: El botón verde "[$] VENDER PRODUCTO" DEBE estar disponible tanto para el Administrador como para el Recepcionista, abriendo un modal que liste únicamente productos con `stock > 0`.
- **RF-015**: El modal de venta rápida DEBE restringir la cantidad a vender entre 1 y el stock máximo disponible del producto seleccionado, recalculando en tiempo real el monto total a pagar.
- **RF-016**: La venta rápida de producto mediante `TRANSFERENCIA` DEBE exigir obligatoriamente la subida de la imagen del comprobante de pago digital (voucher, captura Yape o Plin) y registrar la transacción en la lista de cambios y aprobaciones.
- **RF-017**: Toda venta confirmada (efectivo o transferencia) DEBE restar inmediatamente las unidades correspondientes del stock del producto en la base de datos SQLite.

---

## 5. Entidades Principales

- **PromocionPlan**:
  - `id`: Identificador único.
  - `nombre`: Nombre comercial del plan o campaña (ej. "Plan Anual Mutación 2025").
  - `duracion_valor`: Valor numérico de vigencia.
  - `duracion_unidad`: Unidad temporal (`MESES` o `DIAS`).
  - `precio`: Importe en Soles (`S/`).
  - `publico_objetivo`: Nivel mínimo de fidelidad requerido (`TODOS`, `NOVATO`, `PRINCIPIANTE`, etc.).
  - `banner_url`: Ruta o URL de la imagen promocional.
  - `activo`: Estado booleano de vigencia de la promoción en catálogo.
- **Producto**:
  - `id`: Identificador único.
  - `nombre`: Denominación del producto.
  - `descripcion`: Descripción y beneficios.
  - `precio_venta`: Precio de venta público en Soles (`S/`).
  - `precio_costo`: Precio de costo privado (confidencial solo para Admin).
  - `stock`: Unidades físicas disponibles en mostrador.
  - `imagen_url`: Fotografía del producto.
  - `activo`: Estado booleano de visibilidad en inventario.
- **VentaProducto**:
  - `id`: Identificador de transacción / ticket.
  - `producto_id`: Referencia al producto vendido.
  - `cantidad`: Unidades vendidas.
  - `precio_unitario`: Precio aplicado al momento de la venta.
  - `total`: Importe total en Soles (`S/`).
  - `metodo_pago`: `EFECTIVO` o `TRANSFERENCIA`.
  - `comprobante_url`: Archivo de imagen adjunto en caso de transferencia.
  - `operador_id`: Usuario que registró la venta.
  - `estado`: `APROBADO` (efectivo/admin) o `PENDIENTE_APROBACION` (transferencia recepcionista).
- **AsignacionMembresiaTransaccion**:
  - `id`: Identificador de la extensión o recarga.
  - `usuario_id`: Atleta beneficiario.
  - `promocion_id`: Plan seleccionado (nulo si fue manual).
  - `dias_agregados`: Cantidad de días sumados a la vigencia.
  - `monto_pagado`: Importe en Soles (`S/`).
  - `metodo_pago`: `EFECTIVO` o `TRANSFERENCIA`.
  - `comprobante_url`: Archivo del voucher bancario.
  - `operador_id`: Usuario que registró la operación.
  - `estado`: `APROBADO` o `PENDIENTE_APROBACION`.

---

## 6. Criterios de Éxito (Medibles y Tecnológicamente Agnósticos)

- **SC-001**: La búsqueda por DNI y despliegue de la ficha del atleta con su tiempo restante se completa en menos de 1 segundo tras ingresar los 8 dígitos.
- **SC-002**: El cálculo y proyección del nuevo saldo de días y el total a cobrar en Soles (`S/`) en la ventana emergente de membresía se actualiza de manera instantánea al alternar entre promociones o ingresar días manuales.
- **SC-003**: En el 100% de las ventas de mostrador procesadas, el stock del producto disminuye de forma atómica y consistente con la cantidad vendida sin discrepancias de inventario.
- **SC-004**: Ningún usuario con rol `RECEPCIONISTA` o `MIEMBRO` puede visualizar el precio de costo privado ni el margen comercial de ningún producto en ninguna pantalla o respuesta del sistema.
- **SC-005**: El 100% de los productos con stock 0 quedan ocultos para los atletas en su aplicación móvil y se visualizan de forma translúcida en la terminal de mostrador.
- **SC-006**: Toda recarga o venta por transferencia bancaria realizada en recepción queda registrada con su comprobante digital adjunto y enrutada a la lista de cambios y aprobaciones.

---

## 7. Casos Límite y Reglas de Negocio

- **Intento de venta mayor al stock**: El selector de cantidad del modal de venta rápida impide físicamente digitar o seleccionar un valor mayor al stock actual del producto (`max = stock`), deshabilitando el botón de venta si el stock es 0.
- **Atleta con membresía vencida vs activa**: Si el atleta tiene una membresía vencida (saldo negativo de días), al agregar nuevo tiempo la vigencia se calcula sumando los días a partir de la fecha de hoy; si la membresía está activa (saldo positivo), los nuevos días se suman consecutivamente a partir de la fecha de vencimiento futura.
- **Subida de comprobante vacía en Transferencia (Recepción)**: El sistema bloquea el envío de la asignación de membresía o venta si no se ha seleccionado un archivo de imagen válido.
- **Archivado de promoción con membresías activas**: Archivar una promoción la retira del desplegable para nuevas asignaciones, pero no altera los registros ni la vigencia de los atletas que ya la tenían asignada.

---

## 8. Supuestos y Dependencias

- **Moneda y formato**: Se asume el uso exclusivo de Soles peruanos con símbolo `S/` y dos decimales.
- **Almacenamiento de comprobantes**: Las imágenes de transferencias se almacenan temporalmente en el servidor para permitir la auditoría del Administrador, de acuerdo con el principio constitucional de liberación de recursos tras su aprobación.
- **Autenticación**: Se reutiliza el sistema de sesiones y roles (`ADMINISTRADOR`, `RECEPCIONISTA`, `MIEMBRO`) implementado en el Módulo 001.
