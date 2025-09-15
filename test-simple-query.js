const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  addDoc,
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

async function testSimpleQuery() {
  try {
    console.log("Testing simple comments query...");

    // Get any rant
    const rantsSnapshot = await getDocs(collection(db, "rants"));
    console.log("Existing rants:", rantsSnapshot.size);

    if (rantsSnapshot.size > 0) {
      const firstRant = rantsSnapshot.docs[0];
      const rantId = firstRant.id;
      console.log("Testing with rant ID:", rantId);

      // Try simpler query without orderBy
      const q = query(
        collection(db, "comments"),
        where("rantId", "==", rantId)
      );

      const commentsSnapshot = await getDocs(q);
      console.log(
        "✅ Comments for this rant (simple query):",
        commentsSnapshot.size
      );

      commentsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Comment:", data.content);
      });
    } else {
      console.log("No rants found");
    }
  } catch (error) {
    console.error("❌ Error with simple query:", error);
  }
}

testSimpleQuery();
