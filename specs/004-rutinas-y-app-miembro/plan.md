# Implementation Plan: 004 — Rutinas Semanales, Alertas de Coach y App del Miembro

**Branch**: `004-rutinas-y-app-miembro` | **Date**: 2026-11-19 | **Spec**: [spec.md](file:///c:/Users/usuario/mis-proyectos/gymcore/specs/004-rutinas-y-app-miembro/spec.md)  
**Input**: Feature specification from `/specs/004-rutinas-y-app-miembro/spec.md`

---

## Summary

Implementar la Feature 004 conectando los 3 portales independientes (`/admin`, `/recepcion` y `/miembro`) sobre la misma API Node.js/Express y base de datos SQLite (`server/gymcore.db`):

1. **Sitio Administrador (`/admin`)**: Configurador semanal de rutinas (Lunes a Sábado) con Drag & Drop nativo desde un catálogo precargado de 25 máquinas numeradas (#01–#25), numeración secuencial automática (`1.`, `2.`, ...), modal emergente de configuración (series, repeticiones, descanso), modal "Guardar rutina" con botón "Aceptar" validado, y buscador por DNI para asignar plantillas (`rutina: <nombre>`).
2. **Sitio Recepción (`/recepcion`)**: Buscador por DNI con lista desplegable para asignar rutinas preconfiguradas, más un banner de alerta en vivo ("Llamar Coach") alimentado por sondeo HTTP cada 3 segundos desde el backend compartido (visible también en el Sitio Administrador).
3. **Sitio Miembro (`/miembro`)**: Portal móvil completo con estado de membresía y nivel de fidelidad, publicidad emergente de promociones vigentes filtradas por fecha límite y nivel (una vez por inicio de sesión, con botón `'X'`), pestañas superiores `Rutina Asignada` / `Mi Rutina Privada`, edición personal de series/descanso, creador de rutinas privadas aisladas, botón "Llamar Coach" con tarjeta de estado y cancelación, y chat "Ayuda con IA" integrado con Google Gemini (`GEMINI_API_KEY`) y fallback local deportivo.
4. **Limpieza Visual Estricta**: Fidelidad a la estética oscura de `stitch-referencias/004-rutinas-y-app-miembro/` eliminando todo texto decorativo de relleno (`terminal mode alpha001`, `sys_online: 99.8`, `motor táctico`, etc.).

---

## Technical Context

**Language/Version**: JavaScript (ESM) — Node.js 18+ (Backend) / React 18.3 (Frontend)  
**Primary Dependencies**: Express 4, `node:sqlite`, Vite 5, Tailwind CSS 3, Lucide React  
**Storage**: SQLite (`server/gymcore.db`) con migraciones idempotentes en `server/db.js` y `server/schema.sql`  
**Testing**: Vitest 2 (`vitest run --fileParallelism=false`) para tests unitarios e integración de API  
**Target Platform**: Web Desktop (`/admin`, `/recepcion`) y Web Móvil Responsivo (`/miembro`, `/admin`)  
**Project Type**: Full-stack SPA + REST API monorepo (`src/` + `server/`)  
**Performance Goals**: Búsqueda por DNI < 500ms; propagación de alertas "Llamar Coach" <= 3 segundos mediante HTTP polling ligero; respuestas IA <= 3s  
**Constraints**: Cero dependencias NPM externas para Drag & Drop o WebSockets (Principio I); español de Perú, moneda `S/`, DNI 8 dígitos (Principio II); `GEMINI_API_KEY` opcional mediante variable de entorno (Principio V)  
**Scale/Scope**: Gimnasio local con catálogo de 25 máquinas, decenas de rutinas plantilla y cientos de miembros concurrentes sobre SQLite

---

## Constitution Check

*GATE: Verificado previo a Phase 0 y re-evaluado tras Phase 1.*

| Principio Constitucional | Verificación en Feature 004 | Estado |
|---|---|---|
| **I. Simplicidad ante todo** | Uso de HTML5 Drag & Drop nativo, HTTP polling ligero cada 3s para alertas de coach, y `fetch` nativo para Gemini API con fallback local (cero librerías extra). | PASS |
| **II. Idioma y mercado local (Perú)** | Toda la UI, mensajes del asistente IA, días de la semana, promociones en Soles (`S/`) y búsquedas por DNI de 8 dígitos en español de Perú. | PASS |
| **III. Cero alcance fantasma** | Se implementa estrictamente lo especificado en `spec.md` y las 5 carpetas de `stitch-referencias/004-rutinas-y-app-miembro/`, omitiendo textos de ruido técnico. | PASS |
| **IV. Verificable por personas no técnicas** | Todo flujo (arrastrar máquina, guardar rutina, alertar al coach, ver popup de promo, chatear con IA) se prueba directamente en el navegador/móvil. | PASS |
| **V. Datos y recursos con respeto** | `GEMINI_API_KEY` se lee exclusivamente de `process.env`; las rutinas privadas del miembro quedan aisladas por `usuario_id`. | PASS |
| **VI. Separación Estricta en 3 Sitios por Rol** | Rutas de API protegidas por rol (`ADMINISTRADOR`, `RECEPCIONISTA`, `MIEMBRO`), conectadas al mismo servidor Express y SQLite central (`gymcore.db`). | PASS |

---

## Project Structure

### Documentation (this feature)

```text
specs/004-rutinas-y-app-miembro/
├── plan.md                                  # Este documento
├── research.md                              # Decisiones técnicas (Phase 0)
├── data-model.md                            # Esquema SQLite y semilla de 25 máquinas (Phase 1)
├── quickstart.md                            # Guía de ejecución y verificación manual (Phase 1)
├── contracts/                               # Contratos REST (Phase 1)
│   ├── rutinas-api.md
│   ├── alertas-coach-api.md
│   └── asistente-ia-api.md
└── tasks.md                                 # Generado en el siguiente paso (/speckit-tasks)
```

### Source Code (repository root)

```text
server/
├── schema.sql                               # Nuevas tablas: maquinas_ejercicios, rutinas_*, miembro_rutina_*, alertas_coach
├── db.js                                    # Seed idempotente de las 25 máquinas (#01-#25)
├── server.js                                # Registro de rutas /api/rutinas, /api/alertas-coach, /api/asistente-ia
├── routes/
│   ├── promociones.js                       # Añadir GET /api/promociones/para-miembro (filtro fecha_limite y nivel)
│   ├── rutinas.js                           # Endpoints de plantillas, catálogo máquinas, búsqueda DNI, asignación y privadas
│   ├── alertasCoach.js                      # Endpoints POST/GET/PATCH para alertas en sala
│   └── asistenteIa.js                       # Endpoint POST /api/asistente-ia/consultar
└── services/
    ├── rutinaService.js                     # Lógica SQLite para plantillas, asignaciones, ajustes y privacidad
    ├── alertaCoachService.js                # Gestión de ciclo de vida PENDIENTE -> ATENDIDA / CANCELADA
    └── asistenteIaService.js                # Integración Gemini REST + Fallback local deportivo

src/
├── App.jsx                                  # Rutas /admin/rutinas, /recepcion/rutinas y sub-vistas de /miembro/*
├── components/
│   ├── common/
│   │   ├── AdminLayout.jsx                  # Incluye banner en vivo de Alertas Coach (polling 3s)
│   │   ├── ReceptionLayout.jsx              # Incluye banner en vivo de Alertas Coach (polling 3s)
│   │   ├── Sidebar.jsx                      # Enlace "Configurar y Manejar Rutinas"
│   │   └── ReceptionSidebar.jsx             # Enlace "Manejar Rutinas"
│   ├── admin/
│   │   ├── RoutineBuilder.jsx               # Drag & Drop izquierdo-derecho (Lunes-Sábado) + Modales de ejercicio y nombre
│   │   └── RoutineAssigner.jsx              # Buscador DNI + "rutina: <nombre>" + "Modificar rutina" (compartido Admin/Recepción)
│   ├── coach/
│   │   └── CoachAlertsBanner.jsx            # Banner en vivo para Recepción y Admin con botón "Marcar como Atendida"
│   └── member/
│       ├── MemberNav.jsx                    # Navegación inferior móvil (Inicio, Mi Rutina, Llamar Coach, Ayuda IA)
│       ├── PromoPopupModal.jsx              # Publicidad emergente por inicio de sesión con botón 'X'
│       └── CallCoachModal.jsx               # Modal para digitar/elegir máquina y enviar/cancelar alerta
└── pages/
    ├── admin/
    │   └── RoutinesManagement.jsx           # Página contenedor de Configurar + Manejar Rutinas
    ├── reception/
    │   └── ReceptionRoutines.jsx            # Página de Manejar Rutinas para Recepción
    └── member/
        ├── MemberCard.jsx                   # Dashboard móvil: días, fidelidad, botón Renovar, acceso rápido Coach/IA y PromoPopup
        ├── MemberRoutine.jsx                # Pestañas "Rutina Asignada" (ajuste series/descanso) / "Mi Rutina Privada"
        ├── MemberCreateRoutine.jsx          # Creador móvil de rutina personal privada
        └── MemberAiChat.jsx                 # Chat interactivo "Ayuda con IA"

tests/
├── unit/
│   └── asistenteIaFallback.test.js          # Pruebas del motor deportivo local y formato de respuestas
└── integration/
    ├── rutinasApi.test.js                   # Pruebas de plantillas, asignación por DNI, ajustes y aislamiento de privadas
    ├── alertasCoachApi.test.js              # Pruebas de creación, polling pendientes, atención y cancelación
    └── promoMiembroApi.test.js              # Pruebas de filtrado de promociones vigentes por fecha_limite y nivel
```

**Structure Decision**: Se mantiene la arquitectura monorepo existente (`server/` para Express + SQLite y `src/` para los 3 portales React + Tailwind). Se reutilizan componentes compartidos donde la lógica es idéntica (`RoutineAssigner` entre Admin y Recepción; `CoachAlertsBanner` en ambos layouts) respetando estricto control de rol en endpoints y vistas.

---

## Complexity Tracking

No existen violaciones a la Constitución. Toda la solución emplea capacidades nativas del navegador y de Node.js/SQLite sin añadir dependencias pesadas ni arquitecturas complejas.
