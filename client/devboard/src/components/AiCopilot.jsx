import { useState, useRef, useEffect } from "react";

export default function AiCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("devboard_copilot_messages");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        role: "assistant",
        text: "Hello! I am your **DevBoard AI Copilot**. I can inspect your sections, recommend resources, or help you organize your learning path. How can I help you today?",
      },
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("devboard_copilot_messages", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (promptToSend) => {
    const text = promptToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "Done!",
          actions: data.actionsTaken || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `?? **Connection Error:** Could not reach the DevBoard Agent server (${err.message}). Make sure the Express server is running on port 5000!`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "What sections are currently in DevBoard?",
    "Suggest a 3-day Redis learning plan",
    "Show topics under Backend",
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-full shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 font-medium text-sm border border-white/20 active:scale-95 group"
      >
        <span className="text-lg group-hover:rotate-12 transition-transform duration-300">
          ?
        </span>
        <span>AI Copilot</span>
        {isOpen ? (
          <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">?</span>
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        )}
      </button>

      {/* Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base font-bold shadow-md">
                ??
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                  DevBoard Agent
                  <span className="text-[10px] font-normal px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                    Gemini 3.6
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Direct database & Redis access
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const reset = [
                    {
                      role: "assistant",
                      text: "Hello! I am your **DevBoard AI Copilot**. I can inspect your sections, recommend resources, or help you organize your learning path. How can I help you today?",
                    },
                  ];
                  setMessages(reset);
                  localStorage.removeItem("devboard_copilot_messages");
                }}
                title="Clear Chat History"
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded-md hover:bg-slate-800 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-md hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20"
                      : "bg-slate-800/90 text-slate-200 rounded-bl-none border border-slate-700/60"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Tool Actions Badge Display */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50 flex flex-wrap gap-1.5">
                      {msg.actions.map((act, actIdx) => (
                        <span
                          key={actIdx}
                          className="inline-flex items-center gap-1 text-[10px] bg-slate-900/80 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono"
                        >
                          ? {act.tool}()
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs px-2 py-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                <span>DevBoard Agent is reasoning with tools...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                disabled={loading}
                className="whitespace-nowrap bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-700/60 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask agent to inspect or add resources..."
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl text-xs font-medium transition-colors shadow-sm"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
