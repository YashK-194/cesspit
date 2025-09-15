"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { getUserProfile } from "../../lib/userService";

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("rants");
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

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

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">Profile not found</p>
          <button
            onClick={() => router.push("/profile-setup")}
            className="bg-white text-black px-4 py-2 rounded-xl"
          >
            Complete Profile Setup
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "rants", label: "Rants", count: userProfile.rantsCount || 0 },
    { id: "arguments", label: "Arguments", count: 0 }, // Will implement later
    { id: "saved", label: "Saved", count: 0 }, // Will implement later
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/95 backdrop-blur-md border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-lg font-bold">Profile</h1>
          <button
            onClick={() => router.push("/settings")}
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
                d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {isAuthenticated ? (
          <>
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

              {/* Stats */}
              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <div className="text-xl font-bold">
                    {userProfile.rantsCount || 0}
                  </div>
                  <div className="text-xs text-white/60">Rants</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">0</div>
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
              <div className="flex gap-3 mb-8">
                <button className="flex-1 bg-white text-black rounded-xl px-4 py-2 font-medium hover:bg-gray-100 transition-colors">
                  Edit Profile
                </button>
                <button className="flex-1 border border-white/20 text-white rounded-xl px-4 py-2 font-medium hover:bg-white/5 transition-colors">
                  Share Profile
                </button>
              </div>
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
                  <p className="text-lg font-medium mb-2">No rants yet</p>
                  <p className="text-sm">Start your first argument</p>
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
                  <p className="text-lg font-medium mb-2">No arguments yet</p>
                  <p className="text-sm">Join the debate on someone's rant</p>
                </div>
              )}
              {activeTab === "saved" && (
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
                      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-lg font-medium mb-2">No saved rants</p>
                  <p className="text-sm">Save rants to read later</p>
                </div>
              )}
            </div>

            {/* Logout button */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl px-4 py-3 font-medium hover:bg-red-500/30 transition-colors"
              >
                Log out
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Not signed in</h2>
            <p className="text-white/60 mb-6">
              Sign in to access your profile and start arguing
            </p>
            <button
              onClick={() => router.push("/login")}
              className="bg-white text-black rounded-xl px-6 py-3 font-medium hover:bg-gray-100 transition-colors"
            >
              Sign in
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
