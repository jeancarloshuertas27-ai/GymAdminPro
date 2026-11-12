# API Contract: Conciliación, Aprobaciones y Purgado de Vouchers (Principio V)

**Path Base**: `/api/aprobaciones`  
**Security**: Requiere rol `ADMINISTRADOR`.

---

## 1. `GET /api/aprobaciones`
Lista todas las transacciones pendientes de revisión por transferencia bancaria (tanto de membresías como de ventas de productos).

- **Roles Permitidos**: Exclusivamente `ADMINISTRADOR`.

### Respuesta Exitosa (`200 OK`)
```json
{
  "membresias_pendientes": [
    {
      "id": 46,
      "tipo_transaccion": "MEMBRESIA",
      "usuario_id": 12,
      "atleta_nombres": "Mateo",
      "atleta_apellidos": "Valdivia Roca",
      "atleta_dni": "72849102",
      "dias_agregados": 365,
      "monto": 899.00,
      "comprobante_url": "/uploads/vouchers/voucher-17298810.jpg",
      "operador_nombre": "Carlos Mendoza (Recepción)",
      "created_at": "2026-10-25T15:20:00.000Z"
    }
  ],
  "ventas_pendientes": [
    {
      "id": 105,
      "tipo_transaccion": "PRODUCTO",
      "producto_id": 2,
      "producto_nombre": "Creatina Creapure 300g",
      "cantidad": 1,
      "total": 115.00,
      "comprobante_url": "/uploads/vouchers/voucher-17298822.png",
      "operador_nombre": "Carlos Mendoza (Recepción)",
      "created_at": "2026-10-25T15:22:00.000Z"
    }
  ]
}
```

---

## 2. `POST /api/aprobaciones/:tipo/:id/aprobar`
Aprueba formalmente la transferencia bancaria, activa el beneficio al usuario/venta y **ejecuta el purgado físico del archivo de comprobante** conforme al Principio Constitucional V.

- **Parámetros de Ruta**:
  - `tipo`: `membresia` o `producto`.
  - `id`: ID numérico del registro en `solicitudes_membresia` o `ventas_productos`.

### Acciones Ejecutadas por el Backend
1. Marca `estado = 'APROBADO'`.
2. Si es membresía, extiende la fecha de caducidad en la tabla `membresias`.
3. Si es producto, confirma el despacho físico.
4. **Purgado del Principio V**: Borra de forma permanente el archivo físico de `uploads/vouchers/` y actualiza la base de datos a `comprobante_url = 'PURGADO_TRAS_APROBACION'`.

### Respuesta Exitosa (`200 OK`)
```json
{
  "message": "Transacción aprobada con éxito. Los beneficios fueron aplicados y el comprobante gráfico ha sido purgado del servidor.",
  "id": 46,
  "tipo": "membresia",
  "estado": "APROBADO",
  "comprobante_url": "PURGADO_TRAS_APROBACION"
}
```

---

## 3. `POST /api/aprobaciones/:tipo/:id/rechazar`
Rechaza el comprobante bancario (p. ej. comprobante falso o monto incorrecto).

- **Parámetros de Ruta**:
  - `tipo`: `membresia` o `producto`.
  - `id`: ID numérico de la solicitud.
- **Body**: `{ "motivo": "Comprobante ilegible / monto incompleto" }`

### Acciones Ejecutadas por el Backend
1. Marca `estado = 'RECHAZADO'`.
2. Si es membresía: No aplica ningún día a la cuenta del atleta.
3. Si es producto: **Reintegra de inmediato las unidades reservadas** al stock del producto (`UPDATE productos SET stock = stock + cantidad WHERE id = ?`).
4. Conserva el registro en el historial para auditoría con su respectivo motivo.

### Respuesta Exitosa (`200 OK`)
```json
{
  "message": "Transacción rechazada. El stock reservado ha sido reintegrado automáticamente al inventario.",
  "id": 105,
  "tipo": "producto",
  "estado": "RECHAZADO",
  "stock_restaurado": true
}
```

