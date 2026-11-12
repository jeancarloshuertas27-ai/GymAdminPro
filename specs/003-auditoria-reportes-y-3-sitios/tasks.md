# Tasks: 003 - Auditoría, Reportes PDF y Separación en 3 Sitios

**Input**: Design documents from `/specs/003-auditoria-reportes-y-3-sitios/`  
**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)  
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description with file path`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`, `[US4]`, `[US5]`, `[US6]`, `[US7]`)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency setup and schema preparation

- [ ] T001 Install `jspdf` and `jspdf-autotable` in package.json for client-side PDF compiling
- [ ] T002 [P] Update database schema in server/schema.sql to include historical textual snapshots (`atleta_nombre_historico`, `atleta_dni_historico`, `operador_nombre_historico`) and `ON DELETE SET NULL` constraints
- [ ] T003 [P] Update server/db.js and initialization logic to support updated constraints and safe cascades on server/gymcore.db

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core routing, authentication isolation, and multi-portal foundation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Implement multi-portal session isolation in src/context/AuthContext.jsx with segregated storage keys (`gym_admin_session`, `gym_recepcion_session`, `gym_miembro_session`) and role check helpers
- [ ] T005 [P] Implement portal-specific login verification middleware in server/routes/auth.js with strict role rejection for unauthorized portals
- [ ] T006 [P] Create tactical portal selector landing component in src/pages/PortalSelect.jsx for the root route `/` with direct entry cards to `/admin`, `/recepcion` and `/miembro`
- [ ] T007 Refactor central router in src/App.jsx to support sub-routers and layouts for `/admin/*`, `/recepcion/*`, and `/miembro/*`

**Checkpoint**: Foundation ready - user story implementation can now begin in priority order

---

## Phase 3: User Story 1 - Separación Limpia y Login Exclusivo en 3 Sitios (Priority: P1) 🎯 MVP

**Goal**: Establish 3 segregated sites (`/admin`, `/recepcion`, `/miembro`) with dedicated logins that reject accounts of other roles while connecting to the shared SQLite database.

**Independent Test**: Navigate to `/admin` and attempt login with reception credentials (verify immediate rejection); navigate to `/recepcion` with member credentials (verify rejection); open `/admin` and `/recepcion` in concurrent tabs (verify sessions remain independent).

### Tests for User Story 1
- [ ] T008 [P] [US1] Create integration test in tests/auth-isolation.test.js verifying cross-role login rejection and segregated local storage persistence

### Implementation for User Story 1
- [ ] T009 [P] [US1] Create Admin exclusive login view in src/pages/admin/AdminLogin.jsx rejecting reception and member roles with Peruvian Spanish error alerts
- [ ] T010 [P] [US1] Create Reception exclusive login view in src/pages/reception/ReceptionLogin.jsx rejecting admin and member roles
- [ ] T011 [P] [US1] Create Member exclusive login view in src/pages/member/MemberLogin.jsx rejecting administrative and reception accounts
- [ ] T012 [US1] Implement layout shells src/components/common/AdminLayout.jsx and src/components/common/ReceptionLayout.jsx with dedicated navigation and logout handlers

**Checkpoint**: User Story 1 is fully functional and delivers the core architectural segregation required by Principle VI.

---

## Phase 4: User Story 2 - Experiencia Operativa de Recepción en Mostrador (Priority: P1)

**Goal**: Deliver the receptionist counter interface with tactical Check-in as the default home screen, quick product sales with stock visibility, membership renewal with fidelity filtering, and member creation.

**Independent Test**: Log in at `/recepcion`, verify the default view is Check-in with 8-digit DNI input, perform a quick product sale with stock deduction, and extend a membership verifying promotions are filtered by rank.

### Tests for User Story 2
- [ ] T013 [P] [US2] Create integration test in tests/reception-ops.test.js validating default checkin route, fidelity-filtered promo catalog, and cost price concealment

