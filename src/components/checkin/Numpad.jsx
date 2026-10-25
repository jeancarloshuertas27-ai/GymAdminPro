import React from 'react';

export default function Numpad({ dni, onDniChange, onSubmit, onClear, onBackspace, onSimulate }) {
  const handleKeyClick = (digit) => {
    if (dni.length < 8) {
      onDniChange(dni + digit);
    }
  };

  return (
    <div className="flex flex-col gap-space-md">
      {/* INGRESO DNI & HARDWARE SCANNER */}
      <div className="bg-surface-container-low p-space-md rounded-DEFAULT shadow-md flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <span className="font-data-mono text-data-mono uppercase text-on-surface-variant text-[12px]">
            TERMINAL DE INGRESO MANUAL
          </span>
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[18px]">barcode_scanner</span>
            <span className="font-data-mono text-data-mono text-primary text-[11px]">SCANNER READY</span>
          </div>
        </div>

        {/* INPUT DISPLAY DNI */}
        <div className="bg-surface-container-lowest p-space-md rounded-DEFAULT flex flex-col gap-space-xs shadow-inner border border-surface-container">
          <div className="flex justify-between items-center">
            <span className="font-data-mono text-data-mono text-on-surface-variant text-[11px]">
              DOCUMENTO NACIONAL IDENTIDAD
            </span>
            <span
              className={`font-data-mono text-data-mono text-[12px] font-bold ${
                dni.length === 8 ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              {dni.length} / 8 DÍGITOS
            </span>
          </div>

          <div className="flex items-center justify-between">
            <input
              type="text"
              readOnly
              value={dni}
              placeholder="________"
              maxLength={8}
              className="bg-transparent font-metric-huge text-[40px] text-on-surface tracking-widest focus:outline-none w-full select-none cursor-default font-bold placeholder:text-outline/30"
            />
            <button
              type="button"
              onClick={onBackspace}
              className="w-10 h-10 rounded-DEFAULT bg-surface-container-high hover:bg-surface-container text-on-surface flex items-center justify-center transition-all shrink-0 active:scale-95"
              title="Borrar último dígito"
            >
              <span className="material-symbols-outlined text-[20px]">backspace</span>
            </button>
          </div>
        </div>

        {/* TECLADO TÁCTIL NUMÉRICO DE ALTO RENDIMIENTO (MÍN 48PX DE TAP TARGET) */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyClick(String(num))}
              className="h-12 bg-surface-container hover:bg-surface-container-high active:bg-primary-container active:text-on-primary-container text-on-surface font-headline-md text-headline-md rounded-DEFAULT transition-all flex items-center justify-center select-none"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={onClear}
            className="h-12 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge uppercase rounded-DEFAULT transition-all flex items-center justify-center active:scale-95"
          >
            LIMPIAR
          </button>

          <button
            type="button"
            onClick={() => handleKeyClick('0')}
            className="h-12 bg-surface-container hover:bg-surface-container-high active:bg-primary-container active:text-on-primary-container text-on-surface font-headline-md text-headline-md rounded-DEFAULT transition-all flex items-center justify-center select-none"
          >
            0
          </button>

          <button
            type="button"
            onClick={onSubmit}
            className="h-12 bg-primary-container hover:bg-tertiary-container hover:shadow-[0_0_16px_rgba(199,83,2,0.5)] text-on-primary-container font-headline-md text-headline-md uppercase tracking-wider rounded-DEFAULT transition-all flex items-center justify-center shadow-[0_0_12px_rgba(31,113,239,0.4)] active:scale-95"
          >
            VALIDAR
          </button>
        </div>
      </div>

      {/* SIMULADOR INTERACTIVO DE ESTADOS */}
      <div className="bg-surface-container-low p-space-md rounded-DEFAULT shadow-md flex flex-col gap-space-sm border border-surface-container">
        <div className="flex items-center justify-between">
          <span className="font-data-mono text-data-mono uppercase text-on-surface-variant text-[11px]">
            CONSOLA SDD // SIMULADOR DE ESTADOS
          </span>
          <span className="font-data-mono text-data-mono text-secondary text-[11px]">OVERRIDE</span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Pruebe el comportamiento del torniquete y las pantallas de respuesta del semáforo:
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onSimulate('VERDE')}
            className="h-12 bg-surface-container hover:bg-primary-container/20 text-primary font-headline-md text-headline-md uppercase tracking-wider rounded-DEFAULT flex flex-col items-center justify-center transition-all shadow-sm active:scale-95"
          >
            <span className="text-[15px] leading-tight">VERDE</span>
            <span className="font-data-mono text-data-mono text-[9px]">AUTORIZADO</span>
          </button>

          <button
            type="button"
            onClick={() => onSimulate('NARANJA')}
            className="h-12 bg-surface-container hover:bg-tertiary-container/20 text-tertiary font-headline-md text-headline-md uppercase tracking-wider rounded-DEFAULT flex flex-col items-center justify-center transition-all shadow-sm active:scale-95"
          >
            <span className="text-[15px] leading-tight">NARANJA</span>
            <span className="font-data-mono text-data-mono text-[9px]">≤ 10 DÍAS</span>
          </button>

          <button
            type="button"
            onClick={() => onSimulate('ROJO')}
            className="h-12 bg-surface-container hover:bg-error-container/20 text-error font-headline-md text-headline-md uppercase tracking-wider rounded-DEFAULT flex flex-col items-center justify-center transition-all shadow-sm active:scale-95"
          >
            <span className="text-[15px] leading-tight">ROJO</span>
            <span className="font-data-mono text-data-mono text-[9px]">DENEGADO</span>
          </button>
        </div>
      </div>
    </div>
  );
}
