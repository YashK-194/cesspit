const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  addDoc,
  getDocs,
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

async function createTestComment() {
  try {
    console.log("Creating test comment...");

    // Get first rant
    const rantsSnapshot = await getDocs(collection(db, "rants"));

    if (rantsSnapshot.size > 0) {
      const firstRant = rantsSnapshot.docs[0];
      const rantId = firstRant.id;
      console.log("Using rant ID:", rantId);

      // Create test comment
      const testComment = {
        rantId: rantId,
        authorId: "test-user-123",
        authorUsername: "testuser",
        authorName: "Test User",
        authorPhotoURL: null,
        content: "This is a test comment to verify the system works!",
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
      console.log(
        "You can now test the comments loading in the app at rant:",
        rantId
      );
    } else {
      console.log("No rants found to test with");
    }
  } catch (error) {
    console.error("❌ Error creating test comment:", error);
  }
}

createTestComment();
