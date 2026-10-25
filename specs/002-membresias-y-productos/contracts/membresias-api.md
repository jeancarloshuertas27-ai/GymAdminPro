# API Contract: Manejo y Asignación de Membresías por DNI

**Path Base**: `/api/membresias`  
**Security**: Requiere cabecera de autenticación.

---

## 1. `GET /api/membresias/buscar/:dni`
Localiza de forma inmediata a un atleta por su DNI de 8 dígitos para consultar su estado y saldo de días.

- **Roles Permitidos**: `ADMINISTRADOR`, `RECEPCIONISTA`.

### Parámetros de Ruta
- `dni`: Cadena numérica exacta de 8 dígitos.

### Respuesta Exitosa (`200 OK`)
```json
{
  "usuario": {
    "id": 12,
    "dni": "72849102",
    "nombres": "Mateo",
    "apellidos": "Valdivia Roca",
    "celular": "987654321",
    "foto_url": "/uploads/users/mateo.jpg",
    "nivel_fidelidad": "MUTANDO"
  },
  "membresia_actual": {
    "id": 8,
    "fecha_inicio": "2026-09-15",
    "fecha_vencimiento": "2026-12-12",
    "dias_restantes": 48,
    "estado": "ACTIVO",
    "plan_tag": "PLAN ANUAL MUTACIÓN"
  }
}
```

### Respuestas de Error
- `400 Bad Request`: Si el DNI no tiene exactamente 8 dígitos numéricos.
- `404 Not Found`: Si no existe ningún atleta registrado con ese DNI.

---

## 2. `POST /api/membresias/asignar`
Asigna o extiende el tiempo de membresía mediante una promoción del catálogo o tiempo manual (meses/días).

- **Roles Permitidos**: `ADMINISTRADOR`, `RECEPCIONISTA`.
- **Content-Type**: `multipart/form-data` si es Transferencia; `application/json` si es Efectivo.

### Campos
| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `usuario_id` | Integer | Sí | ID del usuario/atleta beneficiario. |
| `modo` | String | Sí | `PROMO` o `MANUAL`. |
| `promocion_id` | Integer | Condicional | ID de la promoción seleccionada (si `modo` = `PROMO`). |
| `cantidad_tiempo` | Integer | Condicional | Valor numérico (si `modo` = `MANUAL`). |
| `unidad_tiempo` | String | Condicional | `MESES` o `DIAS` (si `modo` = `MANUAL`). |
| `monto` | Number | Sí | Importe a cobrar en Soles (`S/`). |
| `metodo_pago` | String | Sí | `EFECTIVO` o `TRANSFERENCIA`. |
| `comprobante` | File | Condicional | **Obligatorio** si `metodo_pago` es `TRANSFERENCIA` y el usuario es `RECEPCIONISTA`. Opcional si es `ADMINISTRADOR`. |

### Respuesta Exitosa - Efectivo o Admin (`200 OK`)
*(Vigencia actualizada inmediatamente)*
```json
{
  "message": "Tiempo de membresía agregado y liquidado exitosamente en caja",
  "transaccion": {
    "id": 45,
    "usuario_id": 12,
    "dias_agregados": 30,
    "monto": 120.00,
    "metodo_pago": "EFECTIVO",
    "estado": "APROBADO",
    "nueva_fecha_vencimiento": "2027-01-11",
    "nuevo_saldo_dias": 78
  }
}
```

### Respuesta Exitosa - Transferencia en Recepción (`200 OK`)
*(Días pendientes hasta revisión del Administrador)*
```json
{
  "message": "Comprobante de transferencia remitido a la Lista de Cambios y Aprobaciones. Los días se sumarán al ser aprobado por el Administrador.",
  "transaccion": {
    "id": 46,
    "usuario_id": 12,
    "dias_agregados": 365,
    "monto": 899.00,
    "metodo_pago": "TRANSFERENCIA",
    "estado": "PENDIENTE_APROBACION",
    "fecha_vencimiento_actual": "2026-12-12",
    "saldo_dias_actual": 48
  }
}
```

### Errores Comunes
- `400 Bad Request`: Si no se adjunta comprobante para transferencia en recepción.
- `404 Not Found`: Si el usuario o la promoción indicada no existen.

