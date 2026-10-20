import { useState, useRef, useEffect } from "react";
import { runAgentPrompt } from "../services/agentEngine";

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
        text: "👋 Hi! I am the **DevBoard Autonomous Agent**. Unlike a generic chatbot, I have direct tool access to your learning database.\n\nI can create topics, add LeetCode problems, mark problems as solved, and analyze your preparation readiness.",
        actionsTaken: [
          {
            tool: "inspectEnvironment",
            args: { scope: "DevBoard PostgreSQL & LocalStore" },
          },
        ],
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

  // Auto-scroll
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
      // Execute through the Autonomous Agent Engine (with tool calling)
      const agentResult = await runAgentPrompt(text);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: agentResult.reply,
          actionsTaken: agentResult.actionsTaken || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Agent execution failed: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const agentActionPrompts = [
    "Add 'Trapping Rain Water' (Hard) to Two Pointers",
    "Mark Two Sum as Solved",
    "Create topic 'System Design Patterns' under System Design",
    "Analyze my roadmap progress",
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer text-xs font-semibold group"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 group-hover:scale-110 transition-transform animate-pulse" />
        <span>DevBoard Agent</span>
        {isOpen ? (
          <span className="text-[11px] text-slate-400 ml-1">✕</span>
        ) : (
          <span className="text-[10px] text-indigo-300 font-mono bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">
            ReAct
          </span>
        )}
      </button>

      {/* Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-7rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-xs shadow-2xs">
                &lt;A/&gt;
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-900 text-xs">
                    DevBoard Autonomous Agent
                  </h3>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded-full">
                    Tool Enabled
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  ReAct Multi-Turn Engine &bull; Direct Database Access
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const reset = [
                    {
                      role: "assistant",
                      text: "👋 Hi! I am the **DevBoard Autonomous Agent**. Unlike a generic chatbot, I have direct tool access to your learning database.\n\nI can create topics, add LeetCode problems, mark problems as solved, and analyze your preparation readiness.",
                      actionsTaken: [
                        {
                          tool: "inspectEnvironment",
                          args: { scope: "DevBoard PostgreSQL & LocalStore" },
                        },
                      ],
                    },
                  ];
                  setMessages(reset);
                  localStorage.removeItem("devboard_copilot_messages");
                }}
                className="text-slate-400 hover:text-slate-700 text-[11px] font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                title="Reset conversation"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs p-1 rounded hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Agent Action Prompts */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none">
            {agentActionPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="shrink-0 text-[11px] font-medium bg-white text-slate-700 hover:text-indigo-600 border border-slate-200 px-2.5 py-1 rounded-full cursor-pointer hover:border-indigo-300 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 space-y-3.5 overflow-y-auto">
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    isUser ? "items-end" : "items-start"
                  }`}
                >
                  {/* Tool execution trace badge (if tool was invoked) */}
                  {!isUser && m.actionsTaken && m.actionsTaken.length > 0 && (
                    <div className="mb-1.5 max-w-[90%] p-2.5 rounded-xl bg-slate-100/90 border border-slate-200 text-[11px] font-mono text-slate-800 shadow-2xs">
                      <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200/60">
                        <span className="font-bold text-indigo-700 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          TOOL EXECUTION TRACE
                        </span>
                        <span className="text-[9px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                          ReAct
                        </span>
                      </div>
                      {m.actionsTaken.map((act, i) => (
                        <div key={i} className="text-[10px] text-slate-700 truncate">
                          <span className="font-bold text-slate-900">tool:</span>{" "}
                          <span className="text-indigo-600 font-semibold">{act.tool}</span>
                          <span className="text-slate-500">
                            ({JSON.stringify(act.args || {})})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-indigo-600 text-white shadow-2xs font-medium"
                        : "bg-slate-50 text-slate-800 border border-slate-200/90 shadow-2xs"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 text-slate-500 rounded-2xl px-3.5 py-2 text-xs border border-slate-200/80 animate-pulse flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  <span>Agent reasoning &amp; evaluating tools...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-slate-100 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Instruct the agent (e.g. 'Add problem 3Sum' or 'Mark as solved')..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                Execute
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
