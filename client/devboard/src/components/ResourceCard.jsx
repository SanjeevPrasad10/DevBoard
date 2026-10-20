import { useState, useRef } from "react";
import { uploadResourceImage } from "../services/resources";

const ResourceCard = ({
  item,
  onToggleStatus,
  onImageUpdated,
  onNotesUpdated,
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editableNotes, setEditableNotes] = useState(item.notes || "");
  const [isUploading, setIsUploading] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const fileInputRef = useRef(null);

  const isCompleted =
    item.status?.toLowerCase() === "completed" ||
    item.status?.toLowerCase() === "done" ||
    item.status?.toLowerCase() === "solved";

  const getDifficultyBadge = (difficulty) => {
    const diff = (difficulty || "Medium").toLowerCase();
    if (diff === "easy") {
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        dot: "bg-emerald-500",
        label: "Easy",
      };
    }
    if (diff === "hard") {
      return {
        bg: "bg-rose-50 text-rose-700 border-rose-200/80",
        dot: "bg-rose-500",
        label: "Hard",
      };
    }
    return {
      bg: "bg-amber-50 text-amber-700 border-amber-200/80",
      dot: "bg-amber-500",
      label: "Medium",
    };
  };

  const diffStyle = getDifficultyBadge(item.difficulty);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please upload an image smaller than 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadResourceImage(item.id, file);
      if (publicUrl) {
        onImageUpdated?.(item.id, publicUrl);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveNotes = () => {
    setIsEditingNotes(false);
    if (onNotesUpdated) {
      onNotesUpdated(item.id, editableNotes);
    }
  };

  // Extract O(n) or complexity hints if present in notes
  const complexityMatches = (item.notes || "").match(/O\([^)]+\)/g);

  return (
    <>
      <div
        className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
          isCompleted
            ? "bg-slate-50/60 border-slate-200/80 shadow-2xs"
            : "bg-white border-slate-200 hover:border-slate-300 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.05)]"
        }`}
      >
        <div className="flex items-start justify-between gap-3.5">
          {/* Checkbox & Details */}
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onToggleStatus(item)}
              className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                isCompleted
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-xs scale-105"
                  : "border-slate-300 hover:border-indigo-600 bg-white shadow-2xs"
              }`}
              title={isCompleted ? "Mark as In Progress" : "Mark as Solved"}
            >
              {isCompleted && (
                <svg
                  className="w-3.5 h-3.5 text-white stroke-[3]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              )}
            </button>

            <div className="flex-1 min-w-0">
              {/* Header tags: Title, Difficulty, Status */}
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h4
                  className={`text-sm sm:text-base font-bold tracking-tight truncate ${
                    isCompleted
                      ? "line-through text-slate-400 font-medium"
                      : "text-slate-900 group-hover:text-indigo-600 transition-colors"
                  }`}
                >
                  {item.title || "Untitled Problem"}
                </h4>

                {/* Difficulty Pill */}
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${diffStyle.bg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${diffStyle.dot}`} />
                  <span>{diffStyle.label}</span>
                </span>

                {/* Status Pill */}
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                    isCompleted
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {isCompleted ? "✓ Solved" : "In Progress"}
                </span>

                {/* Complexity preview badge if detected */}
                {complexityMatches && complexityMatches.length > 0 && (
                  <span className="hidden sm:inline-flex text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/70">
                    {complexityMatches.join(" • ")}
                  </span>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs">
                {/* External Link */}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/70 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <span>Solve / Open</span>
                    <svg
                      className="w-3 h-3 text-indigo-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}

                {/* Notes Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowNotes(!showNotes)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    showNotes
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span>📝</span>
                  <span>{showNotes ? "Hide Notes" : item.notes ? "View Notes" : "+ Add Note"}</span>
                </button>

                {/* Diagram Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  title="Upload problem screenshot or system design diagram"
                >
                  <span>🖼️</span>
                  <span>
                    {isUploading
                      ? "Uploading..."
                      : item.image_url
                      ? "Change Diagram"
                      : "Attach Diagram"}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Attached Image Thumbnail */}
          {item.image_url && (
            <div className="shrink-0">
              <img
                src={item.image_url}
                alt={item.title || "Resource preview"}
                onClick={() => setShowImageZoom(true)}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-200 hover:border-indigo-400 cursor-pointer hover:scale-102 transition shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Collapsible Notes Section */}
        {showNotes && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-100">
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                  <span>Takeaways &amp; Solution Strategy</span>
                </span>
                {!isEditingNotes && (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    Edit Note
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={editableNotes}
                    onChange={(e) => setEditableNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans resize-none"
                    placeholder="Write key observations, edge cases, time/space complexity..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingNotes(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      className="px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-2xs"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              ) : item.notes ? (
                <p className="whitespace-pre-wrap text-slate-700 font-normal">
                  {item.notes}
                </p>
              ) : (
                <p className="text-slate-400 italic">
                  No notes recorded yet. Click &ldquo;Edit Note&rdquo; to add your approach and Big-O complexity!
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal Preview (Zoom) */}
      {showImageZoom && item.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm cursor-zoom-out animate-in fade-in duration-150"
          onClick={() => setShowImageZoom(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl p-4 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImageZoom(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition"
              title="Close Preview"
            >
              ✕
            </button>
            <img
              src={item.image_url}
              alt={item.title || "Zoomed preview"}
              className="max-h-[80vh] w-auto mx-auto object-contain rounded-xl"
            />
            <p className="text-center text-xs font-medium text-slate-600 pt-3">
              {item.title}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ResourceCard;
