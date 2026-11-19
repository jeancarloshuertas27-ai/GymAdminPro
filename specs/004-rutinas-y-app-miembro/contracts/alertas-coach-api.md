# API Contract: Alertas en Vivo "Llamar Coach"

**Base Path**: `/api/alertas-coach`  
**Authentication**: `Bearer <token>` requerido en todos los endpoints.  
**Mecanismo en Tiempo Real**: Sondeo HTTP ligero (Polling cada 3 segundos desde Recepción y Administrador).

---

## 1. `POST /api/alertas-coach`
Emite una nueva alerta solicitando ayuda de un entrenador en sala.
- **Acceso**: Exclusivo `MIEMBRO`
- **Request Body**:
```json
{
  "maquina_numero": "Máquina #08 - Press Banca Smith",
  "motivo": "Corregir Postura"
}
```
- **Regla de Negocio**: Si el miembro ya tiene una alerta en estado `'PENDIENTE'`, retorna `409 Conflict` (`"Ya tienes una solicitud de coach pendiente en sala"`).
- **Response `201 Created`**:
```json
{
  "message": "Alerta enviada a Recepción.",
  "alerta": {
    "id": 12,
    "usuario_id": 4,
    "maquina_numero": "Máquina #08 - Press Banca Smith",
    "motivo": "Corregir Postura",
    "estado": "PENDIENTE",
    "created_at": "2026-11-19 17:35:00"
  }
}
```

---

## 2. `GET /api/alertas-coach/mi-alerta`
Permite al miembro verificar si posee una alerta pendiente activa en su celular.
- **Acceso**: Exclusivo `MIEMBRO`
- **Response `200 OK`**:
```json
{
  "alerta": {
    "id": 12,
    "maquina_numero": "Máquina #08 - Press Banca Smith",
    "motivo": "Corregir Postura",
    "estado": "PENDIENTE",
    "created_at": "2026-11-19 17:35:00"
  }
}
```
*(Si no tiene alerta pendiente, retorna `{ "alerta": null }`).*

---

## 3. `PATCH /api/alertas-coach/:id/cancelar`
Permite al propio miembro cancelar su alerta antes de que sea atendida.
- **Acceso**: Exclusivo `MIEMBRO` (propietario de la alerta)
- **Response `200 OK`**:
```json
{
  "message": "Solicitud de coach cancelada.",
  "estado": "CANCELADA"
}
```

---

## 4. `GET /api/alertas-coach/pendientes`
Consultado cada 3 segundos por el Sitio de Recepción y el Sitio Administrador para mostrar la notificación en vivo en pantalla principal.
- **Acceso**: `RECEPCIONISTA`, `ADMINISTRADOR`
- **Response `200 OK`**:
```json
{
  "alertas": [
    {
      "id": 12,
      "usuario_id": 4,
      "miembro_nombre": "Mateo Valdivia Roca",
      "miembro_dni": "72849102",
      "maquina_numero": "Máquina #08 - Press Banca Smith",
      "motivo": "Corregir Postura",
      "estado": "PENDIENTE",
      "created_at": "2026-11-19 17:35:00"
    }
  ]
}
```

---

## 5. `PATCH /api/alertas-coach/:id/atender`
Marca la alerta como atendida y la retira inmediatamente tanto de Recepción como de Administración.
- **Acceso**: `RECEPCIONISTA`, `ADMINISTRADOR`
- **Response `200 OK`**:
```json
{
  "message": "Alerta marcada como atendida.",
  "estado": "ATENDIDA"
}
```
