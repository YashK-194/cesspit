const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  doc,
  setDoc,
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

async function createTestStances() {
  try {
    console.log("Creating test user stances...");

    // Get first rant
    const rantsSnapshot = await getDocs(collection(db, "rants"));

    if (rantsSnapshot.size > 0) {
      const firstRant = rantsSnapshot.docs[0];
      const rantId = firstRant.id;
      console.log("Using rant ID:", rantId);

      // Create test stances for different users
      const testStances = [
        {
          userId: "test-user-123",
          stance: "favor",
          username: "testuser",
        },
        {
          userId: "user-456",
          stance: "against",
          username: "anon_user",
        },
        {
          userId: "user-789",
          stance: "favor",
          username: "coolperson",
        },
      ];

      for (const testStance of testStances) {
        const stanceId = `${testStance.userId}_${rantId}`;
        const stanceData = {
          userId: testStance.userId,
          rantId: rantId,
          stance: testStance.stance,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await setDoc(doc(db, "user_stances", stanceId), stanceData);
        console.log(
          `✅ Created stance: ${testStance.username} is ${testStance.stance}`
        );
      }

      console.log(
        "\n🎉 All test stances created! Now update the existing comments..."
      );
    } else {
      console.log("No rants found to test with");
    }
  } catch (error) {
    console.error("❌ Error creating test stances:", error);
  }
}

createTestStances();
