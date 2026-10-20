// client/src/components/ChatReactions.jsx
import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, ChevronDown, ChevronUp, Smile } from "lucide-react";

const QUICK_EMOJIS = ["🔥", "💡", "👏", "😂", "🤔", "🎉", "❤️", "⚡"];

export default function ChatReactions({
  messages,
  floatingReactions,
  onSendMessage,
  onSendReaction
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  return (
    <>
      {/* 1. Capa de Reacciones Flotantes por la Pantalla */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingReactions.map((item) => (
          <div
            key={item.id}
            style={{
              left: `${item.x || Math.random() * 60 + 20}%`,
              bottom: "80px"
            }}
            className="absolute animate-float-up flex flex-col items-center"
          >
            <span className="text-4xl filter drop-shadow-md">{item.emoji}</span>
            <span
              style={{ backgroundColor: item.color?.hex || "#4f46e5" }}
              className="text-[10px] text-white px-2 py-0.5 rounded-full font-bold shadow-md -mt-1"
            >
              {item.player}
            </span>
          </div>
        ))}
      </div>

      {/* 2. Barra Inferior Fija de Reacciones Rápidas y Toggle de Chat */}
      <div className="fixed bottom-3 right-3 sm:right-6 z-40 flex flex-col items-end gap-2">
        {/* Panel de Chat Desplegable */}
        {isOpen && (
          <div className="w-80 sm:w-96 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-80 transition-all animate-in fade-in slide-in-from-bottom-2">
            {/* Cabecera del Chat */}
            <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Chat de la Sala</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Lista de Mensajes */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              {messages?.map((msg) => {
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-400 text-[10px] font-medium inline-block">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{msg.avatar || "👤"}</span>
                      <span
                        style={{ color: msg.color?.hex || "#94a3b8" }}
                        className="font-bold text-[11px]"
                      >
                        {msg.sender}
                      </span>
                    </div>
                    <div className="bg-slate-800/80 text-slate-200 rounded-xl px-3 py-1.5 w-fit max-w-[90%] break-words ml-5">
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Envío */}
            <form onSubmit={handleSubmit} className="p-2 bg-slate-950/90 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                maxLength={180}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe a tus amigos..."
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Botones de Acción: Emojis Rápidos y Botón de Abrir Chat */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl">
          {/* Emojis Rápidos */}
          <div className="flex items-center gap-1">
            {QUICK_EMOJIS.slice(0, 5).map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onSendReaction(emoji)}
                className="w-8 h-8 rounded-xl hover:bg-slate-800 flex items-center justify-center text-lg transition active:scale-125 hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-6 bg-slate-800 mx-0.5" />

          {/* Toggle de Chat */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chat</span>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </>
  );
}
