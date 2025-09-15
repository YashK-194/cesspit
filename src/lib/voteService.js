import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  getDocFromServer,
} from "firebase/firestore";
import { db } from "./firebase";
import { incrementRantStat } from "./rantService";

// Voting operations for rants
export const voteService = {
  // Vote on a rant (upvote or downvote)
  async voteOnRant(userId, rantId, voteType) {
    if (!["upvote", "downvote"].includes(voteType)) {
      throw new Error("Invalid vote type. Must be 'upvote' or 'downvote'");
    }

    try {
      const voteDocId = `${userId}_${rantId}`;
      const voteRef = doc(db, "votes", voteDocId);
      const existingVote = await getDocFromServer(voteRef);

      const batch = writeBatch(db);

      if (existingVote.exists()) {
        const currentVote = existingVote.data();

        if (currentVote.voteType === voteType) {
          // Same vote type - remove the vote
          batch.delete(voteRef);

          // Commit the batch first
          await batch.commit();

          // Decrement the vote count
          const incrementValue = voteType === "upvote" ? -1 : -1;
          await incrementRantStat(rantId, `${voteType}s`, incrementValue);

          return { action: "removed", voteType: null };
        } else {
          // Different vote type - update the vote
          batch.update(voteRef, {
            voteType,
            updatedAt: serverTimestamp(),
          });

          // Commit the batch first
          await batch.commit();

          // Update both counters (remove old, add new)
          const oldVoteType = currentVote.voteType;
          await incrementRantStat(rantId, `${oldVoteType}s`, -1);
          await incrementRantStat(rantId, `${voteType}s`, 1);

          return { action: "updated", voteType, previousVote: oldVoteType };
        }
      } else {
        // New vote
        const voteData = {
          userId,
          contentId: rantId,
          contentType: "rant",
          voteType,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        batch.set(voteRef, voteData);

        // Commit the batch first
        await batch.commit();

        // Increment the vote count
        await incrementRantStat(rantId, `${voteType}s`, 1);

        return { action: "created", voteType };
      }
    } catch (error) {
      console.error("Error voting on rant:", error);
      throw error;
    }
  },

  // Get user's vote on a rant
  async getUserVote(userId, rantId) {
    try {
      const voteDocId = `${userId}_${rantId}`;
      const voteDoc = await getDocFromServer(doc(db, "votes", voteDocId));

      if (voteDoc.exists()) {
        return voteDoc.data().voteType;
      }

      return null;
    } catch (error) {
      console.error("Error getting user vote:", error);
      return null;
    }
  },

  // Get multiple user votes for rants
  async getUserVotes(userId, rantIds) {
    try {
      const votes = {};

      const promises = rantIds.map(async (rantId) => {
        const voteType = await this.getUserVote(userId, rantId);
        if (voteType) {
          votes[rantId] = voteType;
        }
      });

      await Promise.all(promises);
      return votes;
    } catch (error) {
      console.error("Error getting user votes:", error);
      return {};
    }
  },

  // Remove all votes by a user (for account deletion)
  async removeAllUserVotes(userId) {
    try {
      // This would require a more complex query in a real implementation
      // For now, this is a placeholder for the functionality
      console.log(`Removing all votes for user: ${userId}`);
      // Implementation would involve querying all votes by userId and batch deleting
    } catch (error) {
      console.error("Error removing user votes:", error);
      throw error;
    }
  },
};

// Export individual functions for convenience
export const { voteOnRant, getUserVote, getUserVotes, removeAllUserVotes } =
  voteService;
