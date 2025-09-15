"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Image from "next/image";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function ProfileSetupPage() {
  const { user, refreshProfile, setJustSignedUp } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Pre-fill name from Firebase auth if available
  useEffect(() => {
    if (user?.displayName) {
      setFormData((prev) => ({
        ...prev,
        name: user.displayName,
      }));
    }
  }, [user]);

  // Check if username is available
  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) return false;

    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("username", "==", username.toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    }
  };

  // Validate form fields
  const validateForm = async () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 20) {
      newErrors.username = "Username must be less than 20 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores";
    } else {
      // Check availability
      setCheckingUsername(true);
      const isAvailable = await checkUsernameAvailability(formData.username);
      setCheckingUsername(false);

      if (!isAvailable) {
        newErrors.username = "Username is already taken";
      }
    }

    // Bio validation (optional but with limits)
    if (formData.bio.length > 160) {
      newErrors.bio = "Bio must be less than 160 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!(await validateForm())) {
      return;
    }

    setLoading(true);
    try {
      // Create user profile document
      const userProfile = {
        uid: user.uid,
        name: formData.name.trim(),
        username: formData.username.toLowerCase(),
        displayUsername: formData.username, // Preserve original case
        bio: formData.bio.trim(),
        email: user.email,
        photoURL: user.photoURL || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Additional fields for future features
        followersCount: 0,
        followingCount: 0,
        rantsCount: 0,
        isVerified: false,
        profileCompleted: true,
      };

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), userProfile);

      // Create username document for quick lookup
      await setDoc(doc(db, "usernames", formData.username.toLowerCase()), {
        uid: user.uid,
        username: formData.username.toLowerCase(),
        displayUsername: formData.username,
        createdAt: new Date(),
      });

      // Refresh profile status in AuthContext
      await refreshProfile();

      // Clear the just signed up flag
      setJustSignedUp(false);

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Error creating profile:", error);
      setErrors({ submit: "Failed to create profile. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <Image
            src="/images/Cesspit.png"
            alt="Cesspit"
            width={180}
            height={48}
            className="h-18 w-54"
          />
        </div>
        <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
        <p className="text-white/60">Let others know who you are in the pit</p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col gap-6 max-w-sm mx-auto w-full"
      >
        {errors.submit && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {errors.submit}
          </div>
        )}

        <div className="space-y-4">
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter your full name"
              required
              className={`w-full bg-zinc-900/50 border rounded-xl px-4 py-3 text-white placeholder:text-white/40 hover:border-white/20 focus:border-white/30 focus:bg-zinc-900/70 transition-all ${
                errors.name ? "border-red-500/50" : "border-white/10"
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Username Field */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="Choose a unique username"
                required
                className={`w-full bg-zinc-900/50 border rounded-xl px-4 py-3 text-white placeholder:text-white/40 hover:border-white/20 focus:border-white/30 focus:bg-zinc-900/70 transition-all ${
                  errors.username ? "border-red-500/50" : "border-white/10"
                }`}
              />
              {checkingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
            {errors.username && (
              <p className="text-xs text-red-400 mt-1">{errors.username}</p>
            )}
            <p className="text-xs text-white/50 mt-1">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {/* Bio Field */}
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Bio <span className="text-white/50">(Optional)</span>
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="Tell others about yourself..."
              rows={3}
              maxLength={160}
              className={`w-full bg-zinc-900/50 border rounded-xl px-4 py-3 text-white placeholder:text-white/40 hover:border-white/20 focus:border-white/30 focus:bg-zinc-900/70 transition-all resize-none ${
                errors.bio ? "border-red-500/50" : "border-white/10"
              }`}
            />
            {errors.bio && (
              <p className="text-xs text-red-400 mt-1">{errors.bio}</p>
            )}
            <p className="text-xs text-white/50 mt-1">
              {formData.bio.length}/160 characters
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || checkingUsername}
          className={`w-full rounded-xl px-4 py-3 font-medium transition-all ${
            loading || checkingUsername
              ? "bg-white/20 text-white/60 cursor-not-allowed"
              : "bg-white text-black hover:bg-gray-100 active:scale-95"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Creating profile...
            </div>
          ) : (
            "Complete Profile"
          )}
        </button>

        <div className="text-center">
          <p className="text-xs text-white/50">
            You can update your profile information later in settings
          </p>
        </div>
      </form>
    </div>
  );
}
