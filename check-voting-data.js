const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
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

async function checkVotingData() {
  try {
    console.log("Checking voting system data...\n");

    // Check if there are any votes
    const votesSnapshot = await getDocs(collection(db, "votes"));
    console.log(`Found ${votesSnapshot.size} votes in the database`);

    if (votesSnapshot.size > 0) {
      console.log("\nExisting votes:");
      votesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(
          `- ${doc.id}: User ${data.userId} voted ${data.voteType} on content ${data.contentId}`
        );
      });
    }

    // Check rant vote counts
    const rantsSnapshot = await getDocs(collection(db, "rants"));
    console.log(`\nChecking vote counts for ${rantsSnapshot.size} rants:`);

    rantsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(
        `- Rant ${doc.id}: ${data.upvotes || 0} upvotes, ${
          data.downvotes || 0
        } downvotes`
      );
      console.log(`  Title: "${data.title?.substring(0, 50)}..."`);
    });
  } catch (error) {
    console.error("❌ Error checking voting data:", error);
  }
}

checkVotingData();
