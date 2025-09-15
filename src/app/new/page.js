"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { createRant } from "../../lib/rantService";

export default function NewRantPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    if (!user) {
      setError("You must be logged in to post a rant");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Store title and description separately
      await createRant(user.uid, description, {
        title: title,
        contentType: "long-form",
      });

      // Redirect to home page after successful creation
      router.push("/");
    } catch (error) {
      console.error("Error creating rant:", error);
      setError("Failed to post rant. Please try again.");
      setLoading(false);
    }
  }

  const canSubmit = title.trim() && description.trim() && !loading;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/95 backdrop-blur-md border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 12H5m7-7l-7 7 7 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold">Start a Rant</h1>
              <p className="text-xs text-white/60">
                Share what's bothering you
              </p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
              canSubmit
                ? "bg-white text-black hover:bg-gray-100 active:scale-95"
                : "bg-white/20 text-white/60 cursor-not-allowed"
            }`}
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User info */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-semibold">{user?.displayName || "You"}</p>
              <p className="text-sm text-white/60">
                @{user?.email?.split("@")[0] || "user"}
              </p>
            </div>
          </div>

          {/* Title input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">
              What's the argument about?
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Pineapple belongs on pizza"
              required
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 hover:border-white/20 focus:border-white/30 focus:bg-zinc-900/70 transition-all"
              maxLength={100}
            />
            <p className="text-xs text-white/40 text-right">
              {title.length}/100
            </p>
          </div>

          {/* Description input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">
              Make your case
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why should people care about this? What's your stance? Set the stage for a good argument..."
              rows={8}
              required
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 hover:border-white/20 focus:border-white/30 focus:bg-zinc-900/70 transition-all resize-none"
              maxLength={500}
            />
            <p className="text-xs text-white/40 text-right">
              {description.length}/500
            </p>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">
              Guidelines for a killer rant:
            </h3>
            <ul className="text-xs text-white/70 space-y-1">
              <li>
                • Pick <b>Support</b> or <b>Against</b>. No fence-sitting. Stick
                to the topic (e.g., “Android {">"} iPhone”).
              </li>
              <li>
                • Be vicious and witty. Use sarcasm, hyperbole, or petty roasts.
              </li>
              <li>• Keep it short: 100-200 words. Hit hard, fast.</li>
              <li>
                • Roast arguments, not users. “Your take’s rancid garbage”
                works; “You’re a loser” doesn’t.
              </li>
              <li>
                • Provoke with memes or wild digs (e.g., “iPhone’s a shiny
                cage”). Stay on-topic.
              </li>
              <li>
                • Speak your mind freely — no censorship, no sugarcoating.
              </li>
              <li>
                • No illegal, explicit, or doxxing content. Mods flush
                violators.
              </li>
              <li>
                • Reply to slams, quote dumb takes, and upvote the nastiest
                ones.
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-white/20 text-white rounded-xl px-4 py-3 font-medium hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex-1 rounded-xl px-4 py-3 font-medium transition-all ${
                canSubmit
                  ? "bg-white text-black hover:bg-gray-100 active:scale-95"
                  : "bg-white/20 text-white/60 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Posting...
                </div>
              ) : (
                "Post Rant"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
