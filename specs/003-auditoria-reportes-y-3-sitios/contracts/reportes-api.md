# API Contract: Reportes & Telemetría Financiera

**Feature**: `003-auditoria-reportes-y-3-sitios`  
**Base URL**: `/api/reportes`  
**Auth**: Bearer Token (Exclusivo rol `ADMINISTRADOR`)

---

## 1. `GET /api/reportes/dashboard`
Obtiene las métricas en tiempo real requeridas para el Dashboard Principal del Administrador.

### Request
```http
GET /api/reportes/dashboard HTTP/1.1
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

### Response (200 OK)
```json
{
  "ingresos_hoy": {
    "total": 4820.50,
    "membresias": 3650.00,
    "productos": 1170.50,
    "porcentaje_membresias": 75.7,
    "porcentaje_productos": 24.3
  },
  "atletas_activos": {
    "total": 418,
    "por_vencer": 32,
    "nuevos_mes": 18
  },
  "stock_critico": {
    "total_items": 4,
    "items": [
      {
        "id": 1,
        "nombre": "ISO Whey 2kg Vainilla",
        "stock": 2
      },
      {
        "id": 4,
        "nombre": "Creatina Monohidratada 300g",
        "stock": 3
      }
    ]
  },
  "auditorias_pendientes": {
    "total": 3,
    "items": [
      {
        "id": 1,
        "tipo": "MEMBRESIA",
        "monto": 240.00,
        "metodo_pago": "TRANSFERENCIA",
        "referencia": "YAPE // Op. #889102",
        "created_at": "2026-11-12T14:30:00Z"
      }
    ]
  }
}
```

---

## 2. `GET /api/reportes/diario`
Obtiene el consolidado de balance de una fecha para el modal de previsualización y la compilación del PDF `REPORTE <FECHA>.pdf`.

### Request
```http
GET /api/reportes/diario?fecha=2026-11-12 HTTP/1.1
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

### Query Parameters
- `fecha` (string, opcional, formato `YYYY-MM-DD`): Fecha a consultar. Si se omite, calcula los movimientos de la fecha actual del servidor.

### Response (200 OK)
```json
{
  "fecha": "2026-11-12",
  "archivo_sugerido": "REPORTE 2026-11-12.pdf",
  "ganancias_membresias": 11280.00,
  "nuevos_usuarios_count": 14,
  "nuevos_usuarios": [
    {
      "id": 102,
      "nombres": "Mateo",
      "apellidos": "Valdivia",
      "dni": "72849102",
      "created_at": "2026-11-12T09:14:00Z"
    }
  ],
  "ganancias_productos": 3490.00,
  "productos_vendidos": [
    {
      "producto_id": 1,
      "nombre": "Whey Isolate 2kg Gold Standard",
      "sku": "SKU-WHEY-GLD-82",
      "cantidad_vendida": 8,
      "precio_unitario": 249.00,
      "subtotal": 1992.00
    },
    {
      "producto_id": 3,
      "nombre": "Creatina Creapure 300g",
      "sku": "SKU-CREA-CRP-11",
      "cantidad_vendida": 12,
      "precio_unitario": 130.00,
      "subtotal": 1560.00
    }
  ],
  "total_bruto_dia": 14770.00,
  "total_transacciones": 43
}
```

### Response (403 Forbidden)
```json
{
  "error": "Acceso denegado. Exclusivo para el Administrador."
}
```
