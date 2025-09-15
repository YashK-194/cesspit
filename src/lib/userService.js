import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  getDocFromServer,
} from "firebase/firestore";
import { db } from "./firebase";

// User service for managing user profiles and data
export const userService = {
  // Check if user profile is completed (exists and profileCompleted flag true)
  async checkProfileExists(uid) {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (!userDoc.exists()) return false;
      const data = userDoc.data();
      // Backward compatible: if flag is missing, consider completed
      if (data?.profileCompleted === false) return false;
      return true;
    } catch (error) {
      console.error("Error checking profile existence:", error);
      return false;
    }
  },

  // Get user profile by UID
  async getUserProfile(uid) {
    try {
      const userDoc = await getDocFromServer(doc(db, "users", uid));
      return userDoc.exists() ? { ...userDoc.data(), uid } : null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  },

  // Get user profile by username
  async getUserByUsername(username) {
    try {
      const usernameQuery = query(
        collection(db, "usernames"),
        where("username", "==", username.toLowerCase())
      );
      const usernameSnapshot = await getDocs(usernameQuery);

      if (usernameSnapshot.empty) {
        return null;
      }

      const uid = usernameSnapshot.docs[0].data().uid;
      const profile = await userService.getUserProfile(uid);

      if (!profile) {
        return null;
      }

      // Include the uid in the returned profile data
      return {
        ...profile,
        uid: uid,
      };
    } catch (error) {
      console.error("Error getting user by username:", error);
      throw error;
    }
  },

  // Check if username is available
  async isUsernameAvailable(username) {
    try {
      const usernameDoc = await getDoc(
        doc(db, "usernames", username.toLowerCase())
      );
      return !usernameDoc.exists();
    } catch (error) {
      console.error("Error checking username availability:", error);
      return false;
    }
  },

  // Create user profile
  async createUserProfile(uid, profileData) {
    try {
      // Create main profile document
      await setDoc(doc(db, "users", uid), {
        ...profileData,
        username: profileData.username.toLowerCase(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create username mapping document
      await setDoc(doc(db, "usernames", profileData.username.toLowerCase()), {
        uid,
        username: profileData.username.toLowerCase(),
        displayUsername: profileData.displayUsername || profileData.username,
        createdAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(uid, updates) {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      // If username is being updated, handle username document
      if (updates.username) {
        const oldProfile = await userService.getUserProfile(uid);

        // Delete old username document
        if (oldProfile?.username) {
          await deleteDoc(doc(db, "usernames", oldProfile.username));
        }

        // Create new username document
        await setDoc(doc(db, "usernames", updates.username.toLowerCase()), {
          uid,
          username: updates.username.toLowerCase(),
          displayUsername: updates.displayUsername || updates.username,
          createdAt: new Date(),
        });

        updateData.username = updates.username.toLowerCase();
      }

      // Update main profile document
      await updateDoc(doc(db, "users", uid), updateData);

      return true;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  },

  // Search users by username or display name
  async searchUsers(searchTerm, maxResults = 20) {
    try {
      const usersQuery = query(
        collection(db, "usernames"),
        orderBy("username"),
        limit(maxResults)
      );

      const snapshot = await getDocs(usersQuery);
      const users = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (
          data.username.includes(searchTerm.toLowerCase()) ||
          data.displayUsername?.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          users.push(data);
        }
      });

      return users;
    } catch (error) {
      console.error("Error searching users:", error);
      return [];
    }
  },

  // Get user stats (rants count, etc.)
  async getUserStats(uid) {
    try {
      // This could be expanded to get actual stats from database
      return {
        rantsCount: 0,
        commentsCount: 0,
        upvotesReceived: 0,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      return {
        rantsCount: 0,
        commentsCount: 0,
        upvotesReceived: 0,
      };
    }
  },

  // Increment user stat
  async incrementUserStat(uid, statField, incrementBy = 1) {
    try {
      const userRef = doc(db, "users", uid);
      const currentData = await getDoc(userRef);

      if (currentData.exists()) {
        const currentValue = currentData.data()[statField] || 0;
        await updateDoc(userRef, {
          [statField]: currentValue + incrementBy,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error(`Error incrementing ${statField}:`, error);
      throw error;
    }
  },
};

// Export individual functions for convenience
export const {
  checkProfileExists,
  getUserProfile,
  getUserByUsername,
  isUsernameAvailable,
  createUserProfile,
  updateUserProfile,
  searchUsers,
  getUserStats,
  incrementUserStat,
} = userService;
