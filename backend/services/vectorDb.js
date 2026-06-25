const { Pinecone } = require("@pinecone-database/pinecone");
require("dotenv").config();

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
console.log("Index Name:", process.env.PINECONE_INDEX_NAME);
const index = pc.index(process.env.PINECONE_INDEX_NAME);

// Saves vectors into Pinecone
async function storeVectors(chunks, embeddings, fileName) {
  if (
    !chunks ||
    chunks.length === 0 ||
    !embeddings ||
    embeddings.length === 0
  ) {
    throw new Error("Data was lost before reaching the database. Cannot save.");
  }

  // 1. Map the vectors and force every single item into a standard JS Number
  const vectors = chunks.map((chunk, i) => {
    return {
      id: `chunk-${Date.now()}-${i}`,
      values: Array.from(embeddings[i]).map((num) => Number(num)),
      metadata: {
        text: chunk,
        source_file: fileName, // 👈 Attach the sticky note!
      },
    };
  });

  // 2. 🚨 THE MAGIC FIX: Strip away all Google Protobuf wrappers
  const sanitizedVectors = JSON.parse(JSON.stringify(vectors));

  console.log(
    `[VectorDB] Uploading ${sanitizedVectors.length} purified vectors to Pinecone...`,
  );

  // 👇 ADD THESE LINES HERE
  console.log("First vector:");
  console.dir(sanitizedVectors[0], { depth: null });

  console.log("Values length:", sanitizedVectors[0]?.values?.length);
  console.log("First 5 values:", sanitizedVectors[0]?.values?.slice(0, 5));

  console.log("Is Array?", Array.isArray(sanitizedVectors));
  console.log("Vector Count:", sanitizedVectors.length);

  await index.upsert({
    records: sanitizedVectors,
  });

  console.log("✅ Upload successful");
}

// Searches Pinecone for the most relevant text based on the user's question
async function searchSimilar(queryEmbedding, targetFilename) {
  const cleanSearchVector = Array.from(queryEmbedding).map((n) => Number(n));

  const queryParams = {
    vector: cleanSearchVector,
    topK: 3,
    includeMetadata: true,
  };

  // 🚨 Apply the filter if a specific file is requested!
  if (targetFilename) {
    queryParams.filter = { source_file: targetFilename };
  }

  const queryResponse = await index.query(queryParams);

  return queryResponse.matches.map((match) => match.metadata.text).join("\n\n");
}

module.exports = { storeVectors, searchSimilar };
