# Quickstart & Validation Guide: 003 - Auditoría, Reportes PDF y 3 Sitios

**Feature**: `003-auditoria-reportes-y-3-sitios`  
**Target Audience**: Operadores, Administradores y Evaluadores de Aceptación (Verificable por personas no técnicas - Principio IV)  

---

## 1. Arranque del Sistema con un Único Comando

### Prerrequisitos
- Node.js 18+ instalado.
- Dependencias instaladas en el directorio raíz.

### Comando Único de Inicio
```bash
npm run dev
```

Este comando levanta automáticamente:
1. **Servidor API Backend & SQLite**: `http://localhost:3001` con auto-reload.
2. **Servidor Web Frontend**: `http://localhost:5173` con Vite.

### Puntos de Acceso Segregados
- **Sitio Administrador**: `http://localhost:5173/admin`
- **Sitio Recepción**: `http://localhost:5173/recepcion`
- **Sitio Miembro**: `http://localhost:5173/miembro`
- **Portal Central**: `http://localhost:5173/`

---

## 2. Escenarios de Validación Paso a Paso

### Escenario 1: Validación de Separación Estricta y Rechazo de Accesos Cruzados
1. Abre tu navegador y dirígete a `http://localhost:5173/admin`.
2. Intenta iniciar sesión con una cuenta de rol recepción (ej. usuario: `recepcion`, clave: `123456`).
   - **Resultado Esperado**: El sistema muestra una alerta clara indicando "Acceso exclusivo para Administradores" y no permite entrar.
3. Inicia sesión con la cuenta de administrador (usuario: `admin`, clave: `admin123`).
   - **Resultado Esperado**: Se abre el portal completo del Administrador en `/admin/dashboard`.
4. En otra pestaña del mismo navegador, entra a `http://localhost:5173/recepcion`.
5. Inicia sesión con la cuenta de recepción.
   - **Resultado Esperado**: Se abre directamente el mostrador de Recepción con la pantalla principal de "Control de Acceso / Check-in".
6. Regresa a la pestaña del Administrador y refresca la página.
   - **Resultado Esperado**: La sesión del Administrador sigue activa e intacta gracias a las llaves de sesión segregadas (`gym_admin_session` y `gym_recepcion_session`).

---

### Escenario 2: Dashboard Principal del Administrador (Diseño Limpio)
1. En la pestaña del Administrador (`/admin/dashboard`), observa la interfaz.
   - **Resultado Esperado**:
     - Las tarjetas bento muestran: (1) **Ingresos del Día** en `S/` con el split de Membresías vs Productos; (2) **Atletas Activos** con alertas de vencimiento en <10 días y nuevos atletas; (3) **Stock Crítico** con los ítems con existencia menor a 5 unidades y botón de reabastecimiento.
     - En el área central se encuentra el **Control de Acceso Táctico** para verificar DNI in situ.
     - En el lateral derecho se muestra el widget de **Transferencias por Auditar** con conteo en tiempo real y botón para ir a la lista de cambios.
     - **Cero ruido visual**: No aparecen textos ficticios como `terminal mode aplha001`, `sys_online: 99.8`, `auditoria: en linea`, `capacidad actual`, `estado de torniquetes` ni la curva gráfica innecesaria.

---

### Escenario 3: Flujo de Aprobación en 2 Columnas y Purgado Físico de Comprobantes
1. Desde la terminal de recepción (`/recepcion`), realiza una venta rápida de producto seleccionando método de pago "Transferencia" y adjuntando una imagen de voucher.
2. Como Administrador, dirígete a "Cambios & Aprobaciones" (`/admin/aprobaciones`).
   - **Resultado Esperado**: La pantalla se divide en 2 columnas maestras paralelas:
     - Izquierda: "CAMBIOS EN MEMBRESÍAS".
     - Derecha: "VENTA DE PRODUCTOS".
     - En la columna derecha aparece la venta recién creada con el botón "Ver imagen".
3. Haz clic en "Ver imagen".
   - **Resultado Esperado**: Se abre el modal con la imagen en alta resolución y controles interactivos de zoom (+ / - / reiniciar).
4. Cierra el modal y haz clic en el botón **"ACEPTAR CAMBIO"** de la tarjeta.
   - **Resultado Esperado**:
     - La tarjeta se desvanece y desaparece de la vista activa de pendientes en menos de 500 ms con un toast de confirmación.
     - En el servidor, el archivo físico de la imagen en `uploads/vouchers/` es eliminado físicamente del disco (Principio V).
     - La transacción permanece registrada en la base de datos para balances contables.

---

### Escenario 4: Generación y Descarga del Reporte Oficial en PDF
1. En la pantalla de Cambios & Aprobaciones (`/admin/aprobaciones`), ubica el botón flotante en la esquina inferior derecha rotulado **"GENERAR REPORTE"**.
2. Haz clic sobre el botón.
   - **Resultado Esperado**: Se abre el modal de consolidación diaria mostrando el resumen de la fecha de hoy con el nombre sugerido `REPORTE <FECHA>.pdf` y un selector interactivo para elegir fechas anteriores si se desea.
3. Presiona el botón "DESCARGAR 'REPORTE_<FECHA>.pdf'".
   - **Resultado Esperado**: El navegador descarga automáticamente el documento PDF oficial estructurado con:
     - (a) Ganancias consolidadas por membresías en Soles (`S/`).
     - (b) Nuevos usuarios inscritos en la jornada.
     - (c) Ganancias consolidadas por venta de productos en mostrador en Soles (`S/`).
     - (d) Detalle pormenorizado de productos vendidos con sus cantidades y subtotales en `S/`.

---

### Escenario 5: Gestión de Usuarios del Administrador y Depuración de Inactivos > 1 Mes
1. Como Administrador, dirígete a "Usuarios & Fidelidad" (`/admin/usuarios`).
   - **Resultado Esperado**: La tabla lista los usuarios registrados exhibiendo su nombre de usuario y su contraseña visible para soporte de mostrador.
2. Localiza a un socio cuya membresía tenga más de 30 días de vencida y sin renovaciones posteriores.
   - **Resultado Esperado**: El botón "Eliminar Usuario Inactivo" se muestra activo y habilitado en rojo.
3. Haz clic en "Eliminar Usuario Inactivo" y confirma la advertencia.
   - **Resultado Esperado**: El socio es eliminado físicamente (Hard Delete) de la base de datos SQLite y desaparece de la tabla; cualquier transacción contable previa que tuvo se conserva desvinculada para no alterar balances pasados.
4. Observa a un socio con membresía activa o vencida hace menos de 30 días.
   - **Resultado Esperado**: El botón de eliminación está inhabilitado, protegiendo las cuentas activas.

---

### Escenario 6: Sitio Miembro Móvil en Pantallas de Escritorio y Teléfonos
1. Navega a `http://localhost:5173/miembro` desde tu computadora de escritorio.
2. Inicia sesión con credenciales de un atleta (rol `MIEMBRO`).
   - **Resultado Esperado**: En la pantalla ancha de tu monitor se renderiza un marco vertical centrado simulando un smartphone oscuro con proporciones móviles idénticas a las maquetas de Stitch.
3. Abre las herramientas de desarrollador y conmuta a emulación de teléfono móvil (o ingresa desde tu celular a la IP de red local).
   - **Resultado Esperado**: La vista móvil se adapta fluidamente al 100% del viewport vertical de la pantalla táctil, exhibiendo el carnet interactivo con QR de acceso dinámico, vigencia de días, nivel de fidelidad gamificada, promociones activas de su nivel y la barra inferior con accesos directos preparados para rutinas y llamada a coach.
