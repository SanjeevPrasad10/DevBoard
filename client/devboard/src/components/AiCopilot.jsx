import { useState, useRef, useEffect } from "react";

const getClientSideAnswer = (query) => {
  const q = query.toLowerCase();

  if (q.includes("dsa") || q.includes("algorithm") || q.includes("leetcode")) {
    return `For Data Structures & Algorithms, prioritize mastery of recurring patterns over rote memorization:
1. **Arrays & Two Pointers**: Start with Two Sum and Sliding Window problems (e.g., Longest Substring Without Repeating Characters).
2. **Graphs & Trees**: Master recursive DFS for tree inversions and BFS for shortest path or level-order traversals.
3. **Dynamic Programming**: Break problems into subproblems. Define state \`dp[i]\`, transition relations, and base cases.
4. **Time & Space**: Always analyze Big-O complexities before coding in interviews.`;
  }

  if (q.includes("redis") || q.includes("cache")) {
    return `**Redis Cache-Aside Pattern Overview**:
1. **Read Path**: The application first checks Redis using a unique key (e.g. \`devboard:topics:id\`). If a cache hit occurs, it returns data in < 5ms.
2. **Cache Miss**: If absent, query PostgreSQL (Supabase), write the result into Redis with a TTL (e.g. 1 hour), and return to client.
3. **Write / Invalidation Path**: Whenever a resource is created, updated, or deleted, explicitly purge the affected Redis cache keys to prevent stale data.`;
  }

  if (q.includes("react") || q.includes("frontend")) {
    return `**React 19 & Modern Frontend Best Practices**:
- **Server Actions & useActionState**: Handle mutations directly without repetitive loading states or manual try/catch boilerplate.
- **useOptimistic**: Provide immediate UI updates for checkmarks or comments before server confirmation.
- **Performance**: Measure Core Web Vitals (LCP, INP, CLS). Prioritize critical above-the-fold assets and minimize long main-thread tasks.`;
  }

  if (q.includes("system design") || q.includes("rate limit") || q.includes("scale")) {
    return `**System Design Essentials**:
- **Rate Limiting**: Use the Token Bucket algorithm for burst tolerance, or Sliding Window Log with Redis ZSET for strict distributed windows.
- **Message Queues**: Decouple synchronous API traffic from asynchronous worker jobs using Kafka or BullMQ.
- **Database Optimization**: Ensure columns used in WHERE, JOIN, and ORDER BY clauses have appropriate indexes (B-Tree for standard lookups, GIN for text/JSONB).`;
  }

  if (q.includes("section") || q.includes("topic") || q.includes("what is in devboard")) {
    return `DevBoard organizes learning into 4 core domains:
1. **Data Structures & Algorithms** (Arrays, Two Pointers, Trees, Dynamic Programming)
2. **Frontend Architecture** (React 19, Web Performance, Core Web Vitals)
3. **Backend & Systems** (Node.js event loop, Redis caching, PostgreSQL indexes)
4. **System Design & DevOps** (Distributed rate limiting, message queues, Docker)

You can check off completed topics, write study notes, and attach architecture diagrams directly to cards!`;
  }

  return `Here are some recommendations based on your learning journey:
- Consistency matters more than volume: solve 1-2 focused problems daily and document key takeaways.
- Focus on explaining your thought process out loud—trade-offs between time vs space complexity are what interviewers evaluate most.
- Explore the sections above to track your progress and mark topics as 'Completed'!`;
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
        text: "Hi! I am your DevBoard Advisor. Ask me about DSA patterns, system design trade-offs, or how to organize your preparation roadmap.",
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
      // Offline fallback: intelligent client-side assistance
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
    "How to master DSA patterns?",
    "Explain Redis cache-aside",
    "What are React 19 Server Actions?",
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-md text-xs font-medium cursor-pointer transition"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span>Copilot</span>
        {isOpen && <span className="text-[10px] text-slate-400 ml-1">✕</span>}
      </button>

      {/* Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-16 right-5 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-xs">
                DevBoard Copilot
              </h3>
              <p className="text-[11px] text-slate-400">
                Roadmap &amp; Technical Advisor
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const reset = [
                    {
                      role: "assistant",
                      text: "Hi! I am your DevBoard Advisor. Ask me about DSA patterns, system design trade-offs, or how to organize your preparation roadmap.",
                    },
                  ];
                  setMessages(reset);
                  localStorage.removeItem("devboard_copilot_messages");
                }}
                className="text-slate-400 hover:text-slate-700 text-xs px-2 py-0.5 rounded"
                title="Clear Chat"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs p-1 rounded"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="shrink-0 text-[11px] bg-white text-slate-600 hover:text-slate-900 border border-slate-200 px-2.5 py-1 rounded-full cursor-pointer transition"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-800 border border-slate-200/80"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-500 rounded-xl px-3 py-2 text-xs border border-slate-200 animate-pulse">
                  Thinking...
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
                placeholder="Ask about DSA, Redis, system design..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50"
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
