import { useState, useEffect, useMemo } from "react";
import sectionCall from "../services/sectionServices";
import serveTopic from "../services/topicServices";
import resources, {
  updateResourceStatus,
  createResource,
} from "../services/resources";
import ResourceCard from "./ResourceCard";

const SectionPage = ({ searchQuery = "", currentUser }) => {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);

  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [resourcesList, setResourcesList] = useState([]);

  const [loadingSections, setLoadingSections] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);

  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // New Resource Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("Medium");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmittingResource, setIsSubmittingResource] = useState(false);

  // Helper: Fetch and load resources for a given topic
  const loadResourcesForTopic = async (topicId) => {
    if (!topicId) {
      setResourcesList([]);
      return;
    }
    setLoadingResources(true);
    try {
      const data = await resources(topicId);
      setResourcesList(data || []);
    } catch (err) {
      console.error("Failed to load resources:", err);
      setResourcesList([]);
    } finally {
      setLoadingResources(false);
    }
  };

  // Helper: Fetch topics for a section and auto-load the first topic
  const loadTopicsForSection = async (sectionId) => {
    if (!sectionId) return;
    setLoadingTopics(true);
    setTopics([]);
    setSelectedTopic(null);
    setResourcesList([]);

    try {
      const topicData = await serveTopic(sectionId);
      setTopics(topicData || []);

      if (topicData && topicData.length > 0) {
        const savedTopicId = localStorage.getItem("devboard_selected_topic_id");
        const targetTopic = topicData.find((t) => t.id === savedTopicId) || topicData[0];
        setSelectedTopic(targetTopic);
        await loadResourcesForTopic(targetTopic.id);
      }
    } catch (err) {
      console.error("Failed to load topics:", err);
    } finally {
      setLoadingTopics(false);
    }
  };

  // Initial load: Fetch sections
  useEffect(() => {
    const initData = async () => {
      setLoadingSections(true);
      try {
        const sectionData = await sectionCall();
        setSections(sectionData || []);

        if (sectionData && sectionData.length > 0) {
          const savedSectionId = localStorage.getItem("devboard_selected_section_id");
          const targetSection = sectionData.find((s) => s.id === savedSectionId) || sectionData[0];
          setSelectedSection(targetSection);
          await loadTopicsForSection(targetSection.id);
        }
      } catch (err) {
        console.error("Failed to load initial sections:", err);
      } finally {
        setLoadingSections(false);
      }
    };

    initData();
  }, []);

  // When user clicks a section tab
  const handleSelectSection = async (sec) => {
    if (selectedSection?.id === sec.id) return;
    setSelectedSection(sec);
    localStorage.setItem("devboard_selected_section_id", sec.id);
    await loadTopicsForSection(sec.id);
  };

  // When user clicks a topic in the left sidebar
  const handleSelectTopic = async (topic) => {
    setSelectedTopic(topic);
    localStorage.setItem("devboard_selected_topic_id", topic.id);
    await loadResourcesForTopic(topic.id);
  };

  // Toggle problem completion status
  const handleToggleStatus = async (resource) => {
    const isCurrentlyDone =
      resource.status?.toLowerCase() === "completed" ||
      resource.status?.toLowerCase() === "done" ||
      resource.status?.toLowerCase() === "solved";

    const nextStatus = isCurrentlyDone ? "Learning" : "Completed";

    // Optimistic UI update
    setResourcesList((prev) =>
      prev.map((r) =>
        r.id === resource.id ? { ...r, status: nextStatus } : r
      )
    );

    try {
      await updateResourceStatus(resource.id, nextStatus);
    } catch (err) {
      console.error("Failed to update status in Supabase:", err);
      // Revert if error
      setResourcesList((prev) =>
        prev.map((r) =>
          r.id === resource.id ? { ...r, status: resource.status } : r
        )
      );
    }
  };

  // Update resource image in state
  const handleImageUpdated = (resourceId, newImageUrl) => {
    setResourcesList((prev) =>
      prev.map((r) =>
        r.id === resourceId ? { ...r, image_url: newImageUrl } : r
      )
    );
  };

  // Create new resource under active topic
  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!selectedTopic || !newTitle.trim()) return;

    setIsSubmittingResource(true);
    try {
      const created = await createResource({
        topic_id: selectedTopic.id,
        title: newTitle.trim(),
        url: newUrl.trim() || null,
        difficulty: newDifficulty,
        status: "Learning",
        notes: newNotes.trim() || null,
      });

      if (created) {
        setResourcesList((prev) => [...prev, created]);
      } else {
        // Reload resources for fresh sync
        await loadResourcesForTopic(selectedTopic.id);
      }

      // Reset form
      setNewTitle("");
      setNewUrl("");
      setNewDifficulty("Medium");
      setNewNotes("");
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Failed to create resource:", err);
      alert("Failed to add resource. Check database connection.");
    } finally {
      setIsSubmittingResource(false);
    }
  };

  // Filtered resources based on search, difficulty, and status
  const filteredResources = useMemo(() => {
    return resourcesList.filter((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesNotes) return false;
      }

      // Difficulty filter
      if (difficultyFilter !== "All") {
        if (
          (item.difficulty || "").toLowerCase() !==
          difficultyFilter.toLowerCase()
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "All") {
        const isDone =
          item.status?.toLowerCase() === "completed" ||
          item.status?.toLowerCase() === "done" ||
          item.status?.toLowerCase() === "solved";
        if (statusFilter === "Completed" && !isDone) return false;
        if (statusFilter === "Pending" && isDone) return false;
      }

      return true;
    });
  }, [resourcesList, searchQuery, difficultyFilter, statusFilter]);

  // Topic progress calculations
  const totalCount = resourcesList.length;
  const completedCount = resourcesList.filter(
    (r) =>
      r.status?.toLowerCase() === "completed" ||
      r.status?.toLowerCase() === "done" ||
      r.status?.toLowerCase() === "solved"
  ).length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6">
      {/* --- SECTIONS TOP BAR (TABS) --- */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Roadmaps & Sections
            </span>
            {currentUser && (
              <span className="text-xs text-indigo-400 font-medium">
                • Workspace for {currentUser.name}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500">
            {sections.length} sections
          </span>
        </div>

        {loadingSections ? (
          <div className="flex gap-3 overflow-x-auto pb-2 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 w-28 bg-slate-800/80 rounded-xl shrink-0"
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {sections.map((sec) => {
              const isActive = selectedSection?.id === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => handleSelectSection(sec)}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shrink-0 cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
                  }`}
                >
                  <span>{sec.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MAIN 2-COLUMN DASHBOARD --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: TOPICS SIDEBAR (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
              <span>📚</span>
              <span>{selectedSection?.name || "Topics"}</span>
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {topics.length} topics
            </span>
          </div>

          {loadingTopics ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-slate-800/60 rounded-xl" />
              ))}
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              <p>No topics added to {selectedSection?.name || "this section"} yet.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1">
              {topics.map((t) => {
                const isSelected = selectedTopic?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTopic(t)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600/25 text-indigo-300 border border-indigo-500/50 font-semibold shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="text-xs opacity-60">→</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: RESOURCES & PROBLEMS CANVAS (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Header & Progress Banner */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-xs text-indigo-400 font-medium tracking-wide uppercase">
                  {selectedSection?.name || "Section"}
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {selectedTopic?.name || "Select a Topic"}
                </h2>
              </div>

              {/* Add Resource Button */}
              {selectedTopic && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  <span>+ Add Problem / Resource</span>
                </button>
              )}
            </div>

            {/* Dynamic Progress Bar */}
            <div className="flex items-center justify-between gap-3 mb-1.5 text-xs text-slate-400">
              <span>Topic Progress</span>
              <span className="font-bold text-emerald-400">
                {completedCount} / {totalCount} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-800/80 text-xs">
              {/* Difficulty Filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 mr-1">Difficulty:</span>
                {["All", "Easy", "Medium", "Hard"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      difficultyFilter === diff
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 mr-1">Status:</span>
                {["All", "Pending", "Completed"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      statusFilter === st
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resources List */}
          {loadingResources ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-slate-800/60 rounded-2xl border border-slate-800"
                />
              ))}
            </div>
          ) : !selectedTopic ? (
            <div className="p-12 text-center bg-slate-900/40 border border-slate-800/60 rounded-2xl text-slate-400">
              <span className="text-3xl block mb-2">👈</span>
              <p className="font-semibold text-white mb-1">Select a Topic</p>
              <p className="text-xs text-slate-500">
                Choose a topic from the left sidebar to view its problems and
                resources.
              </p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 border border-slate-800/60 rounded-2xl text-slate-400">
              <span className="text-3xl block mb-2">📝</span>
              <p className="font-semibold text-white mb-1">
                No resources in {selectedTopic.name}
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Be the first to add a problem, documentation link, or study note!
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md"
              >
                + Add First Resource
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResources.map((item) => (
                <ResourceCard
                  key={item.id}
                  item={item}
                  onToggleStatus={handleToggleStatus}
                  onImageUpdated={handleImageUpdated}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add New Resource */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-white">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold">
                Add Resource to {selectedTopic?.name}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Title / Problem Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Valid Anagram or React useEffect Guide"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  URL / Link (LeetCode, GitHub, Docs, etc.)
                </label>
                <input
                  type="url"
                  placeholder="https://leetcode.com/problems/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={newDifficulty}
                  onChange={(e) => setNewDifficulty(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Notes / Explanation / Approach
                </label>
                <textarea
                  rows={3}
                  placeholder="Key observations, time complexity, or personal notes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResource || !newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingResource ? "Saving..." : "Save Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionPage;
