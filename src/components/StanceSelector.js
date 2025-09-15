"use client";

import { useState } from "react";

export default function StanceSelector({ onStanceSelect, rantTitle, onClose }) {
  const [selectedStance, setSelectedStance] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedStance) return;

    setIsSubmitting(true);
    try {
      await onStanceSelect(selectedStance);
    } catch (error) {
      console.error("Error setting stance:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-900/95 backdrop-blur border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors group"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="text-white/60 group-hover:text-white/80"
          >
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="text-white"
            >
              <path
                d="M7 13L10 16L17 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Choose Your Stance
          </h3>
          <p className="text-white/60 text-xs leading-relaxed">
            Select whether you support or oppose this rant.
            <br />
            <span className="text-white/40">
              This choice is permanent for this rant.
            </span>
          </p>
        </div>

        {/* Rant Preview */}
        <div className="bg-zinc-800/50 border border-white/5 rounded-xl p-3 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            <p className="text-xs text-white/50 uppercase tracking-wide">
              Rant Preview
            </p>
          </div>
          <p className="text-white/80 text-xs line-clamp-2 leading-relaxed">
            {rantTitle}
          </p>
        </div>

        {/* Stance Options */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => setSelectedStance("favor")}
            className={`group w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
              selectedStance === "favor"
                ? "border-green-500/60 bg-green-500/10 shadow-lg shadow-green-500/20"
                : "border-white/10 hover:border-green-500/30 hover:bg-green-500/5"
            }`}
          >
            <div className="flex items-center">
              <div className="relative mr-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                    selectedStance === "favor"
                      ? "border-green-500 bg-green-500"
                      : "border-white/30 group-hover:border-green-500/50"
                  }`}
                >
                  {selectedStance === "favor" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-white"
                      >
                        <path
                          d="L7 13L10 16L17 9"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xl">👍</span>
                  <span className="font-semibold text-green-400">In Favor</span>
                </div>
                <p className="text-white/60 text-xs">
                  I agree with this perspective
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedStance("against")}
            className={`group w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
              selectedStance === "against"
                ? "border-red-500/60 bg-red-500/10 shadow-lg shadow-red-500/20"
                : "border-white/10 hover:border-red-500/30 hover:bg-red-500/5"
            }`}
          >
            <div className="flex items-center">
              <div className="relative mr-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                    selectedStance === "against"
                      ? "border-red-500 bg-red-500"
                      : "border-white/30 group-hover:border-red-500/50"
                  }`}
                >
                  {selectedStance === "against" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-white"
                      >
                        <path
                          d="L7 13L10 16L17 9"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xl">👎</span>
                  <span className="font-semibold text-red-400">Against</span>
                </div>
                <p className="text-white/60 text-xs">
                  I disagree with this viewpoint
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedStance || isSubmitting}
          className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
            !selectedStance || isSubmitting
              ? "bg-white/10 text-white/40 cursor-not-allowed"
              : selectedStance === "favor"
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 active:scale-[0.98]"
              : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 active:scale-[0.98]"
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Setting stance...
            </div>
          ) : (
            `Confirm ${
              selectedStance === "favor"
                ? "Support"
                : selectedStance === "against"
                ? "Opposition"
                : "Stance"
            }`
          )}
        </button>

        {/* Footer Note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-white/40 flex items-center justify-center gap-1.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              className="text-purple-400"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M12 16v-4M12 8h.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Your stance affects comment appearance
          </p>
        </div>
      </div>
    </div>
  );
}
