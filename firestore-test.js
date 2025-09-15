// Run this in the browser console to test Firestore permissions
import { db } from "/src/lib/firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

async function testFirestoreWrite() {
  try {
    console.log("Testing Firestore write permissions...");

    const testDoc = {
      test: true,
      content: "test content",
      createdAt: serverTimestamp(),
      authorId: "test-user-123",
    };

    const docRef = await addDoc(collection(db, "rants"), testDoc);
    console.log("✅ SUCCESS: Document written with ID: ", docRef.id);
  } catch (error) {
    console.error("❌ FAILED: Firestore write error:", error);

    if (error.code === "permission-denied") {
      console.error(
        "🔒 PERMISSION DENIED: Check your Firestore security rules"
      );
    } else if (error.code === "unauthenticated") {
      console.error("🚫 UNAUTHENTICATED: User is not logged in");
    }
  }
}

// Run the test
testFirestoreWrite();
