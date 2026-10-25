# Tasks: Módulo 001 - Usuarios, Roles, Fidelidad y Control de Acceso

**Input**: Design documents from `/specs/001-usuarios-y-acceso/` (`plan.md`, `spec.md`, `data-model.md`, `contracts/api-contracts.md`, `research.md`, `quickstart.md`)  
**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`, `contracts/api-contracts.md`  

## Format: `- [X] [ID] [P?] [Story] Description with exact file path`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story identifier (`[US1]`, `[US2]`, `[US3]`, `[US4]`, `[US5]`)
- Every task includes the exact target file path

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency management, and design system setup

- [X] T001 Initialize Node/React project with Vite, Tailwind CSS, Lucide icons, Express, `better-sqlite3`, `bcryptjs`, `multer`, and `concurrently` in `package.json`
- [X] T002 [P] Configure Tailwind CSS with Kinetic Obsidian design tokens (colors `surface-container-*`, `primary-container`, `tertiary-container`, `error-container`, and fonts `Barlow Condensed`, `Chivo`, `JetBrains Mono`) in `tailwind.config.js`
- [X] T003 [P] Configure Vite dev server with proxy to local backend API (`/api` -> `http://localhost:3001`) in `vite.config.js`
- [X] T004 [P] Configure `index.html` loading Google Fonts (`Barlow Condensed`, `Chivo`, `JetBrains Mono`, `Material Symbols Outlined`) and obsidian dark theme styling in `index.html`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, initial test seed, Express server, and authentication infrastructure

> **CRITICAL**: No user story implementation can begin until this foundational phase is complete.

- [X] T005 Create database connection and SQLite initialization with `PRAGMA foreign_keys = ON` in `server/db.js`
- [X] T006 Create database migration script applying schema DDL (`usuarios`, `membresias`, `fidelidad`, `checkins` with checks: `rol IN ('ADMINISTRADOR', 'RECEPCIONISTA', 'MIEMBRO')`, `length(dni) = 8 AND dni GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'`, `estado IN ('ACTIVO', 'POR_VENCER', 'VENCIDO')`, `tipo_pago IN ('EFECTIVO', 'TRANSFERENCIA')`) in `server/schema.sql`
- [X] T007 [P] Implement database seeder script populating test users (Admin `@admin_01`, Recepcionista `@recep_carlos`, and athletes with >10d, 8d, and >30d expired memberships) in `server/seed.js`
- [X] T008 [P] Implement Express server entry point with static file serving for `uploads/`, body parsers, error handling, and API router in `server/server.js`
- [X] T009 [P] Implement authentication service with password hashing (`bcryptjs`) and session/token validation middleware in `server/utils/authMiddleware.js`
- [X] T010 [P] Implement authentication routes (`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`) in `server/routes/auth.js`
- [X] T011 [P] Create frontend AuthContext and session state management in `src/context/AuthContext.jsx`
- [X] T012 Create base application router and role-based redirect guards (Administrador, Recepcionista, Miembro) in `src/App.jsx`

**Checkpoint**: Foundation ready — database, authentication, and routing established.

---

## Phase 3: User Story 1 - Control de Acceso y Check-in Rápido por DNI en Recepción (Priority: P1) 🎯 MVP

**Goal**: Permitir al recepcionista digitar el DNI de 8 dígitos de un atleta, visualizar instantáneamente la respuesta del semáforo táctico (Verde, Naranja o Rojo), la ficha de atleta y registrar el ingreso en el feed en vivo.

**Independent Test**: Iniciar sesión como recepcionista, digitar DNI de atleta activo (>10d) para verificar Verde, DNI por vencer (8d) para verificar Naranja con paso concedido automático y alerta de cobro, DNI vencido o inexistente para verificar Rojo bloqueado, y botón de pulso manual.

### Tests for User Story 1
- [X] T013 [P] [US1] Unit test for check-in evaluation logic (Verde >10 días, Naranja 1 a 10 días concediendo paso con alerta, Rojo <=0 días o no registrado bloqueando acceso) in `tests/unit/semaphore.test.js`

