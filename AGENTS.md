# GymAdminPro — Memoria Técnica

## 1. Aplicación y Roles
**GymAdminPro** es un sistema de administración de gimnasios con 3 roles:
- **Administrador**: Web y Móvil.
- **Recepcionista**: Web.
- **Miembro**: Móvil.

> Todo el desarrollo debe seguir fielmente el diseño y los archivos `code.html` y `screen.png` ubicados en la carpeta `stitch-referencias/`.

## 2. Stack Tecnológico y Decisiones
- **Frontend**: React con Vite y Tailwind CSS.
- **Backend / Persistencia**: SQLite.
- **Lineamientos**: Simplicidad ante todo (MVP v1 sin sobreingeniería), español de Perú (moneda Soles `S/`, DNI de 8 dígitos).

## 3. Ejecución y Pruebas en Local
- **Instalar dependencias**: `npm install`
- **Iniciar entorno local**: `npm run dev`
- **Ejecutar tests**: `npm test`
- **Compilación / Build**: `npm run build`

## 4. Convenciones y Flujo Git
- **Ramas de trabajo**: Derivadas de `main` siguiendo la nomenclatura `NNN-nombre-feature`.
- **Regla de cierre de feature**:
Cuando te pida "cerrar la feature", ejecuta: verificar el working tree y commitear los cambios pendientes; correr tests (parar si fallan); hacer checkout de main; fusionar la rama de la feature con --no-ff y el mensaje "Merge feature NNN: <nombre>"; borrar la rama local y la rama remota correspondiente; subir main al remoto; y mostrar git log --oneline --graph -10. Si el push falla, informar el error y dejar claro qué pasos sí se completaron.

Las reglas de producto viven en .specify/memory/constitution.md y el estado del producto en specs/README.md
