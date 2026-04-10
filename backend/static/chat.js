let currentConversationId = null;

// Initialize marked
marked.setOptions({
    breaks: true,
    gfm: true
});

document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const newChatBtn = document.getElementById('newChatBtnPrimary');
    const submenu = document.getElementById("chatSubmenu");

    if (!submenu) return;

    const started = localStorage.getItem("chatStarted");

    if (started === "true") {
        submenu.style.display = "flex";
    } else {
        submenu.style.display = "none";
    }

    if (sendBtn) sendBtn.onclick = sendMessage;
    if (messageInput) {
        messageInput.onkeydown = (e) => {
            if (e.key === 'Enter') sendMessage();
        };
    }
    if (newChatBtn) {
        newChatBtn.onclick = () => {
            resetChat();
        };
    }
});

function fillInput(text) {
    const input = document.getElementById('messageInput');
    input.value = text;
    input.focus();
}

function resetChat() {
    currentConversationId = null;

    localStorage.removeItem("chatStarted");

    const submenu = document.getElementById("chatSubmenu");
    if (submenu) {
        submenu.style.display = "none";
    }

    document.getElementById('messages').style.display = 'none';
    document.getElementById('messages').innerHTML = '';
    document.getElementById('landingScreen').style.display = 'flex';
    document.getElementById('messageInput').value = '';
}

async function loadConversation(id, element) {
    currentConversationId = id;

    // UI Updates
    document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    document.getElementById('landingScreen').style.display = 'none';
    const msgContainer = document.getElementById('messages');
    msgContainer.style.display = 'flex';
    msgContainer.innerHTML = '<div class="text-center p-5"><i class="fa-solid fa-spinner fa-spin"></i> Loading conversation...</div>';

    try {
        const response = await fetch(`/ai/history/${id}/`);
        const data = await response.json();

        msgContainer.innerHTML = '';
        data.messages.forEach(msg => {
            renderMessage(msg.text, msg.sender);
        });
        scrollToBottom();
    } catch (error) {
        msgContainer.innerHTML = '<div class="text-danger p-4">Error loading history.</div>';
    }
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text) return;

    // Transition from landing to chat if needed
    document.getElementById('landingScreen').style.display = 'none';
    const msgContainer = document.getElementById('messages');
    msgContainer.style.display = 'flex';

    renderMessage(text, 'user');
    input.value = '';
    scrollToBottom();

    // Show typing
    const typingId = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = typingId;
    typingDiv.className = 'ai-msg ai';
    typingDiv.innerHTML = `
        <div class="typing">
            <span></span><span></span><span></span>
        </div>
    `;
    msgContainer.appendChild(typingDiv);
    scrollToBottom();

    // Mark chat as started
    localStorage.setItem("chatStarted", "true");

    // Show sidebar menu
    const submenu = document.getElementById("chatSubmenu");
    if (submenu) {
        submenu.style.display = "flex";
    }

    try {
        const response = await fetch('/ai/chatbot/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                conversation_id: currentConversationId
            })
        });

        const data = await response.json();

        // Remove typing
        document.getElementById(typingId).remove();

        if (data.reply) {
            renderMessage(data.reply, 'ai');

            // Check if this was a new conversation
            if (!currentConversationId && data.conversation_id) {
                currentConversationId = data.conversation_id;
                addHistoryItem(data.conversation_id, data.conversation_title);
            }
            scrollToBottom();
        }
    } catch (err) {
        document.getElementById(typingId).remove();
        renderMessage("I'm sorry, I'm having trouble connecting right now. Please try again.", 'ai');
    }
}

function renderMessage(text, sender) {
    const container = document.getElementById('messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ${sender}`;

    const htmlContent = sender === 'ai' ? marked.parse(text) : text;

    msgDiv.innerHTML = `
        <div class="content">${htmlContent}</div>
        <div class="meta">${sender === 'ai' ? 'AI Advisor' : 'You'} • Just now</div>
    `;
    container.appendChild(msgDiv);
}

function scrollToBottom() {
    const container = document.getElementById('messages');
    container.scrollTop = container.scrollHeight;
}

function addHistoryItem(id, title) {
    const list = document.getElementById('historyList');
    const item = document.createElement('div');
    item.className = 'history-item active';
    item.onclick = function () { loadConversation(id, this); };
    item.innerHTML = `
        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
            <i class="fa-regular fa-message text-xs mr-2" style="opacity: 0.5;"></i>
            <span class="text-sm">${title}</span>
        </div>
        <button class="icon-btn text-xs delete-conv" onclick="deleteConversation(event, ${id}, this)" style="opacity: 1; transition: opacity 0.2s;">
            <i class="fa-solid fa-trash-can"></i>
        </button>
    `;
    list.prepend(item);
}

async function deleteConversation(event, id, element) {
    event.stopPropagation();
    if (!confirm('Delete this conversation?')) return;

    try {
        const response = await fetch(`/ai/delete/${id}/`, { method: 'POST' });
        if (response.ok) {
            element.closest('.history-item').remove();
            if (currentConversationId == id) {
                resetChat();
            }
        }
    } catch (err) {
        console.error('Failed to delete');
    }
}

function toggleChatDropdown() {
    const menu = document.getElementById('chatDropdownMenu');
    menu.classList.toggle('active');
}

// close when clicking outside
document.addEventListener('click', function (e) {
    const dropdown = document.querySelector('.chat-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        document.getElementById('chatDropdownMenu')?.classList.remove('active');
    }
});

function toggleChatMenu() {
    const menu = document.getElementById('chatSubmenu');
    menu.classList.toggle('active');
}
if (!window.location.pathname.includes('/ai/chat')) {
    localStorage.removeItem("chatStarted");
}