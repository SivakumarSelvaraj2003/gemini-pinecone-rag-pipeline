const pdfParse = require("pdf-parse");

function chunkText(text, chunkSize = 1000) {
  const cleanedText = text.replace(/\s+/g, " ").trim();
  if (!cleanedText) return [];

  const chunks = [];
  for (let i = 0; i < cleanedText.length; i += chunkSize) {
    chunks.push(cleanedText.slice(i, i + chunkSize));
  }
  return chunks;
}

async function processPdf(fileBuffer) {
  try {
    const data = await pdfParse(fileBuffer);

    // 🚨 DEBUGGING LOGS: See what is actually being extracted
    console.log("--- RAW TEXT EXTRACTED ---");
    console.log(
      data.text ? data.text.substring(0, 150) + "..." : "[NO TEXT FOUND]",
    );
    console.log("--------------------------");

    const chunks = chunkText(data.text);
    console.log(`Created ${chunks.length} chunks of text.`);

    return chunks;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw error;
  }
}

module.exports = { processPdf };
