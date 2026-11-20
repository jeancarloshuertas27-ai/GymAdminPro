# Feature Specification: 004 - Rutinas Semanales, Alertas de Coach y App del Miembro

**Feature Branch**: `004-rutinas-y-app-miembro`  
**Created**: 2026-11-12  
**Status**: Clarified  
**Input**: Requisitos de configuración semanal de rutinas mediante Drag & Drop (Lunes a Sábado con series, repeticiones y descanso modal) y asignación por DNI para Administrador; asignación de rutinas por DNI y alertas en vivo de 'Llamar Coach' con máquina para Recepción; portal móvil para Miembros con estado de membresía, fidelidad, publicidad emergente de promociones con 'X', visualización y ajuste de series/descanso en rutina asignada, creación de rutinas privadas locales/aisladas, botón 'Llamar Coach' a máquina, y chat con Asistente de IA para entrenamiento. Todo bajo la regla de simplicidad visual absoluta (eliminando textos de relleno técnico, terminal alpha, sys_online y motor táctico).

---

## 1. Objetivo y Contexto de Negocio

La Feature 004 completa el ecosistema operativo y la experiencia de usuario de **GymAdminPro**, dotando al gimnasio de herramientas de entrenamiento personalizado, asistencia presencial en sala y autoservicio para el atleta socio:

