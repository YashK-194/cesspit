"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { createComment, subscribeToComments } from "../lib/commentService";
import { stanceService } from "../lib/stanceService";
import StanceSelector from "./StanceSelector";
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

export default function CommentsSection({ rantId, rantTitle }) {
  const { user } = useAuth();
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [userStance, setUserStance] = useState(null);
  const [showStanceSelector, setShowStanceSelector] = useState(false);
  const [checkingStance, setCheckingStance] = useState(true);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const maxLength = 500;

  // Handle author click navigation
  const handleAuthorClick = (username, e) => {
    if (e) e.stopPropagation();
    if (username) {
      router.push(`/${username}`);
    }
  };

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  };

  // Check if user is near the bottom of the scroll area
  const isNearBottom = (container) => {
    const threshold = 100;
    const scrollBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return scrollBottom <= threshold;
  };

  // Handle scroll events to detect if user scrolled up manually
  const handleScroll = (e) => {
    const container = e.target;
    const nearBottom = isNearBottom(container);
    setIsUserScrolledUp(!nearBottom);
  };

  useEffect(() => {
    // Only auto-scroll if user hasn't manually scrolled up and comments actually changed
    if (!isUserScrolledUp && comments.length > 0) {
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [comments.length, isUserScrolledUp]);

  // Initialize scroll position on mount
  useEffect(() => {
    if (scrollContainerRef.current && comments.length > 0) {
      setTimeout(() => {
        const container = scrollContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
          setIsUserScrolledUp(false);
        }
      }, 100);
    }
  }, [comments.length > 0]);

  // Check if user has already set a stance for this rant
  useEffect(() => {
    const checkUserStance = async () => {
      if (!user || !rantId) return;

      try {
        setCheckingStance(true);
        const stance = await stanceService.getUserStance(user.uid, rantId);
        setUserStance(stance);
      } catch (error) {
        console.error("Error checking user stance:", error);
      } finally {
        setCheckingStance(false);
      }
    };

    checkUserStance();
  }, [user, rantId]);

  // Set up real-time listener for comments
  useEffect(() => {
    if (!rantId) return;

    console.log("Setting up comments listener for rant:", rantId);

    const unsubscribe = subscribeToComments(
      rantId,
      (newComments) => {
        console.log("Received comments update:", newComments.length);
        setComments(newComments);
        setLoading(false);
      },
      100 // Get last 100 comments
    );

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [rantId]);

  // Handle stance selection
  const handleStanceSelect = async (stance) => {
    try {
      await stanceService.setUserStance(user.uid, rantId, stance);
      const updatedStance = await stanceService.getUserStance(user.uid, rantId);
      setUserStance(updatedStance);
      setShowStanceSelector(false);
    } catch (error) {
      console.error("Error setting stance:", error);
      setError("Failed to set stance. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    if (newComment.length > maxLength) {
      setError(`Comment cannot exceed ${maxLength} characters`);
      return;
    }

    if (!user) {
      setError("You must be logged in to comment");
      return;
    }

    // Check if user needs to set a stance first
    if (!userStance && !checkingStance) {
      setShowStanceSelector(true);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await createComment(user.uid, rantId, newComment);
      setNewComment("");
      // Reset scroll state and force scroll to bottom when user submits
      setIsUserScrolledUp(false);
      setTimeout(() => scrollToBottom(), 200);
    } catch (error) {
      console.error("Error creating comment:", error);
      setError("Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setNewComment(value);
      setError("");
    }
  };

  const charactersLeft = maxLength - newComment.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Comments list - scrollable area with proper layout */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
        onScroll={handleScroll}
        onTouchStart={() => {
          setIsUserScrolledUp(true);
        }}
      >
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/60">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isOwnMessage = user && comment.authorId === user.uid;

            return (
              <div
                key={comment.id}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                } gap-3`}
              >
                {/* Avatar for others' messages (left side) */}
                {!isOwnMessage && (
                  <div
                    className="flex-shrink-0 cursor-pointer"
                    onClick={(e) =>
                      handleAuthorClick(comment.authorUsername, e)
                    }
                  >
                    {comment.authorPhotoURL ? (
                      <img
                        src={comment.authorPhotoURL}
                        alt={comment.authorName}
                        className="h-8 w-8 rounded-full object-cover hover:ring-2 hover:ring-white/20 transition-all"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs hover:ring-2 hover:ring-white/20 transition-all">
                        {comment.authorName?.[0]?.toUpperCase() || "A"}
                      </div>
                    )}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`max-w-[70%] border-2 ${
                    // Base styling
                    isOwnMessage
                      ? "bg-blue-600 text-white rounded-l-2xl rounded-tr-2xl rounded-br-md"
                      : "bg-zinc-800 text-white rounded-r-2xl rounded-tl-2xl rounded-bl-md"
                  } ${
                    // Stance-based border styling
                    comment.authorStance === "favor"
                      ? "border-green-500"
                      : comment.authorStance === "against"
                      ? "border-red-500"
                      : "border-transparent"
                  } px-4 py-2`}
                >
                  {/* Author info for others' messages */}
                  {!isOwnMessage && (
                    <div
                      className="text-xs text-white/70 mb-1 cursor-pointer hover:text-white/90 transition-colors"
                      onClick={(e) =>
                        handleAuthorClick(comment.authorUsername, e)
                      }
                    >
                      {comment.authorName}
                    </div>
                  )}

                  {/* Message content */}
                  <Linkify
                    options={{
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className:
                        "text-blue-400 underline hover:text-blue-300 break-words",
                    }}
                  >
                    <p className="text-white/90 whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </Linkify>

                  {/* Timestamp */}
                  <div
                    className={`text-xs mt-1 ${
                      isOwnMessage ? "text-blue-200" : "text-white/50"
                    }`}
                  >
                    {formatTimeAgo(comment.createdAt)}
                    {comment.isEdited && <span className="ml-1">(edited)</span>}
                  </div>
                </div>

                {/* Avatar for own messages (right side) */}
                {isOwnMessage && (
                  <div className="flex-shrink-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="You"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                        {user.email?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        {/* Spacer element to ensure last comment is visible */}
        <div ref={messagesEndRef} className="h-4 w-full flex-shrink-0" />
      </div>

      {/* Fixed input section at bottom */}
      {user ? (
        <div className="flex-shrink-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-4 pb-20">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-sm mb-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={newComment}
                  onChange={handleInputChange}
                  placeholder="Share your thoughts..."
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/50 resize-none focus:bg-zinc-900/70 focus:border-white/30 transition-all"
                  rows={2}
                  disabled={isSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />

                {/* Character count */}
                <div className="absolute bottom-2 right-2 text-xs text-white/40">
                  {charactersLeft}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                !newComment.trim() || isSubmitting || charactersLeft < 0
              }
              className={`px-4 py-2 rounded-xl font-medium transition-all self-end ${
                !newComment.trim() || isSubmitting || charactersLeft < 0
                  ? "bg-white/20 text-white/50 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </form>

          <p className="text-xs text-white/40 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      ) : (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-xl border-t border-white/10 p-4 pb-20 text-center">
          <p className="text-white/60 text-sm">
            Please log in to join the conversation
          </p>
        </div>
      )}

      {/* Stance Selector Modal */}
      {showStanceSelector && (
        <StanceSelector
          onStanceSelect={handleStanceSelect}
          rantTitle={rantTitle}
          onClose={() => setShowStanceSelector(false)}
        />
      )}
    </div>
  );
}
