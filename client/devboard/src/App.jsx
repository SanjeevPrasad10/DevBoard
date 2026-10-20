import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import SectionPage from "./components/sectionPage";
import NameModal from "./components/NameModal";
import AiCopilot from "./components/AiCopilot";

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("devboard_current_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [isNameModalOpen, setIsNameModalOpen] = useState(() => {
    try {
      return !localStorage.getItem("devboard_current_user");
    } catch {
      return true;
    }
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Track overall stats across all topics for the top navbar
  const [stats, setStats] = useState(() => {
    try {
      const raw = localStorage.getItem("devboard_resources");
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const solved = list.filter(
            (r) =>
              r.status?.toLowerCase() === "completed" ||
              r.status?.toLowerCase() === "done" ||
              r.status?.toLowerCase() === "solved"
          ).length;
          return { total: list.length, solved };
        }
      }
    } catch {}
    return { total: 16, solved: 8 };
  });

  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const raw = localStorage.getItem("devboard_resources");
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const solved = list.filter(
              (r) =>
                r.status?.toLowerCase() === "completed" ||
                r.status?.toLowerCase() === "done" ||
                r.status?.toLowerCase() === "solved"
            ).length;
            setStats({ total: list.length, solved });
          }
        }
      } catch {}
    };

    window.addEventListener("storage", handleStorageUpdate);
    return () => window.removeEventListener("storage", handleStorageUpdate);
  }, []);

  const handleUserSet = (user, isNew) => {
    setCurrentUser(user);
    localStorage.setItem("devboard_current_user", JSON.stringify(user));
    setIsNameModalOpen(false);

    if (isNew) {
      localStorage.removeItem("devboard_selected_topic_id");
    }
  };

  const handleSwitchUser = () => {
    localStorage.removeItem("devboard_current_user");
    setCurrentUser(null);
    setIsNameModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        onOpenNameModal={() => setIsNameModalOpen(true)}
        onSwitchUser={handleSwitchUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalSolved={stats.solved}
        totalResources={stats.total}
      />

      {/* Main Content Area */}
      <main className="flex-1 py-6 sm:py-8">
        <SectionPage
          searchQuery={searchQuery}
          currentUser={currentUser}
        />
      </main>

      {/* Clean Engineering Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">DevBoard</span>
            <span>&bull;</span>
            <span className="text-slate-500">High-Performance Roadmap &amp; DSA Interview Hub</span>
          </div>
          <p className="text-slate-400">
            Engineered by <span className="font-semibold text-slate-700">Sanjiv Prasad</span> &bull; 100% Offline Resilient
          </p>
        </div>
      </footer>

      {/* Name Modal */}
      <NameModal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        onUserSet={handleUserSet}
      />

      {/* Copilot Assistant */}
      <AiCopilot />
    </div>
  );
}

export default App;
