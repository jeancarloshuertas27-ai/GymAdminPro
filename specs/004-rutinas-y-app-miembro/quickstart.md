# Quickstart: Feature 004 — Rutinas Semanales, Alertas de Coach y App del Miembro

**Branch**: `004-rutinas-y-app-miembro`  
**Prerrequisitos**: Node.js 18+, dependencias instaladas (`npm install`).

---

## 1. Arrancar el Entorno Completo

Un único comando levanta concurrentemente el servidor Backend SQLite (`http://localhost:3001`) y los 3 portales independientes (`http://localhost:5173`):

```bash
npm run dev
```

*(Opcional)* Si deseas activar respuestas generativas reales con **Google Gemini** en el chat de "Ayuda con IA", configura la variable de entorno antes de arrancar:

```bash
$env:GEMINI_API_KEY="tu_clave_gemini"
npm run dev
```
*(Si no se define `GEMINI_API_KEY`, el sistema utiliza automáticamente el motor de contingencia local con conocimiento de las 25 máquinas del gimnasio).*

---

## 2. Verificación Rápida por Portal

### A. Sitio Administrador (`http://localhost:5173/admin`)
1. Inicia sesión como Administrador (`@admin` / `Admin2026!`).
2. Navega a **Configurar y Manejar Rutinas**:
   - Arrastra máquinas numeradas desde la izquierda hacia los cuadros de **Lunes a Sábado**.
   - Verifica que se numeren `1.`, `2.`, etc. y que al soltar se abra el modal de **Series, Repeticiones y Descanso**.
   - Haz clic en **"Guardar rutina"** (esquina inferior derecha), escribe el nombre (ej. `Hipertrofia 5 Días`), verifica que el botón **"Aceptar"** se habilite y guarda.
   - En **"Manejar Rutinas"**, busca por DNI (ej. `72849102`), verifica la etiqueta `rutina: ...` y reasigna la nueva rutina mediante el desplegable.

### B. Sitio Recepción (`http://localhost:5173/recepcion`)
1. Inicia sesión como Recepcionista (`@recepcion` / `Recep2026!`).
2. Verifica el buscador por DNI en **Manejar Rutinas**.
3. Mantén abierta la pantalla principal (Control de Acceso) para observar la **Alerta en Vivo de 'Llamar Coach'** apenas un miembro la envíe desde su móvil.

### C. Sitio Miembro (`http://localhost:5173/miembro`)
1. Inicia sesión como Miembro (`@atleta1` / `Atleta2026!`).
2. Observa los **días restantes**, **nivel de fidelidad**, botón **Renovar membresía** y el **popup publicitario de promociones** (ciérralo con `'X'` y verifica que no vuelva a saltar dentro de la misma sesión, pero sí al cerrar e iniciar sesión de nuevo).
3. En **Mi Rutina**, alterna entre las pestañas **`Rutina Asignada`** y **`Mi Rutina Privada`**:
   - Ajusta series/descanso de un ejercicio asignado.
   - Crea una rutina privada y comprueba en `/admin` que no aparece en el catálogo global.
4. En **Llamar Coach**, ingresa un número de máquina (ej. `Máquina 8`) y envía la alerta:
   - Verifica en `/recepcion` y `/admin` que aparece la alerta en vivo en <= 3 segundos.
   - Verifica la tarjeta activa con **"Cancelar solicitud"** en el celular, o márcala como **Atendida** desde Recepción.
5. Abre **Ayuda con IA** y envía una consulta sobre reemplazo de máquinas o descanso.

---

## 3. Ejecutar Suite de Pruebas

```bash
npm test
npm run build
```
