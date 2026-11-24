import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Smartphone, Lock, User, Eye, EyeOff, ArrowLeft, QrCode } from 'lucide-react';

export default function MemberLogin({ onLoginSuccess, onBackToPortals }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(username, password, 'miembro');
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Error al autenticar en el portal Miembro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex items-center justify-center p-2 sm:p-4 selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Marco móvil centrado en escritorio */}
      <div className="w-full max-w-[420px] bg-surface-container-low border-4 border-surface-container-highest rounded-[36px] p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between my-auto min-h-[680px]">
        {/* Notch / Speaker bar decorativo móvil */}
        <div className="w-32 h-4 bg-surface-container-highest rounded-full mx-auto mb-4 shrink-0"></div>

        <div>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="font-data-mono text-[10px] text-secondary uppercase font-bold tracking-widest block">
                  APP ATLETA // CARNET MÓVIL
                </span>
                <h1 className="font-headline-lg text-xl uppercase tracking-wide text-on-surface font-bold">
                  PORTAL MIEMBRO
                </h1>
              </div>
            </div>
            {onBackToPortals && (
              <button
                onClick={onBackToPortals}
                className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors"
                title="Volver"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-secondary/20 mb-6 text-center">
            <QrCode className="w-12 h-12 text-secondary mx-auto mb-2 opacity-90" />
            <p className="font-data-mono text-xs text-on-surface-variant uppercase tracking-wider">
              CARNET DIGITAL // QR DINÁMICO
            </p>
            <p className="font-body-sm text-[11px] text-outline mt-1">
              Accede a tus días de vigencia, nivel de combate y promociones exclusivas.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-error-container text-on-error font-data-mono text-xs flex items-start gap-2 border border-error/30">
              <span className="font-bold">ERROR:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block font-data-mono text-[11px] uppercase text-on-surface-variant mb-1">
                Usuario o DNI
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-surface-container text-on-surface font-data-mono text-sm pl-10 pr-3 py-2.5 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-secondary transition-colors"
                  placeholder="@usuario o DNI"
                />
              </div>
            </div>

            <div>
              <label className="block font-data-mono text-[11px] uppercase text-on-surface-variant mb-1">
                Contraseña / PIN
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-surface-container text-on-surface font-data-mono text-sm pl-10 pr-10 py-2.5 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-secondary transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary py-3 rounded-xl font-headline-md text-sm uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>IDENTIFICANDO ATLETA...</span>
              ) : (
                <span>INGRESAR A MI CARNET</span>
              )}
            </button>
          </form>
        </div>

        {/* Barra inferior decorativa de pantalla táctil */}
        <div className="pt-4 border-t border-outline-variant/20 flex flex-col items-center">
          <span className="text-[10px] font-data-mono text-on-surface-variant uppercase tracking-widest">
            GYMCORE ATLETA OS // V1.0
          </span>
          <div className="w-24 h-1 bg-outline-variant/40 rounded-full mt-2"></div>
        </div>
      </div>
    </div>
  );
}
