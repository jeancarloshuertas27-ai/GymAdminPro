# API Contract: Lista de Cambios & Aprobaciones

**Feature**: `003-auditoria-reportes-y-3-sitios`  
**Base URL**: `/api/aprobaciones`  
**Auth**: Bearer Token (Exclusivo rol `ADMINISTRADOR`)

---

## 1. `GET /api/aprobaciones`
Obtiene las operaciones pendientes organizadas en las dos columnas maestras para la vista paralela.

### Request
```http
GET /api/aprobaciones HTTP/1.1
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

### Response (200 OK)
```json
{
  "membresias": [
    {
      "id": 1,
      "tipo_transaccion": "MEMBRESIA",
      "usuario_id": 12,
      "atleta_nombres": "Mateo Alejandro",
      "atleta_apellidos": "Quispe Vega",
      "atleta_dni": "73829104",
      "promocion_nombre": "Plan Anual Mutación (12 Meses)",
      "tiempo_agregado_texto": "+1 AÑO (12 Meses Mutación)",
      "dias_agregados": 365,
      "monto": 1450.00,
      "metodo_pago": "TRANSFERENCIA",
      "referencia_pago": "BCP-84920",
      "comprobante_url": "/uploads/vouchers/voucher_1730001.png",
      "operador_rol": "RECEPCIONISTA",
      "operador_nombre": "Carlos Mendoza",
      "created_at": "2026-10-24T17:42:00Z"
    }
  ],
  "productos": [
    {
      "id": 4,
      "tipo_transaccion": "PRODUCTO",
      "producto_id": 2,
      "producto_nombre": "Whey Isolate 2kg Gold Standard",
      "producto_sku": "SKU-WHEY-GLD-82",
      "producto_imagen_url": "https://...",
      "cantidad": 1,
      "precio_unitario": 249.00,
      "total": 249.00,
      "metodo_pago": "TRANSFERENCIA",
      "referencia_pago": "YAPE OP #93028",
      "comprobante_url": "/uploads/vouchers/voucher_1730002.png",
      "operador_rol": "RECEPCIONISTA",
      "operador_nombre": "Carlos Mendoza",
      "created_at": "2026-10-24T17:15:00Z"
    }
  ],
  "totales_pendientes": {
    "total_registros": 2,
    "volumen_auditable": 1699.00
  }
}
```

---

## 2. `POST /api/aprobaciones/:tipo/:id/aprobar`
Ejecuta la aceptación formal del cambio ("ACEPTAR CAMBIO").
- Purgado físico del archivo de imagen del comprobante de `uploads/vouchers/` (Principio V).
- Aplicación definitiva de días de vigencia en membresías o liberación final de venta.
- Actualización de estado en base de datos a `APROBADO` con `comprobante_url = 'PURGADO_TRAS_APROBACION'`.

### Request
```http
POST /api/aprobaciones/membresia/1/aprobar HTTP/1.1
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

### Response (200 OK)
```json
{
  "message": "Cambio aceptado con éxito. Se borró la foto del servidor y se conservó el registro contable.",
  "id": 1,
  "tipo": "membresia",
  "estado": "APROBADO",
  "comprobante_purgado": true
}
```
