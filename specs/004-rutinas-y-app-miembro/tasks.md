# Tasks: Feature 004 — Rutinas Semanales, Alertas de Coach y App del Miembro

**Input**: Design documents from `/specs/004-rutinas-y-app-miembro/`  
**Prerequisites**: `plan.md` (requerido), `spec.md` (requerido), `data-model.md`, `contracts/`, `research.md`, `quickstart.md`

**Organization**: Tareas agrupadas por Historia de Usuario para habilitar implementación y verificación independiente de cada incremento.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos diferentes, sin dependencias bloqueantes)
- **[Story]**: Historia de usuario a la que pertenece la tarea (`US1`, `US2`, `US3`, `US4`, `US5`)
- Todos los caminos de archivo corresponden a la raíz del repositorio (`server/`, `src/`, `tests/`)

---

## Phase 1: Setup (Infraestructura Compartida)

**Purpose**: Preparar el esquema SQLite y el registro de rutas base en el servidor Express.

- [x] T001 Añadir tablas `maquinas_ejercicios`, `rutinas_plantillas`, `rutinas_dias`, `rutinas_ejercicios`, `miembro_rutinas_asignadas`, `miembro_rutina_ajustes`, `miembro_rutinas_privadas` y `alertas_coach` en `server/schema.sql`
- [x] T002 Implementar migración automática y semilla idempotente de las 25 máquinas numeradas (#01–#25) en `server/db.js`
- [x] T003 [P] Crear esqueletos de rutas y registrar `/api/rutinas`, `/api/alertas-coach` y `/api/asistente-ia` en `server/server.js`

---

## Phase 2: Foundational (Prerrequisitos Bloqueantes)

**Purpose**: Servicios centrales de datos compartidos entre los 3 portales que bloquean la construcción de UI.

**⚠️ CRITICAL**: Completar esta fase antes de iniciar las historias de usuario en paralelo.

- [x] T004 Implementar consulta de catálogo maestro de máquinas (`getMaquinas`) en `server/services/rutinaService.js`
- [x] T005 [P] Implementar endpoint `GET /api/rutinas/maquinas` en `server/routes/rutinas.js`
- [x] T006 [P] Implementar endpoint `GET /api/promociones/para-miembro` filtrando por `activo = 1`, `fecha_limite` vigente y `publico_objetivo` coincidente en `server/routes/promociones.js` y `server/services/promocionService.js`

**Checkpoint**: Base de datos SQLite migrada con las 25 máquinas y endpoint de promociones vigentes listo.

---

## Phase 3: User Story 1 - Configurador Semanal de Rutinas (Drag & Drop) y Asignación por DNI en Admin (Priority: P1) 🎯 MVP

**Goal**: Permitir al Administrador crear rutinas semanales (Lunes a Sábado) arrastrando máquinas numeradas con modal de series/reps/descanso, guardarlas por nombre en SQLite y asignarlas a atletas mediante búsqueda por DNI.

**Independent Test**: En `/admin/rutinas`, arrastrar una máquina hacia Lunes (verificando numeración `1.`), configurar series/reps/descanso en modal, pulsar "Guardar rutina", escribir nombre, pulsar "Aceptar" y luego buscar un DNI para asignar la nueva rutina.

### Tests for User Story 1
- [x] T007 [P] [US1] Crear pruebas de integración para `GET /api/rutinas/plantillas`, `POST /api/rutinas/plantillas`, `GET /api/rutinas/buscar-atleta/:dni` y `PUT /api/rutinas/asignar` en `tests/integration/rutinasApi.test.js`

### Implementation for User Story 1
- [x] T008 [US1] Implementar lógica de creación de plantillas (`createPlantilla`), listado (`getPlantillas`), búsqueda de atleta por DNI (`buscarAtletaPorDni`) y asignación (`asignarRutinaAtleta`) en `server/services/rutinaService.js`
- [x] T009 [US1] Implementar rutas `GET/POST /api/rutinas/plantillas`, `GET /api/rutinas/buscar-atleta/:dni` y `PUT /api/rutinas/asignar` con control de rol `ADMINISTRADOR`/`RECEPCIONISTA` en `server/routes/rutinas.js`
- [x] T010 [P] [US1] Construir componente `RoutineBuilder` (catálogo izquierdo de 25 máquinas numeradas, cuadrícula derecha Lunes–Sábado con HTML5 Drag & Drop y numeración correlativa `1.`, `2.`, modal de configuración Series/Reps/Descanso al soltar, botón inferior derecho "Guardar rutina" y modal de nombre con botón "Aceptar" habilitado solo al escribir texto) en `src/components/admin/RoutineBuilder.jsx`
- [x] T011 [P] [US1] Construir componente compartido `RoutineAssigner` (buscador DNI de 8 dígitos, ficha con Nombre, Apellido, DNI y formato `rutina: <nombre>`, menú desplegable de plantillas y botón "Modificar rutina") en `src/components/admin/RoutineAssigner.jsx`
- [x] T012 [US1] Crear página `RoutinesManagement` integrando `RoutineBuilder` y `RoutineAssigner` en `src/pages/admin/RoutinesManagement.jsx`
- [x] T013 [US1] Registrar ruta `/admin/rutinas` en `src/App.jsx` y agregar enlace en la navegación lateral en `src/components/common/Sidebar.jsx`

**Checkpoint**: El Administrador crea y asigna rutinas completas de Lunes a Sábado de extremo a extremo.

---

## Phase 4: User Story 2 - Soporte de Rutinas y Alerta en Vivo "Llamar Coach" en Recepción y Admin (Priority: P1)

**Goal**: Habilitar en Recepción la asignación de rutinas por DNI y mostrar en la pantalla principal de Recepción y Admin alertas en tiempo real cuando un socio solicite coach indicando su máquina.

**Independent Test**: En `/recepcion/rutinas`, buscar por DNI y modificar rutina; y desde otro navegador simular una alerta en `POST /api/alertas-coach` para verificar que aparezca en vivo (<= 2s) en Recepción y Admin con botón de "Marcar como Atendida".

### Tests for User Story 2
- [x] T014 [P] [US2] Crear pruebas de integración para ciclo de vida de alertas (`POST /api/alertas-coach`, `GET /api/alertas-coach/pendientes`, `PATCH /api/alertas-coach/:id/atender`, `PATCH /api/alertas-coach/:id/cancelar`) en `tests/integration/alertasCoachApi.test.js`

### Implementation for User Story 2
- [x] T015 [US2] Implementar `alertaCoachService.js` (crear alerta validando no duplicidad pendiente, listar pendientes con nombre y DNI del socio, marcar como atendida, cancelar por el socio y consultar alerta activa propia) en `server/services/alertaCoachService.js`
- [x] T016 [US2] Implementar rutas `/api/alertas-coach` con segregación estricta de roles en `server/routes/alertasCoach.js`
- [x] T017 [P] [US2] Crear página `ReceptionRoutines` reutilizando `RoutineAssigner` en `src/pages/reception/ReceptionRoutines.jsx`
- [x] T018 [P] [US2] Construir componente `CoachAlertsBanner` con HTTP polling ligero cada 2 segundos (`GET /api/alertas-coach/pendientes`), apilado por orden de llegada mostrando nombre del miembro y máquina, y botón "Marcar como Atendida" en `src/components/coach/CoachAlertsBanner.jsx`
- [x] T019 [US2] Integrar `CoachAlertsBanner` en `src/components/common/ReceptionLayout.jsx` y `src/components/common/AdminLayout.jsx`
- [x] T020 [US2] Registrar ruta `/recepcion/rutinas` en `src/App.jsx` y agregar enlace "Manejar Rutinas" en `src/components/common/ReceptionSidebar.jsx`

**Checkpoint**: Recepción asigna rutinas por DNI y recibe/atiende alertas de coach en vivo junto con Administración.

---

## Phase 5: User Story 3 - Portal Móvil del Miembro: Membresía, Fidelidad, Promociones y Llamar Coach (Priority: P1)

**Goal**: Entregar el dashboard móvil del socio con días restantes, nivel de fidelidad, publicidad emergente de promociones filtrada por vigencia y sesión (cerrable con `'X'`), botón "Renovar membresía" y módulo "Llamar Coach" con tarjeta de estado y cancelación.

**Independent Test**: Iniciar sesión en `/miembro`, confirmar popup de promoción vigente (cerrar con `'X'` y verificar que no reaparece al navegar dentro de la sesión, pero sí tras re-login), pulsar "Llamar Coach", ingresar "Máquina 8", enviar alerta y cancelar desde la tarjeta de estado.

### Tests for User Story 3
- [x] T021 [P] [US3] Crear pruebas de integración para `GET /api/promociones/para-miembro` validando exclusión de promociones vencidas (`fecha_limite < hoy`) y filtrado por nivel de fidelidad en `tests/integration/promoMiembroApi.test.js`

### Implementation for User Story 3
- [x] T022 [P] [US3] Crear componente `PromoPopupModal` con diseño móvil de `stitch-referencias`, botón visible `'X'` de cierre y control por `sessionStorage` vinculado al inicio de sesión en `src/components/member/PromoPopupModal.jsx`
- [x] T023 [P] [US3] Crear componente `CallCoachModal` con selector rápido de máquinas, input libre de estación, motivo de llamada, envío a `POST /api/alertas-coach`, tarjeta de estado activo ("Coach solicitado en Máquina X...") y botón "Cancelar solicitud" en `src/components/member/CallCoachModal.jsx`
- [x] T024 [US3] Actualizar `MemberCard.jsx` para mostrar días restantes, nivel de fidelidad gamificado, botón "Renovar membresía" (con catálogo de ofertas vigentes), tarjeta de estado de Coach y montaje inicial de `PromoPopupModal` en `src/pages/member/MemberCard.jsx`
- [x] T025 [US3] Actualizar `MemberLogin.jsx` / `AuthContext.jsx` para limpiar la bandera de popup promocional al iniciar/cerrar sesión en `src/pages/member/MemberLogin.jsx` y `src/context/AuthContext.jsx`
- [x] T026 [US3] Actualizar barra de navegación inferior móvil `MemberNav.jsx` incluyendo Inicio/Carnet, Mi Rutina, Llamar Coach y Ayuda IA en `src/components/member/MemberNav.jsx`

**Checkpoint**: El miembro opera su dashboard móvil completo, visualiza promociones vigentes y solicita/cancela coach en sala.

---

## Phase 6: User Story 4 - Visualización de Rutina Asignada, Ajuste de Series/Descanso y Rutina Privada del Miembro (Priority: P2)

**Goal**: Permitir al miembro consultar su rutina oficial (Lunes–Sábado con enfoque Push/Pull/Legs), ajustar sus propias series y tiempos de descanso, y crear rutinas personales privadas mediante pestañas superiores (`Rutina Asignada` / `Mi Rutina Privada`).

**Independent Test**: En `/miembro/rutina`, visualizar la rutina asignada, ajustar series/descanso y recargar para verificar persistencia sin modificar la plantilla de Admin; cambiar a pestaña "Mi Rutina Privada", crear y guardar una rutina personal y comprobar en `/admin/rutinas` que no es visible para el staff.

### Tests for User Story 4
- [x] T027 [P] [US4] Ampliar pruebas de integración en `tests/integration/rutinasApi.test.js` verificando `PATCH /api/rutinas/mi-rutina/ajustar-ejercicio`, `POST /api/rutinas/privadas` y aislamiento estricto frente a `GET /api/rutinas/plantillas`

### Implementation for User Story 4
- [x] T028 [US4] Implementar funciones de consulta de rutina del socio con ajustes aplicados (`getMiRutina`), guardado de ajustes personales (`ajustarEjercicioMiembro`) y CRUD de rutinas privadas (`crearRutinaPrivada`, `eliminarRutinaPrivada`) en `server/services/rutinaService.js`
- [x] T029 [US4] Añadir rutas `GET /api/rutinas/mi-rutina`, `PATCH /api/rutinas/mi-rutina/ajustar-ejercicio`, `POST /api/rutinas/privadas` y `DELETE /api/rutinas/privadas/:id` (exclusivas `MIEMBRO`) en `server/routes/rutinas.js`
- [x] T030 [P] [US4] Construir página móvil `MemberRoutine` con pestañas superiores (`Rutina Asignada` / `Mi Rutina Privada`), selector horizontal de días (LUN–SÁB con enfoque y estado `REST` para días libres), tarjetas numeradas de ejercicios y edición en línea de series y descanso en `src/pages/member/MemberRoutine.jsx`
- [x] T031 [P] [US4] Construir creador móvil `MemberCreateRoutine` (selector de días Lunes–Sábado, catálogo de 25 máquinas, reordenamiento `↑`/`↓`, configuración de series/reps/descanso y guardado privado) en `src/pages/member/MemberCreateRoutine.jsx`
- [x] T032 [US4] Integrar la navegación entre vistas móviles (`carnet`, `rutina`, `crear-rutina`, `ia`) en `src/App.jsx` y `src/pages/member/MemberCard.jsx`

**Checkpoint**: El atleta consulta y personaliza su rutina oficial y gestiona sus rutinas privadas con aislamiento total.

---

## Phase 7: User Story 5 - Asistente de Entrenamiento con IA para el Miembro (Priority: P3)

**Goal**: Proveer un chat interactivo de "Ayuda con IA" en el móvil del miembro conectado a Google Gemini API (vía `GEMINI_API_KEY`) con motor de contingencia local deportivo para garantizar respuestas continuas.

**Independent Test**: Abrir "Ayuda con IA" en `/miembro`, preguntar por reemplazo de `Máquina 8` o tiempos de descanso, y recibir respuesta estructurada en español de Perú tanto con `GEMINI_API_KEY` como sin ella (fallback offline).

### Tests for User Story 5
- [x] T033 [P] [US5] Crear pruebas unitarias para el motor deportivo local (sustitución de máquinas, tiempos de descanso, consultas de postura y formato de respuesta) en `tests/unit/asistenteIaFallback.test.js`

### Implementation for User Story 5
- [x] T034 [US5] Implementar `asistenteIaService.js` con cliente REST a Google Gemini (`GEMINI_API_KEY`, timeout 5s) + motor determinista de respaldo offline sobre el catálogo de 25 máquinas en `server/services/asistenteIaService.js`
- [x] T035 [US5] Implementar ruta `POST /api/asistente-ia/consultar` (exclusiva `MIEMBRO`) en `server/routes/asistenteIa.js`
- [x] T036 [US5] Construir vista móvil de chat `MemberAiChat` fiel a `stitch-referencias/004-rutinas-y-app-miembro/asistente_ia_miembro/` con burbujas de conversación, chips rápidos de consulta y tarjetas de máquinas recomendadas en `src/pages/member/MemberAiChat.jsx`

**Checkpoint**: El miembro puede consultar dudas de ejercicios y sustitución de máquinas al instante con el asistente virtual.

---

## Phase 8: Polish, Simplicidad Visual & Verificación Final

**Purpose**: Limpieza visual estricta en las nuevas vistas, compilación de producción y validación end-to-end.

- [x] T037 Auditar todas las nuevas vistas React (`RoutineBuilder`, `RoutineAssigner`, `CoachAlertsBanner`, `MemberCard`, `MemberRoutine`, `MemberCreateRoutine`, `MemberAiChat`) eliminando cualquier texto de ruido técnico (`terminal mode`, `sys_online`, `motor táctico`, etc.)
- [x] T038 Ejecutar suite completa de pruebas (`npm test`) y validar compilación de producción (`npm run build`) sin errores ni advertencias críticas
- [x] T039 Verificar flujo completo multi-portal siguiendo `specs/004-rutinas-y-app-miembro/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)** -> **Foundational (Phase 2)** -> Desbloquea todas las User Stories (`US1`..`US5`).
- **US1 (P1)** y **US2 (P1)** comparten el componente `RoutineAssigner` (T011), por lo que completar `US1` primero facilita reutilización directa en `US2`.
- **US3 (P1)** depende de `T006` (promociones vigentes) y de `T015-T016` (endpoints de alertas coach).
- **US4 (P2)** depende de `US1` (plantillas oficiales asignables) y `T004` (catálogo de máquinas).
- **US5 (P3)** depende únicamente de `T002` (catálogo de 25 máquinas) y puede desarrollarse en paralelo una vez completada la Fase 2.

### Parallel Opportunities
- T004, T005 y T006 en Fase 2 pueden ejecutarse en paralelo.
- Dentro de `US1`: `T010` (`RoutineBuilder.jsx`) y `T011` (`RoutineAssigner.jsx`) son independientes y paralelizables.
- Dentro de `US2`: `T017` (`ReceptionRoutines.jsx`) y `T018` (`CoachAlertsBanner.jsx`) son paralelizables.
- Dentro de `US3`: `T022` (`PromoPopupModal.jsx`) y `T023` (`CallCoachModal.jsx`) son paralelizables.
- Dentro de `US4`: `T030` (`MemberRoutine.jsx`) y `T031` (`MemberCreateRoutine.jsx`) son paralelizables.

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)
1. Completar Fase 1 y Fase 2 (esquema SQLite + 25 máquinas + promociones filtradas).
2. Implementar `US1` (Admin configura y asigna rutinas) y `US2` (Recepción asigna y recibe alertas de coach en vivo).
3. Implementar `US3` (Dashboard móvil del miembro con popup promocional y botón Llamar Coach).
4. Añadir `US4` (edición personal + rutinas privadas) y `US5` (chat IA), finalizando con la auditoría de simplicidad visual (Phase 8).
