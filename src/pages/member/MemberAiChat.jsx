import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bot, Send } from 'lucide-react';

const QUICK_PROMPTS = [
  '¿Qué ejercicios y máquinas me tocan en mi rutina?',
  '¿Cuánto descanso debo tomar entre series en mi rutina?',
  '¿Qué máquina alternativa uso si la de hoy está ocupada?',
];

const MENSAJE_ALTA_DEMANDA =
  'El asistente de IA está con alta demanda en este momento. Por favor, intenta de nuevo en unos segundos.';

export default function MemberAiChat() {
  const { authFetch } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '¡Hola! Soy tu Coach Virtual con Gemini IA. Conozco tu rutina asignada y tus rutinas privadas: pregúntame sobre tus ejercicios, máquinas, técnica, series, repeticiones o descansos.',
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

    const historyBefore = messages.map((m) => ({ role: m.role, text: m.text }));
    const nextMessages = [...messages, { role: 'user', text: clean }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

    try {
      const res = await authFetch('/api/miembro/ayuda-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          mensaje: clean,
          historial: historyBefore,
        }),
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo procesar tu consulta.');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.respuesta || MENSAJE_ALTA_DEMANDA,
        },
      ]);
    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout =
        err.name === 'AbortError' ||
        err.message?.toLowerCase().includes('aborted') ||
        err.message?.toLowerCase().includes('timeout');

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: isTimeout ? MENSAJE_ALTA_DEMANDA : (err.message || MENSAJE_ALTA_DEMANDA),
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
            Ayuda con IA // Gemini Coach
          </h2>
          <p className="font-body-sm text-xs text-on-surface-variant truncate">
            Consultas reales sobre tu rutina, técnica y máquinas (#01–#25)
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
                {isUser ? 'Tú' : 'Coach IA'}
              </span>
              <div
                className={`max-w-[90%] p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow ${
                  isUser
                    ? 'bg-primary-container text-on-primary-container rounded-tr-none'
                    : 'bg-surface-container text-on-surface rounded-tl-none border border-outline-variant/20'
                }`}
              >
                <p>{msg.text}</p>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex flex-col items-start">
            <span className="font-label-badge text-[10px] uppercase text-outline mb-1 px-1">
              Coach IA
            </span>
            <div className="bg-surface-container text-on-surface-variant p-3 rounded-2xl rounded-tl-none font-data-mono text-xs animate-pulse border border-outline-variant/20">
              Consultando tu rutina con Gemini...
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
          placeholder="Pregunta sobre tu rutina, técnica o máquinas..."
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
