# GymAdminPro — Memoria Técnica

## 1. Aplicación y Roles
**GymAdminPro** es un sistema de administración de gimnasios estructurado en 3 sitios y roles independientes:
- **(A) Sitio Administrador**: Web escritorio y móvil (`/admin`). Supervisión general, inventario maestro, tarifas y promociones, cambios y aprobaciones financieras, y gestión de personal.
- **(B) Sitio Recepción**: Exclusivo Web escritorio (`/recepcion`). Terminal operativa de mostrador: control de acceso y check-in, punto de venta rápido (POS) y renovación de membresías con validación de pagos.
- **(C) Sitio Miembro**: Exclusivo Móvil (`/miembro`). Portal del atleta: carnet digital interactivo, código QR dinámico de acceso, saldo de vigencia y rutina física asignada.

> **Acceso segregado y base común**: Cada sitio cuenta con su propio inicio de sesión exclusivo que rechaza cuentas de roles no permitidos. Los 3 sitios se conectan a la misma API central y base de datos SQLite compartida para mantener los datos sincronizados en tiempo real.
> Todo el desarrollo debe seguir fielmente el diseño y los archivos `code.html` y `screen.png` ubicados en la carpeta `stitch-referencias/`.

## 2. Stack Tecnológico y Decisiones
- **Frontend**: React con Vite y Tailwind CSS, estructurado para servir los 3 portales independientes por rol (Admin, Recepción y Miembro).
- **Backend / Persistencia**: API REST en Node.js con base de datos SQLite compartida (`server/gymcore.db`).
- **Autenticación**: Inicio de sesión desacoplado por portal con validación estricta de rol por endpoint/vista y tokens portadores (`Bearer`).
- **Lineamientos**: Simplicidad ante todo (MVP v1 sin sobreingeniería), español de Perú (moneda Soles `S/`, DNI de 8 dígitos).

## 3. Estructura y Ejecución en Local
- **Instalar dependencias**: `npm install`
- **Iniciar entorno local completo**: `npm run dev`
  - Inicia concurrentemente el servidor backend SQLite con auto-reload (`node --watch server/server.js` en `http://localhost:3001`) y el servidor frontend Vite (`http://localhost:5173`).
  - Los 3 portales operan de manera independiente a través de sus URLs y accesos dedicados:
    - **Sitio Administrador**: `http://localhost:5173/admin` (Login exclusivo para Administrador)
    - **Sitio Recepción**: `http://localhost:5173/recepcion` (Login exclusivo para Recepción)
    - **Sitio Miembro**: `http://localhost:5173/miembro` (Login exclusivo para Miembro / Carnet Móvil)
    - **Selector Táctico de Portales**: `http://localhost:5173/` (Landing de selección rápida de portal)
- **Ejecutar tests**: `npm test`
- **Compilación / Build**: `npm run build`

## 4. Convenciones y Flujo Git
- **Ramas de trabajo**: Derivadas de `main` siguiendo la nomenclatura `NNN-nombre-feature`.
- **Regla de cierre de feature**:
Cuando te pida "cerrar la feature", ejecuta: verificar el working tree y commitear los cambios pendientes; correr tests (parar si fallan); hacer checkout de main; fusionar la rama de la feature con --no-ff y el mensaje "Merge feature NNN: <nombre>"; borrar la rama local y la rama remota correspondiente; subir main al remoto; y mostrar git log --oneline --graph -10. Si el push falla, informar el error y dejar claro qué pasos sí se completaron.

Las reglas de producto viven en .specify/memory/constitution.md y el estado del producto en specs/README.md
