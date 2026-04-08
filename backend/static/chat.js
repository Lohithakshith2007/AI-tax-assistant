const sidebar = document.getElementById("sidebar");
const toggleSidebar = document.getElementById("toggleSidebar");
const messages = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const chatInput = document.getElementById("chatInput");

marked.setOptions({
    breaks: true,
    gfm: true
});

/* LOAD CHAT FROM STORAGE */
let chat = JSON.parse(localStorage.getItem("chat")) || [];
renderChat();

/* SIDEBAR TOGGLE */
if (toggleSidebar && sidebar) {
    toggleSidebar.onclick = () => {
        sidebar.classList.toggle("collapsed");
    };
}

/* SEND MESSAGE */
async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    chatInput.classList.remove("centered");

    addMessage(text, "user");
    scrollToBottom();
    input.value = "";

    // temporary typing message
    const typingMsg = document.createElement("div");
    typingMsg.className = "ai-msg ai typing";
    typingMsg.textContent = "...";
    messages.appendChild(typingMsg);
    messages.scrollTop = messages.scrollHeight;

    try {
        const response = await fetch("/ai/chatbot/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: text,
                history: chat
            })
        });

        const data = await response.json();

        // Remove typing message
        messages.removeChild(typingMsg);

        if (data.reply) {
            addMessage(data.reply, "ai");
            scrollToBottom();
        } else {
            addMessage("Something went wrong.", "ai");
        }

    } catch (error) {
        messages.removeChild(typingMsg);
        addMessage("Server error. Please try again.", "ai");
    }
}

/* ADD MESSAGE */
function addMessage(text, sender) {
    const msg = document.createElement("div");
    msg.className = `ai-msg ${sender}`;

    msg.innerHTML = marked.parse(text);

    messages.appendChild(msg);

    chat.push({ sender, text });
    localStorage.setItem("chat", JSON.stringify(chat));

    messages.scrollTop = messages.scrollHeight;

    scrollToBottom();
}

function scrollToBottom() {
    const chat = document.querySelector(".messages");

    if (!chat) return;

    requestAnimationFrame(() => {
        chat.scrollTop = chat.scrollHeight;
    });
}

/* RENDER SAVED CHAT */
function renderChat() {
    if (chat.length > 0) {
        chatInput.classList.remove("centered");
    }

    chat.forEach(m => {
        const msg = document.createElement("div");
        msg.className = `ai-msg ${m.sender}`;

        // Parse markdown again when rendering
        msg.innerHTML = marked.parse(m.text);

        messages.appendChild(msg);
    });
}

/* EVENTS */
sendBtn.onclick = sendMessage;

input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
});

newChatBtn.onclick = () => {
    chat = [];
    localStorage.removeItem("chat");
    messages.innerHTML = "";
    chatInput.classList.add("centered");
};
