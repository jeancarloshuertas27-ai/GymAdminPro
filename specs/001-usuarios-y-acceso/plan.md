# Implementation Plan: Módulo 001 - Usuarios, Roles, Fidelidad y Control de Acceso

**Branch**: `001-usuarios-y-acceso` | **Date**: 2026-10-25 | **Spec**: [specs/001-usuarios-y-acceso/spec.md](spec.md)

**Input**: Feature specification from `/specs/001-usuarios-y-acceso/spec.md`

## Summary

Implementar el sistema fundamental de gestión de identidades y control de acceso táctico de GymAdminPro: autenticación multi-rol (Administrador, Recepcionista y Miembro), directorio alfabético estricto de usuarios con modal estilo documento de identidad, cálculo matemático y gamificado del escalafón de fidelidad (8 niveles con penalización por impago >2 semanas), alta rápida de personal y miembros con gestión de vouchers locales, y terminal de Check-In táctico en recepción con semáforo cromático (Verde, Naranja y Rojo) y log de ingresos en vivo.

El desarrollo replica con exactitud milimétrica el diseño obsidian táctico de las carpetas de `stitch-referencias/001-usuarios-y-acceso/`, empleando una arquitectura monolítica simple con React (Vite + Tailwind CSS) en el frontend y una API local en Node.js con SQLite (`better-sqlite3`) para la persistencia.

---

## Technical Context

