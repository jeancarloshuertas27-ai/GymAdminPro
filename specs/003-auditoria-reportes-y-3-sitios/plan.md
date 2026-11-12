# Implementation Plan: 003 - Auditoría, Reportes PDF y Separación en 3 Sitios

**Branch**: `003-auditoria-reportes-y-3-sitios` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-auditoria-reportes-y-3-sitios/spec.md`, maquetas de Stitch en `stitch-referencias/003-auditoria-y-reportes/` (Dashboard Principal y Lista de Cambios) y directrices de purga de ruido visual dadas por el usuario.

---

## Summary

La Feature 003 consolida la arquitectura multi-portal y la infraestructura de control financiero para GymAdminPro:
1. **Separación Limpia en 3 Sitios Independientes**:
   - **(A) Sitio Administrador (`/admin`)**: Web escritorio y móvil. Plataforma ejecutiva: Dashboard Principal, Check-in, Promociones/Precios, Membresías, Lista de Cambios y Reporte PDF, Lista de Usuarios (viendo usuario/contraseña y botón Eliminar inactivos >1 mes), Inventario Maestro con Costos Privados y Alta de Personal (Recepción o Miembro).
   - **(B) Sitio Recepción (`/recepcion`)**: Exclusivo Web escritorio. Pantalla principal por defecto: Control de Acceso (Check-in con semáforo por DNI). Vistas restringidas: Membresías, Lista de Usuarios básica (sin ver contraseñas ni eliminar), Alta de Miembro y Venta Rápida (con stock visible y agotados translúcidos, sin costos ni edición).
   - **(C) Sitio Miembro (`/miembro`)**: Exclusivo Móvil. Carnet digital con QR dinámico, vigencia de días, fidelidad gamificada y promociones activas para su nivel, con accesos preparados para rutinas y llamada a coach. En monitores de escritorio se enmarca en un mockup de smartphone centrado; en móviles reales ocupa el 100% del viewport.
   - **Un Solo Comando**: `npm run dev` levanta concurrentemente el backend Express (puerto 3001) y el frontend Vite (puerto 5173).
   - **Aislamiento de Sesiones**: Llaves segregadas en `localStorage` (`gym_admin_session`, `gym_recepcion_session`, `gym_miembro_session`) que permiten operar en pestañas simultáneas sin colisiones.
2. **Dashboard Principal del Administrador (Diseño Limpio)**: Bento cards con Ingresos del Día en Soles (`S/`) (desglose Membresías vs Productos), Atletas Activos (<10d y nuevos mes), Stock Crítico (<5 u. o agotado) con botón de reabastecimiento, Control de Acceso integrado y widget de Transferencias por Auditar; habiendo purgado por completo textos y widgets decorativos de telemetría de ficción.
3. **Lista de Cambios en 2 Columnas Maestras**: Paralelas y ordenadas para "Cambios en Membresías" y "Venta de Productos". Visor modal forense de comprobantes con zoom interactivo. Botón **"ACEPTAR CAMBIO"** que borra físicamente la foto del servidor (Principio V), retira la tarjeta de la vista activa y preserva los registros contables en SQLite.
4. **Reporte Consolidado Diario en PDF**: Botón flotante **"GENERAR REPORTE"** que abre modal con selector de fecha interactivo y descarga directa del documento oficial `REPORTE <FECHA>.pdf` compilado en cliente con `jspdf` y `jspdf-autotable`, consolidando ganancias de membresías, nuevos usuarios, ganancias de productos y detalle pormenorizado de unidades vendidas.
5. **Depuración de Miembros Inactivos > 1 Mes**: Botón activo solo si el socio lleva más de 30 días con membresía vencida sin renovaciones posteriores, ejecutando un borrado físico completo (Hard Delete) con preservación de nombres históricos en texto plano en los balances pasados.

---

## Technical Context

**Language/Version**: JavaScript (Node.js 18+ con ES Modules en backend, React 18 en frontend con JSX/Vite).

**Primary Dependencies**:
- Backend: Express 4, `better-sqlite3`, `multer`, `cors`, `bcryptjs`.
- Frontend: React 18, React DOM, Tailwind CSS 3, `lucide-react`, `jspdf`, `jspdf-autotable`.

**Storage**: Base de datos SQLite local compartida (`server/gymcore.db`) gobernada por `server/db.js` y `server/schema.sql`, con claves foráneas activas y actualización atómica en tiempo real.

**Testing**: Vitest (`npm test`) para pruebas unitarias de cálculo de balance, autorización de accesos y pruebas de endpoints REST.

**Target Platform**: Navegadores modernos (Google Chrome, Edge, Safari) en entorno local.

**Project Type**: Aplicación web Full-Stack cliente-servidor iniciada mediante un único comando `npm run dev`.

**Performance Goals**:
- Arranque unificado con `npm run dev` en < 3 segundos.
- Verificación y semáforo de Check-in en < 200 ms.
- Actualización reactiva de métricas del Dashboard en < 500 ms tras ventas o renovaciones.
- Compilación y descarga del archivo PDF `REPORTE <FECHA>.pdf` en < 1 segundo.
- Purgado físico y desvanecimiento de tarjeta en "Aceptar cambio" en < 500 ms.

**Constraints**:
- Principio I: Simplicidad ante todo (sin frameworks o abstracciones pesadas).
- Principio II: Idioma y mercado local (español de Perú, moneda Soles `S/`, DNI de 8 dígitos).
- Principio III: Cero alcance fantasma (purgar elementos no solicitados de Stitch según instrucciones directas del usuario).
- Principio IV: Verificable por personas no técnicas (con escenarios en [quickstart.md](./quickstart.md)).
- Principio V: Respeto a los recursos (destrucción física inmediata de fotos de comprobantes aprobados).
- Principio VI: Separación estricta en 3 sitios por rol con logins exclusivos y sesiones desacopladas.

**Scale/Scope**: 3 portales segregados, 2 pantallas maestras de Stitch simplificadas (Dashboard y Lista de Cambios), 2 nuevos endpoints REST (`/api/reportes/dashboard`, `/api/reportes/diario`), 1 nuevo endpoint de baja de socios (`DELETE /api/users/:id/inactivo`), integración de librería PDF en cliente y ajuste a esquema SQLite.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio Constitucional | Estado | Verificación en la Feature 003 |
| :--- | :---: | :--- |
| **I. Simplicidad ante todo** | **PASS** | Servir los 3 sitios desde la misma app Vite mediante rutas limpias (`/admin`, `/recepcion`, `/miembro`) y un solo comando `npm run dev`. Sin microservicios ni configuraciones multi-puerto engorrosas. Generación PDF directa en cliente. |
| **II. Idioma y mercado local (Perú)** | **PASS** | Todas las interfaces, modales, alertas y el reporte PDF descargable redactados en español de Perú. Moneda oficial única Soles (`S/`). Identificación obligatoria por DNI de 8 dígitos. |
| **III. Cero alcance fantasma (Zero Scope Creep)** | **PASS** | Se respetan estrictamente los recortes indicados por el usuario para los prototipos de Stitch, eliminando textos de relleno y métricas ficticias (`terminal mode aplha001`, `sys_online: 99.8`, `curva de afluencia`, etc.). |
| **IV. Verificable por personas no técnicas** | **PASS** | Se elaboró la guía completa [quickstart.md](./quickstart.md) con 6 escenarios ejecutables íntegramente desde el navegador web. |
| **V. Datos del usuario y recursos con respeto** | **PASS** | Al pulsar "ACEPTAR CAMBIO", el comprobante temporal en `uploads/vouchers/` es **eliminado físicamente del disco del servidor**. Cero credenciales expuestas en código fuente. |
| **VI. Separación Estricta en 3 Sitios por Rol** | **PASS** | Tres portales con rutas `/admin`, `/recepcion`, `/miembro`, cada uno con su propio login exclusivo, rechazo de roles no permitidos y llaves de almacenamiento segregadas (`gym_admin_session`, `gym_recepcion_session`, `gym_miembro_session`). |

---

## Project Structure

### Documentation (this feature)

```text
specs/003-auditoria-reportes-y-3-sitios/
├── spec.md              # Especificación funcional clarificada
├── plan.md              # Este plan de implementación técnica
├── research.md          # Decisiones de arquitectura, investigación y recortes visuales
├── data-model.md        # Esquema de datos SQLite y entidades virtuales de reporte
├── quickstart.md        # Guía de validación E2E para usuarios no técnicos
├── contracts/           # Contratos formales de API REST
│   ├── reportes-api.md
│   ├── usuarios-admin-api.md
│   └── aprobaciones-api.md
└── checklists/
    └── requirements.md  # Checklist de calidad de la especificación (16/16 passing)
