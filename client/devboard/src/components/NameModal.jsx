import { useState } from "react";
import { validateOrRegisterUser } from "../services/userService";

const NameModal = ({ isOpen, onClose, onUserSet }) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

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
          text: `✨ Welcome ${user.name}! Created a fresh workspace for you.`,
        });
      } else {
        setMessage({
          type: "success",
          text: `👋 Welcome back, ${user.name}! Access granted.`,
        });
      }

      setTimeout(() => {
        onUserSet(user, isNew);
        onClose();
      }, 1000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3">
            <span className="text-2xl">👤</span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight">Who is learning?</h3>
          <p className="text-xs text-slate-400 mt-1">
            Enter your name to access your personalized DevBoard resources.
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
            }`}
          >
            <span>{message.type === "success" ? "✓" : "⚠️"}</span>
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Sanjiv"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Checking..." : "Continue to DevBoard →"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameModal;

