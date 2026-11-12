# Implementation Plan: 002 - Membresías, Promociones y Productos

**Branch**: `002-membresias-y-productos` | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-membresias-y-productos/spec.md` y maquetas visuales en `stitch-referencias/002-membresias-y-productos/`

---

## Summary

El Módulo 002 consolida la administración comercial y transaccional de GymAdminPro en mostrador y gestión central:
1. **Promociones y Tarifas Maestras**: Creación de ofertas volátiles o fijas (duración, importe en Soles `S/`, banner publicitario 16:9 y filtro por fidelidad) exclusivas para el Administrador.
2. **Manejo de Membresías por DNI**: Búsqueda táctica de atletas, consulta de tiempo restante y modal de imputación de tiempo (vía catálogo de promociones activas o cálculo manual de meses/días) con pagos en Efectivo (inmediato) o Transferencia (con comprobante digital).
3. **Catálogo e Inventario de Productos**: Grilla con imágenes, PVP en Soles (`S/`), stock y telemetría de costos privados confidenciales para el Administrador. Productos con stock 0 estilizados de manera translúcida (`AGOTADO // SIN STOCK DISPONIBLE`) para recepción y ocultos para atletas.
4. **Terminal POS de Venta Rápida**: Modal de venta de productos con dropdown de existencias, selector acotado de cantidad y reserva preventiva de existencias en transferencias.
5. **Conciliación en Lista de Cambios y Purgado (Principio V)**: Aprobación formal de transferencias por el Administrador con destrucción física de la imagen de comprobante y reversión automática de stock ante rechazos.

---

## Technical Context

**Language/Version**: JavaScript (Node.js 18+ con ES Modules en backend, React 18 en frontend con JSX/Vite).

**Primary Dependencies**: Express 4, `better-sqlite3`, `multer` (para procesamiento de archivos de banner y comprobantes de pago), `cors`, Tailwind CSS 3.

**Storage**: SQLite local embebido (`server/gymcore.db`) gestionado mediante `server/db.js` con soporte para transacciones atómicas inmediatas y claves foráneas habilitadas.

**Testing**: Jest / Supertest para pruebas unitarias de cálculo de vigencias y pruebas de integración de endpoints (`npm test`).

**Target Platform**: Navegadores modernos (Google Chrome, Edge, Safari) con optimización de escritorio para Administrador y Recepcionista (Master Suite) y experiencia adaptativa móvil para Atletas (Carnet y Tienda).

**Project Type**: Aplicación web Full-Stack cliente-servidor (Express REST API en puerto 3001 + React SPA con Vite en puerto 5173).

**Performance Goals**:
- Búsqueda por DNI de 8 dígitos y despliegue de ficha en < 1 segundo.
- Cálculo y proyección de días e importes en tiempo real (< 100 ms) sin latencia perceptible en la UI.
- Descuento y reversión atómica de stock en SQLite para evitar sobreventas concurrentes.

**Constraints**:
- Moneda exclusiva en todas las pantallas y comprobantes: Soles (`S/`) con dos decimales.
- Identificación oficial única: DNI de 8 dígitos numéricos.
- Liberación física de recursos: Purgado de archivos de imagen tras aprobación en la Lista de Cambios conforme al Principio Constitucional V.
- Confidencialidad de costos: Ningún recepcionista o miembro puede ver el precio de costo privado ni el margen comercial.

**Scale/Scope**: 4 vistas/modales principales basados en las 4 carpetas de `stitch-referencias/002-membresias-y-productos/`, 4 tablas relacionales nuevas en SQLite, y ~12 endpoints REST.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Verificación en este Módulo |
| :--- | :---: | :--- |
| **I. Simplicidad ante todo** | **PASS** | Persistencia directa en SQLite local con `better-sqlite3`. Sin microservicios, sin colas complejas, sin ORMs pesados. Componentes visuales directos en React y Tailwind CSS replicando exactamente el código de Stitch. |
| **II. Idioma y mercado local (Perú)** | **PASS** | Todas las etiquetas, botones, modales y mensajes en español de Perú. Moneda estándar Soles (`S/`). Buscador de clientes estrictamente por DNI de 8 dígitos. |
| **III. Cero alcance fantasma (Zero Scope Creep)** | **PASS** | El alcance se restringe exactamente a lo especificado en `spec.md` y a los elementos visuales de las maquetas en `stitch-referencias/002-membresias-y-productos/`. |
| **IV. Verificable por personas no técnicas** | **PASS** | Creada la guía [quickstart.md](./quickstart.md) con 5 escenarios reproducibles paso a paso en el navegador por cualquier usuario sin necesidad de consola ni consultas SQL. |
| **V. Datos del usuario y recursos con respeto** | **PASS** | Los comprobantes de transferencia se guardan temporalmente en `uploads/vouchers/` y **se eliminan físicamente del disco** al ser aprobados por el Administrador, conservando solo los metadatos de auditoría contable. Cero credenciales en código. |

---

## Project Structure

### Documentation (this feature)

```text
specs/002-membresias-y-productos/
├── spec.md              # Especificación clarificada
├── plan.md              # Este documento de arquitectura
├── research.md          # Decisiones técnicas y justificaciones de diseño
├── data-model.md        # Esquema de base de datos SQLite y transiciones de estado
├── quickstart.md        # Guía de validación E2E para usuarios no técnicos
├── contracts/           # Contratos formales de API REST
│   ├── promociones-api.md
│   ├── productos-api.md
│   ├── membresias-api.md
│   └── aprobaciones-api.md
└── checklists/
    └── requirements.md  # Checklist de calidad de la especificación
```