### Implementation for User Story 2
- [ ] T014 [US2] Configure reception router in src/App.jsx to set src/pages/reception/CheckIn.jsx as default landing screen with tactical DNI input and semaphore feedback
- [ ] T015 [P] [US2] Implement restricted reception navigation in src/components/common/ReceptionSidebar.jsx providing access strictly to Check-in, Membresías, Atletas, Agregar Miembro y Venta Rápida
- [ ] T016 [P] [US2] Update src/pages/reception/AthletesList.jsx to conceal credentials (passwords) and omit user deletion actions
- [ ] T017 [P] [US2] Update src/pages/reception/QuickSales.jsx to render out-of-stock items as translucent with "AGOTADO" badge, block selling stock 0, and hide private cost prices
- [ ] T018 [US2] Update src/components/modals/AddTimeModal.jsx to filter active promotions strictly according to the athlete's fidelity rank or 'TODOS'

**Checkpoint**: User Story 2 delivers the counter workstation for reception staff.

---

## Phase 5: User Story 3 - Dashboard Principal del Administrador en Tiempo Real (Priority: P1)

**Goal**: Provide the executive Bento Grid Dashboard in `/admin/dashboard` showing real-time revenue in Soles (`S/`), active members with <10d alerts, critical stock warnings (<5 u. or 0 u.), integrated tactical Check-in, and pending transfer approvals, strictly puriging fictional Stitch telemetry.

**Independent Test**: Log in at `/admin`, verify Bento cards for Ingresos del Día (split memberships vs products in S/), Atletas Activos, Stock Crítico (<5 u.), integrated Check-in, and pending transfers widget linking to Approvals.

### Tests for User Story 3
- [ ] T019 [P] [US3] Create unit and contract tests in tests/dashboard-metrics.test.js for `GET /api/reportes/dashboard` validating aggregate calculations

### Implementation for User Story 3
- [ ] T020 [P] [US3] Implement `getDashboardMetrics()` service in server/services/reporteService.js computing today's gross revenue split, active athletes with <10d warning, critical inventory items, and pending transfers
- [ ] T021 [P] [US3] Implement `GET /api/reportes/dashboard` endpoint in server/routes/reportes.js protected by admin authorization
- [ ] T022 [US3] Build Bento Grid Dashboard component in src/components/admin/AdminDashboard.jsx faithful to stitch-referencias/003-auditoria-y-reportes/admin_dashboard_principal/, removing `terminal mode aplha001`, `sys_online: 99.8`, `auditoria: en linea`, `capacidad actual`, `estado de torniquetes`, `curva de afluencia horaria`, `audit_log_stream`, `exportar corte de caja`, `nueva venta rapida`
- [ ] T023 [US3] Connect Dashboard view in src/pages/admin/DashboardPage.jsx with real-time polling or refresh on transaction

**Checkpoint**: User Story 3 delivers the clean executive dashboard for the gym owner.

---

## Phase 6: User Story 4 - Auditoría de Pagos en 2 Columnas Maestras y Aceptación con Purga de Fotos (Priority: P1)

**Goal**: Implement the twin parallel column audit view ("Cambios en Membresías" and "Venta de Productos") with high-resolution voucher zoom viewer and the "ACEPTAR CAMBIO" action that physically unlinks the image file from server disk (Principio V) and hides the card while preserving accounting records.

**Independent Test**: Register a membership renewal and product sale via transfer, navigate to `/admin/aprobaciones`, inspect voucher with zoom viewer, click "ACEPTAR CAMBIO" and verify card disappears, file is deleted from `uploads/vouchers/`, and financial data remains in DB.

### Tests for User Story 4
- [ ] T024 [P] [US4] Create unit test in tests/approvals-purge.test.js verifying that `POST /api/aprobaciones/:tipo/:id/aprobar` deletes the physical voucher file from disk and updates DB state to `APROBADO`

### Implementation for User Story 4
- [ ] T025 [US4] Update server/services/aprobacionService.js and server/routes/aprobaciones.js to return twin parallel arrays (`membresias` and `productos`) and ensure `unlinkVoucherFile` physically removes images upon approval
- [ ] T026 [P] [US4] Build twin parallel audit columns in src/components/admin/ApprovalsList.jsx based on stitch-referencias/003-auditoria-y-reportes/admin_lista_de_cambios_y_aprobaciones_2/ removing fictional telemetry (`terminal alpha`, `sys_online`, `protocolo de reconciliacion`)
- [ ] T027 [P] [US4] Create Forensic Voucher Viewer modal in src/components/modals/VoucherModal.jsx with zoom controls (+ / - / reset) and high-resolution rendering
- [ ] T028 [US4] Implement "ACEPTAR CAMBIO" action handler in src/pages/admin/ApprovalsPage.jsx with smooth transition, immediate card removal from view, and toast feedback

