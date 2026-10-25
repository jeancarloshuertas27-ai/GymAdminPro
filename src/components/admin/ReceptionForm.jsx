import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ReceptionForm({ onSuccess }) {
  const { authFetch } = useAuth();
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dni, setDni] = useState('');
  const [celular, setCelular] = useState('');
  const [celularRespaldo, setCelularRespaldo] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('tipo', 'reception');
      formData.append('nombres', nombres);
      formData.append('apellidos', apellidos);
      formData.append('dni', dni);
      formData.append('celular', celular);
      formData.append('celular_respaldo', celularRespaldo);
      formData.append('domicilio', domicilio);
      formData.append('username', username);
      formData.append('password', password);

      const res = await authFetch('/api/users', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar personal de recepción');
      }

      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setNombres('');
    setApellidos('');
    setDni('');
    setCelular('');
    setCelularRespaldo('');
    setDomicilio('');
    setUsername('');
    setPassword('');
    setError(null);
  };

  return (
    <form className="flex flex-col gap-space-lg" onSubmit={handleSubmit}>
      <div className="bg-surface-container p-space-lg rounded shadow-md relative overflow-hidden border-l-4 border-secondary">
        <div className="flex items-center justify-between pb-space-sm mb-space-md border-b border-outline-variant/30">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-secondary text-[22px]">badge</span>
            <span className="font-headline-md text-headline-md uppercase text-on-surface tracking-wider">
              Formulario de Recepción // Registro de Staff
            </span>
          </div>
          <span className="font-data-mono text-[11px] text-secondary uppercase bg-secondary/10 px-2 py-0.5 rounded font-bold">
            ROL: RECEPCIÓN
          </span>
        </div>

        {error && (
          <div className="mb-space-md p-space-sm rounded bg-error-container/20 border border-error/40 text-error text-xs font-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {/* Nombres */}
          <div className="flex flex-col gap-1">
            <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
              Nombres <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                placeholder="p. ej. Mariana Lucía"
                className="w-full bg-surface-container-lowest text-on-surface px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-secondary placeholder:text-outline-variant/60 border border-surface-container-high"
              />
              <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline-variant">
                person
              </span>
            </div>
          </div>

          {/* Apellidos */}
          <div className="flex flex-col gap-1">
            <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
              Apellidos <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                placeholder="p. ej. Quispe Ramos"
                className="w-full bg-surface-container-lowest text-on-surface px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-secondary placeholder:text-outline-variant/60 border border-surface-container-high"
              />
              <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline-variant">
                badge
              </span>
            </div>
          </div>

          {/* DNI */}
          <div className="flex flex-col gap-1">
            <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
              DNI <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={8}
                pattern="[0-9]{8}"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="8 dígitos (p. ej. 74839201)"
                className="w-full bg-surface-container-lowest text-on-surface font-data-mono px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-secondary placeholder:text-outline-variant/60 border border-surface-container-high"
              />
              <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline-variant">
                fingerprint
              </span>
            </div>
          </div>

          {/* Celular */}
          <div className="flex flex-col gap-1">
            <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
              Número Celular <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                placeholder="+51 987 654 321"
                className="w-full bg-surface-container-lowest text-on-surface font-data-mono px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-secondary placeholder:text-outline-variant/60 border border-surface-container-high"
              />
              <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline-variant">
                phone_iphone
              </span>
            </div>
          </div>

          {/* Celular de respaldo */}
          <div className="flex flex-col gap-1">
            <label className="font-data-mono text-[11px] uppercase tracking-wider text-tertiary">
              Número Celular de respaldo <span className="text-tertiary">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={celularRespaldo}
                onChange={(e) => setCelularRespaldo(e.target.value)}
                placeholder="+51 912 345 678 (Familiar / Emergencia)"
                className="w-full bg-surface-container-lowest text-on-surface font-data-mono px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-tertiary placeholder:text-outline-variant/60 border border-surface-container-high"
              />
              <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-tertiary">
                contact_phone
              </span>
            </div>
          </div>

          {/* Domicilio */}
          <div className="flex flex-col gap-1">
            <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
              Domicilio <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={domicilio}
                onChange={(e) => setDomicilio(e.target.value)}
                placeholder="Av. Los Ingenieros 340, Dpto 402 - Santiago de Surco"
                className="w-full bg-surface-container-lowest text-on-surface px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-secondary placeholder:text-outline-variant/60 border border-surface-container-high"
              />
              <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline-variant">
                home_pin
              </span>
            </div>
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1">
            <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
              Nombre de usuario (@) <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@recepcion_manana"
                className="w-full bg-surface-container-lowest text-on-surface font-data-mono px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-secondary placeholder:text-outline-variant/60 border border-surface-container-high"
              />
              <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline-variant">
                alternate_email
              </span>
            </div>
          </div>

          {/* Contraseña */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                Contraseña <span className="text-error">*</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="font-data-mono text-[10px] text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[12px]">auto_fix_high</span> GENERAR SEGURA
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-surface-container-lowest text-on-surface font-data-mono px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-secondary placeholder:text-outline-variant/60 border border-surface-container-high"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-outline-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-space-lg mt-space-md border-t border-outline-variant/30">
          <div className="flex items-center gap-2 text-on-surface-variant font-data-mono text-[11px]">
            <span className="material-symbols-outlined text-[16px] text-secondary">info</span>
            <span>Todos los campos de personal son requeridos para la habilitación del nodo de caja.</span>
          </div>

          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              onClick={handleReset}
              className="px-space-lg py-2.5 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-headline-md text-[17px] uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span> Limpiar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-space-xl py-3 rounded bg-secondary-container hover:bg-primary-container text-on-secondary-container hover:text-on-primary-container font-headline-md text-[20px] uppercase tracking-wider flex items-center gap-space-xs transition-all shadow-[0_0_16px_rgba(48,72,122,0.4)] cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              <span>{loading ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

