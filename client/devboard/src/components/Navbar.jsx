const Navbar = ({
  user,
  onOpenNameModal,
  onSwitchUser,
  searchQuery,
  onSearchChange,
  totalSolved = 0,
  totalResources = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
          D
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900 tracking-tight">
              DevBoard
            </span>
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Engineering Roadmaps &amp; Resource Hub
          </p>
        </div>
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-md mx-auto min-w-[200px]">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
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
            type="text"
            placeholder="Search problems, topics or notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* User Actions & Stats */}
      <div className="flex items-center gap-3">
        {totalResources > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-600">
            <span>Solved:</span>
            <span className="font-semibold text-emerald-600">
              {totalSolved}/{totalResources}
            </span>
          </div>
        )}

        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
              <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                {user.name ? user.name[0] : "U"}
              </div>
              <span className="text-xs text-slate-700 font-medium max-w-[120px] truncate">
                {user.name}
              </span>
            </div>
            <button
              onClick={onSwitchUser}
              className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition cursor-pointer"
              title="Switch user"
            >
              Switch
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenNameModal}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs transition cursor-pointer"
          >
            Enter Name
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
