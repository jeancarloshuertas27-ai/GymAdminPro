# Quickstart & End-to-End Validation Guide: 002 - Membresías, Promociones y Productos

**Branch**: `002-membresias-y-productos`  
**Date**: 2026-10-25  
**Spec**: [spec.md](./spec.md) | **Data Model**: [data-model.md](./data-model.md) | **Contracts**: [contracts/](./contracts/)

---

## 1. Prerrequisitos y Entorno Local

Asegúrate de contar con las dependencias instaladas y el servidor local en ejecución:

```powershell
# 1. Instalar dependencias si no se ha hecho
npm install

# 2. Inicializar base de datos con semillas (incluye usuarios de prueba)
npm run seed

# 3. Iniciar el entorno completo de desarrollo (Frontend + Backend)
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`
- **Usuarios de prueba**:
  - **Administrador**: `@admin_01` / `Admin2026!`
  - **Recepcionista**: `@recepcion_01` / `Recep2026!`
  - **Miembro**: `@atleta_01` / `Atleta2026!`

---

## 2. Escenarios de Validación Paso a Paso (Para Usuarios No Técnicos)

### Escenario 1: Creación de Promociones Volátiles y Tarifas Fijas (HU1)
1. Iniciar sesión como `@admin_01` y dirigirse a **Membresías & Promociones** (`/admin/membresias-promociones`).
2. En la sección **FORJA DE PLANES Y TARIFAS**:
   - Elegir el tipo: *Tarifa Fija* o *Promoción Volátil*.
   - Digitar el nombre: `Plan Bimestral Fuerza 2026`.
   - Fijar vigencia: `2` en cantidad y seleccionar `Meses`.
   - Indicar el importe: `S/ 210.00`.
   - Seleccionar el público objetivo: `TODOS` o nivel específico (`MUTANDO`).
   - Cargar un banner publicitario (imagen JPG o PNG).
3. Hacer clic en **Guardar Promoción**.
4. **Resultado Esperado**:
   - Se muestra la notificación verde de éxito en pantalla.
   - La nueva tarjeta de promoción aparece de inmediato en la grilla inferior **Promociones y Precios Activos**, mostrando su vigencia, importe en `S/` y estado vigente.

---

### Escenario 2: Asignación de Membresía por DNI con Pago en Efectivo (HU2)
1. Como Recepcionista (`@recepcion_01`) o Administrador, abrir la pantalla de **Manejo de Membresías**.
2. En el buscador por DNI, ingresar un DNI de prueba (ej. `72849102` de Mateo Valdivia Roca) y pulsar **Buscar**.
3. Verificar que aparezca la ficha del atleta con su nombre, DNI y saldo actual de días.
4. Hacer clic en el botón azul **Agregar tiempo de membresía**:
   - Se despliega la ventana emergente con el atleta preseleccionado.
   - En la pestaña *Elegir Promoción Activa*, seleccionar `Pase Fijo 1 Mes // S/ 120.00 (+30 Días)`.
   - Verificar que el radio de método de pago esté en **Efectivo** (marcado por defecto).
   - Observar el indicador de *Validación Instantánea*.
5. Pulsar **Confirmar Asignación**.
6. **Resultado Esperado**:
   - La ventana se cierra, se notifica el éxito y el saldo de días del atleta en pantalla se incrementa en +30 días en el acto.

---

### Escenario 3: Asignación de Membresía por Transferencia y Aprobación con Purgado (HU2 y Principio V)
1. En sesión de Recepcionista (`@recepcion_01`), buscar un atleta por DNI y abrir el modal **Agregar tiempo de membresía**.
2. Seleccionar una promoción o tiempo manual y cambiar el método de pago a **Transferencia**.
3. Constatar que el sistema exige obligatoriamente adjuntar la foto del comprobante de pago digital.
4. Adjuntar una imagen de prueba y presionar **Confirmar Asignación**.
5. **Resultado en Recepción**: El sistema informa que la solicitud quedó enviada a la *Lista de Cambios y Aprobaciones*, y el saldo de días del atleta **aún no se incrementa**.
6. Cerrar sesión e iniciar como Administrador (`@admin_01`); navegar a **Cambios & Aprobaciones** (`/admin/aprobaciones`).
7. Ubicar la solicitud en la lista, presionar para previsualizar el comprobante adjunto y hacer clic en **Aprobar**.
8. **Resultado Esperado**:
   - La solicitud desaparece de la lista de pendientes.
   - Al buscar al atleta, los días de membresía se han sumado formalmente a su cuenta.
   - El archivo físico de la imagen en el servidor queda purgado de la carpeta `uploads/vouchers/` conforme al Principio Constitucional V.

---

### Escenario 4: Inventario Maestro, Costo Privado y Productos Agotados (HU3 y HU4)
1. Iniciar sesión como `@admin_01` e ingresar a **Inventario y Stock** (`/admin/productos`):
   - Verificar que cada tarjeta de producto muestre su imagen, nombre, PVP al público, stock disponible y la telemetría confidencial: *Costo (S/)* y *Margen %*.
   - Localizar un producto con stock 0 (ej. *Barra Proteica Quest Crunch*): verificar que se renderice con estilo translúcido (opacidad atenuada), sello inclinado `AGOTADO // SIN STOCK DISPONIBLE` y botón de venta directa deshabilitado.
2. Hacer clic en el botón flotante azul **[+] AGREGAR PRODUCTOS**:
   - Llenar nombre, descripción, PVP en `S/`, Costo Privado en `S/` y Stock inicial.
   - Guardar el producto y comprobar que se liste inmediatamente en la grilla.
3. Iniciar sesión como `@recepcion_01` y visitar el catálogo de productos:
   - Constatar que el costo privado y el margen de ganancia **están completamente ausentes** en la interfaz.
4. Iniciar sesión como `@atleta_01` (Miembro) en vista móvil:
   - Constatar que los productos con stock 0 **no se muestran en lo absoluto** en su tienda.

---

### Escenario 5: Venta Rápida en Mostrador y Reversión de Stock por Rechazo (HU5)
1. En sesión de Recepción o Admin, hacer clic en el botón flotante verde **[$] VENDER PRODUCTO**.
2. En la ventana emergente de terminal POS:
   - Abrir el desplegable de productos: verificar que **solo liste productos con stock > 0**.
   - Elegir un producto (ej. *Creatina Creapure 300g*, con stock actual de 22 unidades).
   - Constatar que el selector numérico de cantidad impide fijar más de 22 unidades y recalcula el monto en Soles (`S/`) en tiempo real.
3. Elegir método de pago **Transferencia**, adjuntar comprobante y presionar **VENDER**.
4. **Verificación de Reserva Preventiva**:
   - En la grilla de productos, el stock del artículo disminuye inmediatamente a 21 unidades para evitar sobreventa.
   - La entrega queda retenida.
5. Iniciar sesión como Administrador (`@admin_01`), ir a **Cambios & Aprobaciones** y pulsar **Rechazar** sobre la venta con el motivo "Comprobante ilegible".
6. **Resultado Esperado**:
   - La venta queda cancelada.
   - El sistema **reintegra de forma atómica la unidad reservada**, restaurando el stock del producto nuevamente a 22 unidades.

---

## 3. Pruebas Automatizadas

Para validar las reglas de negocio, filtros de costo, concurrencia de stock y transiciones de estado:

```powershell
# Ejecutar suite de pruebas unitarias y de integración
npm test
```

