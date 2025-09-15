"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getUserByUsername, getUserStats } from "../../lib/userService";
import { useAuth } from "../../context/AuthContext";
import { use } from "react";

export default function PublicProfilePage({ params }) {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("rants");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const resolvedParams = use(params); // ✅ unwrap the params promise
  const username = resolvedParams.username?.replace("@", "");

  useEffect(() => {
    const fetchPublicProfile = async () => {
      if (!username) {
        setError("Username not found");
        setLoading(false);
        return;
      }

      // Basic validation for username format
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError("Invalid username format");
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile by username
        const profile = await getUserByUsername(username);
        if (!profile) {
          setError("User not found");
          setLoading(false);
          return;
        }

        setUserProfile(profile);

        // Fetch user stats
        const stats = await getUserStats(profile.uid);
        setUserStats(stats);

        // Check if this is the current user's own profile
        if (currentUser && currentUser.uid === profile.uid) {
          setIsOwnProfile(true);
        }

        // TODO: Check if current user is following this user
        // setIsFollowing(await checkIfFollowing(currentUser?.uid, profile.uid));
      } catch (error) {
        console.error("Error fetching public profile:", error);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [username, currentUser]);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    try {
      // TODO: Implement follow/unfollow functionality
      // await toggleFollow(currentUser.uid, userProfile.uid);
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/@${
      userProfile.displayUsername || userProfile.username
    }`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userProfile.name}'s Profile`,
          text: `Check out ${userProfile.name}'s profile`,
          url: shareUrl,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        // TODO: Show toast notification "Link copied to clipboard"
      } catch (error) {
        console.error("Error copying to clipboard:", error);
      }
    }
  };

  const handleMessage = () => {
    // TODO: Implement messaging functionality
    console.log("Message user:", userProfile.uid);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-white/60 mb-6">
            {error || "This user doesn't exist"}
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-white text-black rounded-xl px-6 py-3 font-medium hover:bg-gray-100 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "rants",
      label: "Rants",
      count: userStats?.rantsCount || userProfile.rantsCount || 0,
    },
    {
      id: "arguments",
      label: "Arguments",
      count: userStats?.commentsCount || 0,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/95 backdrop-blur-md border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
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
          <h1 className="text-lg font-bold">
            @{userProfile.displayUsername || userProfile.username}
          </h1>
          <button
            onClick={handleShare}
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
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Info */}
        <div className="text-center mb-8">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
            {userProfile.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              userProfile.name?.[0]?.toUpperCase() ||
              userProfile.email?.[0]?.toUpperCase() ||
              "U"
            )}
          </div>
          <h2 className="text-xl font-bold mb-1">
            {userProfile.name || "User"}
          </h2>
          <p className="text-white/60 mb-1">
            @{userProfile.displayUsername || userProfile.username}
          </p>
          {userProfile.bio && (
            <p className="text-white/80 text-sm mb-4">{userProfile.bio}</p>
          )}
          {userProfile.createdAt && (
            <p className="text-white/40 text-xs mb-4">
              Joined{" "}
              {new Date(
                userProfile.createdAt.toDate
                  ? userProfile.createdAt.toDate()
                  : userProfile.createdAt
              ).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          )}

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-xl font-bold">
                {userStats?.rantsCount || userProfile.rantsCount || 0}
              </div>
              <div className="text-xs text-white/60">Rants</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">
                {userStats?.upvotesReceived || 0}
              </div>
              <div className="text-xs text-white/60">Upvotes</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">
                {userProfile.followersCount || 0}
              </div>
              <div className="text-xs text-white/60">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">
                {userProfile.followingCount || 0}
              </div>
              <div className="text-xs text-white/60">Following</div>
            </div>
          </div>

          {/* Action buttons */}
          {isOwnProfile ? (
            <div className="flex gap-3 mb-8">
              <button
                onClick={() => router.push("/profile")}
                className="flex-1 bg-white text-black rounded-xl px-4 py-2 font-medium hover:bg-gray-100 transition-colors"
              >
                View Your Profile
              </button>
              <button
                onClick={() => router.push("/settings")}
                className="flex-1 border border-white/20 text-white rounded-xl px-4 py-2 font-medium hover:bg-white/5 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleFollow}
                disabled={!isAuthenticated}
                className={`flex-1 rounded-xl px-4 py-2 font-medium transition-colors ${
                  isFollowing
                    ? "bg-white/10 text-white border border-white/20 hover:bg-white/5"
                    : "bg-white text-black hover:bg-gray-100"
                } ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {!isAuthenticated
                  ? "Follow"
                  : isFollowing
                  ? "Following"
                  : "Follow"}
              </button>
              <button
                onClick={handleMessage}
                disabled={!isAuthenticated}
                className={`flex-1 border border-white/20 text-white rounded-xl px-4 py-2 font-medium hover:bg-white/5 transition-colors ${
                  !isAuthenticated ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Message
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 mb-6">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-white text-white"
                    : "border-transparent text-white/60 hover:text-white/80"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="space-y-4">
          {activeTab === "rants" && (
            <div className="text-center py-12 text-white/60">
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
              <p className="text-lg font-medium mb-2">
                {isOwnProfile
                  ? "No rants yet"
                  : `${userProfile.name} hasn't posted any rants`}
              </p>
              <p className="text-sm">
                {isOwnProfile ? "Start your first rant" : "Check back later"}
              </p>
            </div>
          )}
          {activeTab === "arguments" && (
            <div className="text-center py-12 text-white/60">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto mb-4 opacity-50"
              >
                <path
                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-lg font-medium mb-2">
                {isOwnProfile
                  ? "No arguments yet"
                  : `${userProfile.name} hasn't joined any debates`}
              </p>
              <p className="text-sm">
                {isOwnProfile
                  ? "Join the debate on someone's rant"
                  : "Check back later"}
              </p>
            </div>
          )}
        </div>

        {/* Sign in prompt for non-authenticated users */}
        {!isAuthenticated && !isOwnProfile && (
          <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                Join the conversation
              </h3>
              <p className="text-white/60 text-sm mb-4">
                Sign in to follow users, view more content, and join debates
              </p>
              <button
                onClick={() => router.push("/login")}
                className="bg-white text-black rounded-xl px-6 py-2 font-medium hover:bg-gray-100 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
