import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function EditUserModal({ athlete, onClose, onSaveSuccess }) {
  const { authFetch } = useAuth();
  const [nombres, setNombres] = useState(athlete?.nombres || '');
  const [apellidos, setApellidos] = useState(athlete?.apellidos || '');
  const [celular, setCelular] = useState(athlete?.celular || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!athlete) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await authFetch(`/api/users/${athlete.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres,
          apellidos,
          celular,
          password: password || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar los datos.');
      }

      if (onSaveSuccess) onSaveSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden p-space-lg border border-surface-container">
        {/* Header */}
        <div className="flex items-center justify-between pb-space-sm border-b border-surface-container mb-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">manage_accounts</span>
            <h3 className="font-headline-md text-headline-md uppercase text-on-surface">
              CORRECCIÓN DE DATOS DE ATLETA
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-space-md p-space-sm rounded bg-error-container/20 border border-error/40 text-error text-xs font-body-sm">
            {error}
          </div>
        )}

        <form className="space-y-space-md" onSubmit={handleSubmit}>
          {/* Apellidos */}
          <div>
            <label className="block font-data-mono text-[11px] uppercase text-on-surface-variant mb-1">
              Apellidos Completos *
            </label>
            <input
              type="text"
              required
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              className="w-full h-11 bg-surface-container-high px-space-md rounded text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary uppercase"
            />
          </div>

          {/* Nombres */}
          <div>
            <label className="block font-data-mono text-[11px] uppercase text-on-surface-variant mb-1">
              Nombres *
            </label>
            <input
              type="text"
              required
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              className="w-full h-11 bg-surface-container-high px-space-md rounded text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Celular */}
          <div>
            <label className="block font-data-mono text-[11px] uppercase text-on-surface-variant mb-1">
              Celular *
            </label>
            <input
              type="tel"
              required
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              className="w-full h-11 bg-surface-container-high px-space-md rounded text-on-surface font-data-mono text-body-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* DNI (Immutable) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block font-data-mono text-[11px] uppercase text-on-surface-variant">
                DNI (Inmutable)
              </label>
              <span className="font-data-mono text-[10px] text-outline flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">lock</span> NO MODIFICABLE
              </span>
            </div>
            <input
              type="text"
              readOnly
              disabled
              value={athlete.dni || ''}
              className="w-full h-11 bg-surface-container-low px-space-md rounded text-outline font-data-mono text-body-md cursor-not-allowed border border-outline-variant/30"
            />
          </div>

          {/* @Username (Immutable) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block font-data-mono text-[11px] uppercase text-on-surface-variant">
                Identificador @Username (Inmutable)
              </label>
              <span className="font-data-mono text-[10px] text-outline flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">lock</span> NO MODIFICABLE
              </span>
            </div>
            <input
              type="text"
              readOnly
              disabled
              value={athlete.username || `@usuario_${athlete.id}`}
              className="w-full h-11 bg-surface-container-low px-space-md rounded text-outline font-data-mono text-body-md cursor-not-allowed border border-outline-variant/30"
            />
          </div>

          {/* Nueva Contraseña */}
          <div>
            <label className="block font-data-mono text-[11px] uppercase text-on-surface-variant mb-1">
              Nueva Contraseña (Dejar en blanco para mantener actual)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-11 bg-surface-container-high px-space-md rounded text-on-surface font-data-mono text-body-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Buttons */}
          <div className="pt-space-sm flex items-center justify-end gap-space-xs border-t border-surface-container">
            <button
              type="button"
              onClick={onClose}
              className="px-space-md py-2.5 rounded bg-surface-container hover:bg-surface-bright text-on-surface font-label-badge text-label-badge tracking-wider uppercase cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-space-md py-2.5 rounded bg-primary text-on-primary font-label-badge text-label-badge tracking-wider uppercase hover:bg-primary-fixed cursor-pointer font-bold shadow"
            >
              {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
