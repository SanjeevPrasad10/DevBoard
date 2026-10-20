import { useState } from "react";
import { validateOrRegisterUser } from "../services/userService";

const NameModal = ({ isOpen, onClose, onUserSet }) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const { user, isNew } = await validateOrRegisterUser(name);

      if (isNew) {
        setMessage({
          type: "success",
          text: `Welcome, ${user.name}! Created a fresh workspace for you.`,
        });
      } else {
        setMessage({
          type: "success",
          text: `Welcome back, ${user.name}! Access granted.`,
        });
      }

      setTimeout(() => {
        onUserSet(user, isNew);
        onClose();
      }, 650);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to validate user name.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl p-6 text-slate-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-modal-title"
      >
        <div className="mb-5 text-center">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-mono font-bold mx-auto flex items-center justify-center mb-3 text-sm shadow-sm ring-4 ring-indigo-50">
            &lt;D/&gt;
          </div>
          <h3 id="name-modal-title" className="text-lg font-bold text-slate-900 tracking-tight">
            Welcome to DevBoard
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Enter your name to track your roadmap, completed LeetCode problems, and interview notes.
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            <span>{message.type === "success" ? "✓" : "!"}</span>
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Your Name / Alias
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Sanjiv"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Initializing Workspace..." : "Continue to DevBoard →"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameModal;
