let currentConversationId = null;
const CHAT_STARTED_KEY = 'chatStarted';
const CHAT_CONVERSATION_KEY = 'currentConversationId';

// Initialize marked
marked.setOptions({
    breaks: true,
    gfm: true
});

document.addEventListener('DOMContentLoaded', () => {
    const landingInput = document.getElementById('messageInput');
    const chatInput = document.getElementById('chatMessageInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatDropdownToggle = document.getElementById('chatDropdownToggle');
    const chatNewLinkBtn = document.getElementById('chatNewLinkBtn');

    const started = localStorage.getItem(CHAT_STARTED_KEY);
    const submenu = document.getElementById('chatSubmenu');

    if (submenu) {
        if (started === 'true') {
            submenu.style.display = 'flex';
        } else {
            submenu.style.display = 'none';
        }
    }
    const storedConversationId = localStorage.getItem(CHAT_CONVERSATION_KEY);

    if (started === 'true' && storedConversationId) {
        currentConversationId = storedConversationId;
        showChatScreen();
    }

    if (sendBtn) sendBtn.onclick = sendMessage;
    if (chatSendBtn) chatSendBtn.onclick = sendMessage;

    if (landingInput) {
        landingInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    if (chatDropdownToggle) {
        chatDropdownToggle.addEventListener('click', toggleChatDropdown);
    }

    if (chatNewLinkBtn) {
        chatNewLinkBtn.addEventListener('click', resetChat);
    }

    if (!window.location.pathname.includes('/ai/chat')) {
        const submenu = document.getElementById('chatSubmenu');
        if (submenu) submenu.style.display = 'none';
    }
});

function getActiveInput() {
    const chatInput = document.getElementById('chatMessageInput');
    const landingInput = document.getElementById('messageInput');

    if (chatInput && chatInput.offsetParent !== null) {
        return chatInput;
    }

    return landingInput;
}

function showChatScreen() {
    const landingScreen = document.getElementById('landingScreen');
    const chatScreen = document.getElementById('chatScreen');
    const msgContainer = document.getElementById('messages');
    const chatInputWrapper = document.getElementById('chatInputWrapper');

    console.log('Showing chat screen'); // Debug log

    if (landingScreen) landingScreen.style.display = 'none';
    if (chatScreen) {
        chatScreen.style.display = 'flex';
        console.log('Chat screen display set to flex'); // Debug log
    }
    if (msgContainer) msgContainer.style.display = 'flex';
    if (chatInputWrapper) chatInputWrapper.style.display = 'flex';
}

function resetChat() {
    currentConversationId = null;
    localStorage.removeItem(CHAT_STARTED_KEY);
    localStorage.removeItem(CHAT_CONVERSATION_KEY);

    const landingScreen = document.getElementById('landingScreen');
    const chatScreen = document.getElementById('chatScreen');
    const msgContainer = document.getElementById('messages');
    const chatDropdownMenu = document.getElementById('chatDropdownMenu');
    const messageInput = document.getElementById('messageInput');
    const chatInput = document.getElementById('chatMessageInput');
    const chatInputWrapper = document.getElementById('chatInputWrapper');

    if (landingScreen) landingScreen.style.display = 'flex';
    if (chatScreen) chatScreen.style.display = 'none';
    if (msgContainer) {
        msgContainer.style.display = 'none';
        msgContainer.innerHTML = '';
    }
    if (chatDropdownMenu) chatDropdownMenu.classList.remove('active');
    if (messageInput) messageInput.value = '';
    if (chatInput) chatInput.value = '';
    if (chatInputWrapper) chatInputWrapper.style.display = 'none';
}

async function loadConversation(id, element) {
    currentConversationId = id;
    localStorage.setItem(CHAT_CONVERSATION_KEY, id);

    document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

    showChatScreen();

    const msgContainer = document.getElementById('messages');
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
    const input = getActiveInput();
    const text = input?.value.trim();
    if (!text) return;

    showChatScreen();

    const msgContainer = document.getElementById('messages');
    renderMessage(text, 'user');
    input.value = '';
    scrollToBottom();

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

    localStorage.setItem(CHAT_STARTED_KEY, 'true');
    const submenu = document.getElementById('chatSubmenu');
    if (submenu) {
        submenu.style.display = 'flex';
    }
    if (currentConversationId) localStorage.setItem(CHAT_CONVERSATION_KEY, currentConversationId);

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
        document.getElementById(typingId)?.remove();

        if (data.reply) {
            renderMessage(data.reply, 'ai');
            if (!currentConversationId && data.conversation_id) {
                currentConversationId = data.conversation_id;
                localStorage.setItem(CHAT_CONVERSATION_KEY, currentConversationId);
                addHistoryItem(data.conversation_id, data.conversation_title || text);
            }
            scrollToBottom();
        }
    } catch (err) {
        document.getElementById(typingId)?.remove();
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
    if (container) container.scrollTop = container.scrollHeight;
}

function addHistoryItem(id, title) {
    const list = document.getElementById('chatHistoryList') || document.getElementById('historyList');
    if (!list) return;

    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'history-item chat-history-item active';
    item.onclick = function () { loadConversation(id, this); };
    item.innerHTML = `
        <span>${title}</span>
        <i class="fa-solid fa-arrow-right-long"></i>
    `;
    list.prepend(item);
}

async function deleteConversation(event, id, element) {
    event.stopPropagation();
    if (!confirm('Delete this conversation?')) return;

    try {
        const response = await fetch(`/ai/delete/${id}/`, { method: 'POST' });
        if (response.ok) {
            element.closest('.history-item')?.remove();
            if (currentConversationId == id) resetChat();
        }
    } catch (err) {
        console.error('Failed to delete', err);
    }
}

function toggleChatDropdown() {
    document.getElementById('chatDropdownMenu')?.classList.toggle('active');
}

document.addEventListener('click', function (e) {
    const dropdown = document.querySelector('.chat-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        document.getElementById('chatDropdownMenu')?.classList.remove('active');
    }
});

function toggleChatMenu() {
    const menu = document.getElementById('chatSubmenu');
    menu?.classList.toggle('active');
}
