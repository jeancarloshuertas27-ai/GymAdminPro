# API Contract: Asistente de Entrenamiento con IA

**Base Path**: `/api/asistente-ia`  
**Authentication**: `Bearer <token>` requerido (`MIEMBRO`).

---

## 1. `POST /api/asistente-ia/consultar`
Procesa la consulta deportiva del atleta. Utiliza la API REST de Google Gemini (`GEMINI_API_KEY`) si está configurada y disponible; de lo contrario, responde automáticamente mediante el motor de respaldo local entrenado con el catálogo de las 25 máquinas de sala.

- **Acceso**: Exclusivo `MIEMBRO`
- **Request Body**:
```json
{
  "mensaje": "¿Qué máquina puedo usar si la Máquina 8 de Press Banca está ocupada?",
  "historial": [
    { "role": "user", "text": "..." },
    { "role": "assistant", "text": "..." }
  ]
}
```
- **Response `200 OK`**:
```json
{
  "respuesta": "Si la Máquina #08 (Press Banca Smith) está ocupada, puedes reemplazarla por la Máquina #14 (Press con Mancuernas) o la Máquina #16 (Cruce de Poleas) haciendo 4 series de 10-12 repeticiones con 90s de descanso.",
  "sugerencias_maquinas": [
    { "numero": 14, "nombre": "Máquina 14 - Press Mancuernas / Banco", "grupo_muscular": "Pectoral / Hombro" },
    { "numero": 16, "nombre": "Máquina 16 - Cruce de Poleas (Cross-Over)", "grupo_muscular": "Pectoral Completo" }
  ],
  "fuente": "gemini" // o "local_fallback"
}
```
- **Error `400 Bad Request`**: `{ "error": "Por favor escribe una pregunta para el entrenador virtual." }`
