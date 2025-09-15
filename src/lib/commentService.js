import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  getDocsFromServer,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { incrementUserStat } from "./userService";
import { rantService } from "./rantService";

/**
 * Comments Database Schema:
 *
 * Collection: "comments"
 * Document ID: Auto-generated
 *
 * Fields:
 * - id: string (document ID)
 * - rantId: string (reference to parent rant)
 * - authorId: string (user ID who posted)
 * - authorUsername: string (denormalized for performance)
 * - authorName: string (denormalized for performance)
 * - authorPhotoURL: string | null (denormalized for performance)
 *
 * - content: string (comment text)
 * - contentType: string ("text", "image", "link", etc.)
 *
 * - createdAt: timestamp
 * - updatedAt: timestamp
 *
 * - isEdited: boolean
 * - isDeleted: boolean
 * - deletedAt: timestamp | null
 *
 * - upvotes: number
 * - downvotes: number
 * - netScore: number (upvotes - downvotes)
 *
 * - replyToCommentId: string | null (for threaded replies)
 * - replyToAuthorId: string | null
 * - isReply: boolean
 *
 * - mentions: array of strings (usernames mentioned)
 * - hashtags: array of strings
 *
 * - isReported: boolean
 * - reportCount: number
 * - isFlagged: boolean
 *
 * Indexes needed:
 * - rantId + createdAt (for fetching comments by rant chronologically)
 * - authorId + createdAt (for user's comment history)
 * - rantId + isDeleted + createdAt (for active comments only)
 */

