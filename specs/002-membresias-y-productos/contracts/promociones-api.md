# API Contract: Promociones y Precios Maestros

**Path Base**: `/api/promociones`  
**Security**: Requiere cabecera de autenticación (`x-user-role`, `x-user-id` o token de sesión).

---

## 1. `GET /api/promociones`
Obtiene la lista de promociones activas.

- **Roles Permitidos**: `ADMINISTRADOR`, `RECEPCIONISTA`, `MIEMBRO`.
- **Filtros Automáticos**:
  - Si el usuario es `MIEMBRO`, el sistema devuelve únicamente las promociones con `publico_objetivo = 'TODOS'` o aquellas cuyo nivel requerido sea menor o igual al nivel de fidelidad del miembro actual, excluyendo las inactivas o con fecha límite expirada.
  - Para `ADMINISTRADOR` y `RECEPCIONISTA`, devuelve todas las promociones con `activo = 1`.

### Respuesta Exitosa (`200 OK`)
```json
[
  {
    "id": 1,
    "tipo": "PROMOCION_VOLATIL",
    "nombre": "Plan Anual Mutación 2025",
    "duracion_valor": 12,
    "duracion_unidad": "MESES",
    "duracion_dias_estimados": 365,
    "precio": 899.00,
    "fecha_limite": "2026-12-31",
    "publico_objetivo": "MUTANDO",
    "banner_url": "/uploads/banners/promo-mutacion-2025.jpg",
    "activo": 1,
    "created_at": "2026-10-25T14:30:00.000Z"
  },
  {
    "id": 2,
    "tipo": "TARIFA_FIJA",
    "nombre": "Pase Fijo 1 Mes",
    "duracion_valor": 1,
    "duracion_unidad": "MESES",
    "duracion_dias_estimados": 30,
    "precio": 120.00,
    "fecha_limite": null,
    "publico_objetivo": "TODOS",
    "banner_url": "/uploads/banners/default-banner.jpg",
    "activo": 1,
    "created_at": "2026-10-25T14:35:00.000Z"
  }
]
```

---

## 2. `POST /api/promociones`
Crea una nueva tarifa fija o promoción volátil con banner publicitario.

- **Roles Permitidos**: Exclusivamente `ADMINISTRADOR`.
- **Content-Type**: `multipart/form-data`.

### Campos del Formulario
| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `tipo` | String | Sí | `TARIFA_FIJA` o `PROMOCION_VOLATIL`. |
| `nombre` | String | Sí | Nombre comercial del plan (ej. "Trimestre Hipertrofia"). |
| `duracion_valor` | Integer | Sí | Valor numérico entero > 0 (ej. 3). |
| `duracion_unidad` | String | Sí | `MESES` o `DIAS`. |
| `precio` | Number | Sí | Importe en Soles (`S/`) con hasta 2 decimales. |
| `fecha_limite` | Date | No | Fecha límite YYYY-MM-DD (para promociones volátiles). |
| `publico_objetivo` | String | Sí | `TODOS`, `NOVATO`, `PRINCIPIANTE`, `PROMEDIO`, `EN_PROGRESO`, `MUTANDO`, `MAMADO`, `DIOS_GRIEGO`, `ANIMAL`. |
| `banner` | File | No | Imagen de banner 16:9 (JPG/PNG/WEBP máx 4MB). |

### Respuesta Exitosa (`201 Created`)
```json
{
  "message": "Promoción creada y publicada exitosamente en el catálogo",
  "promocion": {
    "id": 3,
    "tipo": "PROMOCION_VOLATIL",
    "nombre": "Trimestre Hipertrofia",
    "duracion_valor": 3,
    "duracion_unidad": "MESES",
    "precio": 320.00,
    "fecha_limite": "2026-11-30",
    "publico_objetivo": "TODOS",
    "banner_url": "/uploads/banners/banner-172987123.jpg",
    "activo": 1
  }
}
```

### Respuestas de Error
- `400 Bad Request`: Datos incompletos o valores de precio/duración negativos.
- `403 Forbidden`: Usuario no tiene rol `ADMINISTRADOR`.

---

## 3. `PATCH /api/promociones/:id/archivar`
Archiva una promoción retirándola del catálogo activo para nuevas asignaciones.

- **Roles Permitidos**: `ADMINISTRADOR`.

### Respuesta Exitosa (`200 OK`)
```json
{
  "message": "Tarifa archivada correctamente. Las membresías previamente asignadas no se ven afectadas.",
  "id": 3,
  "activo": 0
}
```