### Implementation for User Story 1
- [X] T014 [US1] Implement check-in evaluation service querying active membership by 8-digit DNI and creating checkin records in `server/services/checkinService.js`
- [X] T015 [US1] Implement check-in routes (`POST /api/checkin`, `GET /api/checkin/recent`, `POST /api/checkin/force`) in `server/routes/checkin.js`
- [X] T016 [P] [US1] Build on-screen high-performance numeric keypad component with 48px tap targets, display, clear, backspace and validate buttons in `src/components/checkin/Numpad.jsx`
- [X] T017 [P] [US1] Build tactical semaphore card and athlete summary display (photo, tier badge, name, DNI, routine, attendance telemetry) in `src/components/checkin/SemaphoreCard.jsx`
- [X] T018 [P] [US1] Build live chronological check-in feed component displaying last 10 entries with chromatic status pills in `src/components/checkin/LiveFeed.jsx`
- [X] T019 [US1] Assemble full Receptionist Check-in page (`recepci_n_control_de_acceso_y_check_in`) with top telemetry bar, aforo metric, turnstile relay pulse button, incident alert banner, and simulator console in `src/pages/reception/CheckIn.jsx`

**Checkpoint**: User Story 1 fully functional as standalone MVP for gym access control.

---

## Phase 4: User Story 2 - Directorio Alfabético y Ficha Digital Estilo Carnet de Identidad (Priority: P1)

**Goal**: Permitir a administradores y recepcionistas consultar el padrón de atletas ordenado estrictamente por apellido paterno (A → Z), con filtros por estado, contraseñas enmascaradas con ojito (solo Admin), y modal estilo pasaporte/carnet de identidad con botón 'X' arriba a la derecha.

**Independent Test**: Consultar el padrón, comprobar orden estricto A-Z por apellidos, verificar que recepción no ve contraseñas ni usernames, abrir el modal "Ver más" de un atleta comprobando foto, DNI, vigencia en 'X meses y Y días', fidelidad y rutina.

### Tests for User Story 2
- [X] T020 [P] [US2] Integration test for user roster endpoints (`GET /api/users` with strict A-Z sort by apellidos, privacy masks per role) in `tests/integration/usersList.test.js`

### Implementation for User Story 2
- [X] T021 [US2] Implement user roster service with strict `apellidos ASC` sorting, pagination, and status filters (`all`, `active`, `warning`, `expired`) in `server/services/userService.js`
- [X] T022 [US2] Implement user query routes (`GET /api/users`, `GET /api/users/:id`) enforcing role-based privacy masking of `passwordRaw` and `username` for non-admins in `server/routes/users.js`
- [X] T023 [P] [US2] Build digital tactical passport / athlete ID card modal component ("Ver más") with top hologram banner, 'X' close button, photo, DNI, remaining time in 'X meses y Y días', and fidelity badge in `src/components/modals/TacIdModal.jsx`
- [X] T024 [P] [US2] Build edit athlete modal component ("Corrección de datos de atleta") with immutable DNI and @username (read-only) and editable Nombres, Apellidos, Celular in `src/components/modals/EditUserModal.jsx`
- [X] T025 [US2] Build Admin User Roster page (`admin_lista_de_usuarios_y_fidelidad`) with Quick Metrics HUD (Total Padrón, Activos, Por Vencer, Vencidos), search bar, filter tabs, table with password toggle, and action buttons in `src/pages/admin/UserRoster.jsx`
- [X] T026 [P] [US2] Build Receptionist Athletes List page (`recepci_n_lista_de_atletas_y_rutinas`) with masked passwords/usernames and "Ver Ficha" button in `src/pages/reception/AthletesList.jsx`

**Checkpoint**: User Stories 1 and 2 work independently with full role privacy compliance.

---

## Phase 5: User Story 3 - Alta Rápida de Usuarios (Recepción y Miembro con Cobro) (Priority: P2)

**Goal**: Permitir el registro de personal de Recepción (solo Admin) y Miembros Atletas con membresía en años/meses y pago en efectivo o transferencia (con voucher obligatorio y nro de operación), activando la membresía de inmediato.

**Independent Test**: Registrar personal de recepción verificando campos requeridos (domicilio, celular respaldo); registrar miembro con transferencia adjuntando voucher, verificando que quede activo de inmediato y pueda hacer check-in al instante con su DNI.

### Tests for User Story 3
- [X] T027 [P] [US3] Integration test for user creation (`POST /api/users` with reception vs member payloads, voucher upload, immediate activation) in `tests/integration/userCreation.test.js`

