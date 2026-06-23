const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

// Import our Lego Blocks
const { processPdf } = require("./services/pdfService");
const { createEmbeddings, generateAnswer } = require("./services/aiService");
const { storeVectors, searchSimilar } = require("./services/vectorDb");

const app = express();
app.use(cors());
app.use(express.json());

// Set up multer to store the uploaded file in memory
const upload = multer({ storage: multer.memoryStorage() });

// --- ENDPOINT 1: Upload and Process PDF ---
// --- ENDPOINT 1: Upload and Process PDF ---
app.post("/api/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    console.log("1. Extracting text from PDF...");
    const chunks = await processPdf(req.file.buffer);

    // If chunks is empty, STOP here and return a 400 error to the frontend
    if (!chunks || chunks.length === 0) {
      console.log("❌ Error: No readable text found. Aborting upload.");
      return res.status(400).json({
        error:
          "No readable text found. The PDF might be an image or scanned document.",
      });
    }

    console.log("2. Generating AI Embeddings...");
    const embeddings = await createEmbeddings(chunks);

    console.log("3. Saving to Pinecone Database...");
    await storeVectors(chunks, embeddings);

    res.json({
      success: true,
      message: "PDF processed and stored successfully!",
    });
  } catch (error) {
    // Print heavily to the backend terminal
    console.error("🚨 BACKEND UPLOAD ERROR:", error);

    // Send the actual error message to the frontend network tab/console
    res.status(500).json({
      error: "Failed to process document",
      details: error.message || error.toString(),
    });
  }
});

// --- ENDPOINT 2: Chat with the Document ---
app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    console.log("1. Embedding user question...");
    const questionEmbedding = await createEmbeddings([userMessage]);

    console.log("2. Searching Vector DB for relevant context...");
    const relevantContext = await searchSimilar(questionEmbedding[0]);

    console.log("3. Generating AI answer...");
    const answer = await generateAnswer(userMessage, relevantContext);

    res.json({ answer: answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate answer" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
