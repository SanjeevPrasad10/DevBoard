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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8">
      {/* Sections Tab Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Learning Domains
            </span>
            {currentUser && (
              <span className="text-xs text-indigo-600 font-medium">
                &bull; {currentUser.name}&apos;s Workspace
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">
            {sections.length} domains
          </span>
        </div>

        {loadingSections ? (
          <div className="flex gap-2.5 overflow-x-auto pb-2 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-9 w-32 bg-slate-200 rounded-lg shrink-0"
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {sections.map((sec) => {
              const isActive = selectedSection?.id === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => handleSelectSection(sec)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {sec.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Grid: Topics Sidebar + Resource Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Topics Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
            <h3 className="font-semibold text-sm text-slate-800">
              {selectedSection?.name || "Topics"}
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {topics.length} topics
            </span>
          </div>

          {loadingTopics ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 bg-slate-100 rounded-lg" />
              ))}
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No topics found.
            </div>
          ) : (
            <div className="space-y-1 max-h-[550px] overflow-y-auto pr-0.5">
              {topics.map((t) => {
                const isSelected = selectedTopic?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTopic(t)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="text-[10px] text-slate-400">&rarr;</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Resources Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-600">
                  {selectedSection?.name || "Section"}
                </span>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {selectedTopic?.name || "Select a Topic"}
                </h2>
              </div>

              {selectedTopic && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition cursor-pointer shadow-xs"
                >
                  + Add Resource
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="flex items-center justify-between gap-3 mb-1 text-xs text-slate-500">
              <span>Progress</span>
              <span className="font-semibold text-slate-700">
                {completedCount} of {totalCount} completed ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 text-[11px] mr-1">Difficulty:</span>
                {["All", "Easy", "Medium", "Hard"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                      difficultyFilter === diff
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 text-[11px] mr-1">Status:</span>
                {["All", "Pending", "Completed"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                      statusFilter === st
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:text-slate-900"
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
                  className="h-20 bg-white rounded-xl border border-slate-200"
                />
              ))}
            </div>
          ) : !selectedTopic ? (
            <div className="p-10 text-center bg-white border border-slate-200 rounded-xl text-slate-500">
              <p className="font-medium text-slate-800 text-sm mb-1">
                Select a Topic
              </p>
              <p className="text-xs text-slate-400">
                Choose a topic from the left sidebar to view its problems and resources.
              </p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="p-10 text-center bg-white border border-slate-200 rounded-xl text-slate-500">
              <p className="font-medium text-slate-800 text-sm mb-1">
                No resources in {selectedTopic.name}
              </p>
              <p className="text-xs text-slate-400 mb-3">
                No problems or documentation found for this filter.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
              >
                + Add Resource
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl p-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                Add Resource to {selectedTopic?.name}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm rounded-md"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Title / Problem Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Valid Anagram or React useEffect Guide"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  URL / Link (LeetCode, GitHub, Docs, etc.)
                </label>
                <input
                  type="url"
                  placeholder="https://leetcode.com/problems/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={newDifficulty}
                  onChange={(e) => setNewDifficulty(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Notes / Approach / Time Complexity
                </label>
                <textarea
                  rows={3}
                  placeholder="Key observations, approach, or notes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResource || !newTitle.trim()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition cursor-pointer disabled:opacity-50"
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
