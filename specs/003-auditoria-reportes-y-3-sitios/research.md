# Technical Research & Architecture Decisions: 003 - Auditoría, Reportes PDF y 3 Sitios

**Feature**: `003-auditoria-reportes-y-3-sitios`  
**Date**: 2026-11-12  
**Context**: Definición arquitectónica para servir 3 portales segregados (Admin, Recepción, Miembro) bajo un único comando `npm run dev`, diseño limpio del Dashboard y Lista de Cambios de Stitch eliminando ruidos visuales, generación descargable de reportes en PDF y depuración física de miembros inactivos > 1 mes con salvaguarda contable.

---

## 1. Arquitectura para Servir los 3 Sitios Independientes con `npm run dev`

### Problema
El Principio VI de la Constitución y el usuario exigen 3 portales segregados por rol ((A) Sitio Administrador `/admin`, (B) Sitio Recepción `/recepcion`, y (C) Sitio Miembro `/miembro`) conectados a la misma API y SQLite central, debiendo iniciar todo mediante un único comando simple (`npm run dev`).

### Opciones Evaluadas
- **Opción A: 3 Aplicaciones Vite separadas en puertos distintos (ej. 5173, 5174, 5175) + Servidor Express**.
  - *Ventajas*: Aislamiento de código a nivel de proyecto.
  - *Desventajas*: Viola el Principio I (Simplicidad ante todo). Requiere 4 procesos simultáneos en `concurrently`, cuadruplica el consumo de RAM local, complica el build en CI/CD y satura puertos en Windows.
- **Opción B: Servidor Express que sirve 3 builds estáticos en rutas distintas**.
  - *Ventajas*: Un solo puerto de salida.
  - *Desventajas*: No permite Hot-Module-Replacement (HMR) ágil de Vite en modo de desarrollo sin configuración de proxy compleja.
- **Opción C (Elegida): SPA React Unificada con Enrutamiento Modular Segregado y Portales Aislados**.
  - *Descripción*: Un único servidor Vite en desarrollo (`http://localhost:5173`) sirviendo el frontend React con sub-enrutadores dedicados:
    - `/admin/*` → Router y layout exclusivo del Administrador (con login exclusivo `/admin/login`).
    - `/recepcion/*` → Router y layout exclusivo de Recepción (con login exclusivo `/recepcion/login`).
    - `/miembro/*` → Router y layout exclusivo del Miembro (con login exclusivo `/miembro/login`).
    - `/` → Portal de bienvenida limpio con accesos directos tácticos a los 3 sitios.
  - *Comando de arranque*: `npm run dev` ejecuta concurrentemente el backend Express (`node --watch server/server.js` en puerto 3001) y Vite (`http://localhost:5173`).
  - *Aislamiento de sesiones*: Cada portal gestiona su token en una llave segregada en `localStorage`:
    - `gym_admin_session` (para `/admin`)
    - `gym_recepcion_session` (para `/recepcion`)
    - `gym_miembro_session` (para `/miembro`)
  - *Resultado*: Permite abrir en simultáneo pestañas de `/admin` y `/recepcion` en el mismo navegador sin que colisionen ni se cierren sesiones.

---

## 2. Simplificación Visual de los Prototipos Stitch (Cero Ruido Visual)

### Problema
Los prototipos Stitch en `stitch-referencias/003-auditoria-y-reportes/` contienen textos y widgets conceptuales (ej. telemetría militar o de hardware ficticio) que sobrecargan la pantalla y desvían la atención de la operativa real.

### Elementos a Purgar (Instrucción Expresa del Usuario)
1. **De `admin_dashboard_principal`**:
   - ❌ `terminal mode aplha001` (TERMINAL NODE ALPHA-01)
   - ❌ `sys_online: 99.8%`
   - ❌ `auditoria: en linea`
   - ❌ `capacidad actual: 142 / 200 PAX`
   - ❌ `estado de torniquetes: 4/4 OPERATIVOS`
   - ❌ `curva de afluencia horaria` (gráfico SVG innecesario)
   - ❌ `audit_log_stream`
   - ❌ `exportar corte de caja`
   - ❌ `nueva venta rapida`
2. **De `admin_lista_de_cambios_y_aprobaciones_2`**:
   - ❌ `terminal mode aplha001`
   - ❌ `sys_online: 99.8%`
   - ❌ `protocolo de reconciliacion activo`
   - ❌ `node terminal alpha`

### Elementos a Conservar y Perfeccionar
1. **Dashboard del Administrador**:
   - ✅ HUD Bento Card 1: **Ingresos del Día** en Soles (`S/`) con split visual proporcional entre Membresías y Productos.
   - ✅ HUD Bento Card 2: **Atletas Activos** en padrón con desglose de alertas por vencer (<10 días) y nuevos atletas del mes.
   - ✅ HUD Bento Card 3: **Stock Crítico** (<5 unidades o agotados) con nombres de productos y botón "Reabastecer Maestro".
   - ✅ **Control de Acceso Táctico**: Input numérico para DNI de 8 dígitos y semáforo interactivo (Verde: Autorizado, Naranja: Por Vencer, Rojo: Denegado/Vencido).
   - ✅ **Widget de Transferencias por Auditar**: Conteo de comprobantes bancarios pendientes y enlace directo a la Lista de Cambios.
