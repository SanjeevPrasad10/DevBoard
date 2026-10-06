import { useState, useRef } from "react";
import { uploadResourceImage } from "../services/resources";

const ResourceCard = ({
  item,
  onToggleStatus,
  onImageUpdated,
}) => {
  const [showNotes, setShowNotes] = useState(false);
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
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
    if (diff === "hard") {
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    }
    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g. max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadResourceImage(item.id, file);
      onImageUpdated?.(item.id, publicUrl);
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div
        className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
          isCompleted
            ? "bg-slate-800/40 border-emerald-500/20 hover:border-emerald-500/40 hover:-translate-y-0.5"
            : "bg-slate-800/80 border-slate-700/70 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Status Checkbox & Title */}
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onToggleStatus(item)}
              className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                isCompleted
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/40"
                  : "border-slate-600 hover:border-indigo-400 bg-slate-900/60"
              }`}
              title={isCompleted ? "Mark as Pending" : "Mark as Completed"}
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
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4
                  className={`text-base font-semibold tracking-tight truncate ${
                    isCompleted
                      ? "line-through text-slate-400 decoration-slate-500"
                      : "text-slate-100 group-hover:text-indigo-200 transition-colors"
                  }`}
                >
                  {item.title || "Untitled Resource"}
                </h4>

                {/* Difficulty Pill */}
                {item.difficulty && (
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getDifficultyBadge(
                      item.difficulty
                    )}`}
                  >
                    {item.difficulty}
                  </span>
                )}

                {/* Status Badge */}
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                    isCompleted
                      ? "bg-emerald-900/30 text-emerald-400"
                      : "bg-slate-700/50 text-slate-300"
                  }`}
                >
                  {item.status || (isCompleted ? "Completed" : "Pending")}
                </span>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                {/* External Link */}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
                  >
                    <span>Open Link</span>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}

                {/* Notes Toggle */}
                {item.notes && (
                  <button
                    type="button"
                    onClick={() => setShowNotes(!showNotes)}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <span>📝 {showNotes ? "Hide Notes" : "View Notes"}</span>
                  </button>
                )}

                {/* Image Upload Trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 disabled:opacity-50 cursor-pointer"
                  title="Upload diagram or screenshot for this resource"
                >
                  <span>
                    {isUploading
                      ? "⏳ Uploading..."
                      : item.image_url
                      ? "🔄 Change Image"
                      : "🖼️ Add Image"}
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

          {/* Attached Image Thumbnail (if available) */}
          {item.image_url && (
            <div className="relative shrink-0">
              <img
                src={item.image_url}
                alt={item.title || "Resource diagram"}
                onClick={() => setShowImageZoom(true)}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-700 hover:border-indigo-400 cursor-pointer hover:scale-105 transition-all shadow-md"
              />
              <span className="absolute bottom-1 right-1 bg-black/70 text-[10px] text-white px-1 rounded pointer-events-none">
                🔍
              </span>
            </div>
          )}
        </div>

        {/* Expandable Notes Area */}
        {showNotes && item.notes && (
          <div className="mt-3.5 pt-3 border-t border-slate-700/60 text-xs text-slate-300 bg-slate-900/50 p-3 rounded-xl whitespace-pre-wrap leading-relaxed">
            <span className="font-semibold text-indigo-400 block mb-1">
              Notes / Takeaway:
            </span>
            {item.notes}
          </div>
        )}
      </div>

      {/* Image Modal Preview (Zoom) */}
      {showImageZoom && item.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setShowImageZoom(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl p-2 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImageZoom(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center border border-slate-700 hover:bg-slate-700 transition"
            >
              ✕
            </button>
            <img
              src={item.image_url}
              alt={item.title || "Zoomed preview"}
              className="max-h-[85vh] w-auto mx-auto object-contain rounded-xl"
            />
            <p className="text-center text-xs text-slate-400 py-2">
              {item.title}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ResourceCard;

