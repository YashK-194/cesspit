"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { voteOnRant, getUserVote } from "../lib/voteService";
import { toggleBookmark, isBookmarked } from "../lib/bookmarkService";

// Helper function to format time ago
function formatTimeAgo(timestamp) {
  if (!timestamp) return "now";

  const now = new Date();
  const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
  return time.toLocaleDateString();
}

export default function RantCard({ rant, onVoteUpdate }) {
  const router = useRouter();
  const { user } = useAuth();
  const [userVote, setUserVote] = useState(null);
  const [localUpvotes, setLocalUpvotes] = useState(rant.upvotes || 0);
  const [localDownvotes, setLocalDownvotes] = useState(rant.downvotes || 0);
  const [isVoting, setIsVoting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isRantBookmarked, setIsRantBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  // Fetch user's existing vote
  useEffect(() => {
    const fetchUserVote = async () => {
      if (user && rant.id) {
        try {
          const vote = await getUserVote(user.uid, rant.id);
          setUserVote(vote);
        } catch (error) {
          console.error("Error fetching user vote:", error);
        }
      }
    };

    fetchUserVote();
  }, [user, rant.id]);

  // Check bookmark status
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (user && rant.id) {
        try {
          const bookmarked = await isBookmarked(user.uid, rant.id);
          setIsRantBookmarked(bookmarked);
        } catch (error) {
          console.error("Error checking bookmark status:", error);
        }
      }
    };

    checkBookmarkStatus();
  }, [user, rant.id]);

  const handleUpvote = async (e) => {
    e.stopPropagation();

    if (!user) {
      router.push("/login");
      return;
    }

    // Prevent multiple clicks while voting is in progress
    if (isVoting) {
      console.log("Vote in progress, ignoring click");
      return;
    }

    console.log("Processing upvote. Current vote:", userVote);
    setIsVoting(true);

    try {
      const result = await voteOnRant(user.uid, rant.id, "upvote");
      console.log("Vote result:", result);

      // Update local state based on the result
      if (result.action === "created") {
        setUserVote("upvote");
        setLocalUpvotes((prev) => prev + 1);
      } else if (result.action === "removed") {
        setUserVote(null);
        setLocalUpvotes((prev) => prev - 1);
      } else if (result.action === "updated") {
        setUserVote("upvote");
        setLocalUpvotes((prev) => prev + 1);
        setLocalDownvotes((prev) => prev - 1);
      }

      if (onVoteUpdate) {
        onVoteUpdate(rant.id, result);
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDownvote = async (e) => {
    e.stopPropagation();

    if (!user) {
      router.push("/login");
      return;
    }

    // Prevent multiple clicks while voting is in progress
    if (isVoting) {
      console.log("Vote in progress, ignoring click");
      return;
    }

    console.log("Processing downvote. Current vote:", userVote);
    setIsVoting(true);

    try {
      const result = await voteOnRant(user.uid, rant.id, "downvote");
      console.log("Vote result:", result);

      // Update local state based on the result
      if (result.action === "created") {
        setUserVote("downvote");
        setLocalDownvotes((prev) => prev + 1);
      } else if (result.action === "removed") {
        setUserVote(null);
        setLocalDownvotes((prev) => prev - 1);
      } else if (result.action === "updated") {
        setUserVote("downvote");
        setLocalDownvotes((prev) => prev + 1);
        setLocalUpvotes((prev) => prev - 1);
      }

      if (onVoteUpdate) {
        onVoteUpdate(rant.id, result);
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();

    if (!user) {
      router.push("/login");
      return;
    }

    if (isBookmarking) {
      return; // Prevent multiple clicks
    }

    setIsBookmarking(true);

    try {
      const newBookmarkStatus = await toggleBookmark(user.uid, rant.id);
      setIsRantBookmarked(newBookmarkStatus);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleReply = (e) => {
    e.stopPropagation();
    router.push(`/rant/${rant.id}`);
  };

  const handleCardClick = () => {
    router.push(`/rant/${rant.id}`);
  };

  const handleAuthorClick = (e) => {
    e.stopPropagation(); // Prevent card click
    if (rant.authorUsername) {
      router.push(`/${rant.authorUsername}`);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className="px-4 py-6 hover:bg-white/[0.02] transition-colors border-b border-white/10 last:border-b-0 cursor-pointer"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className="flex-shrink-0 cursor-pointer"
          onClick={handleAuthorClick}
        >
          {rant.authorPhotoURL ? (
            <img
              src={rant.authorPhotoURL}
              alt={rant.authorName}
              className="h-10 w-10 rounded-full object-cover hover:ring-2 hover:ring-white/20 transition-all"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm hover:ring-2 hover:ring-white/20 transition-all">
              {rant.authorName?.[0]?.toUpperCase() ||
                rant.authorUsername?.[0]?.toUpperCase() ||
                "A"}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 text-sm mb-1">
            <span
              onClick={handleAuthorClick}
              className="font-semibold text-white hover:underline cursor-pointer"
            >
              {rant.authorName || "Anonymous"}
            </span>
            <span
              onClick={handleAuthorClick}
              className="text-white/50 hover:text-white/70 cursor-pointer"
            >
              @{rant.authorUsername || "anonymous"}
            </span>
            <span className="text-white/50">•</span>
            <span className="text-white/60">
              {rant.createdAt ? formatTimeAgo(rant.createdAt) : "now"}
            </span>
            {rant.isEdited && (
              <>
                <span className="text-white/50">•</span>
                <span className="text-white/50 text-xs">edited</span>
              </>
            )}
          </div>

          {/* Content */}
          <div className="mb-4">
            {/* Title (if exists) */}
            {rant.title && (
              <h3 className="text-white font-semibold text-lg mb-2 leading-tight break-words overflow-wrap-anywhere line-clamp-2">
                {rant.title}
              </h3>
            )}

            {/* Content */}
            <p className="text-white/90 text-[15px] leading-relaxed break-words overflow-wrap-anywhere line-clamp-3">
              {rant.content}
            </p>

            {/* Hashtags */}
            {rant.hashtags && rant.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {rant.hashtags.map((hashtag, index) => (
                  <span
                    key={index}
                    className="text-blue-400 hover:text-blue-300 cursor-pointer text-sm"
                  >
                    #{hashtag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between text-white/60 text-sm">
            <div className="flex items-center gap-6">
              {/* Reply */}
              <button
                onClick={handleReply}
                className="flex items-center gap-2 hover:text-blue-400 transition-colors group"
              >
                <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span>{rant.commentsCount || 0}</span>
              </button>

              {/* Upvote */}
              <button
                onClick={handleUpvote}
                disabled={isVoting}
                className={`flex items-center gap-2 hover:text-green-400 transition-colors group ${
                  userVote === "upvote" ? "text-green-400" : ""
                } ${isVoting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={userVote === "upvote" ? "currentColor" : "none"}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 5L7 10h10l-5-5z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span>{localUpvotes}</span>
              </button>

              {/* Downvote */}
              <button
                onClick={handleDownvote}
                disabled={isVoting}
                className={`flex items-center gap-2 hover:text-red-400 transition-colors group ${
                  userVote === "downvote" ? "text-red-400" : ""
                } ${isVoting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="p-2 rounded-full group-hover:bg-red-500/10 transition-colors">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={userVote === "downvote" ? "currentColor" : "none"}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 19l5-5H7l5 5z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span>{localDownvotes}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Share */}
              <button
                className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  const rantUrl = `${window.location.origin}/rant/${rant.id}`;
                  if (navigator.share) {
                    navigator
                      .share({
                        title: rant.title || "Check out this rant",
                        text: rant.content
                          ? rant.content.substring(0, 100) +
                            (rant.content.length > 100 ? "..." : "")
                          : "",
                        url: rantUrl,
                      })
                      .catch((error) => {
                        console.log("Error sharing:", error);
                        // Fallback to clipboard
                        navigator.clipboard.writeText(rantUrl).then(() => {
                          // You could add a toast notification here
                          alert("URL copied to clipboard");
                        });
                      });
                  } else {
                    navigator.clipboard
                      .writeText(rantUrl)
                      .then(() => {
                        // You could add a toast notification here
                        alert("URL copied to clipboard");
                      })
                      .catch((error) => {
                        console.error("Failed to copy URL:", error);
                      });
                  }
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Bookmark */}
              <button
                onClick={handleBookmark}
                disabled={isBookmarking}
                className={`p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors ${
                  isRantBookmarked ? "text-yellow-400" : ""
                } ${isBookmarking ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={isRantBookmarked ? "currentColor" : "none"}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
