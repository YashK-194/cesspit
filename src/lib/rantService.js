import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  writeBatch,
  serverTimestamp,
  getDocsFromServer,
  getDocFromServer,
} from "firebase/firestore";
import { db } from "./firebase";
import { incrementUserStat } from "./userService";

// Rant-related operations
export const rantService = {
  // Create a new rant
  async createRant(authorId, content, options = {}) {
    console.log("Creating rant:", { authorId, content, options });
    try {
      // Get author info for denormalization
      let authorData = {
        username: "unknown",
        name: "Anonymous",
        photoURL: null,
      };
      try {
        const authorDoc = await getDocFromServer(doc(db, "users", authorId));
        if (authorDoc.exists()) {
          authorData = authorDoc.data();
          console.log("Author data:", authorData);
        } else {
          console.warn("Author not found, using fallback info:", authorId);
        }
      } catch (err) {
        console.warn("Error fetching author, using fallback info:", err);
      }

      // Extract hashtags and mentions
      const hashtags = rantService.extractHashtags(content);
      const mentions = rantService.extractMentions(content);

      const rantData = {
        authorId,
        authorUsername: authorData.username || "unknown",
        authorName: authorData.name || "Anonymous",
        authorPhotoURL: authorData.photoURL || null,

        // Content
        title: options.title || null,
        content: content.trim(),
        contentType: options.contentType || "text",

        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        // Engagement metrics
        upvotes: 0,
        downvotes: 0,
        netScore: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 0,

        // Content metadata
        tags: options.tags || [],
        mentions,
        hashtags,

        // Status flags
        isEdited: false,
        isDeleted: false,
        isPinned: false,

        // Moderation
        isReported: false,
        isFlagged: false,
        reportCount: 0,
        flagReason: null,

        // Visibility
        visibility: options.visibility || "public",

        // Reply context
        replyToRantId: options.replyToRantId || null,
        replyToAuthorId: options.replyToAuthorId || null,
        isReply: Boolean(options.replyToRantId),

        // Trending algorithm data
        engagementRate: 0,
        trendingScore: 0,
        lastEngagementAt: serverTimestamp(),
      };

      console.log("Rant data to save:", rantData);

      // Create rant document
      const rantRef = await addDoc(collection(db, "rants"), rantData);
      console.log("Rant created with ID:", rantRef.id);

      // Update user's rant count
      await incrementUserStat(authorId, "rantsCount", 1);

      // If this is a reply, update parent rant's comment count
      if (options.replyToRantId) {
        await rantService.incrementRantStat(
          options.replyToRantId,
          "commentsCount",
          1
        );
      }

      const createdRant = {
        id: rantRef.id,
        ...rantData,
      };

      console.log("Created rant:", createdRant);
      return createdRant;
    } catch (error) {
      console.error("Error creating rant:", error);
      throw error;
    }
  },

  // Get rant by ID
  async getRant(rantId) {
    try {
      const rantDoc = await getDocFromServer(doc(db, "rants", rantId));
      if (!rantDoc.exists()) {
        return null;
      }

      return {
        id: rantDoc.id,
        ...rantDoc.data(),
      };
    } catch (error) {
      console.error("Error fetching rant:", error);
      throw error;
    }
  },

  // Get user's rants
  async getUserRants(userId, limitCount = 20, lastVisible = null) {
    try {
      // Simplified query to avoid index requirements
      let q = query(
        collection(db, "rants"),
        where("authorId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount * 2) // Get more to filter out deleted ones
      );

      if (lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const querySnapshot = await getDocsFromServer(q);
      const rants = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter out deleted rants on client side
        if (!data.isDeleted && rants.length < limitCount) {
          rants.push({
            id: doc.id,
            ...data,
          });
        }
      });

      return {
        rants,
        lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        hasMore: querySnapshot.docs.length === limitCount * 2,
      };
    } catch (error) {
      console.error("Error fetching user rants:", error);
      throw error;
    }
  },

  // Get feed (latest rants)
  async getFeed(limitCount = 20, lastVisible = null, sortBy = "createdAt") {
    console.log("Fetching feed with params:", {
      limitCount,
      lastVisible,
      sortBy,
    });
    try {
      // Simplified query - remove compound where clauses that require indexes
      let q = query(
        collection(db, "rants"),
        orderBy(sortBy, "desc"),
        limit(limitCount)
      );

      if (lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      console.log("Executing Firestore query...");
      const querySnapshot = await getDocsFromServer(q);
      const rants = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter out deleted and non-public rants on the client side
        if (!data.isDeleted && data.visibility === "public") {
          rants.push({
            id: doc.id,
            ...data,
          });
        }
      });

      console.log("Fetched rants:", rants);
      return {
        rants,
        lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        hasMore: querySnapshot.docs.length === limitCount,
      };
    } catch (error) {
      console.error("Error fetching feed:", error);
      throw error;
    }
  },

  // Get trending rants
  async getTrendingRants(limitCount = 20) {
    try {
      // Simplified query without compound where clauses
      const q = query(
        collection(db, "rants"),
        orderBy("trendingScore", "desc"),
        limit(limitCount * 2) // Get more to filter
      );

      const querySnapshot = await getDocsFromServer(q);
      const rants = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter on client side
        if (
          !data.isDeleted &&
          data.visibility === "public" &&
          rants.length < limitCount
        ) {
          rants.push({
            id: doc.id,
            ...data,
          });
        }
      });

      return rants;
    } catch (error) {
      console.error("Error fetching trending rants:", error);
      throw error;
    }
  },

  // Search rants by hashtag
  async searchByHashtag(hashtag, limitCount = 20) {
    try {
      // Simplified query with only hashtag filter
      const q = query(
        collection(db, "rants"),
        where("hashtags", "array-contains", hashtag.toLowerCase()),
        orderBy("createdAt", "desc"),
        limit(limitCount * 2)
      );

      const querySnapshot = await getDocsFromServer(q);
      const rants = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter on client side
        if (
          !data.isDeleted &&
          data.visibility === "public" &&
          rants.length < limitCount
        ) {
          rants.push({
            id: doc.id,
            ...data,
          });
        }
      });

      return rants;
    } catch (error) {
      console.error("Error searching rants by hashtag:", error);
      throw error;
    }
  },

  // Update rant
  async updateRant(rantId, updates, userId) {
    try {
      const rantDoc = await getDocFromServer(doc(db, "rants", rantId));
      if (!rantDoc.exists()) {
        throw new Error("Rant not found");
      }

      const rantData = rantDoc.data();
      if (rantData.authorId !== userId) {
        throw new Error("Unauthorized to edit this rant");
      }

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        isEdited: true,
      };

      // Update hashtags and mentions if content is being updated
      if (updates.content) {
        updateData.hashtags = rantService.extractHashtags(updates.content);
        updateData.mentions = rantService.extractMentions(updates.content);
      }

      await updateDoc(doc(db, "rants", rantId), updateData);

      return {
        id: rantId,
        ...rantData,
        ...updateData,
      };
    } catch (error) {
      console.error("Error updating rant:", error);
      throw error;
    }
  },

  // Soft delete rant
  async deleteRant(rantId, userId) {
    try {
      const rantDoc = await getDocFromServer(doc(db, "rants", rantId));
      if (!rantDoc.exists()) {
        throw new Error("Rant not found");
      }

      const rantData = rantDoc.data();
      if (rantData.authorId !== userId) {
        throw new Error("Unauthorized to delete this rant");
      }

      await updateDoc(doc(db, "rants", rantId), {
        isDeleted: true,
        updatedAt: serverTimestamp(),
      });

      // Decrement user's rant count
      await incrementUserStat(userId, "rantsCount", -1);

      return true;
    } catch (error) {
      console.error("Error deleting rant:", error);
      throw error;
    }
  },

  // Increment rant statistics
  async incrementRantStat(rantId, statField, incrementValue = 1) {
    try {
      const rantRef = doc(db, "rants", rantId);
      await updateDoc(rantRef, {
        [statField]: increment(incrementValue),
        lastEngagementAt: serverTimestamp(),
      });

      // Update trending score based on engagement
      if (
        ["upvotes", "downvotes", "commentsCount", "sharesCount"].includes(
          statField
        )
      ) {
        await rantService.updateTrendingScore(rantId);
      }
    } catch (error) {
      console.error(`Error incrementing ${statField}:`, error);
      throw error;
    }
  },

  // Update trending score (simplified algorithm)
  async updateTrendingScore(rantId) {
    try {
      const rantDoc = await getDocFromServer(doc(db, "rants", rantId));
      if (!rantDoc.exists()) return;

      const data = rantDoc.data();
      const ageInHours =
        (Date.now() - data.createdAt.toMillis()) / (1000 * 60 * 60);

      // Simple trending algorithm: (upvotes * 2 + comments * 3 - downvotes) / (age + 1)
      const engagementScore =
        data.upvotes * 2 + data.commentsCount * 3 - data.downvotes;
      const trendingScore = engagementScore / (ageInHours + 1);
      const engagementRate =
        data.viewsCount > 0
          ? ((data.upvotes + data.commentsCount + data.sharesCount) /
              data.viewsCount) *
            100
          : 0;

      await updateDoc(doc(db, "rants", rantId), {
        trendingScore: Math.max(0, trendingScore),
        engagementRate,
        netScore: data.upvotes - data.downvotes,
      });
    } catch (error) {
      console.error("Error updating trending score:", error);
    }
  },

  // Extract hashtags from content
  extractHashtags(content) {
    const hashtagRegex = /#[\w]+/g;
    const matches = content.match(hashtagRegex) || [];
    return matches.map((tag) => tag.substring(1).toLowerCase()).slice(0, 5); // Max 5 hashtags
  },

  // Extract mentions from content
  extractMentions(content) {
    const mentionRegex = /@[\w]+/g;
    const matches = content.match(mentionRegex) || [];
    return matches
      .map((mention) => mention.substring(1).toLowerCase())
      .slice(0, 10); // Max 10 mentions
  },

  // Get replies to a rant
  async getReplies(rantId, limitCount = 20) {
    try {
      // Simplified query with only replyToRantId filter
      const q = query(
        collection(db, "rants"),
        where("replyToRantId", "==", rantId),
        orderBy("createdAt", "asc"),
        limit(limitCount * 2)
      );

      const querySnapshot = await getDocsFromServer(q);
      const replies = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter on client side
        if (!data.isDeleted && replies.length < limitCount) {
          replies.push({
            id: doc.id,
            ...data,
          });
        }
      });

      return replies;
    } catch (error) {
      console.error("Error fetching replies:", error);
      throw error;
    }
  },
};

// Export individual functions for convenience
export const {
  createRant,
  getRant,
  getUserRants,
  getFeed,
  getTrendingRants,
  searchByHashtag,
  updateRant,
  deleteRant,
  incrementRantStat,
  getReplies,
} = rantService;