**Language/Version**: JavaScript / Node.js (v18+ o v20+ LTS), HTML5, CSS3  
**Primary Dependencies**:
- Frontend: React 18/19, Vite, Tailwind CSS, Lucide React / Material Symbols Outlined, React Router DOM (o conmutador de vistas ligero).
- Backend: Express (o HTTP nativo ligero), `better-sqlite3` (driver de alto rendimiento para SQLite), `multer` (para subida local de vouchers y fotos), `bcryptjs` (para hash de contraseñas).
- Herramientas de desarrollo: `concurrently` (para ejecutar frontend y backend en un único comando `npm run dev`).
**Storage**: SQLite 3 local (`gymcore.db` en raíz del servidor, ignorado en `.gitignore`), almacenamiento local de archivos en `uploads/vouchers/` y `uploads/photos/`.  
**Testing**: Vitest para pruebas unitarias de reglas de negocio (fidelidad, semáforo, orden alfabético) y pruebas de integración de endpoints REST.  
**Target Platform**: Navegadores modernos de escritorio (Chrome, Edge, Firefox) para Administrador y Recepcionista; navegadores móviles responsivos para Miembros.  
**Project Type**: Aplicación Web Fullstack local (SPA React + API SQLite local).  
**Performance Goals**: Check-in y respuesta de semáforo en < 2 segundos; carga de lista alfabética de usuarios en < 300 ms.  
**Constraints**: Operación 100% local sin requerir servicios en la nube externos; moneda obligatoria en Soles (`S/`); formato estricto de DNI peruano de 8 dígitos; contraseñas cifradas y ocultas para rol recepcionista.  
**Scale/Scope**: Padrón inicial de ~1,500 atletas registrados con paginación fluida y tiempo de respuesta inmediato en terminal de caja.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio de la Constitución | Estado | Justificación y Validación |
|---|---|---|
| **I. Simplicidad ante todo (YAGNI)** | **PASS** | Monolito local directo: React + Vite y Node + `better-sqlite3`. Sin ORMs complejos, microservicios ni intermediarios innecesarios. |
| **II. Idioma y mercado local (Perú)** | **PASS** | 100% en español de Perú. Moneda oficial Soles (`S/`) y validación estricta de DNI peruano de 8 dígitos numéricos. |
| **III. Cero alcance fantasma** | **PASS** | Implementación limitada estrictamente a las vistas y pantallas de `stitch-referencias/001-usuarios-y-acceso/` y spec.md. |
| **IV. Verificable por personas no técnicas** | **PASS** | Cada flujo (check-in, visualización alfabética, modal carnet, alta de miembros) es verificable directamente desde el navegador según [quickstart.md](quickstart.md). |
| **V. Datos y recursos con respeto** | **PASS** | Datos mínimos requeridos; vouchers de pago guardados en disco local con arquitectura lista para borrado físico al aprobar auditoría; sin credenciales ni secretos en el código. |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-usuarios-y-acceso/
├── spec.md              # Especificación funcional aprobada
├── plan.md              # Plan de implementación de arquitectura (este archivo)
├── research.md          # Investigación técnica y decisiones de arquitectura
├── data-model.md        # Esquema DDL de SQLite y reglas de negocio
├── quickstart.md        # Guía de verificación paso a paso
├── contracts/           # Contratos de interfaces y API REST
│   └── api-contracts.md
├── checklists/
│   └── requirements.md  # Checklist de calidad de especificación (16/16)
└── tasks.md             # Tareas ejecutables (generadas en el siguiente comando)
```

### Source Code Layout

```text
gymcore/
├── package.json                 # Dependencias y scripts (dev, test, build, db:seed)
├── vite.config.js               # Configuración de Vite con proxy hacia API backend
├── tailwind.config.js           # Paleta de tokens y tipografías Kinetic Obsidian
├── index.html                   # HTML base con fuentes de Google y estilos oscuros
├── uploads/                     # Archivos locales (ignorado en .gitignore)
│   ├── vouchers/
│   └── photos/
├── server/                      # Backend ligero SQLite
│   ├── db.js                    # Inicialización y conexión de better-sqlite3
│   ├── schema.sql               # Migración DDL SQLite
│   ├── seed.js                  # Datos iniciales para pruebas locales
│   ├── server.js                # Servidor Express y registro de rutas API
│   ├── routes/
│   │   ├── auth.js              # /api/auth (login, logout, session)
│   │   ├── users.js             # /api/users (CRUD, orden alfabético, modal carnet)
│   │   └── checkin.js           # /api/checkin (evaluación semáforo y feed en vivo)
│   └── utils/
│       ├── fidelity.js          # Motor de cálculo de escalafón y penalización
│       └── authMiddleware.js    # Guardas de autorización por rol
├── src/                         # Frontend React
│   ├── main.jsx                 # Punto de entrada de React
│   ├── App.jsx                  # Router/Switch principal por roles
│   ├── index.css                # Directivas de Tailwind y estilos globales
│   ├── context/
│   │   └── AuthContext.jsx      # Estado de usuario autenticado y rol activo
│   ├── components/
│   │   ├── common/              # Layouts compartidos (Header, Sidebar táctico)
│   │   ├── modals/
│   │   │   ├── TacIdModal.jsx   # Modal estilo Pasaporte Táctico / Carnet ("Ver más")
│   │   │   └── EditUserModal.jsx# Modal de corrección rápida de atleta (DNI inmutable)
│   │   └── checkin/
│   │       ├── Numpad.jsx       # Teclado táctil numérico de alto rendimiento
│   │       ├── SemaphoreCard.jsx# Tarjeta de respuesta Verde/Naranja/Rojo con ficha
│   │       └── LiveFeed.jsx     # Feed cronológico de últimos ingresos
│   └── pages/
│       ├── Login.jsx            # Pantalla de acceso por credenciales
│       ├── admin/
│       │   ├── UserRoster.jsx   # Directorio A-Z de usuarios, filtros y métricas HUD
│       │   └── AddUser.jsx      # Formulario táctico con selector Recepción / Miembro
│       ├── reception/
│       │   ├── CheckIn.jsx      # Puesto de control de acceso y torniquete
│       │   └── AthletesList.jsx # Lista de atletas (con contraseñas ocultas)
│       └── member/
│           └── MemberCard.jsx   # Vista móvil con Carnet Digital Táctico
└── tests/                       # Pruebas unitarias y de integración
    ├── unit/
    │   ├── fidelity.test.js     # Tests del cálculo de 8 niveles y penalización 14d
    │   └── semaphore.test.js    # Tests de semáforo Verde (>10d), Naranja (1-10d), Rojo
    └── integration/
        └── api.test.js          # Pruebas de endpoints auth, users y checkin
```

**Structure Decision**: Monoproyecto limpio con separación clara de `src/` (cliente React Vite) y `server/` (API Express SQLite). Esto permite ejecutar todo de forma integrada con `npm run dev` sin requerir herramientas complejas de monorepositorio.

---

## Complexity Tracking

> **Sin violaciones a la constitución.** Todas las decisiones de arquitectura se apegan a los principios de simplicidad (MVP v1), persistencia directa en SQLite sin capas abstractas intermedias, y fidelidad exacta a las maquetas aprobadas.
