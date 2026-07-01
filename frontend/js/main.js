import { ApiService } from "./services/api.js";
import { Uploader } from "./components/Uploader.js";
import { Chatbox } from "./components/Chatbox.js";

document.addEventListener("DOMContentLoaded", () => {
  const chatbox = new Chatbox(ApiService);

  // 1. Check if we already have a file in memory from a previous session!
  const savedFile = localStorage.getItem("activeFileName");
  if (savedFile) {
    window.currentActiveFile = savedFile;
    chatbox.enable(); // Unlock the chatbox immediately

    // Update the UI to show we remembered it
    const statusEl = document.getElementById("upload-status");
    statusEl.innerText = "Active Document Resumed!";
    statusEl.style.color = "green";


    const uploadBtn = document.getElementById("upload-btn");
    uploadBtn.disabled = true;
    uploadBtn.innerText = "Document Active";
    uploadBtn.style.cursor = "not-allowed";
  }

  // 2. Set up the uploader for NEW files
  const uploader = new Uploader(ApiService, (uniqueFileName) => {
    window.currentActiveFile = uniqueFileName;

    // 🚨 Save the new file name to browser memory!
    localStorage.setItem("activeFileName", uniqueFileName);

    chatbox.enable();
    chatbox.renderMessage(
      "Document processed! What would you like to know?",
      "bot",
    );
  });
});
