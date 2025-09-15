"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { createRant } from "../../lib/rantService";

export default function TestRantCreation() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!user) {
      setResult("Error: No user logged in");
      return;
    }

    setLoading(true);
    setResult("Creating rant...");

    try {
      console.log("User:", user);
      console.log("Content:", content);

      const newRant = await createRant(user.uid, content);
      setResult(`Success! Rant created with ID: ${newRant.id}`);
      console.log("Created rant:", newRant);
    } catch (error) {
      console.error("Test error:", error);
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Rant Creation</h1>

      <div className="mb-4">
        <p>User: {user ? user.email : "Not logged in"}</p>
        <p>User ID: {user ? user.uid : "N/A"}</p>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter test rant content"
        className="w-full p-2 border rounded mb-4 text-black"
        rows={3}
      />

      <button
        onClick={handleTest}
        disabled={loading || !content.trim() || !user}
        className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
      >
        {loading ? "Creating..." : "Test Create Rant"}
      </button>

      {result && (
        <div
          className={`mt-4 p-2 rounded ${
            result.startsWith("Error")
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {result}
        </div>
      )}
    </div>
  );
}
