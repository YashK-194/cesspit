"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "../../../context/AuthContext";
import { getRant } from "../../../lib/rantService";
import { voteOnRant, getUserVote } from "../../../lib/voteService";
import { toggleBookmark, isBookmarked } from "../../../lib/bookmarkService";
import CommentsSection from "../../../components/CommentsSection";
import Linkify from "linkify-react";

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

export default function RantDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [rant, setRant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState(null);
  const [localUpvotes, setLocalUpvotes] = useState(0);
  const [localDownvotes, setLocalDownvotes] = useState(0);
  const [isVoting, setIsVoting] = useState(false);
  const [isRantBookmarked, setIsRantBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  useEffect(() => {
    const fetchRant = async () => {
      try {
        if (params.id) {
          const rantData = await getRant(params.id);
          if (rantData) {
            setRant(rantData);
            setLocalUpvotes(rantData.upvotes || 0);
            setLocalDownvotes(rantData.downvotes || 0);

            // Fetch user's vote if logged in
            if (user) {
              const vote = await getUserVote(user.uid, params.id);
              setUserVote(vote);

              // Check bookmark status
              const bookmarked = await isBookmarked(user.uid, params.id);
              setIsRantBookmarked(bookmarked);
            }
          } else {
            // Rant not found
            router.push("/");
          }
        }
      } catch (error) {
        console.error("Error fetching rant:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchRant();
  }, [params.id, user, router]);

  // Handle voting
  const handleVote = async (voteType) => {
    if (!user || isVoting) return;

    setIsVoting(true);
    try {
      const result = await voteOnRant(user.uid, rant.id, voteType);

      if (result.success) {
        setLocalUpvotes(result.upvotes);
        setLocalDownvotes(result.downvotes);
        setUserVote(result.userVote);
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsVoting(false);
    }
  };

  // Handle author click
  const handleAuthorClick = () => {
    if (rant.authorUsername) {
      router.push(`/${rant.authorUsername}`);
    }
  };

  // Handle bookmark toggle
  const handleBookmark = async () => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-white/60">Loading rant...</div>
      </div>
    );
  }

  if (!rant) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Rant not found</h1>
          <button
            onClick={() => router.push("/")}
            className="text-white/60 hover:text-white"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-black/95 backdrop-blur-md border-b border-white/10 px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
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
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Image
                src="/images/Cesspit.png"
                alt="Cesspit"
                width={120}
                height={32}
                className="h-8 w-24"
              />
            </div>
          </div>
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content area - now properly scrollable */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Rant content */}
        <div className="w-full px-4 py-6 flex-shrink-0 border-b border-white/10">
          {/* Author info */}
          <div className="flex items-center gap-3 mb-4">
            <div
              onClick={handleAuthorClick}
              className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold cursor-pointer hover:ring-2 hover:ring-white/20 transition-all"
            >
              {rant.authorName?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  onClick={handleAuthorClick}
                  className="font-semibold cursor-pointer hover:underline"
                >
                  {rant.authorName || "Anonymous"}
                </span>
                <span
                  onClick={handleAuthorClick}
                  className="text-white/60 text-sm cursor-pointer hover:text-white/80"
                >
                  @{rant.authorUsername || "unknown"}
                </span>
                <span className="text-white/50">•</span>
                <span className="text-white/60 text-sm">
                  {formatTimeAgo(rant.createdAt)}
                </span>
              </div>
              <div className="text-xs text-white/50">
                {rant.contentType || "text"}
              </div>
            </div>
          </div>

          {/* Title and description */}
          {rant.title && (
            <h2 className="text-xl font-bold mb-3 break-words overflow-wrap-anywhere">
              {rant.title}
            </h2>
          )}
          <Linkify
            options={{
              target: "_blank",
              rel: "noopener noreferrer",
              className:
                "text-blue-400 underline hover:text-blue-300 break-words",
            }}
          >
            <p className="text-white/90 leading-relaxed mb-4 whitespace-pre-wrap break-words overflow-wrap-anywhere">
              {rant.content}
            </p>
          </Linkify>

          {/* Action buttons */}
          <div className="flex items-center gap-4 text-white/60">
            {/* Comments count */}
            <div className="flex items-center gap-1 text-sm">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zM12 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zM15.375 12a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{rant.commentsCount || 0}</span>
            </div>

            {/* Upvote */}
            <button
              onClick={() => handleVote("upvote")}
              disabled={isVoting || !user}
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
              <span className="text-sm">{localUpvotes}</span>
            </button>

            {/* Downvote */}
            <button
              onClick={() => handleVote("downvote")}
              disabled={isVoting || !user}
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
              <span className="text-sm">{localDownvotes}</span>
            </button>

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              disabled={isBookmarking || !user}
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

            {/* Share */}
            <button
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors"
              onClick={() => {
                const rantUrl = window.location.href;
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
          </div>
        </div>

        {/* Comments Section - takes remaining space and is properly scrollable */}
        <div className="flex-1 min-h-0 relative">
          <CommentsSection rantId={rant.id} rantTitle={rant.title} />
        </div>
      </div>
    </div>
  );
}
