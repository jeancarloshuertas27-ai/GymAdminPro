import React from 'react';
import { ShieldCheck, MonitorCheck, Smartphone, Dumbbell, ArrowRight } from 'lucide-react';

export default function PortalSelect({ onSelectPortal }) {
  const portals = [
    {
      id: 'admin',
      title: 'Sitio Administrador',
      subtitle: 'Mando Central & Auditoría',
      path: '/admin',
      icon: ShieldCheck,
      color: 'text-primary',
      bgGrad: 'from-primary-container/20 to-transparent',
      borderColor: 'border-primary/40 hover:border-primary',
      badge: 'Web Escritorio y Móvil',
      badgeColor: 'bg-primary-container text-on-primary-container',
      description: 'Supervisión general, telemetría financiera, lista de cambios, tarifas y personal.',
    },
    {
      id: 'recepcion',
      title: 'Sitio Recepción',
      subtitle: 'Terminal de Mostrador',
      path: '/recepcion',
      icon: MonitorCheck,
      color: 'text-tertiary',
      bgGrad: 'from-tertiary-container/20 to-transparent',
      borderColor: 'border-tertiary/40 hover:border-tertiary',
      badge: 'Exclusivo Web Escritorio',
      badgeColor: 'bg-tertiary-container text-on-tertiary-container',
      description: 'Control de acceso táctico con semáforo por DNI, membresías y venta rápida POS.',
    },
    {
      id: 'miembro',
      title: 'Sitio Miembro',
      subtitle: 'Portal del Atleta',
      path: '/miembro',
      icon: Smartphone,
      color: 'text-secondary',
      bgGrad: 'from-secondary-container/20 to-transparent',
      borderColor: 'border-secondary/40 hover:border-secondary',
      badge: 'Exclusivo Móvil',
      badgeColor: 'bg-secondary-container text-on-secondary-container',
      description: 'Carnet digital interactivo, código QR dinámico de acceso, vigencia y promociones.',
    },
  ];

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col justify-between p-6">
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-4 border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-primary-container flex items-center justify-center text-on-primary-container">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-headline-md text-xl tracking-wider uppercase font-bold text-on-surface">
              GYMCORE <span className="text-primary">//</span> ADMIN PRO
            </h1>
            <p className="font-data-mono text-xs text-on-surface-variant uppercase tracking-widest">
              SISTEMA DE GESTIÓN INTEGRAL
            </p>
          </div>
        </div>
        <span className="font-data-mono text-xs text-primary px-3 py-1 rounded bg-surface-container-high border border-outline-variant/30">
          PERÚ // SOLES S/
        </span>
      </header>

      <main className="max-w-5xl w-full mx-auto my-auto py-12">
        <div className="text-center mb-10">
          <h2 className="font-display-hero text-3xl md:text-5xl uppercase tracking-tight text-on-surface font-extrabold mb-3">
            SELECCIONE EL PORTAL DE ACCESO
          </h2>
          <p className="font-body-md text-on-surface-variant max-w-xl mx-auto">
            Cada sitio opera de forma independiente según el rol autorizado, conectado a la misma base de datos central en tiempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portals.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                onClick={() => onSelectPortal(p.path)}
                className={`bg-surface-container hover:bg-surface-container-high p-6 rounded-xl border ${p.borderColor} transition-all duration-300 cursor-pointer flex flex-col justify-between group shadow-lg hover:shadow-2xl hover:-translate-y-1`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center ${p.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`font-label-badge text-xs uppercase px-2.5 py-1 rounded font-bold ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  </div>

                  <p className="font-data-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1">
                    {p.subtitle}
                  </p>
                  <h3 className="font-headline-lg text-2xl uppercase tracking-wide text-on-surface font-bold mb-3">
                    {p.title}
                  </h3>
                  <p className="font-body-sm text-on-surface-variant text-sm leading-relaxed mb-6">
                    {p.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between text-on-surface group-hover:text-primary transition-colors">
                  <span className="font-data-mono text-xs uppercase font-bold tracking-wider">
                    INGRESAR // {p.path}
                  </span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="max-w-6xl w-full mx-auto text-center py-4 text-xs font-data-mono text-on-surface-variant border-t border-outline-variant/20">
        GYMADMINPRO V1.0 // ARQUITECTURA MULTI-PORTAL // PERSISTENCIA SQLITE UNIFICADA
      </footer>
    </div>
  );
}
