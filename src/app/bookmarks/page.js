"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUserBookmarks } from "../../lib/bookmarkService";
import { getRant } from "../../lib/rantService";
import RantCard from "../../components/RantCard";

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarkedRants, setBookmarkedRants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookmarkedRants = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get user's bookmarked rant IDs
        const bookmarkIds = await getUserBookmarks(user.uid, 50);

        if (bookmarkIds.length === 0) {
          setBookmarkedRants([]);
          setLoading(false);
          return;
        }

        // Fetch the actual rant data for each bookmarked ID
        const rantPromises = bookmarkIds.map(async (rantId) => {
          try {
            const rant = await getRant(rantId);
            return rant;
          } catch (error) {
            console.error(`Error fetching rant ${rantId}:`, error);
            return null;
          }
        });

        const rants = await Promise.all(rantPromises);
        // Filter out null values (rants that couldn't be fetched)
        const validRants = rants.filter((rant) => rant !== null);

        setBookmarkedRants(validRants);
        setError("");
      } catch (error) {
        console.error("Error fetching bookmarked rants:", error);
        setError("Failed to load bookmarked rants. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedRants();
  }, [user]);

  const handleVoteUpdate = (rantId, voteResult) => {
    // Update local rant data if needed
    // This is handled by the RantCard component's local state
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center pb-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not Logged In</h1>
          <p className="text-white/60">Please log in to view your bookmarks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/95 backdrop-blur-md border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Bookmarks</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto">
        {loading ? (
          // Loading skeleton
          <div className="divide-y divide-white/10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-4 py-6 animate-pulse">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/10" />
                  <div className="flex-1">
                    <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
                    <div className="h-5 bg-white/10 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-white/10 rounded w-full mb-1" />
                    <div className="h-4 bg-white/10 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="px-4 py-16 text-center">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm inline-block">
              {error}
            </div>
          </div>
        ) : bookmarkedRants.length > 0 ? (
          <div className="divide-y divide-white/10">
            {bookmarkedRants.map((rant) => (
              <RantCard
                key={rant.id}
                rant={rant}
                onVoteUpdate={handleVoteUpdate}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-white/60">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto mb-4 opacity-50"
            >
              <path
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3 className="text-lg font-medium mb-2">No bookmarks yet</h3>
            <p className="text-sm">Start bookmarking rants to see them here.</p>
          </div>
        )}
      </main>
    </div>
  );
}
