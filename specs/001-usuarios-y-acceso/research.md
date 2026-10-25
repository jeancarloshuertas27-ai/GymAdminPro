# Research & Technical Decisions: Módulo 001 - Usuarios, Roles, Fidelidad y Control de Acceso

**Feature**: `001-usuarios-y-acceso`  
**Date**: 2026-10-25  
**Status**: Completed  

---

## Decision 1: Stack Frontend y Renderizado Fiel a Maquetas Stitch

- **Decisión**: Utilizar **React 18/19 con Vite** y **Tailwind CSS**, integrando la paleta de tokens y tipografías del tema **Kinetic Obsidian** definido en `stitch-referencias/kinetic_obsidian/DESIGN.md`.
- **Racionalidad**: 
  - Cumple directamente con AGENTS.md y la constitución (MVP v1 sin sobreingeniería).
  - Vite ofrece arranque instantáneo y Hot Module Replacement (HMR).
  - Tailwind CSS permite portar con fidelidad 1:1 las clases utilitarias, colores (`surface-container-*`, `primary-container`, `tertiary-container`, `error-container`), fuentes (`Barlow Condensed`, `Chivo`, `JetBrains Mono`) y símbolos de Google Material Symbols ya testeados en los archivos `code.html` del prototipo Stitch.
- **Alternativas consideradas**:
  - *Next.js / SSR*: Descartado por sobrecomplejidad innecesaria para un sistema de gestión local y POS de recepción (viola Principio I: Simplicidad ante todo).
  - *UI Libraries (MUI / Ant Design)*: Descartadas porque alterarían el diseño obsidian táctico exacto especificado en las maquetas.

---

## Decision 2: Arquitectura Backend y Persistencia en SQLite

- **Decisión**: Implementar un servidor HTTP ligero en **Node.js con Express** y el controlador nativo **`better-sqlite3`**, organizado en una estructura simple (`server/`) que se ejecuta en paralelo con el frontend de Vite mediante `npm run dev` (usando `concurrently`).
- **Racionalidad**:
  - `better-sqlite3` es síncrono, extraordinariamente rápido para lectura y escritura en disco local, confiable y con cero dependencias de servicios externos o configuración de bases de datos de red.
  - El archivo de base de datos `gymcore.db` se aloja localmente en el servidor, ignorado en `.gitignore` para seguridad y privacidad.
  - Una API REST simple expone los endpoints necesarios (`/api/auth`, `/api/users`, `/api/checkin`) para las operaciones de recepción y administración.
- **Alternativas consideradas**:
  - *ORMs pesados (Prisma / TypeORM)*: Descartados por sobrecarga de abstracción en v1. Consultas SQL preparadas (`db.prepare(...)`) son directas, legibles y fáciles de auditar.
  - *PostgreSQL / MySQL*: Descartados por requerir instalación y configuración de servicios de base de datos independientes, violando la regla de simplicidad técnica de AGENTS.md.

---

## Decision 3: Autenticación, Sesión y Control de Acceso Multi-Rol

- **Decisión**: Autenticación basada en sesiones locales simples o tokens JWT ligeros con cookies httpOnly o cabecera `Authorization`, gestionando 3 roles estrictos: `ADMINISTRADOR`, `RECEPCIONISTA` y `MIEMBRO`.
- **Racionalidad**:
  - Permite redirigir de forma automática según el rol tras el login (Administrador → `/admin/usuarios`, Recepcionista → `/recepcion/checkin`, Miembro → `/miembro/carnet`).
  - El backend aplica middleware de autorización (`requireRole(['ADMINISTRADOR'])`) para proteger endpoints sensibles como la visualización de contraseñas, alta de recepcionistas y eliminación física de usuarios.
  - Las contraseñas se almacenan con hash criptográfico mediante `bcryptjs` o `argon2`, nunca en texto plano.
- **Alternativas consideradas**:
  - *Servicios externos (Auth0 / Firebase Auth / Supabase)*: Descartados por dependencia de internet y complejidad innecesaria para operación local de gimnasio.

---

## Decision 4: Almacenamiento Local de Vouchers y Fotos

- **Decisión**: Guardar los archivos de imágenes (comprobantes de transferencia y fotos de perfil opcionales) en el sistema de archivos local del servidor (`uploads/vouchers/` y `uploads/photos/`) mediante `multer`, almacenando en SQLite únicamente la ruta relativa del archivo y metadatos del pago.
- **Racionalidad**:
  - Mantiene ligera la base de datos SQLite sin almacenar BLOBs pesados.
  - Facilita el cumplimiento estricto del **Principio V de la Constitución**: cuando se apruebe una operación en la lista de cambios (Módulo 003), la imagen del voucher en `uploads/vouchers/` podrá eliminarse del disco de forma atómica y segura mediante `fs.unlinkSync()`, conservando el registro numérico en la base de datos.
- **Alternativas consideradas**:
  - *Cloud storage (AWS S3 / Cloudinary)*: Descartado por requerir llaves de acceso, costos recurrentes y conectividad externa en v1.

---

## Decision 5: Motor Determinista de Fidelidad y Cálculo de Tiempos

- **Decisión**: Implementar una función determinista en JavaScript (`calculateFidelity(startDate, renewalHistory, now)`) que calcule los meses de permanencia continua y aplique la regla de penalización: si la membresía caducó hace más de 14 días corridos sin pago, el nivel se restablece automáticamente a `NOVATO`.
- **Racionalidad**:
  - La lógica es 100% testeable mediante pruebas unitarias en `Vitest` o `Jest`.
  - El formateador de tiempo genera las cadenas exactas requeridas por la especificación: `"X meses y Y días restantes"`, asignando el semáforo cromático correspondiente (Rojo <10d, Naranja 10d a 1m, Verde >1m).
- **Alternativas consideradas**:
  - *Cálculo manual por parte del operador*: Descartado por propenso a errores humanos y falta de consistencia.

