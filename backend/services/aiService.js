const { GoogleGenerativeAI } = require("@google/generative-ai");
const { WaveFile } = require("wavefile");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

// 🚨 Setup the Cache Folder automatically
const CACHE_DIR = path.join(__dirname, "../cache");
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  console.log("📁 Created Audio Cache directory at:", CACHE_DIR);
}

// Initialize Google SDK with your new free API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Turns text chunks into numerical vectors (768 dimensions)
async function createEmbeddings(texts) {
  // Updated to the active 2026 standard embedding model
  const model = genAI.getGenerativeModel({
    model: "gemini-embedding-001",
  });
  const embeddings = [];

  // Process each text chunk into a vector
  for (const text of texts) {
    const result = await model.embedContent(text);

    console.log("Embedding dimension:", result.embedding.values.length);

    embeddings.push(result.embedding.values);
  }
  return embeddings;
}

// Takes the user question + the relevant PDF text to answer it
async function generateAnswer(question, relevantContext) {
  const prompt = `
    You are an intelligent document reading assistant. 
    Answer the user's question using ONLY the provided document context below. 
    If the answer is not in the context, say "I cannot find this in the uploaded document."
    
    Context:
    ${relevantContext}
    
    Question: ${question}
    `;

  // We use gemini-1.5-flash because it is lightning fast and free
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
  const result = await model.generateContent(prompt);

  return result.response.text();
}

async function generateSpeech(text) {
  // A. Hash the text into a unique filename (e.g., "8f4b2a...wav")
  const hash = crypto.createHash("md5").update(text).digest("hex");
  const filePath = path.join(CACHE_DIR, `${hash}.wav`);

  // B. THE GATEKEEPER: Does this file already exist on our hard drive?
  if (fs.existsSync(filePath)) {
    console.log(`🟢 CACHE HIT: Serving saved audio for hash: ${hash}`);
    // Read the saved file and turn it back into base64 for the frontend
    const savedAudioBase64 = fs.readFileSync(filePath, { encoding: "base64" });
    return {
      base64: savedAudioBase64,
      mimeType: "audio/wav",
    };
  }

  // C. CACHE MISS: We must ask Gemini for it.
  console.log(`🔴 CACHE MISS: Asking Gemini TTS to generate audio...`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
        },
      },
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(`Gemini API Error: ${data.error.message}`);

  const inlineData = data.candidates[0].content.parts.find(
    (p) => p.inlineData,
  )?.inlineData;
  if (!inlineData) throw new Error("No audio returned from Gemini");

  // Convert PCM to 16-bit WAV
  const pcmBuffer = Buffer.from(inlineData.data, "base64");
  const int16Samples = new Int16Array(
    pcmBuffer.buffer,
    pcmBuffer.byteOffset,
    pcmBuffer.length / 2,
  );

  const wav = new WaveFile();
  wav.fromScratch(1, 24000, "16", int16Samples);

  
  const finalWavBuffer = Buffer.from(wav.toBuffer());

 
  fs.writeFileSync(filePath, finalWavBuffer);
  console.log(`💾 SAVED: New audio cached at ${filePath}`);

  return {
    base64: finalWavBuffer.toString("base64"),
    mimeType: "audio/wav",
  };
}


module.exports = { createEmbeddings, generateAnswer, generateSpeech };
