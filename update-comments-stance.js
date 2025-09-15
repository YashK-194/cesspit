const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCs6fb3detwEzHnaZOGD4q2MA0iMxaQ-KQ",
  authDomain: "cesspit-bc673.firebaseapp.com",
  projectId: "cesspit-bc673",
  storageBucket: "cesspit-bc673.firebasestorage.app",
  messagingSenderId: "1063750755374",
  appId: "1:1063750755374:web:f9c82c28150601a2a3ebbf",
  measurementId: "G-CGVEF58CVK",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateCommentsWithStance() {
  try {
    console.log("Updating existing comments with stance information...");

    const rantId = "3u3fv2vz45U2CtWom80R";

    // Get all comments for this rant
    const q = query(collection(db, "comments"), where("rantId", "==", rantId));
    const commentsSnapshot = await getDocs(q);

    console.log(`Found ${commentsSnapshot.size} comments to update`);

    // User stance mapping
    const userStances = {
      "test-user-123": "favor",
      "user-456": "against",
      "user-789": "favor",
    };

    for (const commentDoc of commentsSnapshot.docs) {
      const commentData = commentDoc.data();
      const authorId = commentData.authorId;
      const stance = userStances[authorId];

      if (stance) {
        await updateDoc(doc(db, "comments", commentDoc.id), {
          authorStance: stance,
        });
        console.log(
          `✅ Updated comment by ${commentData.authorUsername} with stance: ${stance}`
        );
      } else {
        console.log(`⚠️  No stance found for user: ${authorId}`);
      }
    }

    console.log("\n🎉 All comments updated with stance information!");
  } catch (error) {
    console.error("❌ Error updating comments:", error);
  }
}

updateCommentsWithStance();