**Checkpoint**: User Story 4 delivers financial reconciliation and compliance with Principle V (Resource respect).

---

## Phase 7: User Story 5 - Generación y Descarga del Reporte Consolidado en PDF (Priority: P2)

**Goal**: Provide a prominent floating button "GENERAR REPORTE" in `/admin/aprobaciones` opening a daily summary modal with optional date selector, compiling and downloading an official PDF titled `REPORTE <FECHA>.pdf` with 4 fiscal blocks.

**Independent Test**: Click "GENERAR REPORTE", select a date, click "DESCARGAR 'REPORTE_<FECHA>.pdf'", and verify the downloaded PDF opens with: (a) memberships revenue in S/, (b) new users registered, (c) products revenue in S/, and (d) table of products sold with quantities, unit prices, and subtotals.

### Tests for User Story 5
- [ ] T029 [P] [US5] Create unit test in tests/daily-report.test.js for `GET /api/reportes/diario` verifying aggregation of memberships, new members count/details, product revenue, and products sold breakdown

### Implementation for User Story 5
- [ ] T030 [P] [US5] Implement `getDailyReportSummary(fecha)` in server/services/reporteService.js querying SQLite for the 4 mandatory blocks by date
- [ ] T031 [P] [US5] Implement `GET /api/reportes/diario` endpoint in server/routes/reportes.js accepting optional `fecha` query parameter
- [ ] T032 [US5] Build client-side PDF compilation utility in src/utils/generateReportPdf.js using `jspdf` and `jspdf-autotable` formatting output in Peruvian Spanish, Soles (`S/`), and filename `REPORTE <FECHA>.pdf`
- [ ] T033 [US5] Implement floating action button and preview modal in src/components/admin/ReportPdfModal.jsx integrated into src/pages/admin/ApprovalsPage.jsx

**Checkpoint**: User Story 5 provides official PDF reporting for daily shifts and fiscal audits.

---

## Phase 8: User Story 6 - Gestión Administrativa de Usuarios y Depuración de Inactivos > 1 Mes (Priority: P2)

**Goal**: Display visible usernames and passwords/PINs in `/admin/usuarios` for administrative customer support, and provide an active "Eliminar Usuario Inactivo" button strictly for members whose membership expired > 30 days ago without subsequent renewals to perform a physical Hard Delete.

**Independent Test**: Log in at `/admin/usuarios`, check that usernames and passwords are displayed; locate a member expired > 30 days and confirm "Eliminar Usuario Inactivo" performs a hard delete from SQLite; verify active or recently expired members have delete button disabled.

### Tests for User Story 6
- [ ] T034 [P] [US6] Create unit test in tests/inactive-user-delete.test.js testing `DELETE /api/users/:id/inactivo` (rejecting members expired < 30 days and deleting members expired > 30 days while preserving historic textual references)

### Implementation for User Story 6
- [ ] T035 [P] [US6] Update server/routes/users.js to expose credentials for admin requests and calculate `puede_eliminar_inactivo` flag (true only if expired > 30 days without newer memberships)
- [ ] T036 [P] [US6] Implement `DELETE /api/users/:id/inactivo` endpoint in server/routes/users.js to execute physical Hard Delete of the user record
- [ ] T037 [US6] Update src/pages/admin/UserRoster.jsx to display credentials columns and the "Eliminar Usuario Inactivo" red action button enabled strictly for eligible inactive members

**Checkpoint**: User Story 6 delivers complete user administration and safe inactive member purge.

---

## Phase 9: User Story 7 - Sitio Miembro Móvil y Preparación de Módulos Futuros (Priority: P3)

**Goal**: Deliver the Member Mobile Portal in `/miembro` presenting an interactive digital card with dynamic access QR, days remaining, fidelity rank badge, eligible promotions, and prepared bottom navigation for routines and coach call.