### Implementation for User Story 3
- [X] T028 [US3] Configure local file upload middleware (`multer`) storing vouchers in `uploads/vouchers/` and photos in `uploads/photos/` with 5MB limit in `server/utils/upload.js`
- [X] T029 [US3] Implement user creation service handling staff vs member logic, membership duration calculation (years and months), and transfer voucher persistence in `server/services/userCreationService.js`
- [X] T030 [US3] Implement user creation endpoint `POST /api/users` with role validation (reception role restricted to member creation) in `server/routes/users.js`
- [X] T031 [P] [US3] Build Reception Staff form component (Nombres, Apellidos, DNI 8 dígitos, Celular, Celular respaldo, Domicilio, @username, Contraseña con generador de clave segura) in `src/components/admin/ReceptionForm.jsx`
- [X] T032 [P] [US3] Build Member form component (Foto opcional, Nombres, Apellidos, DNI, Celular, @username, Contraseña, Rutina desplegable, Tiempo en años y meses, Tipo de Pago Efectivo/Transferencia con voucher obligatorio y nro operación) in `src/components/admin/MemberForm.jsx`
- [X] T033 [US3] Assemble Add User page (`admin_agregar_usuario_nuevo_2`) with top toggle selector (`TIPO: RECEPCIÓN` vs `TIPO: MIEMBRO`), feedback toast, and clear/submit buttons in `src/pages/admin/AddUser.jsx`

**Checkpoint**: User registration and immediate membership activation verified.

---

## Phase 6: User Story 4 - Escalafón de Fidelidad Gamificada y Purga de Inactivos (Priority: P2)

**Goal**: Calcular automáticamente el nivel de fidelidad de 8 rangos desde la inscripción, reiniciar a NOVATO ante impago >14 días, y habilitar el botón "Eliminar usuario de la base de datos" solo si lleva >30 días vencido bajo rol Admin.

**Independent Test**: Probar atletas con diferentes antigüedades (1m, 3m, 6m, 12m, 2a, 4a+) verificando la denominación e insignia; probar miembro con impago >14d verificando reinicio a NOVATO; abrir modal de miembro vencido >30d y confirmar eliminación física de SQLite.

### Tests for User Story 4
- [X] T034 [P] [US4] Unit test for fidelity ladder calculation (8 levels: NOVATO, PRINCIPIANTE, PROMEDIO, EN PROGRESO, MUTANDO, MAMADO/A, DIOS/A GRIEGO/A, ANIMAL) and 14-day unpaid penalty in `tests/unit/fidelity.test.js`

### Implementation for User Story 4
- [X] T035 [US4] Implement fidelity engine utility calculating months of continuous attendance, badge rank, progress bar percentage, and 14-day penalty in `server/utils/fidelity.js`
- [X] T036 [US4] Implement user purge endpoint `DELETE /api/users/:id` enforcing Admin role check and `dias_vencido > 30` rule with physical hard delete in `server/routes/users.js`
- [X] T037 [P] [US4] Add Gamification Level Reference Infobar (8 tier boxes with Nivel Apex ANIMAL) to the bottom of the User Roster in `src/pages/admin/UserRoster.jsx`
- [X] T038 [US4] Integrate dynamic fidelity ladder progress bar and delete button with confirmation modal (`¿Está seguro de eliminar permanentemente a este atleta?`) into `src/components/modals/TacIdModal.jsx`

**Checkpoint**: Gamification ladder and safe database purge verified.

---

## Phase 7: User Story 5 - Autenticación Multi-Rol y Acceso del Miembro en Móvil (Priority: P3)

**Goal**: Inicio de sesión multi-rol por credenciales y pantalla web móvil responsiva del Miembro mostrando su Carnet Digital Táctico con datos, vigencia, fidelidad y rutina.

**Independent Test**: Iniciar sesión como Miembro en viewport móvil (390px ancho) y verificar presentación del carnet digital con DNI, días restantes con semáforo y rutina asignada.

### Implementation for User Story 5
- [X] T039 [P] [US5] Build tactical login screen (`login_gymadminpro`) with username/password fields, visual theme, role redirect handling, and demo role switcher in `src/pages/Login.jsx`
- [X] T040 [P] [US5] Build Member Mobile view (`dashboard_del_miembro` / Carnet Digital) showing athlete photo, names, DNI, days remaining with chromatic badge, fidelity rank, and assigned routine in `src/pages/member/MemberCard.jsx`
- [X] T041 [US5] Implement responsive mobile navigation bar and logout action in `src/components/common/MobileHeader.jsx`

**Checkpoint**: All 5 user stories functional across desktop and mobile.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Shared layouts, developer tooling, and end-to-end verification

- [X] T042 [P] Implement common tactical desktop header and sidebar navigation for Admin and Reception in `src/components/common/Header.jsx` and `src/components/common/Sidebar.jsx`
- [X] T043 [P] Add seed runner and build scripts to `package.json` (`dev`, `server`, `client`, `db:seed`, `test`, `build`) and verify local run commands
- [X] T044 Run end-to-end quickstart validation guide scenarios from `specs/001-usuarios-y-acceso/quickstart.md` across all user roles

---
