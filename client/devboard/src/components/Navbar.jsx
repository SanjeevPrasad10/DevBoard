import { useEffect, useRef } from "react";

const Navbar = ({
  user,
  onOpenNameModal,
  onSwitchUser,
  searchQuery,
  onSearchChange,
  totalSolved = 0,
  totalResources = 0,
}) => {
  const searchInputRef = useRef(null);

  // Global keyboard shortcut ('/' to focus search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const completionRate =
    totalResources > 0 ? Math.round((totalSolved / totalResources) * 100) : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 sm:gap-6">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs shadow-sm ring-1 ring-slate-900/10 transition-transform hover:scale-105">
            &lt;D/&gt;
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                DevBoard
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                Roadmap
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden md:block">
              Curated LeetCode &bull; System Design &bull; Frontend Prep
            </p>
          </div>
        </div>

        {/* Global Search with / keyboard hint */}
        <div className="flex-1 max-w-md mx-auto min-w-[200px]">
          <div className="relative group">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Quick search problems, notes or complexity..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-100/70 border border-slate-200 rounded-xl pl-9 pr-14 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all shadow-2xs"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 p-0.5"
                title="Clear search"
              >
                ✕
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 border border-slate-200 bg-white px-1.5 py-0.5 rounded shadow-2xs pointer-events-none">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Stats & User Workspace */}
        <div className="flex items-center gap-3">
          {totalResources > 0 && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500 font-medium">Solved:</span>
              <span className="font-bold text-slate-900">
                {totalSolved}/{totalResources}
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded-md">
                {completionRate}%
              </span>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold uppercase shadow-2xs">
                  {user.name ? user.name[0] : "U"}
                </div>
                <span className="text-xs text-slate-800 font-semibold max-w-[120px] truncate">
                  {user.name}
                </span>
              </div>
              <button
                onClick={onSwitchUser}
                className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                title="Switch to another learner"
              >
                Switch
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenNameModal}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
            >
              Enter Name
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