2. **Lista de Cambios & Auditoría de Pagos**:
   - ✅ **Doble Columna Paralela**: Columna Izquierda (Cambios en Membresías) y Columna Derecha (Venta de Productos).
   - ✅ **Modal Forense de Comprobante**: Visor de imagen en alta resolución con controles interactivos de zoom (+ / - / reiniciar).
   - ✅ **Botón 'ACEPTAR CAMBIO'**: En cada tarjeta, elimina físicamente la imagen del servidor (Principio V), retira la tarjeta de pantalla con animación fluida y preserva el asiento contable en SQLite.
   - ✅ **Botón Flotante 'GENERAR REPORTE'**: En la esquina inferior derecha, abre el modal de consolidado con selector interactivo de fecha y descarga de PDF oficial.

---

## 3. Generación y Descarga del Reporte Oficial en PDF

### Problema
El Administrador debe generar y descargar un archivo PDF titulado `REPORTE <FECHA>.pdf` (ej. `REPORTE 2026-11-12.pdf`) estructurado obligatoriamente con 4 bloques de balance fiscal.

### Opciones Evaluadas
- **Opción A: Generación con Puppeteer en Node.js**.
  - *Desventajas*: Descarga pesada de Chromium (>300 MB), alta latencia (3-5 segundos) y complejidad de mantenimiento.
- **Opción B (Elegida): Compilación en Cliente con `jspdf` y `jspdf-autotable` alimentada por API REST**.
  - *Descripción*: 
    1. Endpoint backend `GET /api/reportes/diario?fecha=YYYY-MM-DD` calcula los consolidados directamente desde SQLite:
       - (a) Suma de membresías y renovaciones aprobadas en esa fecha.
       - (b) Cantidad y lista de nuevos usuarios inscritos en esa fecha.
       - (c) Suma de ventas de productos aprobadas en esa fecha.
       - (d) Lista agrupada de productos vendidos (nombre, unidades, precio unitario, subtotal).
    2. El frontend utiliza `jspdf` con `jspdf-autotable` para compilar el documento en memoria (< 200 ms) con estética ejecutiva limpia (colores institucionales de GymAdminPro, tipografía legible y formato A4).
    3. Descarga directa en el navegador con el nombre exacto `REPORTE <FECHA>.pdf`.

---

## 4. Depuración Física de Usuarios Inactivos > 1 Mes (Hard Delete con Respeto Contable)

### Problema
El Administrador puede ver usuario/contraseña en su Lista de Usuarios y debe contar con un botón para eliminar miembros que tengan más de 1 mes sin actualizar su membresía desde que venció. El usuario seleccionó la Opción B: **Borrado físico completo (Hard Delete)**.

### Reto de Integridad Referencial
En SQLite, si se ejecuta un `DELETE FROM usuarios WHERE id = ?`, las tablas `solicitudes_membresia`, `ventas_productos` y `checkins` con `FOREIGN KEY ON DELETE CASCADE` eliminarían también las transacciones financieras históricas, arruinando los reportes pasados.

### Solución Adoptada
1. En las tablas contables (`solicitudes_membresia` y `checkins`), almacenar en el momento del registro el nombre completo y DNI en texto plano (`atleta_nombre_historico`, `atleta_dni_historico`).
2. Configurar la clave foránea `usuario_id` como `ON DELETE SET NULL`.
3. Al ejecutar el Hard Delete del usuario inactivo:
   - El registro en `usuarios` se destruye físicamente de la base de datos junto con su contraseña y datos de contacto.
   - Las transacciones contables pasadas en `solicitudes_membresia` preservan el monto en `S/`, fecha, método de pago y el nombre histórico del socio, garantizando que los reportes de meses pasados sigan cuadrando al 100%.

---

## 5. Resumen de Decisiones de Arquitectura

| Dimensión | Decisión Adoptada | Razón Técnica Principal |
| :--- | :--- | :--- |
| **Arranque del Sistema** | `npm run dev` (Concurrently: Express 3001 + Vite 5173) | Simplicidad operativa máxima; un solo comando levanta toda la plataforma. |
| **Enrutamiento** | `/admin/*`, `/recepcion/*`, `/miembro/*` sobre React Router modular | Segregación total sin crear proyectos duplicados innecesarios. |
| **Gestión de Sesión** | Llaves independientes en localStorage por portal | Permite trabajar en pestañas concurrentes sin interferencias. |
| **Estilo Visual** | Bento Grid de Stitch purgado de telemetría de ficción | Cero ruido visual, información directa y relevante para el operador. |
| **Reportes PDF** | `jspdf` + `jspdf-autotable` en cliente con API SQLite agregada | Compilación instantánea, sin dependencias pesadas de servidor ni conexión externa. |
| **Depuración de Socios** | Hard Delete con `ON DELETE SET NULL` y campos de texto históricos | Cumple el borrado físico sin comprometer el balance contable histórico. |
