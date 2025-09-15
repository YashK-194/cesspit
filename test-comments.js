const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
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

async function testComments() {
  try {
    console.log("Testing comments functionality...");

    // First, let's see if there are any rants
    const rantsSnapshot = await getDocs(collection(db, "rants"));
    console.log("Existing rants:", rantsSnapshot.size);

    if (rantsSnapshot.size > 0) {
      const firstRant = rantsSnapshot.docs[0];
      const rantId = firstRant.id;
      console.log("Testing with rant ID:", rantId);

      // Try to read existing comments
      const q = query(
        collection(db, "comments"),
        where("rantId", "==", rantId),
        where("isDeleted", "==", false),
        orderBy("createdAt", "asc")
      );

      const commentsSnapshot = await getDocs(q);
      console.log("Existing comments for this rant:", commentsSnapshot.size);

      // Try to create a test comment
      const testComment = {
        rantId: rantId,
        authorId: "test-user-123",
        authorUsername: "testuser",
        authorName: "Test User",
        authorPhotoURL: null,
        content: "This is a test comment",
        contentType: "text",
        createdAt: new Date(),
        updatedAt: new Date(),
        upvotes: 0,
        downvotes: 0,
        netScore: 0,
        isEdited: false,
        isDeleted: false,
        deletedAt: null,
        replyToCommentId: null,
        replyToAuthorId: null,
        isReply: false,
        mentions: [],
        hashtags: [],
        isReported: false,
        isFlagged: false,
        reportCount: 0,
      };

      const docRef = await addDoc(collection(db, "comments"), testComment);
      console.log("✅ Test comment created with ID:", docRef.id);

      // Try to read comments again
      const newCommentsSnapshot = await getDocs(q);
      console.log("Comments after creation:", newCommentsSnapshot.size);
    } else {
      console.log("No rants found to test comments with");
    }
  } catch (error) {
    console.error("❌ Error testing comments:", error);

    if (error.code === "failed-precondition") {
      console.error(
        "🔍 This might be a Firestore index issue. Check Firebase Console > Firestore > Indexes"
      );
    }
  }
}

testComments();
