export class Uploader {
  constructor(apiService, onUploadSuccess) {
    this.api = apiService;
    this.onUploadSuccess = onUploadSuccess; // Callback to notify main.js when done

    // DOM Elements
    this.inputElement = document.getElementById("pdf-input");
    this.buttonElement = document.getElementById("upload-btn");
    this.statusElement = document.getElementById("upload-status");

    this.initEventListeners();
  }

  initEventListeners() {
    // Trigger file input when button is clicked
    this.buttonElement.addEventListener("click", () =>
      this.inputElement.click(),
    );

    // Handle file selection
    this.inputElement.addEventListener("change", (e) =>
      this.handleUpload(e.target.files[0]),
    );
  }

  async handleUpload(file) {
    if (!file || file.type !== "application/pdf") {
      this.statusElement.innerText = "Please select a valid PDF.";
      this.statusElement.style.color = "red";
      return;
    }

    this.statusElement.innerText = `Uploading ${file.name}...`;
    this.statusElement.style.color = "blue";
    this.buttonElement.disabled = true;

    try {
      // THE FIX: Call your actual api.js function!
     const result = await this.api.uploadDocument(file);

     this.statusElement.innerText = "Processing complete! Ready to chat.";
     this.statusElement.style.color = "green";
     // Pass the unique name from the server to the callback!
     this.onUploadSuccess(result.savedFileName);
    } catch (error) {
      this.statusElement.innerText = "Upload failed.";
      this.statusElement.style.color = "red";
      this.buttonElement.disabled = false;
    }
  }
}