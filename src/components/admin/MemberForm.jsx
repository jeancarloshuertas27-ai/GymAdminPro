import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function MemberForm({ onSuccess }) {
  const { authFetch } = useAuth();
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dni, setDni] = useState('');
  const [celular, setCelular] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rutina, setRutina] = useState('PPL Clásico // Fuerza & Hipertrofia (6 días)');
  const [years, setYears] = useState(1);
  const [months, setMonths] = useState(0);
  const [tipoPago, setTipoPago] = useState('EFECTIVO');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [voucherFile, setVoucherFile] = useState(null);
  const [voucherName, setVoucherName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const photoInputRef = useRef(null);
  const voucherInputRef = useRef(null);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setShowPassword(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleVoucherChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVoucherFile(file);
      setVoucherName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (tipoPago === 'TRANSFERENCIA' && !voucherFile) {
      setError('Debe adjuntar obligatoriamente el comprobante/voucher de pago por transferencia.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('tipo', 'member');
      formData.append('nombres', nombres);
      formData.append('apellidos', apellidos);
      formData.append('dni', dni);
      formData.append('celular', celular);
      formData.append('username', username);
      formData.append('password', password);
      formData.append('rutina', rutina);
      formData.append('anios', String(years));
      formData.append('meses', String(months));
      formData.append('tipo_pago', tipoPago);

      if (numeroOperacion) {
        formData.append('numero_operacion', numeroOperacion);
      }
      if (photoFile) {
        formData.append('foto', photoFile);
      }
      if (voucherFile) {
        formData.append('voucher', voucherFile);
      }

      const res = await authFetch('/api/users', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar atleta');
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
    setUsername('');
    setPassword('');
    setRutina('PPL Clásico // Fuerza & Hipertrofia (6 días)');
    setYears(1);
    setMonths(0);
    setTipoPago('EFECTIVO');
    setNumeroOperacion('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setVoucherFile(null);
    setVoucherName('');
    setError(null);
  };

  return (
    <form className="flex flex-col gap-space-lg" onSubmit={handleSubmit}>
      <div className="bg-surface-container p-space-lg rounded shadow-md relative overflow-hidden border-l-4 border-primary">
        <div className="flex items-center justify-between pb-space-sm mb-space-md border-b border-outline-variant/30">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[22px]">fitness_center</span>
            <span className="font-headline-md text-headline-md uppercase text-on-surface tracking-wider">
              Formulario de Miembro // Registro de Atleta
            </span>
          </div>
          <span className="font-data-mono text-[11px] text-primary uppercase bg-primary/10 px-2 py-0.5 rounded font-bold">
            ROL: MIEMBRO ATLETA
          </span>
        </div>

        {error && (
          <div className="mb-space-md p-space-sm rounded bg-error-container/20 border border-error/40 text-error text-xs font-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-space-lg">
          {/* Bloque 1: Identidad básica & Foto */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-start">
            {/* Foto opcional */}
            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
                <span>Foto (Opcional)</span>
                <span className="text-primary text-[10px]">BIOMETRÍA</span>
              </label>

              <div
                onClick={() => photoInputRef.current?.click()}
                className="relative w-full h-44 bg-surface-container-lowest rounded border border-dashed border-outline-variant/60 hover:border-primary overflow-hidden flex flex-col items-center justify-center group cursor-pointer transition-colors"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview foto" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 text-center">
                    <span className="material-symbols-outlined text-[36px] text-primary mb-1">add_a_photo</span>
                    <span className="font-data-mono text-[11px] text-on-surface font-semibold uppercase leading-tight">
                      Subir Foto
                    </span>
                    <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5 leading-tight">
                      JPG o PNG (1:1)
                    </span>
                  </div>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="mt-1 text-[11px] font-data-mono text-primary hover:underline flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">upload_file</span> Cargar archivo de imagen
              </button>
            </div>

            {/* Nombres, Apellidos, DNI, Celular */}
            <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-space-md">
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
                    placeholder="p. ej. Roberto"
                    className="w-full bg-surface-container-lowest text-on-surface px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-outline-variant/60 border border-surface-container-high"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline-variant">
                    person
                  </span>
                </div>
              </div>

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
                    placeholder="p. ej. Carlos Morales"
                    className="w-full bg-surface-container-lowest text-on-surface px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-outline-variant/60 border border-surface-container-high"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline-variant">
                    badge
                  </span>
                </div>
              </div>

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
                    className="w-full bg-surface-container-lowest text-on-surface font-data-mono px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-outline-variant/60 border border-surface-container-high"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline-variant">
                    fingerprint
                  </span>
                </div>
              </div>

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
                    className="w-full bg-surface-container-lowest text-on-surface font-data-mono px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-outline-variant/60 border border-surface-container-high"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline-variant">
                    phone_iphone
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 2: Credenciales */}
          <div className="pt-space-sm border-t border-outline-variant/20 grid grid-cols-1 md:grid-cols-2 gap-space-md">
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
                  placeholder="@atleta_94"
                  className="w-full bg-surface-container-lowest text-on-surface font-data-mono px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-outline-variant/60 border border-surface-container-high"
                />
                <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline-variant">
                  alternate_email
                </span>
              </div>
            </div>

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
                  className="w-full bg-surface-container-lowest text-on-surface font-data-mono px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-outline-variant/60 border border-surface-container-high"
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

          {/* Bloque 3: Rutina y Tiempo de Membresía */}
          <div className="pt-space-sm border-t border-outline-variant/20 grid grid-cols-1 md:grid-cols-2 gap-space-md items-end">
            <div className="flex flex-col gap-1">
              <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                Rutina Asignada <span className="text-error">*</span>
              </label>
              <div className="relative">
                <select
                  value={rutina}
                  onChange={(e) => setRutina(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface px-space-md py-3 rounded text-body-md focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer border border-surface-container-high"
                >
                  <option value="PPL Clásico // Fuerza & Hipertrofia (6 días)">
                    PPL Clásico // Fuerza & Hipertrofia (6 días)
                  </option>
                  <option value="Torso / Pierna Pro // Atleta Intermedio (4 días)">
                    Torso / Pierna Pro // Atleta Intermedio (4 días)
                  </option>
                  <option value="Fullbody Adaptación Rápida // Novato (3 días)">
                    Fullbody Adaptación Rápida // Novato (3 días)
                  </option>
                  <option value="Protocolo Bestia // SBD Heavy Focus (5 días)">
                    Protocolo Bestia // SBD Heavy Focus (5 días)
                  </option>
                  <option value="Metabolic Conditioning // Shred (4 días)">
                    Metabolic Conditioning // Shred (4 días)
                  </option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline-variant pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Tiempo de Membresía */}
            <div className="flex flex-col gap-1">
              <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                Tiempo de membresía <span className="text-error">*</span>
              </label>
              <div className="flex items-center gap-space-sm bg-surface-container-lowest px-space-md py-2.5 rounded border border-outline-variant/40">
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="number"
                    min="0"
                    value={years}
                    onChange={(e) => setYears(Math.max(0, parseInt(e.target.value || 0, 10)))}
                    className="w-16 bg-surface-container-high text-on-surface font-data-mono font-bold text-center py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/60"
                  />
                  <span className="font-headline-md text-headline-md uppercase text-on-surface tracking-wider">
                    AÑOS
                  </span>
                </div>
                <span className="font-headline-md text-headline-md text-primary tracking-widest uppercase">Y</span>
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={months}
                    onChange={(e) => setMonths(Math.max(0, parseInt(e.target.value || 0, 10)))}
                    className="w-16 bg-surface-container-high text-on-surface font-data-mono font-bold text-center py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/60"
                  />
                  <span className="font-headline-md text-headline-md uppercase text-on-surface tracking-wider">
                    MESES
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 4: Tipo de Pago */}
          <div className="pt-space-sm border-t border-outline-variant/20 flex flex-col gap-space-md">
            <div className="flex flex-col gap-1">
              <label className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                Tipo de Pago <span className="text-error">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                {/* Efectivo */}
                <div
                  onClick={() => setTipoPago('EFECTIVO')}
                  className={`p-space-md rounded cursor-pointer transition-all flex items-center gap-space-sm border ${
                    tipoPago === 'EFECTIVO'
                      ? 'bg-primary-container text-on-primary-container border-primary shadow-[0_0_12px_rgba(31,113,239,0.35)]'
                      : 'bg-surface-container-lowest text-on-surface border-outline-variant/30 hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">payments</span>
                  <div className="flex flex-col text-left">
                    <span className="font-headline-md text-[18px] uppercase leading-none">Efectivo</span>
                    <span className="font-data-mono text-[10px] mt-0.5 opacity-80 uppercase">
                      Cobro directo en caja central
                    </span>
                  </div>
                </div>

                {/* Transferencia */}
                <div
                  onClick={() => setTipoPago('TRANSFERENCIA')}
                  className={`p-space-md rounded cursor-pointer transition-all flex items-center gap-space-sm border ${
                    tipoPago === 'TRANSFERENCIA'
                      ? 'bg-primary-container text-on-primary-container border-primary shadow-[0_0_12px_rgba(31,113,239,0.35)]'
                      : 'bg-surface-container-lowest text-on-surface border-outline-variant/30 hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">account_balance</span>
                  <div className="flex flex-col text-left">
                    <span className="font-headline-md text-[18px] uppercase leading-none">Transferencia</span>
                    <span className="font-data-mono text-[10px] mt-0.5 opacity-80 uppercase">
                      Yape / Plin / Bancos (Voucher Obligatorio)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Caja obligatoria para voucher */}
            {tipoPago === 'TRANSFERENCIA' && (
              <div className="flex flex-col gap-space-sm p-space-md bg-surface-container-low rounded border-l-4 border-tertiary transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs text-tertiary">
                    <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                    <span className="font-data-mono text-[11px] uppercase font-bold tracking-wider">
                      Comprobante de Pago / Voucher Obligatorio
                    </span>
                  </div>
                  <span className="font-data-mono text-[10px] bg-tertiary/20 text-tertiary px-2 py-0.5 rounded font-bold uppercase">
                    REQUERIDO PARA TRANSFERENCIA
                  </span>
                </div>

                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Suba la imagen legible del comprobante o captura de transferencia bancaria para la auditoría de caja.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center">
                  <div className="md:col-span-8">
                    <label
                      onClick={() => voucherInputRef.current?.click()}
                      className="flex flex-col items-center justify-center border-2 border-dashed border-tertiary/60 hover:border-tertiary rounded p-space-md bg-surface-container-lowest cursor-pointer transition-colors group"
                    >
                      <span className="material-symbols-outlined text-tertiary text-[28px] group-hover:scale-110 transition-transform">
                        cloud_upload
                      </span>
                      <span className="font-data-mono text-[12px] text-on-surface font-semibold mt-1">
                        {voucherName || 'Seleccionar o arrastrar imagen del comprobante / voucher'}
                      </span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">
                        Formatos: JPG, PNG, PDF (Máx. 5MB)
                      </span>
                      <input
                        ref={voucherInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleVoucherChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="md:col-span-4 flex flex-col gap-1">
                    <label className="font-data-mono text-[10px] uppercase text-on-surface-variant">
                      Nro. de Operación / Código
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={numeroOperacion}
                        onChange={(e) => setNumeroOperacion(e.target.value)}
                        placeholder="Ej. OP-983142"
                        className="w-full bg-surface-container-lowest text-on-surface font-data-mono px-3 py-2.5 rounded text-body-sm focus:outline-none focus:ring-1 focus:ring-tertiary border border-surface-container-high"
                      />
                      <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-[16px] text-outline-variant">
                        tag
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-space-lg mt-space-md border-t border-outline-variant/30">
          <div className="flex items-center gap-2 text-on-surface-variant font-data-mono text-[11px]">
            <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
            <span>El atleta recibirá credenciales de acceso a la App Móvil con su membresía activada.</span>
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
              className="px-space-xl py-3 rounded bg-primary-container hover:bg-tertiary-container text-on-primary-container hover:text-on-tertiary-container font-headline-md text-[20px] uppercase tracking-wider flex items-center gap-space-xs transition-all shadow-[0_0_20px_rgba(31,113,239,0.35)] cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>{loading ? 'Aceptando...' : 'Aceptar'}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
