import {
  doc,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Bookmark service for managing user bookmarks
export const bookmarkService = {
  // Add a bookmark
  async addBookmark(userId, rantId) {
    try {
      // Use a composite ID to ensure uniqueness
      const bookmarkId = `${userId}_${rantId}`;

      await setDoc(doc(db, "bookmarks", bookmarkId), {
        userId,
        rantId,
        createdAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("Error adding bookmark:", error);
      throw error;
    }
  },

  // Remove a bookmark
  async removeBookmark(userId, rantId) {
    try {
      const bookmarkId = `${userId}_${rantId}`;
      await deleteDoc(doc(db, "bookmarks", bookmarkId));
      return true;
    } catch (error) {
      console.error("Error removing bookmark:", error);
      throw error;
    }
  },

  // Check if a rant is bookmarked by user
  async isBookmarked(userId, rantId) {
    try {
      const bookmarkId = `${userId}_${rantId}`;
      const bookmarkDoc = await getDoc(doc(db, "bookmarks", bookmarkId));
      return bookmarkDoc.exists();
    } catch (error) {
      console.error("Error checking bookmark status:", error);
      return false;
    }
  },

  // Get all bookmarks for a user
  async getUserBookmarks(userId, limit = 20) {
    try {
      const bookmarksQuery = query(
        collection(db, "bookmarks"),
        where("userId", "==", userId)
      );

      const bookmarksSnapshot = await getDocs(bookmarksQuery);
      const bookmarks = [];

      bookmarksSnapshot.forEach((doc) => {
        const data = doc.data();
        bookmarks.push({
          rantId: data.rantId,
          createdAt: data.createdAt,
        });
      });

      // Sort by createdAt on the client side to avoid needing a composite index
      bookmarks.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });

      // Apply limit after sorting
      const limitedBookmarks = bookmarks.slice(0, limit);

      return limitedBookmarks.map((bookmark) => bookmark.rantId);
    } catch (error) {
      console.error("Error getting user bookmarks:", error);
      return [];
    }
  },

  // Toggle bookmark status
  async toggleBookmark(userId, rantId) {
    try {
      const isCurrentlyBookmarked = await bookmarkService.isBookmarked(
        userId,
        rantId
      );

      if (isCurrentlyBookmarked) {
        await bookmarkService.removeBookmark(userId, rantId);
        return false; // Now not bookmarked
      } else {
        await bookmarkService.addBookmark(userId, rantId);
        return true; // Now bookmarked
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      throw error;
    }
  },
};

// Export individual functions for convenience
export const {
  addBookmark,
  removeBookmark,
  isBookmarked,
  getUserBookmarks,
  toggleBookmark,
} = bookmarkService;
