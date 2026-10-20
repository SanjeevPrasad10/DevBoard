import { useState } from "react";
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        onOpenNameModal={() => setIsNameModalOpen(true)}
        onSwitchUser={handleSwitchUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content */}
      <main className="flex-1 py-6">
        <SectionPage
          searchQuery={searchQuery}
          currentUser={currentUser}
        />
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium text-slate-600">
            DevBoard &mdash; Developer Roadmap &amp; DSA Tracker
          </p>
          <p className="text-slate-400">
            Built by Sanjiv Prasad &bull; High Performance Caching &amp; Offline Resilient
          </p>
        </div>
      </footer>

      {/* Name Modal */}
      <NameModal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        onUserSet={handleUserSet}
      />

      {/* AI Assistant Drawer */}
      <AiCopilot />
    </div>
  );
}

export default App;
