<h1 style="color: #059669; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">DocuSight: Enterprise Policy Intelligence</h1>

<p>DocuSight is a specialized, strictly-grounded Retrieval-Augmented Generation (RAG) application built to help employees and stakeholders interact with dense internal policy documents, manuals, and compliance texts.</p>

<p>While most AI wrappers act as open-ended conversational agents, DocuSight is designed with a singular focus: <strong>Data Integrity</strong>. It extracts, embeds, and vocalizes document data without the risk of external hallucination.</p>

<hr>

<h2 style="color: #047857;">The "Why": Solving the Hallucination Problem</h2>

<p>A common question from engineering managers and recruiters regarding LLM wrappers is: <span style="color: #991B1B;"><em>"Why use this over ChatGPT, and how do you prevent the AI from making things up?"</em></span></p>

<p>Standard AI chatbots are prone to hallucination. If you ask a generic AI about a company's specific PTO policy, it will often "guess" based on its training data, providing an answer that sounds confident but is factually (and legally) incorrect for that specific company.</p>

<p>DocuSight solves this through strict isolation. When a document is uploaded, it is broken down and converted into a mathematical vector space using <strong>Pinecone</strong>. When a user asks a question, the application does not ask the AI for an answer—it searches the Pinecone database for the mathematical closest match to the question, retrieves <em>only</em> that specific paragraph, and instructs the AI to format that exact text.</p>

<p><span style="background-color: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px;">If the answer does not exist within the uploaded document, the system is hard-coded to refuse the answer rather than invent one.</span></p>

<hr>

<h2 style="color: #047857;">Technical Architecture & Stack</h2>

<p>This project is built using a decoupled architecture, separating the client-side interface from the AI and database processing layers.</p>

<h3 style="color: #2C3539;">Core AI Models (Google Gemini)</h3>
<ul>
  <li><strong>Multimodal Extraction:</strong> <code>gemini-3.1-flash-lite</code> is used to extract both raw text and generate highly detailed text descriptions of charts/diagrams found in PDFs.</li>
  <li><strong>Vector Embeddings:</strong> <code>gemini-embedding-001</code> translates the parsed document chunks into 768-dimensional numerical vectors.</li>
  <li><strong>Text-to-Speech (TTS):</strong> <code>gemini-3.1-flash-tts-preview</code> (using the 'Aoede' voice profile) generates human-like audio responses.</li>
</ul>

<h3 style="color: #2C3539;">Backend Infrastructure</h3>
<ul>
  <li><strong>Runtime:</strong> Node.js with Express.</li>
  <li><strong>Vector Database:</strong> Pinecone SDK is used for storing and querying the document embeddings.</li>
  <li><strong>File Parsing:</strong> <code>multer</code> handles memory storage for uploads, while <code>mammoth</code> is specifically utilized to cleanly extract raw text from <code>.docx</code> file formats.</li>
  <li><strong>Audio Processing:</strong> The <code>wavefile</code> library converts incoming base64 PCM audio from the Gemini API into valid 16-bit WAV files. These are cached locally on the server to prevent redundant API calls for repeated answers.</li>
</ul>

<h3 style="color: #2C3539;">Frontend Experience</h3>
<ul>
  <li><strong>State Management:</strong> Native <code>localStorage</code> is used to maintain session persistence. If a user refreshes the page, their active document reference and chat history are seamlessly reloaded.</li>
  <li><strong>Audio Player:</strong> A custom asynchronous audio controller built in Vanilla JavaScript prevents overlapping audio and gracefully handles state changes (Play/Pause/Generating).</li>
  <li><strong>Styling:</strong> Pure CSS utilizing a custom "Ivory & Green" light-mode theme, designed specifically to reduce eye strain when reading long compliance documents.</li>
</ul>

<hr>

<h2 style="color: #047857;">Future Roadmap</h2>

<p>Software is never truly finished. If this project were to be scaled for a production enterprise environment, the following features would be the immediate next steps in the development lifecycle:</p>

<ol>
  <li><strong>Cloud Audio Storage (AWS S3):</strong> Currently, generated <code>.wav</code> files are cached on the local server. For horizontal scaling, this would be migrated so that the Node backend pipes the audio stream directly to an S3 bucket, saving the CDN link in a PostgreSQL database.</li>
  <li><strong>Multi-Document Context:</strong> The current iteration maps one active document at a time. The next update would involve adding namespace filtering to the Pinecone queries, allowing a user to ask a question that cross-references an Employee Handbook against a specific Department Guideline simultaneously.</li>
  <li><strong>Source Citation UI:</strong> Modifying the system prompt to return the exact page number or chunk ID alongside the answer, and rendering a clickable citation tag in the frontend UI so users can verify the original text instantly.</li>
</ol>

<hr>

<h2 style="color: #047857;">Local Setup Instructions</h2>

<p>To run this project locally, ensure you have Node.js installed, then follow these steps:</p>

<p><strong>1. Clone the repository and install dependencies:</strong></p>
<pre><code>git clone [your-repo-link]
cd DocuSight/internal/backend
npm install
</code></pre>

<p><strong>2. Configure Environment Variables:</strong></p>
<p>Create a <code>.env</code> file in the <code>backend</code> directory and provide your API keys:</p>
<pre><code>GEMINI_API_KEY=your_google_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=your_index_name
PORT=3000
</code></pre>

<p><strong>3. Boot the Server:</strong></p>
<p>Because the server dynamically writes audio files to a cache folder, run the server with the following command to prevent nodemon from infinitely refreshing:</p>
<pre><code>nodemon server.js --ignore 'cache/*'
</code></pre>

<p><strong>4. Launch the Client:</strong></p>
<p>Open <code>internal/frontend/index.html</code> using VS Code Live Server (ensure your <code>.vscode/settings.json</code> is configured to ignore the backend directory to prevent unwanted browser refreshes).</p>