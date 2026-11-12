import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ReceptionForm({ onSuccess }) {
  const { authFetch } = useAuth();
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dni, setDni] = useState('');
  const [celular, setCelular] = useState('');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
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

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
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
      formData.append('username', username);
      formData.append('password', password);
      if (fotoFile) {
        formData.append('foto', fotoFile);
      }

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
    setFotoFile(null);
    setFotoPreview(null);
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
              Formulario de Recepción // Registro de Personal
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

        {/* Fila superior: Subida de Foto */}
        <div className="mb-space-md flex flex-col sm:flex-row items-center gap-space-md p-space-md bg-surface-container-lowest rounded border border-surface-container-high">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center border-2 border-secondary shrink-0">
            {fotoPreview ? (
              <img src={fotoPreview} alt="Foto Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[36px] text-outline-variant">person</span>
            )}
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
              Foto de Perfil del Personal
            </label>
            <div className="flex items-center gap-space-sm">
              <label
                htmlFor="receptionPhotoInput"
                className="px-space-md py-2 bg-surface-container-high hover:bg-surface-bright text-on-surface rounded font-data-mono text-body-sm uppercase flex items-center gap-1.5 cursor-pointer transition-colors border border-outline-variant/30"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">add_a_photo</span>
                <span>{fotoFile ? 'Cambiar Foto' : 'Subir Foto'}</span>
                <input
                  id="receptionPhotoInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="hidden"
                />
              </label>
              {fotoFile && (
                <span className="font-data-mono text-[11px] text-outline truncate max-w-[200px]">
                  {fotoFile.name}
                </span>
              )}
            </div>
            <span className="font-data-mono text-[10px] text-outline">Formato JPG, PNG o WEBP (Máx. 5MB)</span>
          </div>
        </div>

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
                person
              </span>
            </div>
          </div>

          {/* DNI */}
          <div className="flex flex-col gap-1">
            <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
              DNI (8 Dígitos) <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={8}
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                placeholder="72849102"
                className="w-full bg-surface-container-lowest text-on-surface font-data-mono px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-secondary placeholder:text-outline-variant/60 border border-surface-container-high"
              />
              <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline-variant">
                badge
              </span>
            </div>
          </div>

          {/* Celular */}
          <div className="flex flex-col gap-1">
            <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
              Número de Celular <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                placeholder="987 654 321"
                className="w-full bg-surface-container-lowest text-on-surface font-data-mono px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-secondary placeholder:text-outline-variant/60 border border-surface-container-high"
              />
              <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline-variant">
                smartphone
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
            <span>Campos para personal de recepción: Nombres, Apellidos, DNI, Celular, Foto, Usuario y Contraseña.</span>
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
