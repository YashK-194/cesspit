"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import RantCard from "../components/RantCard";
import { getFeed } from "../lib/rantService";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [rants, setRants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadRants = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      const { rants: fetchedRants } = await getFeed(20);
      setRants(fetchedRants);
      setError("");
    } catch (error) {
      console.error("Error loading rants:", error);
      setError("Failed to load rants. Please try again.");
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRants();
  }, []);

  const handleVoteUpdate = (rantId, voteResult) => {
    // Update local rant data if needed
    // This is handled by the RantCard component's local state
  };

  const handleRefresh = () => {
    loadRants(true);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/95 backdrop-blur-md border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/images/Cesspit.png"
              alt="Cesspit"
              width={120}
              height={32}
              className="h-12 w-36"
            />
            {/* <p className="text-xs text-white/60 mt-0.5">
              Spew Your Hate, Stain the Pit
            </p> */}
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 21L16.514 16.506M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button className="px-3 py-1.5 rounded-full bg-white/10 text-white/90 text-sm border border-white/10 hover:bg-white/15 transition-colors">
              Trending
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto">
        {/* Quick text field - redirects to /new page */}
        {isAuthenticated && (
          <div className="px-4 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <button
                onClick={() => router.push("/new")}
                className="flex-1 text-left bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white/50 hover:bg-zinc-900/70 hover:border-white/20 transition-all"
              >
                What's got you fired up today?
              </button>
            </div>
          </div>
        )}

        {/* Quick action for non-authenticated users */}
        {!isAuthenticated && (
          <div className="px-4 py-4 border-b border-white/10">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
              <div className="flex-1">
                <button
                  onClick={() => router.push("/login")}
                  className="w-full text-left bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white/60 hover:bg-zinc-900/70 hover:border-white/20 transition-all"
                >
                  Sign in to share your rants...
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="px-4 py-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
              {error}
              <button
                onClick={handleRefresh}
                className="ml-2 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Rants list */}
        <div className="divide-y divide-white/10">
          {loading
            ? // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
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
              ))
            : rants.length > 0
            ? rants.map((rant) => (
                <RantCard
                  key={rant.id}
                  rant={rant}
                  onVoteUpdate={handleVoteUpdate}
                />
              ))
            : !loading && (
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
                      d="M8 12h8M8 16h6M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <h3 className="text-lg font-medium mb-2">No rants yet</h3>
                  <p className="text-sm">
                    {isAuthenticated
                      ? "Be the first to share your thoughts!"
                      : "Sign in to see the latest rants and join the conversation."}
                  </p>
                  {!isAuthenticated && (
                    <button
                      onClick={() => router.push("/login")}
                      className="mt-4 px-6 py-2 bg-white text-black rounded-xl font-medium hover:bg-gray-100 transition-colors"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              )}

          {/* Refresh button */}
          {rants.length > 0 && (
            <div className="px-4 py-6 text-center">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-6 py-2 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                {refreshing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Refreshing...
                  </div>
                ) : (
                  "Load more rants"
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