### Source Code (repository layout)

```text
server/
├── routes/
│   ├── auth.js                     # Rutas de autenticación (existente)
│   ├── users.js                    # Rutas de usuarios y perfiles (existente)
│   ├── checkin.js                  # Control de acceso y torniquete (existente)
│   ├── promociones.js              # [NUEVO] CRUD de tarifas y promociones
│   ├── productos.js                # [NUEVO] Inventario maestro y venta POS
│   ├── membresias.js               # [NUEVO] Búsqueda DNI y adición de tiempo
│   └── aprobaciones.js             # [NUEVO] Lista de cambios y purgado de vouchers
├── services/
│   ├── promocionService.js         # [NUEVO] Lógica de tarifas y filtros de fidelidad
│   ├── productoService.js          # [NUEVO] Control de existencias, costos y POS
│   ├── membresiaService.js         # [NUEVO] Cálculo de vigencias y prórrogas
│   └── aprobacionService.js        # [NUEVO] Conciliación bancaria y purgado físico
├── db.js                           # Conexión SQLite better-sqlite3 (existente)
├── schema.sql                      # DDL actualizado con nuevas tablas
├── seed.js                         # Datos iniciales para pruebas
└── server.js                       # Montaje de endpoints Express

src/
├── components/
│   ├── common/
│   │   ├── Header.jsx              # Cabecera táctica (actualizar con rutas)
│   │   └── Sidebar.jsx             # Menú lateral (incorporar nuevos módulos)
│   ├── admin/
│   │   ├── PromoForm.jsx           # [NUEVO] Formulario "Forja de Planes y Tarifas"
│   │   ├── PromoGrid.jsx           # [NUEVO] Grilla de promociones activas
│   │   ├── ProductMasterGrid.jsx   # [NUEVO] Grilla de productos con costos y stock
│   │   └── ApprovalsList.jsx       # [NUEVO] Panel de Cambios & Aprobaciones
│   ├── reception/
│   │   ├── MembershipLookup.jsx    # [NUEVO] Buscador por DNI y ficha de atleta
│   │   └── PosTerminal.jsx         # [NUEVO] Grilla de venta rápida y ticket mostrador
│   └── modals/
│       ├── AddTimeModal.jsx        # [NUEVO] Modal "Agregar Tiempo de Membresía"
│       ├── AddProductModal.jsx     # [NUEVO] Modal azul "[+] AGREGAR PRODUCTOS"
│       └── SellProductModal.jsx    # [NUEVO] Modal verde "[$] VENDER PRODUCTO"
├── pages/
│   ├── admin/
│   │   ├── MembershipPromos.jsx    # [NUEVO] Página de Membresías & Promociones
│   │   ├── ProductInventory.jsx    # [NUEVO] Página de Inventario y Stock
│   │   └── ApprovalsPage.jsx       # [NUEVO] Página de Cambios & Aprobaciones
│   └── reception/
│       ├── MembershipOps.jsx       # [NUEVO] Gestión de membresías por DNI
│       └── QuickSales.jsx          # [NUEVO] Venta rápida de productos en mostrador
├── App.jsx                         # Enrutamiento React según rol
└── index.css                       # Clases de Tailwind y diseño de Stitch

tests/
├── unit/
│   ├── membershipDuration.test.js  # Pruebas de cálculo de vigencias (activo vs vencido)
│   └── stockReservation.test.js    # Pruebas de descuento preventivo y reversión
└── integration/
    ├── promocionesApi.test.js      # Pruebas de creación y archivado de tarifas
    ├── productosApi.test.js        # Pruebas de control de stock y seguridad de costos
    ├── membresiasApi.test.js       # Pruebas de asignación por DNI y comprobantes
    └── aprobacionesApi.test.js     # Pruebas de aprobación y purgado de archivos (Principio V)
```

**Structure Decision**: Se mantiene la arquitectura unificada Full-Stack (`server/` y `src/`), minimizando la fricción de despliegue y desarrollo local (`npm run dev`), con controladores modularizados en `server/routes/` y componentes desacoplados en `src/components/`.

---

## Complexity Tracking

> **Violaciones a la Constitución**: CERO (0). No se introducen patrones innecesarios ni tecnologías complejas. Se reutiliza SQLite local y React con Tailwind CSS.

| Elemento Técnico | Justificación según Constitución | Alternativa Más Simple Evaluada y Descartada |
| :--- | :--- | :--- |
| **Reserva preventiva de existencias** | Impide sobreventas accidentales durante el tiempo que toma al Administrador revisar la transferencia bancaria. | No reservar el stock: descartado porque causaría quiebres de inventario físico en mostrador si otro operador vende las unidades en efectivo. |
| **Baja lógica de productos** (`activo = 0`) | Garantiza la integridad contable y el arqueo de caja de ventas pasadas cuando un producto es descatalogado. | Eliminación física (`DELETE`): descartado porque rompería la integridad referencial y corrompería los reportes de ventas históricas. |
| **Purgado físico de comprobantes** | Mandato explícito del Principio Constitucional V para optimizar almacenamiento en disco. | Almacenar imágenes indefinidamente: descartado porque viola directamente la Constitución. |
