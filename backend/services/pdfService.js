const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function chunkText(text, chunkSize = 1000) {
  const cleanedText = text.replace(/\s+/g, " ").trim();
  if (!cleanedText) return [];

  const chunks = [];
  for (let i = 0; i < cleanedText.length; i += chunkSize) {
    chunks.push(cleanedText.slice(i, i + chunkSize));
  }
  return chunks;
}

// 🚨 We use Gemini for EVERYTHING (Text + Images + Diagrams)
async function processPdf(fileBuffer) {
  try {
    console.log("Analyzing PDF (Text & Visuals) with Gemini...");

    // Using flash model as it supports multimodal file reading natively
    // Using the active flash-lite model as it supports multimodal file reading natively
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    const prompt = `
    You are an expert document analyzer. Read this document carefully.
    1. Extract all readable text exactly as it appears.
    2. If there are any charts, diagrams, or images, write a highly detailed text description of exactly what data they show and insert it where the image appears.
    Return ONLY the extracted text and descriptions.
    `;

    // Convert the memory buffer into the base64 format Gemini expects
    const pdfPart = {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType: "application/pdf",
      },
    };

    const result = await model.generateContent([prompt, pdfPart]);
    const extractedText = result.response.text();

    console.log("--- AI EXTRACTED DATA ---");
    console.log(
      extractedText
        ? extractedText.substring(0, 150) + "..."
        : "[NO TEXT FOUND]",
    );
    console.log("-------------------------");

    const chunks = chunkText(extractedText);
    console.log(`Created ${chunks.length} chunks of text.`);

    return chunks;
  } catch (error) {
    console.error("Error parsing PDF with AI:", error);
    throw error;
  }
}

module.exports = { processPdf };
