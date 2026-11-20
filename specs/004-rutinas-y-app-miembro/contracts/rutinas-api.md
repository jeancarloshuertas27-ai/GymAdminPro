# API Contract: Rutinas, Máquinas y Promociones de Miembro

**Base Path**: `/api/rutinas` & `/api/promociones`  
**Authentication**: `Bearer <token>` requerido en todos los endpoints.

---

## 1. Catálogo de Máquinas

### `GET /api/rutinas/maquinas`
Lista las 25 máquinas numeradas del gimnasio ordenadas por `numero_maquina`.
- **Acceso**: `ADMINISTRADOR`, `RECEPCIONISTA`, `MIEMBRO`
- **Response `200 OK`**:
```json
{
  "maquinas": [
    {
      "id": 1,
      "numero_maquina": 1,
      "codigo_etiqueta": "#01",
      "nombre": "Máquina 1 - Sentadilla Guiada",
      "grupo_muscular": "Cuádriceps"
    }
  ]
}
```

---

## 2. Plantillas Maestras de Rutinas (Admin y Recepción)

### `GET /api/rutinas/plantillas`
Obtiene todas las plantillas de rutinas creadas por el Administrador (excluyendo las rutinas privadas de miembros).
- **Acceso**: `ADMINISTRADOR`, `RECEPCIONISTA`
- **Response `200 OK`**:
```json
{
  "plantillas": [
    {
      "id": 1,
      "nombre": "Protocolo Hipertrofia 5 Días",
      "total_ejercicios": 18,
      "dias": [
        {
          "dia_semana": "LUNES",
          "enfoque_muscular": "PUSH",
          "ejercicios": [
            {
              "id": 10,
              "maquina_id": 8,
              "numero_maquina": 8,
              "nombre": "Máquina 8 - Press Banca Smith",
              "grupo_muscular": "Pectoral Mayor",
              "orden_secuencial": 1,
              "series": 4,
              "repeticiones": "8-12",
              "tiempo_descanso_segundos": 90
            }
          ]
        }
      ]
    }
  ]
}
```

### `POST /api/rutinas/plantillas`
Crea y guarda una nueva rutina preconfigurada desde el configurador Drag & Drop.
- **Acceso**: Exclusivo `ADMINISTRADOR`
- **Request Body**:
```json
{
  "nombre": "Fuerza Bruta 4 Días",
  "dias": [
    {
      "dia_semana": "LUNES",
      "enfoque_muscular": "PUSH",
      "ejercicios": [
        {
          "maquina_id": 8,
          "orden_secuencial": 1,
          "series": 4,
          "repeticiones": "8-12",
          "tiempo_descanso_segundos": 90
        }
      ]
    }
  ]
}
```
- **Response `201 Created`**: `{ "message": "Rutina guardada correctamente", "plantilla": { ... } }`

---

## 3. Manejar Rutinas: Búsqueda por DNI y Asignación (Admin y Recepción)

### `GET /api/rutinas/buscar-atleta/:dni`
Busca a un miembro por su DNI de 8 dígitos para visualizar su rutina actual.
- **Acceso**: `ADMINISTRADOR`, `RECEPCIONISTA`
- **Response `200 OK`**:
```json
{
  "atleta": {
    "id": 4,
    "nombres": "Mateo",
    "apellidos": "Valdivia Roca",
    "dni": "72849102",
    "rutina_id": 1,
    "rutina_nombre": "Protocolo Hipertrofia 5 Días",
    "rutina_etiqueta": "rutina: Protocolo Hipertrofia 5 Días"
  }
}
```

### `PUT /api/rutinas/asignar`
Asigna o modifica la rutina oficial de un atleta.
- **Acceso**: `ADMINISTRADOR`, `RECEPCIONISTA`
- **Request Body**:
```json
{
  "usuario_id": 4,
  "rutina_id": 2
}
```
- **Response `200 OK`**:
```json
{
  "message": "Rutina asignada exitosamente.",
  "rutina_nombre": "Fuerza Bruta 4 Días",
  "rutina_etiqueta": "rutina: Fuerza Bruta 4 Días"
}
```

---

## 4. Rutina Oficial, Personalización y Rutina Privada (Sitio Miembro)

### `GET /api/rutinas/mi-rutina`
Devuelve la rutina oficial asignada al miembro autenticado (con sus ajustes personales aplicados en `series` y `tiempo_descanso_segundos`) junto con su(s) rutina(s) privada(s).
- **Acceso**: Exclusivo `MIEMBRO`
- **Response `200 OK`**:
```json
{
  "rutina_asignada": {
    "id": 1,
    "nombre": "Protocolo Hipertrofia 5 Días",
    "dias": [ ... ]
  },
  "rutinas_privadas": [
    {
      "id": 5,
      "nombre": "Mi Rutina de Brazos",
      "dias": [ ... ],
      "created_at": "2026-11-19 15:00:00"
    }
  ]
}
```

### `PATCH /api/rutinas/mi-rutina/ajustar-ejercicio`
Permite al miembro ajustar series y tiempo de descanso de un ejercicio de su rutina oficial sin alterar la plantilla maestra.
- **Acceso**: Exclusivo `MIEMBRO`
- **Request Body**:
```json
{
  "rutina_ejercicio_id": 10,
  "series_custom": 5,
  "descanso_custom_segundos": 120
}
```
- **Response `200 OK`**: `{ "message": "Ajustes de entrenamiento guardados." }`

### `POST /api/rutinas/privadas`
Guarda una nueva rutina privada creada por el miembro en `/miembro`. Nunca se expone a Admin ni Recepción.
- **Acceso**: Exclusivo `MIEMBRO`
- **Request Body**: `{ "nombre": "Mi Rutina Privada", "dias": [ ... ] }`
- **Response `201 Created`**: `{ "message": "Rutina personal privada guardada.", "rutina": { ... } }`

### `DELETE /api/rutinas/privadas/:id`
Elimina una rutina privada perteneciente al miembro autenticado.
- **Acceso**: Exclusivo `MIEMBRO`

---

## 5. Promociones Vigentes para Publicidad del Miembro

### `GET /api/promociones/para-miembro`
Retorna únicamente promociones con `activo = 1`, `fecha_limite IS NULL OR fecha_limite >= DATE('now', 'localtime')`, y `publico_objetivo IN ('TODOS', nivel_actual_usuario)`.
- **Acceso**: Exclusivo `MIEMBRO`
- **Response `200 OK`**:
```json
{
  "nivel_actual": "MUTANDO",
  "promociones": [
    {
      "id": 3,
      "nombre": "Plan Trimestral Mutando",
      "precio": 279,
      "duracion_valor": 3,
      "duracion_unidad": "MESES",
      "fecha_limite": "2026-11-30",
      "publico_objetivo": "MUTANDO"
    }
  ]
}
```
