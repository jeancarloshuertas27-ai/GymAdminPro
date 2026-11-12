# API Contract: Gestión de Usuarios del Administrador

**Feature**: `003-auditoria-reportes-y-3-sitios`  
**Base URL**: `/api/users`  
**Auth**: Bearer Token (Exclusivo rol `ADMINISTRADOR`)

---

## 1. `GET /api/users`
Obtiene el padrón de usuarios con credenciales visibles para administración y cálculo de elegibilidad para eliminación de inactivos > 1 mes.

### Request
```http
GET /api/users HTTP/1.1
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

### Response (200 OK)
```json
[
  {
    "id": 14,
    "rol": "MIEMBRO",
    "username": "mateo.valdivia",
    "password_visible": "72849102",
    "nombres": "Mateo",
    "apellidos": "Valdivia",
    "dni": "72849102",
    "celular": "987654321",
    "fecha_vencimiento": "2026-10-01",
    "dias_inactivo": 42,
    "puede_eliminar_inactivo": true,
    "estado_membresia": "VENCIDO"
  },
  {
    "id": 18,
    "rol": "MIEMBRO",
    "username": "carla.benavides",
    "password_visible": "45091283",
    "nombres": "Carla",
    "apellidos": "Benavides",
    "dni": "45091283",
    "celular": "912345678",
    "fecha_vencimiento": "2026-11-20",
    "dias_inactivo": 0,
    "puede_eliminar_inactivo": false,
    "estado_membresia": "ACTIVO"
  }
]
```

---

## 2. `DELETE /api/users/:id/inactivo`
Ejecuta el borrado físico completo (Hard Delete) de un socio inactivo por más de 1 mes (más de 30 días sin membresía vigente desde su vencimiento).

### Request
```http
DELETE /api/users/14/inactivo HTTP/1.1
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

### Response (200 OK)
```json
{
  "message": "Usuario inactivo eliminado físicamente de la base de datos con éxito. Los registros contables pasados fueron preservados de forma desvinculada.",
  "usuario_id": 14,
  "dni": "72849102"
}
```

### Response (400 Bad Request) - Intento de borrar socio no elegible
```json
{
  "error": "No se puede eliminar el usuario: su membresía no tiene más de 1 mes (30 días) de vencida o registra renovaciones recientes."
}
```

### Response (403 Forbidden)
```json
{
  "error": "Acceso denegado. Exclusivo para el Administrador."
}
```
