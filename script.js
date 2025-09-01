let prompt = document.querySelector("#prompt");
let container = document.querySelector(".container");
let btn = document.querySelector("#btn");
let chatContainer = document.querySelector(".chat-container");
let userMessage = null;

let Api_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDLdv-A7SBg8_AMqLE8PxaesnwdnuOkOBU';

// Chat Box create karne ka function
function createChatBox(html, className) {
    let div = document.createElement("div");
    div.classList.add(className);
    div.innerHTML = html;
    return div;
}

// API se response lene ka function
async function getApiResponse(aiChatBox) {
    let textElement = aiChatBox.querySelector(".text");
    try {
        let response = await fetch(Api_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    { "parts": [{ text: userMessage }] }
                ]
            })
        });

        // Yahaan sahi await lagana zaroori hai
        let data = await response.json();
        console.log("API Response:", data); // Debug ke liye

        // Safe access
        let apiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ No response from API";
        textElement.innerText = apiResponse;
    } catch (error) {
        console.error("API Error:", error);
        textElement.innerText = "❌ Error fetching response";
    } finally {
        aiChatBox.querySelector(".loading").style.display = "none";
    }
}

// Loading  ka function
function showLoading() {
    let html = `
        <div class="img">
            <img src="ai.png" alt="" width="60">
        </div>
        <p class="text"></p>
        <img class="loading" src="loading.gif" alt="loading" height="50">
    `;
    let aiChatBox = createChatBox(html, "ai-chat-box");
    chatContainer.appendChild(aiChatBox);
    getApiResponse(aiChatBox);
}

// Button click event
btn.addEventListener("click", () => {
    userMessage = prompt.value.trim();

    if (!userMessage) {
        container.style.display = "flex";
        return;
    } else {
        container.style.display = "none";
    }

    let html = `
        <div class="img">
            <img src="user.png" alt="" width="60">
        </div>
        <p class="text">${userMessage}</p>
    `;
    let userChatBox = createChatBox(html, "user-chat-box");
    chatContainer.appendChild(userChatBox);

    prompt.value = "";
    setTimeout(showLoading, 500);
});

// enter button click code

prompt.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        btn.click();
    }
});

// Image upload ka function
async function handleImageUpload(file) {
    let html = `
        <div class="img">
            <img src="user.png" alt="" width="60">
        </div>
        <p class="text">📷 Image Uploaded</p>
    `;
    let userChatBox = createChatBox(html, "user-chat-box");
    chatContainer.appendChild(userChatBox);

    // Loading show karna
    let aiHtml = `
        <div class="img">
            <img src="ai.png" alt="" width="60">
        </div>
        <p class="text"></p>
        <img class="loading" src="loading.gif" alt="loading" height="50">
    `;
    let aiChatBox = createChatBox(aiHtml, "ai-chat-box");
    chatContainer.appendChild(aiChatBox);

    // File ko Base64 me convert karna
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
        const base64Image = reader.result.split(",")[1];
        let textElement = aiChatBox.querySelector(".text");

        try {
            let response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDLdv-A7SBg8_AMqLE8PxaesnwdnuOkOBU', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: "Describe this image in detail." },
                                {
                                    inlineData: {
                                        mimeType: file.type,
                                        data: base64Image
                                    }
                                }
                            ]
                        }
                    ]
                })
            });

            let data = await response.json();
            console.log("Image API Response:", data);

            let apiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ No response from API";
            textElement.innerText = apiResponse;
        } catch (err) {
            textElement.innerText = "❌ Error: " + err.message;
        } finally {
            aiChatBox.querySelector(".loading").style.display = "none";
        }
    };
}

// Image upload event listener
document.getElementById("imageUpload").addEventListener("change", (e) => {
    let file = e.target.files[0];
    if (file) {
        handleImageUpload(file);
    }
});

// Auto scroll function
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// MutationObserver se chatContainer me naya element add hote hi scroll
const observer = new MutationObserver(() => {
    scrollToBottom();
});

// observe karna start
observer.observe(chatContainer, { childList: true });
