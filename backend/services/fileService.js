const { GoogleGenerativeAI } = require("@google/generative-ai");
const mammoth = require("mammoth"); // For .docx files
require("dotenv").config();

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

// 🚨 THE TRAFFIC COP ROUTER
async function processUniversalFile(fileBuffer, mimeType) {
  try {
    let extractedText = "";
    console.log(`[Traffic Cop] File arrived. Detected type: ${mimeType}`);

    // HIGHWAY 1: Vision Files (PDFs & Images)
    if (mimeType === "application/pdf" || mimeType.startsWith("image/")) {
      console.log("--> Routing to Gemini Multimodal Vision...");
      const model = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite",
      });

      const prompt = `Extract all text. If there are diagrams, charts, or images, write a highly detailed text description of what data they show.`;

      const filePart = {
        inlineData: { data: fileBuffer.toString("base64"), mimeType: mimeType },
      };

      const result = await model.generateContent([prompt, filePart]);
      extractedText = result.response.text();
    }

    // HIGHWAY 2: Raw Text Files (.txt, .csv, .md)
    else if (mimeType.startsWith("text/") || mimeType === "application/json") {
      console.log("--> Routing to Instant Buffer Reader...");
      extractedText = fileBuffer.toString("utf-8");
    }

    // HIGHWAY 3: Word Documents (.docx)
    else if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      console.log("--> Routing to Mammoth Word Extractor...");
      const docResult = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = docResult.value;
    } else {
      throw new Error(`Sorry, we do not support the file type: ${mimeType}`);
    }

    const chunks = chunkText(extractedText);
    console.log(`[Traffic Cop] Success! Created ${chunks.length} chunks.`);
    return chunks;
  } catch (error) {
    console.error("File Router Error:", error);
    throw error;
  }
}

module.exports = { processUniversalFile };
