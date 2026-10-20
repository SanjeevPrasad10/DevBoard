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
      }, 700);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-xl p-6 text-slate-900">
        <div className="mb-5 text-center">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 font-bold mx-auto flex items-center justify-center mb-2.5 text-base">
            D
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Welcome to DevBoard
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Enter your name to track your roadmap and problem completion.
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            <span>{message.type === "success" ? "✓" : "!"}</span>
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Sanjiv"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Checking..." : "Continue to DevBoard"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameModal;
