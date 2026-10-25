# API Contract: Catálogo, Inventario y Venta Rápida de Productos

**Path Base**: `/api/productos`  
**Security**: Requiere cabecera de autenticación.

---

## 1. `GET /api/productos`
Lista el catálogo de productos con stock disponible y precios.

- **Roles Permitidos**: `ADMINISTRADOR`, `RECEPCIONISTA`, `MIEMBRO`.
- **Reglas de Seguridad y Filtro**:
  - `ADMINISTRADOR`: Recibe `precio_costo`, margen calculado (`margen_porcentaje`) y todos los productos (`activo = 1`), incluidos los que tienen `stock = 0`.
  - `RECEPCIONISTA`: Recibe los productos con `activo = 1` (incluidos `stock = 0` para marcarlos como translúcidos), pero el campo `precio_costo` es **omitido o devuelto como `null`**.
  - `MIEMBRO`: Recibe únicamente productos con `activo = 1` y **`stock > 0`** (los productos con stock 0 quedan completamente excluidos). `precio_costo` no se incluye.

### Respuesta Exitosa para Administrador (`200 OK`)
```json
[
  {
    "id": 1,
    "sku": "SKU-PROT-01",
    "nombre": "Whey Isolate 2kg Gold",
    "descripcion": "Fórmula de máxima pureza microfiltrada con aminoácidos ramificados.",
    "precio_venta": 249.00,
    "precio_costo": 160.00,
    "margen_porcentaje": 35.74,
    "stock": 14,
    "categoria": "SUPLEMENTOS",
    "imagen_url": "/uploads/productos/whey-gold.jpg",
    "activo": 1
  },
  {
    "id": 5,
    "sku": "SKU-SNK-04",
    "nombre": "Barra Proteica Quest Crunch 60g",
    "descripcion": "20g de proteína aislada, 1g de azúcar.",
    "precio_venta": 14.00,
    "precio_costo": 8.20,
    "margen_porcentaje": 41.43,
    "stock": 0,
    "categoria": "SNACKS",
    "imagen_url": "/uploads/productos/quest-crunch.jpg",
    "activo": 1
  }
]
```

### Respuesta Exitosa para Recepcionista (`200 OK`)
*(Nótese la ausencia total de `precio_costo` y `margen_porcentaje`)*
```json
[
  {
    "id": 1,
    "sku": "SKU-PROT-01",
    "nombre": "Whey Isolate 2kg Gold",
    "descripcion": "Fórmula de máxima pureza microfiltrada con aminoácidos ramificados.",
    "precio_venta": 249.00,
    "stock": 14,
    "categoria": "SUPLEMENTOS",
    "imagen_url": "/uploads/productos/whey-gold.jpg",
    "activo": 1
  },
  {
    "id": 5,
    "sku": "SKU-SNK-04",
    "nombre": "Barra Proteica Quest Crunch 60g",
    "descripcion": "20g de proteína aislada, 1g de azúcar.",
    "precio_venta": 14.00,
    "stock": 0,
    "categoria": "SNACKS",
    "imagen_url": "/uploads/productos/quest-crunch.jpg",
    "activo": 1
  }
]
```

---

## 2. `POST /api/productos`
Registra un nuevo producto en el inventario con costo privado y stock inicial (Botón azul `[+] AGREGAR PRODUCTOS`).

- **Roles Permitidos**: Exclusivamente `ADMINISTRADOR`.
- **Content-Type**: `multipart/form-data`.

### Campos del Formulario
| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `nombre` | String | Sí | Nombre comercial del artículo. |
| `descripcion` | String | No | Beneficios y composición técnica. |
| `precio_venta` | Number | Sí | PVP al público en Soles (`S/`). |
| `precio_costo` | Number | Sí | Costo privado en Soles (`S/`) confidencial. |
| `stock` | Integer | Sí | Existencias físicas iniciales (mínimo 0). |
| `categoria` | String | No | Suplementos, Bebidas, Snacks, Accesorios. |
| `sku` | String | No | Código único de artículo (se autogenera si se omite). |
| `imagen` | File | No | Fotografía del producto JPG/PNG. |

