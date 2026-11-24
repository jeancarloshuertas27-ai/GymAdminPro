import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess, onBackToPortals }) {
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
      const user = await login(username, password, 'admin');
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Error al autenticar en el portal Administrador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex items-center justify-center p-4 relative selection:bg-primary-container selection:text-on-primary-container">
      <div className="w-full max-w-[480px] bg-surface-container-low border border-primary/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <span className="font-data-mono text-xs text-primary uppercase font-bold tracking-widest block">
                PORTAL EXCLUSIVO // ROL MASTER
              </span>
              <h1 className="font-headline-lg text-2xl uppercase tracking-wide text-on-surface font-bold">
                ADMINISTRADOR
              </h1>
            </div>
          </div>
          {onBackToPortals && (
            <button
              onClick={onBackToPortals}
              className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors"
              title="Volver al selector de portales"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        <p className="font-body-sm text-on-surface-variant text-sm mb-6">
          Inicio de sesión exclusivo para supervisión general, telemetría financiera y personal. Otras cuentas serán rechazadas.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error font-data-mono text-xs flex items-start gap-2 border border-error/30 animate-shake">
            <span className="font-bold">ERROR:</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-data-mono text-xs uppercase text-on-surface-variant mb-1">
              Usuario Administrador
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-surface-container text-on-surface font-data-mono text-sm pl-11 pr-4 py-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary transition-colors"
                placeholder="@usuario"
              />
            </div>
          </div>

          <div>
            <label className="block font-data-mono text-xs uppercase text-on-surface-variant mb-1">
              Contraseña Master
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-surface-container text-on-surface font-data-mono text-sm pl-11 pr-11 py-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-primary-container hover:bg-tertiary-container text-on-primary-container hover:text-on-tertiary-container py-3.5 rounded-xl font-headline-md text-base uppercase tracking-wider font-bold transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>VERIFICANDO ACCESO...</span>
            ) : (
              <span>INGRESAR A SUPERVISIÓN MASTER</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs font-data-mono text-on-surface-variant">
          <span>SUITE // ADMIN</span>
          <span className="text-primary">EN LÍNEA</span>
        </div>
      </div>
    </div>
  );
}
