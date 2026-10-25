import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onLoginSuccess }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('@admin_01');
  const [password, setPassword] = useState('Admin2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeProfile, setActiveProfile] = useState('ADMIN');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(username, password);
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p, profileKey) => {
    setUsername(u);
    setPassword(p);
    setActiveProfile(profileKey);
    setError(null);
  };

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md antialiased min-h-screen relative overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* Background Aura Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-primary-container/15 blur-[140px] rounded-full"></div>
        <div className="absolute -bottom-40 right-10 w-[480px] h-[300px] bg-secondary-container/20 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(49,53,61,0.18)_1px,transparent_1px)] [background-size:28px_28px] opacity-40"></div>
      </div>

      <main className="relative z-10 w-full min-h-screen flex items-center justify-center p-gutter">
        <div className="flex flex-col w-full items-center justify-center py-space-lg px-gutter-mobile md:px-margin">
          <div className="relative w-full max-w-[540px] flex flex-col items-center">
            {/* Ambient Neon Edge Glow Backdrops */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary-container/20 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-secondary-container/30 rounded-full blur-[90px] pointer-events-none"></div>

            {/* Top Identity / Isotype Bar */}
            <div className="w-full flex items-center justify-between mb-space-md px-space-xs">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 bg-surface-container-high rounded-lg flex items-center justify-center relative overflow-hidden shadow-md group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-container/40 to-transparent opacity-80"></div>
                  <span className="material-symbols-outlined text-primary text-[24px] relative z-10">bolt</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-md text-headline-md tracking-wider uppercase text-on-surface">
                      GYMADMIN<span className="text-primary-container">PRO</span>
                    </span>
                    <span className="text-outline text-[11px] font-data-mono tracking-widest">//</span>
                    <span className="font-headline-md text-headline-md text-secondary tracking-widest uppercase">
                      GYMCORE
                    </span>
                  </div>
                  <span className="font-data-mono text-[10px] tracking-widest uppercase text-outline">
                    KINETIC PERFORMANCE OS
                  </span>
                </div>
              </div>

              {/* System Status Beacon */}
              <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-1 rounded-full shadow-inner">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
                <span className="font-data-mono text-[11px] tracking-wider text-primary uppercase">ONLINE</span>
              </div>
            </div>

            {/* Main Tactical Access Card */}
            <div className="w-full bg-surface-container-low/95 backdrop-blur-xl rounded-xl p-space-md md:p-space-xl shadow-2xl relative overflow-hidden border border-outline-variant/30">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(31,113,239,0.08),transparent_60%)] pointer-events-none"></div>

              {/* Card Header */}
              <div className="relative z-10 flex flex-col mb-space-lg">
                <div className="flex items-center gap-space-xs text-primary mb-1">
                  <span className="material-symbols-outlined text-[16px]">terminal</span>
                  <span className="font-data-mono text-[11px] tracking-widest uppercase text-primary">
                    SECURE LOGIN PROTOCOL
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-wide">
                  SISTEMA DE ACCESO TÁCTICO <span className="text-primary-container">//</span> GYMADMINPRO
                </h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Ingrese sus credenciales criptográficas para autorizar nodo de telemetría y gestión de alto rendimiento.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="relative z-10 mb-space-md p-space-sm rounded bg-error-container/20 border border-error/40 flex items-center gap-space-xs text-error">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span className="font-body-sm text-[12px]">{error}</span>
                </div>
              )}

              {/* Authentication Form */}
              <form className="relative z-10 flex flex-col gap-space-md" onSubmit={handleSubmit}>
                {/* Input: Username */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label
                      className="font-data-mono text-body-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5"
                      htmlFor="username"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
                      NOMBRE DE USUARIO
                    </label>
                    <span className="font-data-mono text-[10px] text-outline tracking-widest uppercase">ID / EMAIL</span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px] pointer-events-none">
                      account_circle
                    </span>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="@usuario"
                      className="w-full h-12 bg-surface-container-lowest text-on-surface font-body-md pl-11 pr-4 rounded-lg placeholder:text-outline/50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-highest transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Input: Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label
                      className="font-data-mono text-body-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5"
                      htmlFor="password"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">key</span>
                      CONTRASEÑA
                    </label>
                    <span className="font-data-mono text-[10px] text-outline">DNI PERÚ / CIFRADO</span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px] pointer-events-none">
                      lock
                    </span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full h-12 bg-surface-container-lowest text-on-surface font-body-md pl-11 pr-12 rounded-lg placeholder:text-outline/50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-highest transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 w-8 h-8 rounded flex items-center justify-center text-outline hover:text-on-surface transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-space-sm">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-primary-container hover:bg-tertiary-container text-on-primary-container font-headline-md text-headline-md uppercase tracking-wider rounded-lg shadow-lg hover:shadow-primary-container/40 transition-all duration-200 flex items-center justify-center gap-space-sm active:scale-[0.99] disabled:opacity-75"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin material-symbols-outlined text-[22px]">progress_activity</span>
                        <span>VERIFICANDO NODO...</span>
                      </>
                    ) : (
                      <>
                        <span>INICIAR SESIÓN</span>
                        <span className="material-symbols-outlined text-[22px]">bolt</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Demo Credentials Switcher */}
              <div className="relative z-10 mt-space-lg pt-space-md bg-surface-container/60 rounded-xl p-space-sm border border-outline-variant/20">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-data-mono text-[11px] text-outline uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">shield_person</span>
                    ACCESO RÁPIDO // PERFILES DE DEMO
                  </span>
                  <span className="font-data-mono text-[10px] text-primary uppercase">CLIC PARA CARGAR</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs">
                  {/* Admin */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill('@admin_01', 'Admin2026!', 'ADMIN')}
                    className={`text-left rounded-lg p-2.5 flex flex-col justify-between transition-all cursor-pointer border ${
                      activeProfile === 'ADMIN'
                        ? 'bg-surface-container-highest border-primary shadow-[0_0_10px_rgba(31,113,239,0.3)]'
                        : 'bg-surface-container-high/80 border-transparent hover:border-primary/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="material-symbols-outlined text-primary text-[18px]">admin_panel_settings</span>
                        <span className="font-headline-md text-[14px] leading-tight uppercase text-on-surface">Admin</span>
                      </div>
                      <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight block">
                        Control & Auditoría
                      </span>
                    </div>
                    <div className="mt-2 pt-1 border-t border-outline-variant/30 font-data-mono text-[10px]">
                      <span className="text-primary block font-bold">@admin_01</span>
                      <span className="text-outline block">Clave: <strong className="text-on-surface">Admin2026!</strong></span>
                    </div>
                  </button>

                  {/* Reception */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill('@recep_carlos', 'Recep2026!', 'RECEPCION')}
                    className={`text-left rounded-lg p-2.5 flex flex-col justify-between transition-all cursor-pointer border ${
                      activeProfile === 'RECEPCION'
                        ? 'bg-surface-container-highest border-tertiary shadow-[0_0_10px_rgba(255,182,147,0.3)]'
                        : 'bg-surface-container-high/80 border-transparent hover:border-tertiary/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="material-symbols-outlined text-tertiary text-[18px]">point_of_sale</span>
                        <span className="font-headline-md text-[14px] leading-tight uppercase text-on-surface">
                          Recepción
                        </span>
                      </div>
                      <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight block">
                        Check-In & Padrón
                      </span>
                    </div>
                    <div className="mt-2 pt-1 border-t border-outline-variant/30 font-data-mono text-[10px]">
                      <span className="text-tertiary block font-bold">@recep_carlos</span>
                      <span className="text-outline block">Clave: <strong className="text-on-surface">Recep2026!</strong></span>
                    </div>
                  </button>

                  {/* Member */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill('@mateo_val', 'Atleta2026!', 'ATLETA')}
                    className={`text-left rounded-lg p-2.5 flex flex-col justify-between transition-all cursor-pointer border ${
                      activeProfile === 'ATLETA'
                        ? 'bg-surface-container-highest border-secondary shadow-[0_0_10px_rgba(175,198,255,0.3)]'
                        : 'bg-surface-container-high/80 border-transparent hover:border-secondary/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="material-symbols-outlined text-secondary text-[18px]">fitness_center</span>
                        <span className="font-headline-md text-[14px] leading-tight uppercase text-on-surface">Atleta</span>
                      </div>
                      <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight block">
                        App Móvil & Carnet
                      </span>
                    </div>
                    <div className="mt-2 pt-1 border-t border-outline-variant/30 font-data-mono text-[10px]">
                      <span className="text-secondary block font-bold">@mateo_val</span>
                      <span className="text-outline block">Clave: <strong className="text-on-surface">Atleta2026!</strong></span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Security Telemetry Subtext */}
              <div className="relative z-10 mt-space-md flex flex-col sm:flex-row items-center justify-between text-outline font-data-mono text-[10px] tracking-wider gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px] text-primary">enhanced_encryption</span>
                  <span>PROTOCOL ENCRYPTION AES-256</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>TERMINAL NODE V4.8</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                  <span>LATENCY &lt;8ms</span>
                </div>
              </div>
            </div>

            {/* Bottom Institutional Footnote */}
            <div className="mt-space-md flex items-center justify-between w-full px-space-xs text-outline text-[12px] font-body-sm">
              <span>© 2026 GymAdminPro / GymCore Inc.</span>
              <div className="flex items-center gap-space-md">
                <span className="hover:text-on-surface transition-colors">Perú (S/)</span>
                <span className="hover:text-on-surface transition-colors">DNI 8 dígitos</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

