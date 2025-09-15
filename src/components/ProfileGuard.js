"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ProfileGuard({ children }) {
  const { user, profileCompleted, justSignedUp, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Pages that don't require authentication
  const publicPages = ["/login", "/signup"];
  // Pages that require authentication but not profile completion
  const profileSetupPages = ["/profile-setup"];
  const isPublicPage = publicPages.includes(pathname);
  const isProfileSetupPage = profileSetupPages.includes(pathname);

  useEffect(() => {
    // If not loading and no user, redirect to login (unless already on public page)
    if (!loading && !user && !isPublicPage) {
      console.log("No user found, redirecting to login");
      router.push("/login");
      return;
    }

    // If user is authenticated but profile is not completed, redirect to profile setup
    // (but allow them to stay on profile-setup page)
    if (
      !loading &&
      user &&
      (justSignedUp || !profileCompleted) &&
      !isPublicPage &&
      !isProfileSetupPage
    ) {
      console.log(
        "Redirecting to profile setup - justSignedUp:",
        justSignedUp,
        "profileCompleted:",
        profileCompleted
      );
      router.push("/profile-setup");
    }
  }, [
    user,
    profileCompleted,
    justSignedUp,
    loading,
    isPublicPage,
    isProfileSetupPage,
    router,
    pathname,
  ]);

  // Show loading while checking auth and profile status
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user and not on a public page, show loading while redirecting to login
  if (!user && !isPublicPage) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white/60">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated but profile is not completed, show loading while redirecting to profile setup
  if (
    user &&
    (justSignedUp || !profileCompleted) &&
    !isPublicPage &&
    !isProfileSetupPage
  ) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white/60">Redirecting to profile setup...</p>
        </div>
      </div>
    );
  }

  return children;
}