### Respuesta Exitosa (`201 Created`)
```json
{
  "message": "Producto registrado exitosamente en el inventario",
  "producto": {
    "id": 7,
    "sku": "SKU-PUMP-07",
    "nombre": "Pre-Entreno Nuclear Pump 400g",
    "precio_venta": 189.00,
    "precio_costo": 110.00,
    "stock": 25,
    "categoria": "SUPLEMENTOS",
    "imagen_url": "/uploads/productos/nuclear-pump.jpg",
    "activo": 1
  }
}
```

---

## 3. `PUT /api/productos/:id`
Actualiza datos de un producto existente (nombre, descripción, precios, stock, imagen).

- **Roles Permitidos**: Exclusivamente `ADMINISTRADOR`.

### Respuesta Exitosa (`200 OK`)
```json
{
  "message": "Producto actualizado correctamente",
  "producto": {
    "id": 1,
    "nombre": "Whey Isolate 2kg Gold",
    "precio_venta": 255.00,
    "precio_costo": 160.00,
    "stock": 20
  }
}
```

---

## 4. `DELETE /api/productos/:id`
Ejecuta la **baja lógica** (`activo = 0`) del producto.

- **Roles Permitidos**: Exclusivamente `ADMINISTRADOR`.
- **Efecto**: El producto se oculta de catálogos y ventas, preservando el histórico de ventas pasadas y tickets contables sin violar integridad referencial.

### Respuesta Exitosa (`200 OK`)
```json
{
  "message": "Producto dado de baja lógicamente del inventario. El histórico de ventas previas se mantiene intacto.",
  "id": 1,
  "activo": 0
}
```

---

## 5. `POST /api/productos/vender`
Ejecuta la venta rápida en mostrador (Botón verde `[$] VENDER PRODUCTO`).

- **Roles Permitidos**: `ADMINISTRADOR`, `RECEPCIONISTA`.
- **Content-Type**: `multipart/form-data` si es Transferencia; `application/json` si es Efectivo.

### Campos
| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `producto_id` | Integer | Sí | ID del producto a vender (debe tener stock > 0). |
| `cantidad` | Integer | Sí | Cantidad vendida (entre 1 y stock disponible). |
| `metodo_pago` | String | Sí | `EFECTIVO` o `TRANSFERENCIA`. |
| `comprobante` | File | Condicional | **Obligatorio** si `metodo_pago` es `TRANSFERENCIA`. |

### Respuesta Exitosa - Efectivo (`200 OK`)
```json
{
  "message": "Venta procesada con éxito y liquidada en caja",
  "venta": {
    "id": 104,
    "producto_id": 2,
    "producto_nombre": "Creatina Creapure 300g",
    "cantidad": 2,
    "precio_unitario": 115.00,
    "total": 230.00,
    "metodo_pago": "EFECTIVO",
    "estado": "APROBADO",
    "stock_remanente": 20,
    "despacho_autorizado": true
  }
}
```

### Respuesta Exitosa - Transferencia en Recepción (`200 OK`)
```json
{
  "message": "Venta por transferencia registrada. Stock reservado preventivamente; entrega en espera de aprobación del Administrador.",
  "venta": {
    "id": 105,
    "producto_id": 2,
    "producto_nombre": "Creatina Creapure 300g",
    "cantidad": 1,
    "total": 115.00,
    "metodo_pago": "TRANSFERENCIA",
    "estado": "PENDIENTE_APROBACION",
    "stock_remanente": 19,
    "despacho_autorizado": false
  }
}
```

### Errores Comunes
- `400 Bad Request`: Si la cantidad solicitada supera el stock disponible (`CANTIDAD_SUPERA_STOCK`).
- `400 Bad Request`: Si es transferencia y no se adjunta el comprobante fotográfico.
- `404 Not Found`: Si el producto no existe o está inhabilitado (`activo = 0`).
