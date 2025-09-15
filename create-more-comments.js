const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

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

async function createMoreComments() {
  const rantId = "3u3fv2vz45U2CtWom80R";

  const comments = [
    {
      authorId: "user-456",
      authorUsername: "anon_user",
      authorName: "Anonymous User",
      content: "I totally agree with this rant! 👍",
    },
    {
      authorId: "test-user-123",
      authorUsername: "testuser",
      authorName: "Test User",
      content: "Here's another comment from the same user to test the UI",
    },
    {
      authorId: "user-789",
      authorUsername: "coolperson",
      authorName: "Cool Person",
      content: "This is an interesting perspective. What do others think?",
    },
  ];

  try {
    for (const comment of comments) {
      const testComment = {
        rantId: rantId,
        authorId: comment.authorId,
        authorUsername: comment.authorUsername,
        authorName: comment.authorName,
        authorPhotoURL: null,
        content: comment.content,
        contentType: "text",
        createdAt: new Date(),
        updatedAt: new Date(),
        upvotes: Math.floor(Math.random() * 5),
        downvotes: Math.floor(Math.random() * 2),
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

      // Calculate net score
      testComment.netScore = testComment.upvotes - testComment.downvotes;

      const docRef = await addDoc(collection(db, "comments"), testComment);
      console.log(
        `✅ Comment created: "${comment.content}" (ID: ${docRef.id})`
      );

      // Add slight delay between comments
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(
      "\n🎉 All test comments created! Check the browser to see them."
    );
  } catch (error) {
    console.error("❌ Error creating comments:", error);
  }
}

createMoreComments();