**Independent Test**: Navigate to `/miembro` on desktop and verify vertical centered smartphone mockup; navigate on mobile viewport and verify 100% full-width adaptation; inspect QR code, days remaining, fidelity points, and bottom navigation tabs.

### Implementation for User Story 7
- [ ] T038 [US7] Create Member responsive layout shell in src/components/common/MemberLayout.jsx featuring a vertical centered smartphone mockup on desktop screens and 100% viewport adaptation on mobile touchscreens
- [ ] T039 [P] [US7] Update src/pages/member/MemberCard.jsx to render interactive digital membership card, dynamic access QR, remaining days counter, fidelity badge with points, and rank-filtered active promotions
- [ ] T040 [P] [US7] Implement bottom tactical navigation bar in src/components/member/MemberNav.jsx with tabs for "Carnet", "Promociones", "Mi Rutina", and "Llamar Coach" (preparing architecture for Feature 004)

**Checkpoint**: User Story 7 delivers the dedicated mobile athlete portal.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: System integration, single-command validation, cleanup, and end-to-end verification

- [ ] T041 [P] Verify and update package.json dev scripts ensuring `npm run dev` boots Express backend (port 3001) and Vite frontend (port 5173) cleanly in a single command
- [ ] T042 [P] Remove any lingering debug logs or fictional telemetry references across all components
- [ ] T043 Execute full automated test suite with `npm test` verifying 100% passing tests
- [ ] T044 Execute and validate all 6 scenarios in specs/003-auditoria-reportes-y-3-sitios/quickstart.md directly in browser

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: Can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 completion. **BLOCKS all user stories**.
- **Phase 3 (User Story 1 - MVP)**: Depends on Phase 2. Delivers segregated 3-site access.
- **Phase 4 (User Story 2 - Recepción)**: Depends on Phase 2 & Phase 3.
- **Phase 5 (User Story 3 - Dashboard Admin)**: Depends on Phase 2 & Phase 3.
- **Phase 6 (User Story 4 - Auditoría & Purga)**: Depends on Phase 2 & Phase 3.
- **Phase 7 (User Story 5 - Reporte PDF)**: Depends on Phase 6 (Approvals).
- **Phase 8 (User Story 6 - Usuarios & Hard Delete)**: Depends on Phase 2 & Phase 3.
- **Phase 9 (User Story 7 - Sitio Miembro)**: Depends on Phase 2 & Phase 3.
- **Phase 10 (Polish)**: Depends on all user stories completion.

### Parallel Opportunities
- In Phase 1: `T002` and `T003` can execute in parallel.
- In Phase 2: `T005` and `T006` can execute in parallel with `T004`.
- In Phase 3 (US1): `T008`, `T009`, `T010`, `T011` can execute in parallel.
- In Phase 4 (US2): `T013`, `T015`, `T016`, `T017` can execute in parallel.
- In Phase 5 (US3): `T019`, `T020`, `T021` can execute in parallel.
- In Phase 6 (US4): `T024`, `T026`, `T027` can execute in parallel.
- In Phase 7 (US5): `T029`, `T030`, `T031` can execute in parallel.
- In Phase 8 (US6): `T034`, `T035`, `T036` can execute in parallel.
- In Phase 9 (US7): `T039` and `T040` can execute in parallel.

---

## Implementation Strategy (MVP First)

1. **Phase 1 + Phase 2**: Build foundational shared session isolation and central sub-routing.
2. **Phase 3 (User Story 1)**: Deploy MVP: 3 independent sites accessible via dedicated URLs (`/admin`, `/recepcion`, `/miembro`) with role-locked logins and multi-tab session isolation.
3. **Phase 4 + Phase 5 + Phase 6**: Deliver reception counter operations, the clean Admin Dashboard, and twin-column financial approvals with physical voucher destruction.
4. **Phase 7 + Phase 8 + Phase 9**: Add client-side PDF consolidated reporting, admin user management with hard delete of inactive members, and mobile member interface.
5. **Phase 10**: Polish and end-to-end verification using `quickstart.md`.
