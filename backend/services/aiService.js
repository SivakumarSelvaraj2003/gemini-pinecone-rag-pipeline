const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

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

// 🚨 NEW FUNCTION: Generate Human-like Audio with Gemini
async function generateSpeech(text) {
  console.log("Generating audio with Gemini TTS...");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            // "Aoede", "Kore", "Puck", "Charon", or "Fenrir"
            prebuiltVoiceConfig: { voiceName: "Aoede" },
          },
        },
      },
    }),
  });

  const data = await response.json();

  // Grab the actual inline data object
  const inlineData = data.candidates[0].content.parts[0].inlineData;

  // Return BOTH the base64 audio and the correct format (mimeType)
  return {
    base64: inlineData.data,
    mimeType: inlineData.mimeType, // Gemini usually returns 'audio/mpeg'
  };
}

// ⚠️ Don't forget to export the new function at the very bottom!
module.exports = { createEmbeddings, generateAnswer, generateSpeech };

