# Research & Technical Decisions: Feature 004 — Rutinas Semanales, Alertas de Coach y App del Miembro

**Branch**: `004-rutinas-y-app-miembro`  
**Date**: 2026-11-19  
**Spec**: [spec.md](file:///c:/Users/usuario/mis-proyectos/gymcore/specs/004-rutinas-y-app-miembro/spec.md)

---

## 1. Implementación de Drag & Drop (Configurador de Rutinas)

### Decisión
Utilizar la **API nativa HTML5 Drag and Drop** (`draggable`, `onDragStart`, `onDragOver`, `onDrop`) en el navegador de escritorio (`/admin/rutinas`), combinada con controles táctiles directos (`+` para añadir al día activo y flechas `↑`/`↓` para reordenar) pensados especialmente para la vista móvil del socio (`/miembro/crear-rutina`).

### Alternativas Evaluadas
- **Librerías externas (`@dnd-kit/core`, `react-beautiful-dnd`)**: Añaden peso al bundle, complejidad de configuración en sensores táctiles y requieren dependencias de terceros.
- **Solución elegida (HTML5 nativo + Botones táctiles)**: Cero dependencias externas, máxima ligereza (Principio I: Simplicidad ante todo), y soporte garantizado tanto con mouse en desktop como con toques en pantallas móviles.

---

## 2. Mecanismo de Alertas en Vivo "Llamar Coach"

### Decisión
**HTTP Polling ligero cada 3 segundos** desde los layouts de Recepción (`/recepcion`) y Administración (`/admin`) hacia el endpoint `GET /api/alertas-coach/pendientes`, respaldado por SQLite como única fuente de verdad.

### Justificación
- Cumple con el Principio I (Simplicidad) y VI (Sincronización en SQLite central).
- A diferencia de WebSockets puros, no requiere mantener estados en memoria ni manejar reconexiones complejas en entornos Node con `--watch` o despliegues serverless/proxy.
- Con un intervalo de 3000 ms y una consulta indexada por `estado = 'PENDIENTE'`, la latencia de notificación es imperceptible para una alerta presencial (< 3s) y el consumo de CPU/red es despreciable.
- El miembro en `/miembro` también sondea o consulta su estado activo (`GET /api/alertas-coach/mi-alerta`) para actualizar su tarjeta de estado cuando recepción marca la alerta como atendida.

---

## 3. Aislamiento de Rutinas (Plantillas Globales vs Ajustes Personales vs Rutinas Privadas)

### Decisión
Separar el almacenamiento en 3 niveles relacionales claros en SQLite:
1. **Plantillas Maestras (`rutinas_plantillas`, `rutinas_dias`, `rutinas_ejercicios`)**: Creadas y visibles por Administrador y Recepción para asignar a socios.
2. **Personalización sobre Rutina Asignada (`miembro_rutina_ajustes`)**: Almacena únicamente las sobreescrituras de `series_custom` y `descanso_custom_segundos` por `(usuario_id, rutina_ejercicio_id)`. Así, si un atleta cambia de 4 a 3 series en su celular, no muta la plantilla oficial que usan otros 50 atletas.
3. **Rutinas Privadas del Miembro (`miembro_rutinas_privadas`)**: Tabla aislada indexada estrictamente por `usuario_id`. Los endpoints `/api/rutinas/plantillas` (Admin/Recepción) nunca consultan ni exponen esta tabla, garantizando privacidad absoluta.

---

## 4. Motor de Inteligencia Artificial ("Ayuda con IA")

### Decisión
Implementación híbrida mediante `fetch` nativo de Node.js en el backend (`POST /api/asistente-ia/consultar`):
- **Modo Online (Gemini API)**: Si `process.env.GEMINI_API_KEY` está definida, invoca el endpoint REST de Google Gemini (`gemini-2.5-flash`) enviando un *system prompt* compacto con el catálogo real de las 25 máquinas del gimnasio y la rutina activa del atleta.
- **Modo Contingencia (Fallback Local Inteligente)**: Si no existe `GEMINI_API_KEY` o la API falla/excede tiempo de espera (5s), un analizador semántico local basado en reglas responde al instante con equivalencias biomecánicas entre las máquinas #01–#25, rangos de series/repeticiones y tiempos de descanso óptimos, en español de Perú.

### Justificación
- Cero dependencias NPM adicionales (no requiere instalar SDKs pesados si solo usamos `fetch` estándar de Node 18+).
- Garantiza que el usuario nunca reciba un error 500 o pantalla rota durante las pruebas o en entornos offline (Principio IV: Verificable por personas no técnicas).

---

## 5. Control de Publicidad Emergente de Promociones (Sitio Miembro)

### Decisión
- El backend expone en `GET /api/promociones/para-miembro` las promociones donde `activo = 1`, `(fecha_limite IS NULL OR fecha_limite >= DATE('now', 'localtime'))` y `(publico_objetivo = 'TODOS' OR publico_objetivo = nivel_fidelidad_usuario)`.
- El frontend controla la exhibición **una sola vez por sesión de inicio** mediante `sessionStorage` (`gym_promo_shown_<usuarioId>`):
  - Al iniciar sesión en `/miembro`, se limpia dicha clave.
  - Al montar `MemberCard` (dashboard del socio), si hay promociones vigentes y la clave no existe, se muestra el popup publicitario con el botón `'X'`.
  - Al cerrar con `'X'` (o navegar), se registra la clave en `sessionStorage` para evitar que vuelva a interrumpir si regresa a Inicio.
  - Al cerrar sesión, la clave se limpia, por lo que al volver a iniciar sesión la publicidad aparecerá nuevamente mientras la promoción no haya vencido.

---

## 6. Limpieza Visual y Alineación con Stitch

### Decisión
Siguiendo estrictamente las directivas de diseño de Feature 003 y Feature 004:
- Se conserva la paleta oscura táctica (`#10131a` surface, `#1f71ef` primary-container, `#c75302` tertiary-container) y tipografías (`Barlow Condensed`, `Chivo`, `JetBrains Mono`) de `stitch-referencias/004-rutinas-y-app-miembro/`.
- Se omiten deliberadamente todos los textos decorativos sin valor operativo presentes en los HTML brutos (`terminal mode alpha001`, `sys_online: 99.8`, `SOCKET GATEWAY : CONNECTED`, `motor táctico`, `v2.4 HUD`, etc.).
