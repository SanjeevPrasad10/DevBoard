import { useState } from "react";
import Navbar from "./components/Navbar";
import SectionPage from "./components/sectionPage";
import NameModal from "./components/NameModal";
import AiCopilot from "./components/AiCopilot";

function App() {
  // Initialize state directly from localStorage
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
      // Clear topic selection for a fresh experience
      localStorage.removeItem("devboard_selected_topic_id");
    }
  };

  const handleSwitchUser = () => {
    localStorage.removeItem("devboard_current_user");
    setCurrentUser(null);
    setIsNameModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        user={currentUser}
        onOpenNameModal={() => setIsNameModalOpen(true)}
        onSwitchUser={handleSwitchUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Section Content Area */}
      <main className="flex-1 py-4">
        <SectionPage
          searchQuery={searchQuery}
          currentUser={currentUser}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>DevBoard — Designed for developer roadmaps, DSA tracking & interview prep.</p>
      </footer>

      {/* Name Modal (Single name-based access) */}
      <NameModal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        onUserSet={handleUserSet}
      />

      {/* Autonomous AI Copilot Agent */}
      <AiCopilot />
    </div>
  );
}

export default App;