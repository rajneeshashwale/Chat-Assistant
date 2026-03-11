let prompt = document.querySelector("#prompt");
let container = document.querySelector(".container");
let btn = document.querySelector("#btn");
let chatContainer = document.querySelector(".chat-container");
let userMessage = null;
let pendingImageFile = null;
let pendingImageUrl = null;
let pendingImageChatBox = null;
const defaultPromptPlaceholder = prompt.getAttribute("placeholder") || "Ask Something.....";

// Chat box create function
function createChatBox(html, className) {
    let div = document.createElement("div");
    div.classList.add(className);
    div.innerHTML = html;
    return div;
}

// Backend se text response lene ka function (Professional + Developer info)
async function getApiResponse(aiChatBox) {
    let textElement = aiChatBox.querySelector(".text");

    try {
        let response = await fetch("http://localhost:5000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `${userMessage}\n\nPlease respond in professional paragraph format without any markdown symbols like *, -, or --- and add at the end: "MyDeveloper: Rajneesh Ashwale".`
            })
        });

        let data = await response.json();
        textElement.innerText = data.reply || "Warning: No response";

    } catch (error) {
        console.error(error);
        textElement.innerText = "Error fetching response";
    } finally {
        aiChatBox.querySelector(".loading").style.display = "none";
    }
}

// Loading animation show karna
function showLoading() {
    let html = `
        <div class="img">
            <img src="ai.png" width="60">
        </div>
        <p class="text"></p>
        <img class="loading" src="loading.gif" height="50">
    `;
    let aiChatBox = createChatBox(html, "ai-chat-box");
    chatContainer.appendChild(aiChatBox);
    getApiResponse(aiChatBox);
}

// Button click
btn.addEventListener("click", () => {
    const inputText = prompt.value.trim();

    if (pendingImageFile) {
        container.style.display = "none";
        submitImagePrompt(inputText);
        return;
    }

    userMessage = inputText;

    if (!userMessage) {
        container.style.display = "flex";
        return;
    } else {
        container.style.display = "none";
    }

    let html = `
        <div class="img">
            <img src="user.png" width="60">
        </div>
        <p class="text">${userMessage}</p>
    `;
    let userChatBox = createChatBox(html, "user-chat-box");
    chatContainer.appendChild(userChatBox);

    prompt.value = "";
    setTimeout(showLoading, 500);
});

// Enter key send
prompt.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        btn.click();
    }
});

// Image upload (ChatGPT-style preview + response)
function handleImageUpload(file) {
    container.style.display = "none";

    if (pendingImageUrl) {
        URL.revokeObjectURL(pendingImageUrl);
    }

    const imageUrl = URL.createObjectURL(file);
    pendingImageFile = file;
    pendingImageUrl = imageUrl;
    let userHtml = `
        <div class="img">
            <img src="user.png" width="60">
        </div>
        <div class="text image-only">
            <img class="uploaded-image" src="${imageUrl}" alt="Uploaded image">
        </div>
    `;
    pendingImageChatBox = createChatBox(userHtml, "user-chat-box");
    chatContainer.appendChild(pendingImageChatBox);

    prompt.value = "";
    prompt.setAttribute("placeholder", "Add a prompt for this image (optional)...");
    prompt.focus();
}

async function submitImagePrompt(instructionText) {
    const safeInstructionText = (instructionText || "").trim();
    const finalInstruction = safeInstructionText || "Describe the image in detail.";

    if (!pendingImageFile || !pendingImageUrl || !pendingImageChatBox) {
        return;
    }

    if (safeInstructionText) {
        const instructionEl = document.createElement("p");
        instructionEl.className = "text image-instruction";
        instructionEl.innerText = `Instruction: ${safeInstructionText}`;
        pendingImageChatBox.appendChild(instructionEl);
    }

    let aiHtml = `
        <div class="img">
            <img src="ai.png" width="60">
        </div>
        <p class="text">Analyzing image...</p>
        <img class="loading" src="loading.gif" height="50">
    `;
    let aiChatBox = createChatBox(aiHtml, "ai-chat-box");
    chatContainer.appendChild(aiChatBox);

    let textElement = aiChatBox.querySelector(".text");

    try {
        const formData = new FormData();
        formData.append("image", pendingImageFile);
        formData.append("prompt", finalInstruction);

        let response = await fetch("http://localhost:5000/image", {
            method: "POST",
            body: formData
        });

        let data = await response.json();
        textElement.innerText = data.reply
            ? `${data.reply}\n\nMy Developer: Rajneesh Ashwale`
            : "Warning: No response";

    } catch (err) {
        textElement.innerText = "Error uploading image";
    } finally {
        aiChatBox.querySelector(".loading").style.display = "none";
        URL.revokeObjectURL(pendingImageUrl);
        pendingImageFile = null;
        pendingImageUrl = null;
        pendingImageChatBox = null;
        prompt.value = "";
        prompt.setAttribute("placeholder", defaultPromptPlaceholder);
    }
}

// Image input listener
document.getElementById("imageUpload").addEventListener("change", (e) => {
    let file = e.target.files[0];
    if (file) handleImageUpload(file);
    e.target.value = "";
});

// Auto scroll
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

const observer = new MutationObserver(scrollToBottom);
observer.observe(chatContainer, { childList: true });
