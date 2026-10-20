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
  const [topicSearch, setTopicSearch] = useState("");

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
        const targetTopic =
          topicData.find((t) => t.id === savedTopicId) || topicData[0];
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
          const targetSection =
            sectionData.find((s) => s.id === savedSectionId) || sectionData[0];
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
      console.error("Failed to update status:", err);
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

  // Update resource notes in state and localStorage
  const handleNotesUpdated = (resourceId, newNotesText) => {
    setResourcesList((prev) => {
      const updated = prev.map((r) =>
        r.id === resourceId ? { ...r, notes: newNotesText } : r
      );
      try {
        const raw = localStorage.getItem("devboard_resources");
        if (raw) {
          const allRes = JSON.parse(raw);
          const synced = allRes.map((r) =>
            r.id === resourceId ? { ...r, notes: newNotesText } : r
          );
          localStorage.setItem("devboard_resources", JSON.stringify(synced));
        }
      } catch {}
      return updated;
    });
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
        setResourcesList((prev) => [created, ...prev]);
      } else {
        await loadResourcesForTopic(selectedTopic.id);
      }

      setNewTitle("");
      setNewUrl("");
      setNewDifficulty("Medium");
      setNewNotes("");
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Failed to create resource:", err);
    } finally {
      setIsSubmittingResource(false);
    }
  };

  // Filtered topics in sidebar
  const filteredTopics = useMemo(() => {
    if (!topicSearch.trim()) return topics;
    const q = topicSearch.toLowerCase();
    return topics.filter((t) => t.name.toLowerCase().includes(q));
  }, [topics, topicSearch]);

  // Filtered resources based on search, difficulty, and status
  const filteredResources = useMemo(() => {
    return resourcesList.filter((item) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesNotes) return false;
      }

      // Difficulty
      if (difficultyFilter !== "All") {
        if (
          (item.difficulty || "").toLowerCase() !==
          difficultyFilter.toLowerCase()
        ) {
          return false;
        }
      }

      // Status
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

  const easyCount = resourcesList.filter(
    (r) => (r.difficulty || "medium").toLowerCase() === "easy"
  ).length;
  const medCount = resourcesList.filter(
    (r) => (r.difficulty || "medium").toLowerCase() === "medium"
  ).length;
  const hardCount = resourcesList.filter(
    (r) => (r.difficulty || "medium").toLowerCase() === "hard"
  ).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8">
      {/* --- SECTIONS TOP BAR (Segmented Tabs) --- */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Learning Domains
            </span>
            {currentUser && (
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                Workspace: {currentUser.name}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {sections.length} core learning domains
          </span>
        </div>

        {loadingSections ? (
          <div className="flex gap-2 overflow-x-auto pb-1 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 w-36 bg-slate-200/80 rounded-xl shrink-0"
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {sections.map((sec) => {
              const isActive = selectedSection?.id === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => handleSelectSection(sec)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer flex items-center gap-2 border ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm scale-101"
                      : "bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200 shadow-2xs"
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
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {selectedSection?.name || "Topics"}
              </h3>
              <p className="text-[11px] text-slate-400">
                Structured patterns &amp; problem tracks
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {topics.length}
            </span>
          </div>

          {/* Mini Search within topics */}
          {topics.length > 3 && (
            <div className="mb-2.5">
              <input
                type="text"
                placeholder="Filter topics..."
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>
          )}

          {loadingTopics ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No matching topics found.
            </div>
          ) : (
            <div className="space-y-1 max-h-[580px] overflow-y-auto pr-0.5">
              {filteredTopics.map((t) => {
                const isSelected = selectedTopic?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTopic(t)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/80 text-indigo-900 border border-indigo-200/80 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className={`text-[11px] ${isSelected ? "text-indigo-600 font-bold" : "text-slate-300"}`}>
                      &rarr;
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: RESOURCES CANVAS (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Header & Stats Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  {selectedSection?.name || "Domain"}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  {selectedTopic?.name || "Select a Topic"}
                </h2>
              </div>

              {selectedTopic && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>+ Add Problem / Resource</span>
                </button>
              )}
            </div>

            {/* Quick Metrics & Progress Row */}
            <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3.5 mb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                <span className="font-semibold text-slate-700">Topic Progress</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[11px]">
                    Mix: <span className="font-medium text-emerald-700">{easyCount}E</span> •{" "}
                    <span className="font-medium text-amber-700">{medCount}M</span> •{" "}
                    <span className="font-medium text-rose-700">{hardCount}H</span>
                  </span>
                  <span className="font-bold text-slate-900">
                    {completedCount} of {totalCount} Solved ({progressPercent}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-medium text-[11px] mr-1">Difficulty:</span>
                {["All", "Easy", "Medium", "Hard"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      difficultyFilter === diff
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100/80 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-medium text-[11px] mr-1">Status:</span>
                {["All", "Pending", "Completed"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      statusFilter === st
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100/80 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {st === "Pending" ? "In Progress" : st === "Completed" ? "Solved" : "All"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resources List */}
          {loadingResources ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-white rounded-2xl border border-slate-200"
                />
              ))}
            </div>
          ) : !selectedTopic ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Select a Topic to Start Learning
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Choose any pattern from the left sidebar to view LeetCode challenges, architecture notes, and solutions.
              </p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-base mb-1">
                No matching resources found
              </h3>
              <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                Try switching the filters or add your own problem/documentation link below.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
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
                  onNotesUpdated={handleNotesUpdated}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modern Add Resource Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 text-slate-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 id="modal-title" className="text-base font-bold text-slate-900">
                  Add Resource / Problem
                </h3>
                <p className="text-[11px] text-slate-400">
                  Adding to: <span className="font-semibold text-slate-700">{selectedTopic?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Title / Problem Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Valid Anagram or React Server Actions"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  URL / Problem Link (LeetCode, GitHub, Docs)
                </label>
                <input
                  type="url"
                  placeholder="https://leetcode.com/problems/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Easy", "Medium", "Hard"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setNewDifficulty(d)}
                      className={`py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        newDifficulty === d
                          ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Solution Notes &amp; Big-O Complexity
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. O(n) time, O(1) space. Use two pointers..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResource || !newTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingResource ? "Saving..." : "Save Problem"}
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