```

### Source Code Layout

```text
server/
├── routes/
│   ├── auth.js            # Login con validación estricta por portal
│   ├── checkin.js         # Endpoint de validación táctica por DNI
│   ├── promociones.js     # CRUD de promociones
│   ├── productos.js       # Inventario maestro y ventas rápidas
│   ├── membresias.js      # Búsqueda y extensión de membresías
│   ├── aprobaciones.js    # Lista en 2 columnas y purga física de vouchers
│   ├── reportes.js        # NUEVO: Telemetría de dashboard y consolidado diario
│   └── users.js           # Lista con contraseñas visibles y Hard Delete de inactivos
├── services/
│   ├── aprobacionService.js # Lógica de conciliación y fs.unlink de imágenes
│   ├── reporteService.js    # NUEVO: Cálculos consolidados para PDF y Dashboard
│   └── userService.js       # NUEVO: Hard delete de inactivos > 1 mes con salvaguarda
├── db.js                  # Conexión better-sqlite3
└── schema.sql             # Tablas y claves foráneas

src/
├── components/
│   ├── admin/
│   │   ├── AdminDashboard.jsx    # NUEVO: Dashboard Bento limpio (ingresos, stock, etc.)
│   │   ├── ApprovalsList.jsx     # Doble columna paralela de cambios con visor zoom
│   │   ├── ReportPdfModal.jsx    # NUEVO: Modal de consolidado diario y descarga PDF
│   │   └── ...
│   ├── checkin/
│   │   └── SemaphoreCard.jsx     # Semáforo Verde, Naranja (<=10d) y Rojo
│   ├── common/
│   │   ├── AdminLayout.jsx       # Layout exclusivo del Administrador con Sidebar completo
│   │   ├── ReceptionLayout.jsx   # Layout exclusivo de Recepción (sin navegación admin)
│   │   └── MemberLayout.jsx      # Layout de simulación móvil (mockup smartphone en desktop)
│   └── ...
├── context/
│   └── AuthContext.jsx           # Manejo de sesiones segregadas por portal
├── pages/
│   ├── PortalSelect.jsx          # NUEVO: Selector inicial táctico en ruta raíz (/)
│   ├── admin/
│   │   ├── AdminLogin.jsx        # Login exclusivo para Administradores
│   │   ├── DashboardPage.jsx     # Vista ejecutiva del Dashboard
│   │   ├── ApprovalsPage.jsx     # Vista de Lista de Cambios & Auditoría
│   │   └── UserRoster.jsx        # Lista de usuarios con contraseñas y botón eliminar
│   ├── reception/
│   │   ├── ReceptionLogin.jsx    # Login exclusivo para Recepción
│   │   ├── CheckIn.jsx           # Pantalla principal predeterminada de mostrador
│   │   └── ...
│   └── member/
│       ├── MemberLogin.jsx       # Login exclusivo para Miembros
│       └── MemberCard.jsx        # Carnet digital con QR interactivo y fidelidad
├── utils/
│   └── generateReportPdf.js      # NUEVO: Compilador cliente de PDF con jspdf-autotable
├── App.jsx                       # Enrutador central modular (/admin, /recepcion, /miembro)
└── main.jsx
```

---

## Complexity Tracking

*No violations detected. Zero complexity additions.* Todas las soluciones adoptadas se basan estrictamente en la arquitectura existente (React SPA + Express + SQLite local) y respetan íntegramente los 6 principios de la Constitución.
