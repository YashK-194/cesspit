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

async function testFirestore() {
  try {
    console.log("Testing Firestore connection...");

    // Try to read from rants collection
    const rantsSnapshot = await getDocs(collection(db, "rants"));
    console.log("Existing rants count:", rantsSnapshot.size);

    // Try to add a test document
    const testRant = {
      content: "Test rant from script",
      authorId: "test-user",
      createdAt: new Date(),
      upvotes: 0,
      downvotes: 0,
    };

    const docRef = await addDoc(collection(db, "rants"), testRant);
    console.log("Test rant created with ID:", docRef.id);
  } catch (error) {
    console.error("Firestore test failed:", error);
  }
}

testFirestore();
