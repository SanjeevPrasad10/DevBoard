import { useState, useRef, useEffect } from "react";

const getClientSideAnswer = (query) => {
  const q = query.toLowerCase();

  if (q.includes("dsa") || q.includes("pattern") || q.includes("leetcode") || q.includes("algorithm")) {
    return `### 💡 Core DSA Patterns for Technical Interviews

1. **Two Pointers & Sliding Window**
   - *When to use*: Substring problems, sorted pair searches, subarray maximums.
   - *Example*: \`Two Sum II\` (pointers at edges) vs \`Longest Substring Without Repeating Characters\` (expand right, contract left).

2. **Trees & Graph Traversals**
   - *When to use*: Hierarchical data, shortest path, connected components.
   - *Rule of thumb*: BFS with a Queue for shortest path; DFS with recursion for depth, topological sort, and path validation.

3. **Dynamic Programming**
   - *Steps*: 1. Identify optimal substructure. 2. Define state \`dp[i]\`. 3. Write transition formula. 4. Determine base cases.
   - *Optimization*: Many 1D/2D DP problems only need the last 1-2 state values (optimizing space from \`O(N)\` to \`O(1)\`).`;
  }

  if (q.includes("redis") || q.includes("cache")) {
    return `### ⚡ Redis Cache-Aside Pattern Architecture

1. **Read Path (Sub-5ms)**:
   - Application queries Redis key (\`devboard:topics:id\`).
   - **Cache HIT**: Return in < 5ms directly from memory.
   - **Cache MISS**: Query PostgreSQL (Supabase), write response to Redis with TTL (e.g. 1 hour), and return.

2. **Write / Invalidation Path**:
   - When a resource is added or updated (\`POST /api/resources\`), immediately purge the affected Redis cache key.
   - This prevents serving stale data while maintaining fast read throughput.`;
  }

  if (q.includes("react") || q.includes("frontend") || q.includes("action")) {
    return `### ⚛️ React 19 & Modern State Architecture

- **Server Actions & useActionState**: Manage async form submissions natively without manual \`loading\` or \`error\` states.
- **useOptimistic**: Render instantaneous UI checkmarks or problem status changes while background network requests complete.
- **Core Web Vitals**:
  - **LCP**: Inline critical CSS, prioritize hero images with \`fetchpriority="high"\`.
  - **INP**: Break up long JavaScript execution using \`requestAnimationFrame\` or microtasks.`;
  }

  if (q.includes("system design") || q.includes("rate limit") || q.includes("scale") || q.includes("mock")) {
    return `### 🌐 System Design & Scalability Principles

- **Rate Limiting**:
  - *Token Bucket*: Best for handling bursts while maintaining steady consumption.
  - *Distributed*: Use Redis Sorted Sets (\`ZSET\`) with current timestamp as score for atomic sliding window evaluation.
- **Message Queues (Kafka / BullMQ)**:
  - Decouple long-running tasks (e.g. report generation, image compression) from user-facing HTTP handlers.
- **Database Sharding & Indexes**:
  - Always index foreign keys and columns frequently used in \`WHERE\` and \`ORDER BY\` filters.`;
  }

  return `### 🎯 Strategy Recommendation

- **Consistency**: Solving 1-2 problems daily with deep comprehension outperforms solving 20 problems without retention.
- **Verbalize Trade-offs**: In interview settings, always state the brute-force time/space complexity first, then optimize.
- **DevBoard Tracks**: Use the sections above to systematically cover DSA, Frontend, Backend, and System Design!`;
};

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
        text: "👋 Hi! I am your **DevBoard Technical Coach**. I can help you analyze time complexities, master DSA patterns, or explain system design trade-offs. What are you working on today?",
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
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1200);

      const response = await fetch("http://localhost:5000/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });
      clearTimeout(id);

      if (!response.ok) {
        throw new Error("Backend offline");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "Done!",
        },
      ]);
    } catch {
      // Offline fallback: intelligent client-side technical coach
      const reply = getClientSideAnswer(text);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: reply,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Master DSA patterns",
    "Explain Redis cache-aside",
    "React 19 Server Actions",
    "System design tips",
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer text-xs font-semibold group"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 group-hover:scale-110 transition-transform" />
        <span>Study Copilot</span>
        {isOpen ? (
          <span className="text-[11px] text-slate-400 ml-1">✕</span>
        ) : (
          <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
            AI
          </span>
        )}
      </button>

      {/* Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-7rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-xs shadow-2xs">
                &lt;C/&gt;
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xs">
                  DevBoard Copilot
                </h3>
                <p className="text-[10px] text-slate-400">
                  Technical Interview &amp; Roadmap Coach
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const reset = [
                    {
                      role: "assistant",
                      text: "👋 Hi! I am your **DevBoard Technical Coach**. I can help you analyze time complexities, master DSA patterns, or explain system design trade-offs. What are you working on today?",
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

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none">
            {quickPrompts.map((p, idx) => (
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
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
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
                <div className="bg-slate-50 text-slate-500 rounded-2xl px-3.5 py-2 text-xs border border-slate-200/80 animate-pulse">
                  Analyzing roadmap &amp; questions...
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
                placeholder="Ask about DSA complexities, Redis, React 19..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
