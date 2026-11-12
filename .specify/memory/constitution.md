<!--
SYNC IMPACT REPORT
==================
- Version change: 1.0.0 -> 1.1.0
- List of modified principles:
  - Added principle: VI. Separación Estricta en 3 Sitios por Rol
- Added sections: Ninguna
- Removed sections: Ninguna
- Follow-up TODOs: Ninguno
-->

# GymAdminPro Constitution

## Core Principles

### I. Simplicidad ante todo
Ante dos soluciones técnicas o de diseño que satisfagan la especificación, se DEBE elegir siempre la más simple. Al tratarse de la versión 1 (MVP), queda estrictamente prohibida la complejidad anticipada, sobrearquitectura o abstracción prematura (principio YAGNI). Todo código debe ser directo, comprensible y estrictamente necesario para la funcionalidad solicitada.

### II. Idioma y mercado local (Perú)
Todo el sistema, incluyendo interfaces web y móviles, textos en pantalla, mensajes del sistema, validaciones y reportes generados en PDF, DEBE estar redactado en español de Perú.
- **Moneda**: La moneda oficial y única en todas las vistas y reportes DEBE ser Soles (`S/`).
- **Documento de identidad**: El documento oficial para la identificación de clientes y usuarios DEBE ser el DNI de 8 dígitos numéricos.

### III. Cero alcance fantasma (Zero Scope Creep)
Queda terminantemente PROHIBIDO implementar cualquier funcionalidad, campo, vista, modal o comportamiento que no esté explícitamente redactado en la especificación (`spec.md`) o presente en las maquetas visuales de `stitch-referencias/`. Si durante el desarrollo surge una nueva idea o necesidad de mejora, esta DEBE proponerse y documentarse antes de iniciar su construcción; nunca debe construirse de forma no autorizada.

### IV. Verificable por personas no técnicas
Cada criterio de aceptación y funcionalidad DEBE ser comprobable de extremo a extremo por un usuario sin conocimientos técnicos interactuando directamente con la aplicación en el navegador o dispositivo móvil. No se considerará completada ninguna tarea que requiera inspeccionar código, consultar bases de datos o ejecutar comandos en consola para validar su éxito.

### V. Datos del usuario y recursos con respeto
El sistema DEBE solicitar y persistir únicamente los datos indispensables para la operación del gimnasio.
- **Liberación de recursos**: Al aprobar un registro en la lista de cambios y aprobaciones, el sistema DEBE eliminar del servidor y base de datos el archivo de imagen del comprobante de transferencia para optimizar espacio, conservando únicamente los metadatos numéricos y referencias para auditoría y reportes.
- **Seguridad**: Queda estrictamente PROHIBIDO introducir credenciales, llaves API, tokens o secretos en el código fuente. Toda configuración sensible DEBE provenir de variables de entorno seguras.

### VI. Separación Estricta en 3 Sitios por Rol
El sistema DEBE presentarse y operar a través de 3 sitios o portales independientes según el rol:
- **(A) Sitio Administrador**: Accesible en Web escritorio y móvil (`/admin`). Destinado a la supervisión global, inventario maestro, tarifas fijas y volátiles, cambios/aprobaciones y control de staff.
- **(B) Sitio Recepción**: Exclusivo para Web escritorio (`/recepcion`). Destinado a la operación ágil de mostrador: control de acceso (check-in con semáforo táctico), venta rápida POS de productos y renovación de membresías con comprobantes.
- **(C) Sitio Miembro**: Exclusivo para Móvil (`/miembro`). Destinado al socio del gimnasio: carnet digital interactivo con QR de acceso, monitoreo de días restantes y rutina asignada.

**Reglas de acceso y persistencia**:
- **Inicio de sesión exclusivo**: Cada portal o sitio cuenta con su propio inicio de sesión exclusivo y DEBE rechazar de inmediato cuentas y credenciales de usuarios que no pertenezcan al rol habilitado para ese sitio.
- **Backend y persistencia unificada en tiempo real**: Los 3 sitios se conectan a la misma API central y a la misma base de datos SQLite compartida, garantizando la actualización instantánea y sincronizada de estados, stock, caja y membresías.

## Governance

Esta constitución define las reglas inquebrantables de desarrollo y gobernanza para GymAdminPro:
- **Cumplimiento**: Todo cambio, especificación, plan de arquitectura y pull request DEBE verificarse contra estos principios antes de su aprobación e implementación.
- **Procedimiento de Enmiendas**: Cualquier modificación a los principios requiere justificación explícita, documentación y aprobación formal.
- **Política de Versionado**: Sigue Versionado Semántico estricto (MAJOR al modificar o eliminar principios existentes, MINOR al incorporar nuevos principios o secciones, PATCH para correcciones o clarificaciones editoriales).

**Version**: 1.1.0 | **Ratified**: 2026-10-25 | **Last Amended**: 2026-11-12
