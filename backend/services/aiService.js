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

module.exports = { createEmbeddings, generateAnswer };