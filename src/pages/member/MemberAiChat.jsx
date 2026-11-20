import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bot, Send, Dumbbell } from 'lucide-react';

const QUICK_PROMPTS = [
  '¿Qué máquina reemplaza a la Máquina 8 (Press Banca)?',
  '¿Cuánto descanso debo tomar en prensa pesada?',
  'Consejos de postura para Jalón Polea',
];

export default function MemberAiChat() {
  const { authFetch } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '¡Hola! Soy tu Coach Virtual de entrenamiento. Pregúntame sobre máquinas alternativas si alguna está ocupada, tiempos de descanso o técnica de ejercicios.',
      sugerencias: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (textToSend) => {
    const clean = String(textToSend || input).trim();
    if (!clean || loading) return;

    const nextMessages = [...messages, { role: 'user', text: clean }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await authFetch('/api/asistente-ia/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: clean,
          historial: nextMessages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo procesar tu consulta.');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.respuesta,
          sugerencias: data.sugerencias_maquinas || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: err.message || 'Ocurrió un inconveniente al responder. Intenta nuevamente.',
          sugerencias: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-gutter-mobile flex flex-col h-[calc(100vh-145px)] sm:h-[650px] pb-2">
      {/* Cabecera compacta limpia */}
      <div className="bg-surface-container rounded-xl p-3.5 shadow-md flex items-center gap-3 border border-outline-variant/20 shrink-0 mb-3">
        <div className="w-11 h-11 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
          <Bot className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h2 className="font-headline-md text-lg uppercase text-on-surface font-bold leading-tight">
            Asistente de Entrenamiento IA
          </h2>
          <p className="font-body-sm text-xs text-on-surface-variant truncate">
            Técnica, equivalencia de máquinas (#01–#25) y descansos
          </p>
        </div>
      </div>

      {/* Chips rápidos */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar shrink-0">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={loading}
            onClick={() => sendMessage(q)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-on-surface-variant font-data-mono text-[11px] border border-outline-variant/25 transition-all cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Historial de chat */}
      <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <span className="font-label-badge text-[10px] uppercase text-outline mb-1 px-1">
                {isUser ? 'Tú' : 'Coach Virtual'}
              </span>
              <div
                className={`max-w-[90%] p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow ${
                  isUser
                    ? 'bg-primary-container text-on-primary-container rounded-tr-none'
                    : 'bg-surface-container text-on-surface rounded-tl-none border border-outline-variant/20'
                }`}
              >
                <p>{msg.text}</p>

                {!isUser && msg.sugerencias && msg.sugerencias.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-outline-variant/20 space-y-1.5">
                    <span className="font-data-mono text-[10px] uppercase text-primary font-bold block">
                      Alternativas en Sala:
                    </span>
                    {msg.sugerencias.map((s) => (
                      <div
                        key={s.numero}
                        className="bg-surface-container-lowest p-2 rounded-lg flex items-center gap-2 border border-outline-variant/20"
                      >
                        <Dumbbell className="w-4 h-4 text-tertiary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-headline-md text-xs text-on-surface uppercase font-bold truncate">
                            {s.nombre}
                          </p>
                          <p className="font-data-mono text-[10px] text-on-surface-variant">
                            {s.grupo_muscular}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex flex-col items-start">
            <span className="font-label-badge text-[10px] uppercase text-outline mb-1 px-1">
              Coach Virtual
            </span>
            <div className="bg-surface-container text-on-surface-variant p-3 rounded-2xl rounded-tl-none font-data-mono text-xs animate-pulse border border-outline-variant/20">
              Analizando tu consulta...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Barra inferior de envío */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex items-center gap-2 pt-2 border-t border-outline-variant/20 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta sobre ejercicios o máquinas..."
          className="flex-1 bg-surface-container-lowest text-on-surface text-sm px-4 py-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-12 h-12 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container flex items-center justify-center shrink-0 shadow cursor-pointer disabled:opacity-40"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
