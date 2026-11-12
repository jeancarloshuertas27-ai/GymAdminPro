import React, { useState } from 'react';

export default function PromoForm({ onPromoCreated }) {
  const [tipo, setTipo] = useState('TARIFA_FIJA');
  const [nombre, setNombre] = useState('');
  const [duracionValor, setDuracionValor] = useState('');
  const [duracionUnidad, setDuracionUnidad] = useState('MESES');
  const [precio, setPrecio] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [publicoObjetivo, setPublicoObjetivo] = useState('TODOS');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
  );
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      const url = URL.createObjectURL(file);
      setBannerPreview(url);
    }
  };

  const handleReset = () => {
    setTipo('TARIFA_FIJA');
    setNombre('');
    setDuracionValor('');
    setDuracionUnidad('MESES');
    setPrecio('');
    setFechaLimite('');
    setPublicoObjetivo('TODOS');
    setBannerFile(null);
    setBannerPreview(
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
    );
    setErrorMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('tipo', tipo);
      formData.append('nombre', nombre);
      formData.append('duracion_valor', duracionValor);
      formData.append('duracion_unidad', duracionUnidad);
      formData.append('precio', precio);
      formData.append('publico_objetivo', publicoObjetivo);
      if (fechaLimite) {
        formData.append('fecha_limite', fechaLimite);
      }
      if (bannerFile) {
        formData.append('banner', bannerFile);
      }

      const token = localStorage.getItem('gymcore_token') || localStorage.getItem('token');
      const res = await fetch('/api/promociones', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar la promoción');
      }

      setToastMessage('TARIFARIO_ACTUALIZADO : Registro sincronizado con el catálogo.');
      setTimeout(() => setToastMessage(null), 5000);

      handleReset();
      if (onPromoCreated) {
        onPromoCreated(data.promocion);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-surface-container-low rounded-xl p-space-lg shadow-xl relative overflow-hidden flex flex-col gap-space-md border border-outline-variant/30">
      <div className="absolute -right-8 -top-8 w-36 h-36 bg-primary-container/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header Form */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-primary-container text-[26px]">tune</span>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-on-surface uppercase tracking-wide">
              FORJA DE PLANES Y TARIFAS
            </span>
            <span className="font-data-mono text-[11px] text-on-surface-variant uppercase">
              ESTABLECER TARIFAS BASE O CAMPAÑAS ESPECIALES
            </span>
          </div>
        </div>
        <span className="px-space-sm py-1 rounded bg-surface-container-highest text-primary font-data-mono text-[11px] uppercase tracking-wider font-semibold">
          TARIFA_SOL / S/
        </span>
      </div>

      {/* Selector Tipo: Tarifa Fija vs Promoción Volátil */}
      <div className="flex flex-col gap-space-xs">
        <label className="font-label-badge text-label-badge text-on-surface-variant uppercase flex items-center justify-between">
          <span>Modalidad de Tarifa</span>
          <span className="font-data-mono text-[10px] text-outline">SELECTOR_ESTRATEGIA</span>
        </label>
        <div className="grid grid-cols-2 gap-space-xs p-1 bg-surface-container rounded-xl">
          <button
            type="button"
            onClick={() => setTipo('TARIFA_FIJA')}
            className={`py-2 px-space-sm rounded-lg font-label-badge text-label-badge uppercase tracking-wider transition-all ${
              tipo === 'TARIFA_FIJA'
                ? 'bg-primary-container text-on-primary-container font-bold shadow-md'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Tarifa Fija (Vigencia Continua)
          </button>
          <button
            type="button"
            onClick={() => setTipo('PROMOCION_VOLATIL')}
            className={`py-2 px-space-sm rounded-lg font-label-badge text-label-badge uppercase tracking-wider transition-all ${
              tipo === 'PROMOCION_VOLATIL'
                ? 'bg-primary-container text-on-primary-container font-bold shadow-md'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Promoción Volátil (Campaña Temporal)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
        {/* Campo 1: Nombre del plan */}
        <div className="flex flex-col gap-space-xs">
          <label className="font-label-badge text-label-badge text-on-surface-variant uppercase flex items-center justify-between" htmlFor="planName">
            <span>Nombre del Plan / Campaña</span>
            <span className="font-data-mono text-[10px] text-outline">IDENTIFICADOR_COMERCIAL</span>
          </label>
          <div className="relative">
            <input
              id="planName"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Plan Anual Mutación 2025"
              className="w-full h-12 bg-surface-container px-space-md rounded text-on-surface font-body-md placeholder:text-outline-variant focus:outline-none focus:bg-surface-container-high transition-all"
            />
            <span className="material-symbols-outlined absolute right-space-md top-1/2 -translate-y-1/2 text-outline-variant text-[20px] pointer-events-none">
              sports_kabaddi
            </span>
          </div>
        </div>

        {/* Campos Numéricos: Duración y Precio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          {/* Duración */}
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-badge text-label-badge text-on-surface-variant uppercase flex items-center justify-between" htmlFor="planDuration">
              <span>Vigencia Operativa</span>
              <span className="font-data-mono text-[10px] text-outline">DIAS / MESES</span>
            </label>
            <div className="flex gap-space-xs">
              <input
                id="planDuration"
                type="number"
                min="1"
                max="1000"
                required
                value={duracionValor}
                onChange={(e) => setDuracionValor(e.target.value)}
                placeholder="12"
                className="w-2/3 h-12 bg-surface-container px-space-md rounded text-on-surface font-data-mono text-[16px] placeholder:text-outline-variant focus:outline-none focus:bg-surface-container-high transition-all"
              />
              <select
                id="durationUnit"
                value={duracionUnidad}
                onChange={(e) => setDuracionUnidad(e.target.value)}
                className="w-1/3 h-12 bg-surface-container px-space-xs rounded text-primary font-label-badge text-label-badge uppercase focus:outline-none focus:bg-surface-container-high cursor-pointer"
              >
                <option value="MESES">Meses</option>
                <option value="DIAS">Días</option>
              </select>
            </div>
          </div>

          {/* Precio en Soles */}
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-badge text-label-badge text-on-surface-variant uppercase flex items-center justify-between" htmlFor="planPrice">
              <span>Importe en Soles (PEN)</span>
              <span className="font-data-mono text-[10px] text-primary">S/ COBRO</span>
            </label>
            <div className="relative">
              <span className="absolute left-space-md top-1/2 -translate-y-1/2 font-data-mono text-primary font-bold">
                S/
              </span>
              <input
                id="planPrice"
                type="number"
                min="1"
                step="0.50"
                required
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="899.00"
                className="w-full h-12 bg-surface-container pl-10 pr-space-md rounded text-on-surface font-data-mono text-[16px] placeholder:text-outline-variant focus:outline-none focus:bg-surface-container-high transition-all"
              />
            </div>
          </div>
        </div>

        {/* Fila opcional: Fecha límite (si es volátil) y Público Objetivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          {/* Público Objetivo */}
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-badge text-label-badge text-on-surface-variant uppercase flex items-center justify-between" htmlFor="planAudience">
              <span>Público / Nivel de Fidelidad</span>
              <span className="font-data-mono text-[10px] text-outline">SEGMENTACIÓN</span>
            </label>
            <select
              id="planAudience"
              value={publicoObjetivo}
              onChange={(e) => setPublicoObjetivo(e.target.value)}
              className="w-full h-12 bg-surface-container px-space-md rounded text-on-surface font-body-md focus:outline-none focus:bg-surface-container-high cursor-pointer"
            >
              <option value="TODOS">Todos los atletas (Abierto)</option>
              <option value="NOVATO">Novato en adelante</option>
              <option value="PRINCIPIANTE">Principiante en adelante</option>
              <option value="PROMEDIO">Promedio en adelante</option>
              <option value="EN_PROGRESO">En Progreso en adelante</option>
              <option value="MUTANDO">Mutando en adelante</option>
              <option value="MAMADO">Mamado/a en adelante</option>
              <option value="DIOS_GRIEGO">Dios/a Griego/a en adelante</option>
              <option value="ANIMAL">Animal (Nivel Apex Exclusivo)</option>
            </select>
          </div>

          {/* Fecha Límite Opcional */}
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-badge text-label-badge text-on-surface-variant uppercase flex items-center justify-between" htmlFor="planDeadline">
              <span>Fecha Límite de Oferta</span>
              <span className="font-data-mono text-[10px] text-tertiary">OPCIONAL VOLÁTIL</span>
            </label>
            <input
              id="planDeadline"
              type="date"
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
              className="w-full h-12 bg-surface-container px-space-md rounded text-on-surface font-data-mono text-[14px] focus:outline-none focus:bg-surface-container-high cursor-pointer"
            />
          </div>
        </div>

        {/* Subida de Imagen Publicitaria & Preview 16:9 */}
        <div className="flex flex-col gap-space-xs">
          <span className="font-label-badge text-label-badge text-on-surface-variant uppercase">
            Banner Publicitario para App de Atletas
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-space-md items-center">
            {/* Trigger Upload */}
            <div className="sm:col-span-5 flex flex-col gap-space-xs">
              <label
                htmlFor="bannerUpload"
                className="group h-32 flex flex-col items-center justify-center bg-surface-container hover:bg-surface-container-high rounded-xl cursor-pointer transition-all p-space-sm text-center border border-dashed border-outline-variant/40"
              >
                <span className="material-symbols-outlined text-outline-variant group-hover:text-primary text-[32px] transition-colors">
                  add_photo_alternate
                </span>
                <span className="font-label-badge text-[12px] uppercase text-on-surface-variant group-hover:text-on-surface mt-1">
                  Cargar Gráfica (16:9)
                </span>
                <span className="font-data-mono text-[10px] text-outline">JPG / PNG / WEBP MÁX 4MB</span>
                <input
                  id="bannerUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Banner Preview */}
            <div className="sm:col-span-7">
              <div className="relative w-full h-32 rounded-xl overflow-hidden bg-surface-container-lowest shadow-md flex items-center justify-center">
                <img
                  src={bannerPreview}
                  alt="Vista previa del banner"
                  className="w-full h-full object-cover object-center filter brightness-90 hover:brightness-100 transition-all"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-dim/90 via-surface-dim/20 to-transparent flex items-end p-space-sm">
                  <div className="flex flex-col">
                    <span className="font-data-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-primary-container text-on-primary-container w-fit font-bold">
                      VISTA PREVIA APP
                    </span>
                    <span className="font-headline-md text-[16px] text-on-surface uppercase tracking-wide line-clamp-1">
                      {nombre || 'Plan Anual Mutación 2025'}
                    </span>
                  </div>
                </div>
                <span className="absolute top-2 right-2 bg-surface-container-highest/80 backdrop-blur px-2 py-0.5 rounded font-data-mono text-[10px] text-primary">
                  S/ {parseFloat(precio || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-error-container text-on-error-container rounded-lg font-data-mono text-[12px]">
            {errorMsg}
          </div>
        )}

        {/* Botones de Guardar */}
        <div className="flex items-center justify-end gap-space-md pt-space-xs">
          <button
            type="button"
            onClick={handleReset}
            className="px-space-md h-12 rounded font-label-badge text-label-badge tracking-wider uppercase text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
          >
            Limpiar Campos
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-12 px-space-xl bg-primary-container hover:bg-tertiary-container text-on-primary-container hover:text-on-tertiary-container rounded font-label-badge text-label-badge tracking-widest uppercase flex items-center gap-space-sm transition-all shadow-[0_0_16px_rgba(31,113,239,0.35)] disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
            <span>{loading ? 'Guardando...' : 'Guardar Promoción'}</span>
          </button>
        </div>
      </form>

      {/* Feedback Alert Toast */}
      {toastMessage && (
        <div className="p-space-sm bg-surface-container-highest rounded-lg flex items-center justify-between border border-primary/30">
          <div className="flex items-center gap-space-sm text-primary">
            <span className="material-symbols-outlined text-[20px]">task_alt</span>
            <span className="font-data-mono text-data-mono text-on-surface text-[12px]">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
    </section>
  );
}

