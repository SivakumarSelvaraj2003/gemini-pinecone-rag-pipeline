import { ApiService } from './services/api.js';
import { Uploader } from './components/Uploader.js';
import { Chatbox } from './components/Chatbox.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Initialize the Chatbox
    const chatbox = new Chatbox(ApiService);

    // 2. Initialize the Uploader
    // We pass a callback function so the Uploader can tell the Chatbox to unlock
    // once the PDF is successfully processed by the backend.
    const uploader = new Uploader(ApiService, () => {
        chatbox.enable();
        chatbox.renderMessage("Document processed! What would you like to know?", "bot");
    });

    console.log("Frontend architecture initialized successfully.");
});