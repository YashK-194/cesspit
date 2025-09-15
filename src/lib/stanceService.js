import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * User Stances Database Schema:
 *
 * Collection: "user_stances"
 * Document ID: userId_rantId (composite key)
 *
 * Fields:
 * - userId: string
 * - rantId: string
 * - stance: string ("favor" | "against")
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */

export const stanceService = {
  // Get user's stance for a specific rant
  async getUserStance(userId, rantId) {
    try {
      const stanceId = `${userId}_${rantId}`;
      const stanceDoc = await getDoc(doc(db, "user_stances", stanceId));

      if (stanceDoc.exists()) {
        return stanceDoc.data();
      }

      return null;
    } catch (error) {
      console.error("Error getting user stance:", error);
      throw error;
    }
  },

  // Set user's stance for a specific rant (only allowed once)
  async setUserStance(userId, rantId, stance) {
    try {
      // Validate stance
      if (!["favor", "against"].includes(stance)) {
        throw new Error("Invalid stance. Must be 'favor' or 'against'");
      }

      const stanceId = `${userId}_${rantId}`;

      // Check if stance already exists
      const existingStance = await this.getUserStance(userId, rantId);
      if (existingStance) {
        throw new Error("User has already set a stance for this rant");
      }

      const stanceData = {
        userId,
        rantId,
        stance,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "user_stances", stanceId), stanceData);

      return {
        id: stanceId,
        ...stanceData,
      };
    } catch (error) {
      console.error("Error setting user stance:", error);
      throw error;
    }
  },

  // Get all stances for a rant (for analytics/stats)
  async getRantStances(rantId) {
    try {
      const q = query(
        collection(db, "user_stances"),
        where("rantId", "==", rantId)
      );

      const snapshot = await getDocs(q);
      const stances = [];

      snapshot.forEach((doc) => {
        stances.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return stances;
    } catch (error) {
      console.error("Error getting rant stances:", error);
      throw error;
    }
  },

  // Get stance statistics for a rant
  async getRantStanceStats(rantId) {
    try {
      const stances = await this.getRantStances(rantId);

      const stats = {
        total: stances.length,
        favor: stances.filter((s) => s.stance === "favor").length,
        against: stances.filter((s) => s.stance === "against").length,
      };

      stats.favorPercentage =
        stats.total > 0 ? Math.round((stats.favor / stats.total) * 100) : 0;
      stats.againstPercentage =
        stats.total > 0 ? Math.round((stats.against / stats.total) * 100) : 0;

      return stats;
    } catch (error) {
      console.error("Error getting stance stats:", error);
      throw error;
    }
  },
};