1. **Sitio Administrador (`/admin`)**:
   - **Configurador Semanal de Rutinas (Drag & Drop)**: Panel intuitivo con catálogo lateral izquierdo de ejercicios y máquinas numeradas (#01, #02, etc.), y cuadrícula semanal (Lunes a Sábado) en grande. Al arrastrar una máquina a un día, se numera automáticamente de forma secuencial (`1.`, `2.`, `3.`, etc.) y abre de inmediato una ventana modal para parametrizar: series (sets), repeticiones (reps) y tiempo de descanso (segundos). En la esquina inferior derecha, botón destacado "Guardar rutina" que abre un modal solicitando el nombre de la rutina con botón "Aceptar" condicionado (se habilita solo si hay texto) para persistir la plantilla en SQLite.
   - **Manejar Rutinas (Asignación Directa)**: Buscador por DNI (8 dígitos) que muestra Nombre, Apellido, DNI, rutina asignada con formato exacto `rutina: <nombre de rutina>` y botón "Modificar rutina" con menú desplegable (`<select>`) de plantillas existentes para actualizar al socio al instante.

2. **Sitio Recepción (`/recepcion`)**:
   - **Manejar Rutinas**: Misma funcionalidad de búsqueda por DNI y asignación rápida mediante lista desplegable de rutinas preconfiguradas para soporte ágil en mostrador.
   - **Alerta en Vivo de "Llamar Coach"**: Banner/notificación prominente en la pantalla principal (y en Admin) ante solicitudes de auxilio de atletas en sala, indicando el nombre del socio y el número de máquina/estación donde se ubica, para que el personal de recepción dé aviso verbal inmediato al entrenador de piso, con botón interactivo para marcar como "Atendida / Cerrar alerta".

3. **Sitio Miembro (`/miembro` - Exclusivo Móvil)**:
   - **Dashboard del Socio**: Consulta en tiempo real de días restantes de membresía, nivel de fidelidad gamificado (Novato, Principiante, Promedio, Mutando, Mamado/a, Animal) y botón "Renovar membresía" con catálogo de promociones vigentes.
   - **Publicidad Emergente de Promociones**: Al entrar al portal, si existen promociones activas aplicables a todos o a su rango de fidelidad, se despliega un popup publicitario con botón de cierre directo `'X'`.
   - **Mi Rutina Asignada**: Visualización por días (Lunes a Sábado) con enfoque muscular (Push, Pull, Legs, etc.), secuencia ordenada de ejercicios numerados, y capacidad de ajustar las series y tiempos de descanso para su sesión.
   - **Crear Rutina Personal Privada**: Vista interactiva para armar rutinas personalizadas por días, series, repeticiones y descansos, con aislamiento total: estos datos son privados del miembro y no se mezclan con las plantillas globales del gimnasio.
   - **Llamar Coach a mi Máquina**: Botón de asistencia rápida donde el socio digita o selecciona su máquina actual y notifica a Recepción y Administración.
   - **Asistente de Entrenamiento con IA**: Ventana de chat interactiva que responde dudas de postura, técnica, sustitución de máquinas ocupadas y tiempos de descanso.

4. **Regla de Simplicidad Visual (Cero Ruido)**:
   - Se prohíbe terminantemente incluir textos ficticios o crípticos del tipo `terminal mode alpha001`, `sys_online: 99.8`, `motor táctico`, `node terminal alpha` o indicadores pseudo-militares. La interfaz debe presentar exclusivamente datos funcionales limpios, legibles y de valor real para el usuario humano.

---

## Clarifications

### Session 2026-11-12
- **Q1 (Motor de IA para "Ayuda con IA")**: ¿Cómo debe integrarse el asistente inteligente de entrenamiento?  
  → **A**: **Google Gemini API con Fallback Local Deportivo**. Se conecta a la API de Google Gemini en el backend mediante `GEMINI_API_KEY`. Si la llave no está configurada o se interrumpe la conexión externa, el sistema responde de forma instantánea mediante un motor local de contingencia entrenado con el inventario de máquinas, ejercicios y biomecánica deportiva del gimnasio.
- **Q2 (Frecuencia y Vigencia de la Publicidad de Promociones)**: ¿Cuándo y con qué vigencia aparece la publicidad emergente en el celular del miembro?  
  → **A**: **Una vez por inicio de sesión y filtrada por fecha límite**. La publicidad se muestra únicamente al iniciar sesión un miembro. Si el socio navega a otras vistas de su portal y regresa al inicio, la publicidad no se repite durante esa misma sesión. Si cierra sesión y vuelve a ingresar, vuelve a desplegarse siempre que la promoción se encuentre dentro de su rango de fecha límite (`fecha_limite`), parámetro configurable por el Administrador.
- **Q3 (Mecanismo de Alertas en Tiempo Real para 'Llamar Coach')**: ¿Cómo se propagan las alertas a Recepción y Admin?  
  → **A**: **HTTP Polling ligero cada 2 segundos**. Recepción y el Dashboard Admin realizan un sondeo liviano cada 2 segundos a la API SQLite, asegurando entrega inmediata (<= 2s) de la alerta con nombre del socio y número de máquina, sin complejidad innecesaria de sockets y con tolerancia nativa a desconexiones (Principio I).

### Session 2026-11-19
- **Q4 (Alternancia entre Rutina Asignada y Rutina Privada)**: ¿Cómo debe visualizar y alternar el atleta en su portal móvil cuando cuenta con una rutina oficial asignada por el staff y además ha creado una rutina personal privada?  
  → **A**: **Pestañas superiores (`Rutina Asignada` / `Mi Rutina Privada`)**. La vista de entrenamiento del miembro `/miembro/rutina` presenta un selector de pestañas en la parte superior para alternar de forma limpia e instantánea entre el protocolo prescrito por el entrenador y su propia rutina personal, manteniendo ambos esquemas aislados y accesibles.
- **Q5 (Estado y Cancelación de 'Llamar Coach' en el Miembro)**: ¿Cómo debe visualizar y gestionar el miembro en su teléfono el estado de su solicitud tras presionar "Llamar Coach"?  
  → **A**: **Tarjeta de estado activo con botón "Cancelar solicitud"**. Mientras la solicitud esté pendiente, la pantalla muestra una tarjeta visible ("Coach solicitado en Máquina X...") inhabilitando nuevos envíos para evitar duplicados, y ofreciendo al socio un botón para cancelar la solicitud en caso de error o resolución anticipada.
- **Q6 (Catálogo Inicial de Máquinas y Ejercicios)**: ¿Cómo debe inicializarse el catálogo de ejercicios y máquinas numeradas en el sistema para el configurador de rutinas del Administrador y Miembro?  
  → **A**: **Catálogo precargado de 25 máquinas del prototipo**. SQLite inicia con una semilla de 25 estaciones numeradas (#01 a #25) con sus nombres y grupos musculares (Pectoral, Espalda, Cuádriceps, Deltoides, etc.), disponibles de inmediato en la columna izquierda para arrastrar y armar rutinas.

---

## 2. User Scenarios & Testing *(mandatory)*

### User Story 1 - Configurador Semanal de Rutinas (Drag & Drop) y Asignación por DNI (Priority: P1)

**Como** Administrador del gimnasio,  
**quiero** diseñar rutinas de entrenamiento arrastrando máquinas numeradas hacia los días de la semana (Lunes a Sábado), configurando series, repeticiones y descansos en un modal emergente, y asignarlas a los atletas mediante su DNI,  
**para** estandarizar los protocolos de entrenamiento del gimnasio y desplegarlos rápidamente a cualquier miembro.

- **Por qué esta prioridad**: Es el núcleo de la gestión de rutinas para el gimnasio y la base de datos que consumirá el portal del miembro.
- **Prueba Independiente**: Ingresar a `/admin/rutinas`, arrastrar "Máquina 8 - Press Banca Smith" hacia el día "Lunes", verificar que tome la numeración "1.", configurar 4 series, 10-12 reps y 90s de descanso en el modal emergente; luego presionar "Guardar rutina", ingresar el nombre "Protocolo Hipertrofia 5 Días" y guardar. Posteriormente, buscar un atleta por su DNI (ej: `72849102`), ver `rutina: Protocolo Hipertrofia 5 Días` y reasignar otra plantilla desde el desplegable.

**Acceptance Scenarios**:
1. **Given** el panel de configuración de rutinas en `/admin`, **When** se visualiza la pantalla, **Then** a la izquierda aparece la lista de ejercicios y máquinas numeradas (`Máquina 1`, `Máquina 2`, etc.), y a la derecha se exhiben los 6 días de la semana (Lunes, Martes, Miércoles, Jueves, Viernes, Sábado) con sus respectivas zonas de soltado (drop zones).
2. **Given** una máquina del catálogo izquierdo, **When** el Administrador la arrastra y suelta dentro del contenedor de un día específico, **Then** el ejercicio se posiciona automáticamente con el prefijo numérico correspondiente al orden en que fue soltado (`1.`, `2.`, `3.`, etc.).
3. **Given** que se acaba de soltar una máquina en un día, **When** el evento de soltado finaliza, **Then** se abre automáticamente una ventana emergente modal que solicita: (a) Cantidad de series, (b) Repeticiones y (c) Tiempo de descanso en segundos, actualizando la tarjeta del ejercicio al confirmar.
4. **Given** la rutina en edición, **When** el Administrador hace clic en el botón "Guardar rutina" ubicado en la esquina inferior derecha, **Then** se abre una ventana emergente solicitando el "Nombre de la rutina" con un botón "Aceptar" que se encuentra deshabilitado inicialmente y solo se habilita al ingresar al menos un caracter válido.
5. **Given** el modal de guardar rutina con nombre completado, **When** se presiona "Aceptar", **Then** la rutina se persiste en SQLite, el modal se cierra y la nueva rutina queda disponible de inmediato en la lista desplegable de asignaciones.
6. **Given** el módulo "Manejar Rutinas", **When** el Administrador digita los 8 dígitos del DNI de un atleta y presiona buscar, **Then** se muestran Nombre y Apellido, DNI, la rutina actual con el texto exacto `rutina: <nombre de rutina>` y el botón "Modificar rutina" junto a la lista desplegable de plantillas guardadas.
7. **Given** un atleta consultado en "Manejar Rutinas", **When** el Administrador selecciona una rutina diferente del menú desplegable y confirma "Modificar rutina", **Then** el cambio se registra inmediatamente en la base de datos y se actualiza la etiqueta visible.

---

### User Story 2 - Soporte de Rutinas y Alerta en Vivo "Llamar Coach" en Recepción (Priority: P1)

**Como** Recepcionista en el mostrador del gimnasio,  
**quiero** asignar rutinas preconfiguradas buscando a los socios por su DNI y recibir alertas visuales prominentes en tiempo real cuando un atleta solicite ayuda desde su máquina,  
**para** brindar soporte rápido en mostrador y avisar verbalmente al coach que se encuentra en la sala de entrenamiento.

- **Por qué esta prioridad**: Conecta operativamente la solicitud física del socio con el mostrador del gimnasio y asegura la atención presencial inmediata sin fricción.
- **Prueba Independiente**: Iniciar sesión en `/recepcion`, verificar la pestaña de "Manejar Rutinas" con búsqueda por DNI y asignación desplegable; luego, simular una solicitud de coach desde el portal del miembro para "Máquina #04" y verificar que aparezca la alerta prominente en la pantalla de recepción con el botón para cerrarla/atenderla.

**Acceptance Scenarios**:
1. **Given** la interfaz de Recepción en `/recepcion`, **When** el recepcionista accede a "Manejar Rutinas", **Then** dispone del buscador por DNI idéntico al del Administrador, mostrando Nombre, Apellido, DNI, `rutina: <nombre>` y el botón "Modificar rutina" con el `<select>` de rutinas preconfiguradas.
2. **Given** que un miembro presiona "Llamar Coach" desde su app indicando su máquina, **When** la solicitud llega al backend, **Then** en la pantalla principal de Recepción (y en el Dashboard Admin) aparece de forma inmediata una alerta/notificación destacada (con sonido o animación sutil no invasiva) mostrando: Nombre del atleta y Número de máquina donde se encuentra.
3. **Given** la alerta visible de "Llamar Coach" en Recepción, **When** el recepcionista avisa al coach en sala y pulsa el botón "Marcar como Atendida" (o cerrar alerta), **Then** la alerta desaparece de la pantalla y queda registrada como resuelta en la base de datos.
4. **Given** múltiples atletas solicitando coach simultáneamente, **When** se reciben las alertas, **Then** el sistema las apila ordenadas por hora de llegada sin sobreescribir ni bloquear la operativa de check-in o venta de mostrador.

---

### User Story 3 - Portal Móvil del Miembro: Membresía, Fidelidad, Promociones y Llamar Coach (Priority: P1)

**Como** Atleta socio del gimnasio,  
**quiero** ingresar desde mi celular a mi portal móvil `/miembro` para consultar mis días restantes de membresía, ver mi rango de fidelidad, revisar promociones mediante popups emergentes y pulsar un botón para llamar a un coach indicando mi máquina,  
**para** tener autonomía, enterarme de ofertas para mi nivel y recibir asistencia personalizada durante mi entrenamiento sin tener que caminar al mostrador.

- **Por qué esta prioridad**: Entrega la experiencia central para el cliente final en su teléfono móvil y potencia la retención y soporte en sala.
- **Prueba Independiente**: Autenticarse en `/miembro` con credenciales de miembro; verificar que se muestre el contador de días restantes, la insignia de nivel de fidelidad (ej: "Nivel: Mutando") y el botón "Renovar membresía". Verificar que si existe una promoción activa se despliegue un modal emergente que se pueda cerrar con la `'X'`. Presionar "Llamar Coach", ingresar "Máquina 08", pulsar "Enviar Alerta" y verificar la confirmación en pantalla.

**Acceptance Scenarios**:
1. **Given** que el miembro inicia sesión en `/miembro`, **When** carga su pantalla principal móvil, **Then** visualiza con claridad: (a) Días faltantes de membresía activa, (b) Nivel de fidelidad gamificado con su barra de progreso y (c) Botón "Renovar membresía".
2. **Given** que existen promociones vigentes aplicables al miembro (generales o exclusivas para su nivel de fidelidad), **When** el miembro ingresa al portal, **Then** se despliega una ventana publicitaria emergente destacando la oferta, con un botón o ícono `'X'` en la esquina superior derecha que al presionarlo cierra el popup limpiamente sin bloquear la navegación.
3. **Given** que el miembro pulsa el botón "Renovar membresía", **When** se abre la sección de promociones, **Then** se muestran los planes y ofertas disponibles para su categoría con el detalle en Soles (`S/`).
4. **Given** que el socio necesita asistencia en su entrenamiento, **When** presiona el botón destacado "Llamar Coach", **Then** se abre un diálogo solicitando indicar el número de máquina o estación en la que se encuentra (ej. "Máquina 8").
5. **Given** que el socio ingresa su máquina y presiona "Notificar Ayuda", **When** se envía la petición, **Then** el sistema emite la alerta en tiempo real a Recepción y Administración, y la pantalla del socio muestra una tarjeta de estado activo ("Coach solicitado en Máquina X...") inhabilitando nuevos envíos para evitar duplicados y ofreciendo un botón "Cancelar solicitud" que anula la alerta en vivo si el socio decide cancelarla antes de su atención en sala.

---

### User Story 4 - Visualización de Rutina Asignada, Ajuste de Series y Rutina Privada del Miembro (Priority: P2)

**Como** Atleta socio del gimnasio,  
**quiero** consultar los ejercicios asignados para cada día de la semana con su respectivo grupo muscular (Push, Pull, Legs, etc.), ajustar las series y tiempos de descanso para mi jornada, y tener la opción de crear mi propia rutina privada,  
**para** seguir mi entrenamiento con precisión y personalizar mi rutina personal sin que sea alterada por el gimnasio.

- **Por qué esta prioridad**: Otorga flexibilidad deportiva a los atletas avanzados o que requieren adaptaciones específicas en su entrenamiento diario.
- **Prueba Independiente**: En `/miembro/rutina`, consultar la rutina del día asignada por el coach; modificar las series de un ejercicio de 4 a 3 y el descanso de 90s a 60s; luego, ingresar a "Crear Rutina Personal", diseñar un día privado mediante arrastre o selección secuencial, guardarla con un nombre propio y verificar que esta rutina no aparezca en las opciones del Administrador en `/admin`.

**Acceptance Scenarios**:
1. **Given** que el miembro consulta "Mi Rutina", **When** navega por los días de Lunes a Sábado, **Then** visualiza para cada día el tipo de entrenamiento (ej: "LUNES: PUSH", "MARTES: PULL", "MIÉRCOLES: LEGS", etc.) y la lista de ejercicios numerados secuencialmente.
2. **Given** un ejercicio de su rutina asignada, **When** el miembro desea adaptar su esfuerzo, **Then** puede editar directamente el número de series o el tiempo de descanso por serie, persistiendo estos ajustes en su expediente personal de sesión.
3. **Given** la opción "Crear Rutina Personal", **When** el miembro la selecciona, **Then** se presenta una interfaz interactiva adaptada a móvil con selector de días (Lunes a Sábado) y lista de máquinas numeradas para estructurar su entrenamiento con series, repeticiones y descansos.
4. **Given** una rutina creada por el socio en su vista personal, **When** la guarda con su nombre deseado, **Then** el sistema la persiste bajo un esquema privado asociado exclusivamente a su `usuario_id`, garantizando que ni el Administrador ni Recepción la vean ni la puedan sobrescribir en el catálogo global de plantillas del gimnasio.
5. **Given** un miembro que posee tanto una rutina asignada por el staff como una rutina privada creada, **When** accede a la sección de entrenamiento, **Then** dispone de pestañas superiores (`Rutina Asignada` / `Mi Rutina Privada`) para alternar con un solo clic entre ambas sin conflicto de datos.

---

### User Story 5 - Asistente de Entrenamiento con IA para el Miembro (Priority: P3)

**Como** Atleta socio en la sala de pesas,  
**quiero** abrir un chat interactivo con un Asistente de IA para hacer preguntas sobre postura, alternativas de máquinas cuando una esté ocupada o recomendaciones de descanso,  
**para** resolver dudas técnicas inmediatas de entrenamiento sin interrumpir innecesariamente a los demás.

- **Por qué esta prioridad**: Añade un valor innovador y diferenciador de autoservicio para el socio, complementando al coach presencial.
- **Prueba Independiente**: Abrir la pestaña o módulo de "Ayuda con IA" en `/miembro`, escribir "¿Qué ejercicio puedo hacer si la Máquina 8 de Press Banca está ocupada?", y verificar que el asistente responda con recomendaciones claras de máquinas equivalentes (ej. Mancuernas o Máquina Smith), indicando series y descansos sugeridos.

**Acceptance Scenarios**:
1. **Given** que el socio accede a "Ayuda con IA" desde su portal móvil, **When** se despliega la interfaz, **Then** se presenta una vista de chat fluida y limpia, con historial de la conversación activa y campo para enviar mensajes.
2. **Given** una consulta escrita por el socio sobre un ejercicio o máquina del gimnasio, **When** pulsa "Enviar", **Then** el asistente procesa la pregunta y responde en lenguaje natural claro y conciso (en español de Perú), ofreciendo sugerencias biomecánicas, rangos de series/repeticiones o sustitutos disponibles en el gimnasio.
3. **Given** un escenario donde el servidor no tenga conexión a la API externa de IA o falte la llave de configuración, **When** el usuario consulta, **Then** el sistema recurre a un motor local de respuestas especializadas de entrenamiento de contingencia sin mostrar errores técnicos ni fallar.

---

### Edge Cases

- **EC-001 (Soltar ejercicios duplicados en el mismo día)**: Si el usuario arrastra la misma máquina dos veces a un mismo día (ej. para un biserie o ejercicio dividido), el sistema lo permite pero asigna la siguiente posición numérica secuencial (`1.`, `2.`, etc.) con sus propios parámetros de series y descanso.
- **EC-002 (Día sin ejercicios / Día de Descanso - REST)**: Si en la configuración semanal de una rutina no se asignan máquinas para un día específico (ej. Jueves o Domingo), la app del miembro debe mostrar ese día con la etiqueta clara "DÍA DE DESCANSO / REST" en lugar de un error o pantalla vacía.
- **EC-003 (Recepción o Admin sin conexión momentánea durante 'Llamar Coach')**: Si un miembro llama al coach y la conexión del recepcionista se restablece segundos después, el sistema entrega la alerta pendiente sin pérdida de información mediante sondeo o cola de eventos pendientes.
- **EC-004 (Cierre de publicidad emergente)**: Al cerrar la publicidad emergente con la `'X'`, la preferencia de visualización se guarda en la sesión del miembro para no volver a interrumpirlo de forma repetitiva en cada recarga inmediata de la pantalla durante su misma visita.
- **EC-005 (Atleta sin rutina asignada por el staff)**: Si un socio nuevo ingresa a "Mi Rutina" antes de que el staff le haya asignado un protocolo, el sistema muestra un mensaje orientador amable ("Aún no tienes una rutina asignada por tu coach. Puedes solicitar una en recepción o crear tu propia rutina personal aquí") con botón directo a "Crear Rutina Personal".
- **EC-006**: Si el usuario reordena los ejercicios asignados en un día (subir/bajar posición), los prefijos numéricos (`1.`, `2.`, `3.`) se recalculan automáticamente para mantener siempre el orden correlativo estricto.
- **EC-007 (Cancelación de alerta por el propio miembro)**: Si el socio presiona "Cancelar solicitud" desde su celular, el estado de la alerta en SQLite pasa inmediatamente a 'CANCELADA' y la notificación desaparece en tiempo real de las pantallas de Recepción y Administración sin requerir acción del recepcionista.

---

## 3. Requirements *(mandatory)*

### Functional Requirements

#### Bloque A: Sitio Administrador (`/admin`)
- **FR-001**: El sistema DEBE ofrecer en `/admin` una vista de "Configurar Rutinas" con diseño dividido: panel izquierdo con la lista de ejercicios y máquinas numeradas del gimnasio (precargando un catálogo maestro de 25 estaciones #01-#25 con grupos musculares), y panel derecho con la cuadrícula de los 6 días de la semana (Lunes a Sábado).
- **FR-002**: El configurador DEBE soportar interacción Drag & Drop para arrastrar cualquier máquina desde el catálogo hacia el cuadro de cualquier día de la semana.
- **FR-003**: Cada ejercicio arrastrado a un día DEBE numerarse automáticamente en orden secuencial estricto (`1.`, `2.`, `3.`, etc.) según la posición en que sea colocado.
- **FR-004**: Al soltar un ejercicio dentro de un día, el sistema DEBE abrir de forma automática una ventana emergente modal que solicite registrar obligatoriamente: (a) Cantidad de series, (b) Rango de repeticiones y (c) Tiempo de descanso en segundos.
- **FR-005**: El configurador DEBE disponer en la esquina inferior derecha de un botón destacado "Guardar rutina", el cual al ser presionado abre una ventana emergente solicitando el nombre de la rutina.
- **FR-006**: La ventana emergente de nombre de rutina DEBE contener un botón "Aceptar" que permanece inhabilitado y solo se activa cuando el usuario escribe al menos un texto válido; al hacer clic en "Aceptar", la rutina se guarda en la base de datos SQLite y el modal se cierra automáticamente.
- **FR-007**: El sistema DEBE proveer en `/admin` una vista de "Manejar Rutinas" con un buscador por DNI de 8 dígitos numéricos.
- **FR-008**: Al consultar un DNI en "Manejar Rutinas", el sistema DEBE presentar: Nombre y Apellido del socio, número de DNI, la rutina asignada actualmente con el formato exacto `rutina: <nombre de rutina>` y un botón "Modificar rutina" acompañado de una lista desplegable (`<select>`) con todas las rutinas preconfiguradas existentes.
- **FR-009**: Al seleccionar una rutina del menú desplegable y presionar "Modificar rutina", el sistema DEBE actualizar la asignación en la base de datos de manera inmediata.

#### Bloque B: Sitio Recepción (`/recepcion`)
- **FR-010**: El sistema DEBE incluir en `/recepcion` el módulo "Manejar Rutinas" con idénticas capacidades de búsqueda por DNI de 8 dígitos y reasignación mediante lista desplegable de rutinas preconfiguradas.
- **FR-011**: La pantalla principal de Recepción DEBE mostrar una sección o banner de alerta en vivo cuando un socio presione "Llamar Coach" desde su celular.
- **FR-012**: La alerta de "Llamar Coach" DEBE especificar claramente: Nombre completo del miembro y Número de máquina o estación donde se encuentra ubicado.
- **FR-013**: Cada alerta de "Llamar Coach" DEBE contar con un botón interactivo para "Marcar como Atendida" o cerrar la notificación, actualizando su estado en la base de datos compartida para que también se refleje en Administración.

#### Bloque C: Sitio Miembro (`/miembro` - Exclusivo Móvil)
- **FR-014**: La pantalla de inicio de `/miembro` DEBE mostrar en tiempo real los días restantes de membresía, el nivel de fidelidad gamificado alcanzado y el botón destacado "Renovar membresía".
- **FR-015**: Al detectar promociones activas dentro de su fecha límite (`fecha_limite`) y aplicables a su nivel de fidelidad o a todo público, el sistema DEBE desplegar un popup de publicidad emergente en el celular al iniciar sesión. La publicidad solo se mostrará una vez por inicio de sesión (no reaparece al regresar al inicio dentro de la misma sesión; vuelve a aparecer únicamente tras cerrar e iniciar sesión nuevamente) y contará con un botón de cierre `'X'` accesible.
- **FR-016**: El portal DEBE ofrecer la sección "Mi Rutina" mostrando los días asignados de la semana (Lunes a Sábado), el enfoque muscular de cada día (Push, Pull, Legs, etc.) y la secuencia ordenada y numerada de ejercicios.
- **FR-017**: En "Mi Rutina", el miembro DEBE poder ajustar o personalizar la cantidad de series y el tiempo de descanso por serie para cada ejercicio.
- **FR-018**: El miembro DEBE contar con una opción para "Crear Rutina Personal", permitiendo armar una rutina por días (Lunes a Sábado) con máquinas, series, repeticiones y descanso.
- **FR-019**: Las rutinas creadas por el miembro en "Crear Rutina Personal" DEBEN guardarse como privadas vinculadas exclusivamente a su cuenta (`usuario_id`), impidiendo que aparezcan o puedan ser modificadas desde los catálogos globales de Administrador y Recepción.
- **FR-020**: El portal del miembro DEBE incluir la función "Llamar Coach" (con selector de máquina y notificación). Mientras la solicitud se encuentre en estado pendiente, el portal DEBE desplegar una tarjeta de estado activo ("Coach solicitado en Máquina X...") e inhabilitar nuevos envíos simultáneos, incluyendo un botón interactivo "Cancelar solicitud" para anular la alerta antes de su atención en sala.
- **FR-021**: El portal del miembro DEBE incorporar una vista de "Ayuda con IA" tipo chat conectada al backend con la API de Google Gemini (vía `GEMINI_API_KEY`) y con un motor de respaldo local preentrenado con el catálogo de máquinas y biomecánica deportiva para responder siempre con fluidez en español de Perú.
- **FR-022**: La sección móvil de entrenamiento `/miembro/rutina` DEBE incorporar un selector de pestañas superior (`Rutina Asignada` / `Mi Rutina Privada`) para alternar limpiamente entre ambas modalidades sin mezclar datos.

#### Bloque D: Experiencia de Usuario y Simplicidad Visual
- **FR-023**: Todas las interfaces de los 3 sitios DEBEN abstenerse de incluir textos de relleno ficticios o ruido visual (`terminal mode alpha001`, `sys_online: 99.8`, `motor táctico`, `node terminal alpha` o similares). Solo se deben renderizar textos informativos necesarios y datos que aporten utilidad directa al usuario.

---

### Key Entities

- **`maquinas_ejercicios`**: Catálogo base de 25 máquinas numeradas (#01-#25) e instalaciones de musculación del gimnasio (id, numero_maquina, nombre, grupo_muscular, descripcion_corta).
- **`rutinas_plantillas`**: Plantillas maestras de rutinas creadas por el Administrador (id, nombre, descripcion, created_by, created_at, activo).
- **`rutinas_dias`**: Configuración de cada día de la semana dentro de una rutina (id, rutina_id, dia_semana [LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO], enfoque_muscular [Push, Pull, Legs, etc.], orden_dia).
- **`rutinas_ejercicios`**: Estaciones asignadas a un día específico (id, rutina_dia_id, maquina_id, orden_secuencial [1, 2, 3...], series, repeticiones, tiempo_descanso_segundos).
- **`miembro_rutinas_asignadas`**: Asignación activa de una rutina a un socio (id, usuario_id, rutina_id, asignado_por, fecha_asignacion, estado).
- **`miembro_rutinas_privadas`**: Rutinas personales creadas exclusivamente por y para un socio (id, usuario_id, nombre, contenido_json, created_at).
- **`alertas_coach`**: Registro de solicitudes de asistencia presencial en sala (id, usuario_id, maquina_numero, estado [PENDIENTE, ATENDIDA, CANCELADA], created_at, atendido_por, atendido_at).

---

## 4. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El Administrador puede estructurar una rutina completa de 3 días con 4 ejercicios por día (incluyendo series, repeticiones y descansos) y guardarla en la base de datos en menos de **2 minutos**.
- **SC-002**: Al buscar a un socio por DNI en "Manejar Rutinas", los datos del atleta y su rutina actual (`rutina: <nombre>`) se cargan en pantalla en menos de **500 milisegundos**.
- **SC-003**: Al presionar "Llamar Coach" desde el celular del miembro, la alerta visual aparece en la pantalla de Recepción y Administración en un lapso no mayor a **2 segundos**.
- **SC-004**: El popup de publicidad de promociones en el Sitio del Miembro se cierra inmediatamente al pulsar la `'X'`, sin generar saltos de pantalla ni bloquear la interacción.
- **SC-005**: Las rutinas privadas de los socios permanecen 100% aisladas, con cero visibilidad ni riesgo de sobrescritura accidental desde las vistas administrativas o de recepción.
- **SC-006**: El Asistente de IA entrega respuestas de apoyo biomecánico o sustitución de ejercicios en menos de **3 segundos**, contando con un fallback local inmediato si la conexión a internet o API no está disponible.
- **SC-007**: El 100% de las interfaces cumple estrictamente la política de simplicidad visual, con cero textos residuales de depuración o terminal militar.

---

## 5. Assumptions

- **A-001**: El gimnasio opera de Lunes a Sábado como días habituales de entrenamiento de fuerza y acondicionamiento; los días sin ejercicios configurados se consideran automáticamente días de descanso (REST).
- **A-002**: Las máquinas del gimnasio están identificadas físicamente con números correlativos visibles en sala (#01 a #25), precargadas en SQLite coincidiendo con las referencias visuales de Stitch.
- **A-003**: La comunicación en tiempo real para la alerta de "Llamar Coach" se implementa mediante sondeo ligero (HTTP polling cada 2 segundos) sobre SQLite, garantizando simplicidad máxima, latencia <= 2s, cero fallos por desconexión de sockets y compatibilidad universal en local y producción (Principio I).
- **A-004**: Para el "Asistente de IA", se utiliza el SDK/API de Google Gemini si existe la variable de entorno `GEMINI_API_KEY`; en caso contrario o ante fallas de red, el sistema responde fluidamente mediante una base de conocimientos deportivos y biomecánicos locales basada en las máquinas de `stitch-referencias/`.
- **A-005**: La publicidad emergente de promociones se exhibe una vez por inicio de sesión del miembro (reseteándose tras cerrar sesión), mostrando únicamente promociones activas con fecha límite no vencida, y permitiendo volver a consultar todas las ofertas en cualquier momento mediante el botón "Renovar membresía".
- **A-006**: El DNI peruano de 8 dígitos continúa siendo el identificador universal para las búsquedas y asignaciones en los 3 sitios.
