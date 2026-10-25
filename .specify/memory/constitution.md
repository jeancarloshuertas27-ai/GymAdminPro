<!--
SYNC IMPACT REPORT
==================
- Version change: Template inicial -> 1.0.0
- List of modified principles:
  - [PRINCIPLE_1_NAME] -> I. Simplicidad ante todo
  - [PRINCIPLE_2_NAME] -> II. Idioma y mercado local (Perú)
  - [PRINCIPLE_3_NAME] -> III. Cero alcance fantasma (Zero Scope Creep)
  - [PRINCIPLE_4_NAME] -> IV. Verificable por personas no técnicas
  - [PRINCIPLE_5_NAME] -> V. Datos del usuario y recursos con respeto
- Added sections: Ninguna
- Removed sections:
  - [SECTION_2_NAME]
  - [SECTION_3_NAME]
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

## Governance

Esta constitución define las reglas inquebrantables de desarrollo y gobernanza para GymAdminPro:
- **Cumplimiento**: Todo cambio, especificación, plan de arquitectura y pull request DEBE verificarse contra estos principios antes de su aprobación e implementación.
- **Procedimiento de Enmiendas**: Cualquier modificación a los principios requiere justificación explícita, documentación y aprobación formal.
- **Política de Versionado**: Sigue Versionado Semántico estricto (MAJOR al modificar o eliminar principios existentes, MINOR al incorporar nuevos principios o secciones, PATCH para correcciones o clarificaciones editoriales).

**Version**: 1.0.0 | **Ratified**: 2026-10-25 | **Last Amended**: 2026-10-25
