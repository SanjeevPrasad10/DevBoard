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
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (diff === "hard") {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB.");
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

  return (
    <>
      <div
        className={`group p-4 rounded-xl border transition-all ${
          isCompleted
            ? "bg-slate-50/60 border-slate-200 text-slate-600"
            : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Status Checkbox & Title */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onToggleStatus(item)}
              className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                isCompleted
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "border-slate-300 hover:border-indigo-600 bg-white"
              }`}
              title={isCompleted ? "Mark as Pending" : "Mark as Completed"}
            >
              {isCompleted && (
                <svg
                  className="w-3 h-3 text-white stroke-[3]"
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
                  className={`text-sm font-semibold tracking-tight truncate ${
                    isCompleted
                      ? "line-through text-slate-400"
                      : "text-slate-900"
                  }`}
                >
                  {item.title || "Untitled Resource"}
                </h4>

                {/* Difficulty Pill */}
                {item.difficulty && (
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${getDifficultyBadge(
                      item.difficulty
                    )}`}
                  >
                    {item.difficulty}
                  </span>
                )}

                {/* Status Badge */}
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                    isCompleted
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {isCompleted ? "Completed" : "Learning"}
                </span>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs">
                {/* External Link */}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                  >
                    <span>Open Resource</span>
                    <svg
                      className="w-3 h-3"
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
                    className="text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {showNotes ? "Hide Notes" : "View Notes"}
                  </button>
                )}

                {/* Image Upload Trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
                >
                  {isUploading
                    ? "Uploading..."
                    : item.image_url
                    ? "Change Diagram"
                    : "Attach Diagram"}
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
                className="w-14 h-14 object-cover rounded-lg border border-slate-200 hover:border-indigo-400 cursor-pointer transition shadow-2xs"
              />
            </div>
          )}
        </div>

        {/* Notes Container */}
        {showNotes && item.notes && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
            <span className="font-semibold text-slate-800 block mb-1">
              Key Notes &amp; Observations:
            </span>
            {item.notes}
          </div>
        )}
      </div>

      {/* Image Modal Preview */}
      {showImageZoom && item.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs cursor-zoom-out"
          onClick={() => setShowImageZoom(false)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white border border-slate-200 rounded-xl p-3 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImageZoom(false)}
              className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition"
            >
              ✕
            </button>
            <img
              src={item.image_url}
              alt={item.title || "Zoomed preview"}
              className="max-h-[80vh] w-auto mx-auto object-contain rounded-lg"
            />
            <p className="text-center text-xs text-slate-500 pt-2">
              {item.title}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ResourceCard;
