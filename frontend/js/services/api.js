// The base URL for your future Node.js server
const API_URL = 'http://localhost:3000/api';

export const ApiService = {
  // Sends the PDF file to the backend
  async uploadDocument(file) {
    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  },

  // Sends the user's question to the backend and gets the AI response
  async askQuestion(question, activeDocumentName) {
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          targetFilename: activeDocumentName, // 👈 Send it to the server!
        }),
      });
      return await response.json();
    } catch (error) {
      console.error("Chat failed:", error);
      throw error;
    }
  },
};