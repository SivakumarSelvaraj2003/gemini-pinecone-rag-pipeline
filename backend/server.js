const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

// Import our Lego Blocks
// Import our Lego Blocks
const { processUniversalFile } = require("./services/fileService"); // 👈 Changed!
// Change your import to include generateSpeech
const { createEmbeddings, generateAnswer, generateSpeech } = require("./services/aiService");
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

    console.log("1. Running Universal File Router...");

    // Grab both the buffer AND the file's digital passport (mimetype)
    const fileBuffer = req.file.buffer;
    const fileMime = req.file.mimetype;

    // Pass them both to the new Traffic Cop
    const chunks = await processUniversalFile(fileBuffer, fileMime);

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
    // Create a 100% unique filename using the current timestamp
    const uniqueFileName = `${Date.now()}_${req.file.originalname}`;

    // Pass the unique name to the database
    await storeVectors(chunks, embeddings, uniqueFileName);

    res.json({
      success: true,
      message: "PDF processed and stored successfully!",
      savedFileName: uniqueFileName, // Send the unique name back to the frontend
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
   const targetFilename = req.body.targetFilename; // Grab the secret nametag!

   console.log("1. Embedding user question...");
   const questionEmbedding = await createEmbeddings([userMessage]);

   console.log(`2. Searching Vector DB inside: ${targetFilename}...`);
   // Pass the nametag to the search function
   const relevantContext = await searchSimilar(
     questionEmbedding[0],
     targetFilename,
   );

    console.log("3. Generating AI answer...");
    const answer = await generateAnswer(userMessage, relevantContext);

    res.json({ answer: answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate answer" });
  }
});


// --- ENDPOINT 3: Generate Audio Answer ---
app.post("/api/tts", async (req, res) => {
    try {
        const text = req.body.text;
        if (!text) return res.status(400).json({ error: "No text provided" });

        const audioData = await generateSpeech(text);

        // Send both pieces of data to the frontend
        res.json({
          audioBase64: audioData.base64,
          mimeType: audioData.mimeType,
        });
    } catch (error) {
        console.error("Audio Generation Error:", error);
        res.status(500).json({ error: "Failed to generate audio" });
    }
});

const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));

// If the user visits the main URL, send them the index.html file!
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
