"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createRant } from "../lib/rantService";

export default function CreateRant({ onRantCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const maxLength = 280;
  const charactersLeft = maxLength - content.length;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Rant content cannot be empty");
      return;
    }

    if (content.length > maxLength) {
      setError(`Rant cannot exceed ${maxLength} characters`);
      return;
    }

    if (!user) {
      setError("You must be logged in to post a rant");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const newRant = await createRant(user.uid, content);
      setContent("");

      if (onRantCreated) {
        onRantCreated(newRant);
      }
    } catch (error) {
      console.error("Error creating rant:", error);
      setError("Failed to post rant. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setContent(value);
      setError("");
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 mb-6">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>

          {/* Input area */}
          <div className="flex-1">
            <textarea
              value={content}
              onChange={handleInputChange}
              placeholder="What's making you angry today?"
              className="w-full bg-transparent text-white placeholder:text-white/50 border-none outline-none resize-none text-lg"
              rows={3}
              disabled={isSubmitting}
            />

            {/* Controls */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-4">
                {/* Character count */}
                <span
                  className={`text-sm ${
                    charactersLeft < 20
                      ? charactersLeft < 0
                        ? "text-red-400"
                        : "text-yellow-400"
                      : "text-white/60"
                  }`}
                >
                  {charactersLeft}
                </span>

                {/* Future: Media upload buttons */}
                <div className="flex items-center gap-2 opacity-50">
                  <button
                    type="button"
                    disabled
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                    title="Image upload (coming soon)"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 16V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle
                        cx="8.5"
                        cy="8.5"
                        r="1.5"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M15 9l-3 3-2-2-4 4"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    disabled
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                    title="Video upload (coming soon)"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <polyline
                        points="14,2 14,8 20,8"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <triangle points="10,12 16,8 16,16" fill="currentColor" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting || charactersLeft < 0}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  !content.trim() || isSubmitting || charactersLeft < 0
                    ? "bg-white/20 text-white/50 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700 active:scale-95"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Posting...
                  </div>
                ) : (
                  "Rant"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