export const commentService = {
  // Create a new comment
  async createComment(authorId, rantId, content, options = {}) {
    console.log("Creating comment:", { authorId, rantId, content, options });
    try {
      // Get author info for denormalization
      let authorData = {
        username: "unknown",
        name: "Anonymous",
        photoURL: null,
      };

      try {
        const { getUserProfile } = await import("./userService");
        const profile = await getUserProfile(authorId);
        if (profile) {
          authorData = {
            username: profile.username || "unknown",
            name: profile.name || "Anonymous",
            photoURL: profile.photoURL || null,
          };
        }
      } catch (err) {
        console.warn("Error fetching author, using fallback info:", err);
      }

      // Extract hashtags and mentions
      const hashtags = commentService.extractHashtags(content);
      const mentions = commentService.extractMentions(content);

      // Get user's stance for this rant (for comment display styling)
      let userStance = null;
      try {
        const { stanceService } = await import("./stanceService");
        const stance = await stanceService.getUserStance(authorId, rantId);
        userStance = stance ? stance.stance : null;
      } catch (err) {
        console.warn("Error fetching user stance:", err);
      }

      const commentData = {
        rantId,
        authorId,
        authorUsername: authorData.username,
        authorName: authorData.name,
        authorPhotoURL: authorData.photoURL,

        // Content
        content: content.trim(),
        contentType: options.contentType || "text",

        // User's stance on the rant (for styling)
        authorStance: userStance,

        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        // Engagement metrics
        upvotes: 0,
        downvotes: 0,
        netScore: 0,

        // Status flags
        isEdited: false,
        isDeleted: false,
        deletedAt: null,

        // Reply context
        replyToCommentId: options.replyToCommentId || null,
        replyToAuthorId: options.replyToAuthorId || null,
        isReply: Boolean(options.replyToCommentId),

        // Content metadata
        mentions,
        hashtags,

        // Moderation
        isReported: false,
        isFlagged: false,
        reportCount: 0,
      };

      console.log("Comment data to save:", commentData);

      // Create comment document
      const commentRef = await addDoc(collection(db, "comments"), commentData);
      console.log("Comment created with ID:", commentRef.id);

      // Update rant's comment count
      await rantService.incrementRantStat(rantId, "commentsCount", 1);

      // Update user's comment count
      await incrementUserStat(authorId, "commentsCount", 1);

      const createdComment = {
        id: commentRef.id,
        ...commentData,
      };

      console.log("Created comment:", createdComment);
      return createdComment;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  },

  // Get comments for a rant (ordered chronologically like chat)
  async getCommentsByRant(rantId, limitCount = 50, lastVisible = null) {
    try {
      console.log("Fetching comments for rant:", rantId);

      let q = query(
        collection(db, "comments"),
        where("rantId", "==", rantId),
        where("isDeleted", "==", false),
        orderBy("createdAt", "asc"), // Chronological order like chat
        limit(limitCount)
      );

      if (lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const querySnapshot = await getDocsFromServer(q);
      const comments = [];

      querySnapshot.forEach((doc) => {
        comments.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log("Fetched comments:", comments.length);
      return {
        comments,
        lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        hasMore: querySnapshot.docs.length === limitCount,
      };
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }
  },

  // Real-time listener for new comments (for chat-like experience)
  subscribeToComments(rantId, callback, limitCount = 50) {
    try {
      // Simplified query to avoid Firestore index requirement
      const q = query(
        collection(db, "comments"),
        where("rantId", "==", rantId),
        limit(limitCount)
      );

      return onSnapshot(q, (querySnapshot) => {
        const comments = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Filter out deleted comments on client side
          if (!data.isDeleted) {
            comments.push({
              id: doc.id,
              ...data,
            });
          }
        });

        // Sort by createdAt on client side
        comments.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || a.createdAt;
          const bTime = b.createdAt?.toDate?.() || b.createdAt;
          return aTime - bTime;
        });

        callback(comments);
      });
    } catch (error) {
      console.error("Error setting up comments listener:", error);
      throw error;
    }
  },

  // Update comment
  async updateComment(commentId, updates, userId) {
    try {
      const commentDoc = await getDocFromServer(doc(db, "comments", commentId));
      if (!commentDoc.exists()) {
        throw new Error("Comment not found");
      }

      const commentData = commentDoc.data();
      if (commentData.authorId !== userId) {
        throw new Error("Unauthorized to edit this comment");
      }

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        isEdited: true,
      };

      // Update hashtags and mentions if content is being updated
      if (updates.content) {
        updateData.hashtags = commentService.extractHashtags(updates.content);
        updateData.mentions = commentService.extractMentions(updates.content);
      }

      await updateDoc(doc(db, "comments", commentId), updateData);

      return {
        id: commentId,
        ...commentData,
        ...updateData,
      };
    } catch (error) {
      console.error("Error updating comment:", error);
      throw error;
    }
  },

  // Soft delete comment
  async deleteComment(commentId, userId) {
    try {
      const commentDoc = await getDocFromServer(doc(db, "comments", commentId));
      if (!commentDoc.exists()) {
        throw new Error("Comment not found");
      }

      const commentData = commentDoc.data();
      if (commentData.authorId !== userId) {
        throw new Error("Unauthorized to delete this comment");
      }

      await updateDoc(doc(db, "comments", commentId), {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Decrement rant's comment count
      await rantService.incrementRantStat(
        commentData.rantId,
        "commentsCount",
        -1
      );

      // Decrement user's comment count
      await incrementUserStat(userId, "commentsCount", -1);

      return true;
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  },

  // Get user's comments
  async getUserComments(userId, limitCount = 20, lastVisible = null) {
    try {
      let q = query(
        collection(db, "comments"),
        where("authorId", "==", userId),
        where("isDeleted", "==", false),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      if (lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const querySnapshot = await getDocsFromServer(q);
      const comments = [];

      querySnapshot.forEach((doc) => {
        comments.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return {
        comments,
        lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        hasMore: querySnapshot.docs.length === limitCount,
      };
    } catch (error) {
      console.error("Error fetching user comments:", error);
      throw error;
    }
  },

  // Extract hashtags from content
  extractHashtags(content) {
    const hashtagRegex = /#[\w]+/g;
    const matches = content.match(hashtagRegex) || [];
    return matches.map((tag) => tag.substring(1).toLowerCase()).slice(0, 5);
  },

  // Extract mentions from content
  extractMentions(content) {
    const mentionRegex = /@[\w]+/g;
    const matches = content.match(mentionRegex) || [];
    return matches
      .map((mention) => mention.substring(1).toLowerCase())
      .slice(0, 10);
  },

  // Get comment count for a rant (faster than fetching all comments)
  async getCommentCount(rantId) {
    try {
      const q = query(
        collection(db, "comments"),
        where("rantId", "==", rantId),
        where("isDeleted", "==", false)
      );

      const querySnapshot = await getDocsFromServer(q);
      return querySnapshot.size;
    } catch (error) {
      console.error("Error getting comment count:", error);
      return 0;
    }
  },
};

// Export individual functions for convenience
export const {
  createComment,
  getCommentsByRant,
  subscribeToComments,
  updateComment,
  deleteComment,
  getUserComments,
  getCommentCount,
} = commentService;
