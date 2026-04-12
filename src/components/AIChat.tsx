// AIChat.tsx — Gratis AI-chattassistent för monterkonfiguratorn
import React, { useState, useRef, useEffect } from 'react';
import { interpretMessage } from '../utils/aiInterpreter';
import type { AIAction, AIContext } from '../utils/aiInterpreter';

interface Message {
  id: number;
  role: 'ai' | 'user';
  text: string;
  time: string;
}

interface AIChatProps {
  onActions: (actions: AIAction[]) => void;
  context: AIContext;
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

const QUICK_ACTIONS = [
  { label: '📐 Välj storlek', text: 'Vilka storlekar finns?' },
  { label: '🖼️ Skapa vepa', text: 'Skapa en vepa med blå bakgrund' },
  { label: '🌿 Lägg till växt', text: 'Lägg till ett olivträd' },
  { label: '💡 Lägg till lampor', text: 'Lägg till belysning' },
  { label: '🔄 Börja om', text: 'Börja om från början' },
];

function formatText(text: string): React.ReactNode {
  // Enkel markdown: **bold** och *italic* och radbrytningar
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\n)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part === '\n') return <br key={i} />;
    return <span key={i}>{part}</span>;
  });
}

function getTime(): string {
  return new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}

const WELCOME: Message = {
  id: 0,
  role: 'ai',
  text: '👋 Hej! Jag är din AI-assistent för monterkonfiguratorn.\n\nBeskriv vad du vill ha så bygger jag montern åt dig! Prova t.ex.:\n• *"4x3m U-form med gul matta"*\n• *"Lägg till en 55" TV"*\n• *"Skapa en vepa med texten Acme AB på blå bakgrund"*',
  time: getTime(),
};

export default function AIChat({ onActions, context, triggerRef }: AIChatProps) {
  const [open, setOpen] = useState(false);

  // Exponera toggle via triggerRef
  React.useImperativeHandle(triggerRef as React.RefObject<any>, () => ({
    toggle: () => setOpen(o => !o),
  }));
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [nextId, setNextId] = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, messages]);

  const send = (text: string) => {
    if (!text.trim() || thinking) return;
    const userMsg: Message = { id: nextId, role: 'user', text: text.trim(), time: getTime() };
    setNextId(n => n + 2);
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    // Simulera "tänker" 600–1200ms
    const delay = 600 + Math.random() * 600;
    setTimeout(() => {
      const result = interpretMessage(text, context);
      if (result.actions.length > 0) {
        onActions(result.actions);
      }
      const aiMsg: Message = {
        id: nextId + 1,
        role: 'ai',
        text: result.response,
        time: getTime(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setThinking(false);
    }, delay);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <>
      {/* Chatpanel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 90,
            left: 340,
            width: 380,
            height: 560,
            background: '#ffffff',
            borderRadius: 18,
            boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9998,
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 26 }}>🤖</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>AI-Monterassistent</div>
              <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12 }}>
                {thinking ? '✍️ Tänker...' : '● Online — gratis & lokal'}
              </div>
            </div>
          </div>

          {/* Snabbknappar */}
          <div
            style={{
              padding: '8px 10px 4px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 5,
              borderBottom: '1px solid #f0f0f0',
              flexShrink: 0,
              background: '#fafafa',
            }}
          >
            {QUICK_ACTIONS.map(qa => (
              <button
                key={qa.label}
                onClick={() => send(qa.text)}
                disabled={thinking}
                style={{
                  padding: '4px 9px',
                  borderRadius: 20,
                  border: '1px solid #e0e0e0',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 11,
                  color: '#555',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f0edff')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Meddelandelista */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{ maxWidth: '85%' }}>
                  <div
                    style={{
                      padding: '9px 13px',
                      borderRadius: msg.role === 'user'
                        ? '16px 16px 4px 16px'
                        : '16px 16px 16px 4px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #667eea, #764ba2)'
                        : '#f4f4f8',
                      color: msg.role === 'user' ? '#fff' : '#222',
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      boxShadow: msg.role === 'user'
                        ? '0 2px 8px rgba(102,126,234,0.3)'
                        : '0 1px 4px rgba(0,0,0,0.07)',
                    }}
                  >
                    {formatText(msg.text)}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#aaa',
                      marginTop: 3,
                      textAlign: msg.role === 'user' ? 'right' : 'left',
                      paddingInline: 4,
                    }}
                  >
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {/* Tänker-animation */}
            {thinking && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: '16px 16px 16px 4px',
                    background: '#f4f4f8',
                    display: 'flex',
                    gap: 5,
                    alignItems: 'center',
                  }}
                >
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#a78bfa',
                        animation: `bounce 1.1s ease-in-out ${i * 0.18}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Inmatningsfält */}
          <div
            style={{
              padding: '10px 12px',
              borderTop: '1px solid #eee',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              background: '#fafafa',
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Beskriv din monter..."
              disabled={thinking}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: 22,
                border: '1.5px solid #e0e0e0',
                outline: 'none',
                fontSize: 13.5,
                background: '#fff',
                transition: 'border-color 0.15s',
                color: '#222',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#764ba2')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || thinking}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: 'none',
                background: input.trim() && !thinking
                  ? 'linear-gradient(135deg, #667eea, #764ba2)'
                  : '#e0e0e0',
                cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                transition: 'all 0.2s',
                flexShrink: 0,
                boxShadow: input.trim() && !thinking ? '0 2px 8px rgba(102,126,234,0.35)' : 'none',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* CSS-animation för "tänker"-prickar */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
