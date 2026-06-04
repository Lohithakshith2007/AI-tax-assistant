let currentConversationId = null;
const CHAT_STARTED_KEY = 'chatStarted';
const CHAT_CONVERSATION_KEY = 'currentConversationId';
const CHAT_OWNER_KEY = 'chatOwnerId';

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

    const started = localStorage.getItem(CHAT_STARTED_KEY);
    const onChatPage = window.location.pathname.includes('/ai/chat');
    const storedConversationId = localStorage.getItem(CHAT_CONVERSATION_KEY);
    
    // Cross-account validation
    const userIdMeta = document.querySelector('meta[name="user-id"]');
    const currentUserId = userIdMeta ? userIdMeta.content : '';
    const storedOwnerId = localStorage.getItem(CHAT_OWNER_KEY);
    
    let mismatchedAccount = false;
    if (currentUserId && storedOwnerId && currentUserId !== storedOwnerId) {
        mismatchedAccount = true;
    }

    // Restore previous conversation on page load / refresh intelligently
    function isValidId(id) {
        return id && id !== 'null' && id !== 'undefined' && id.trim() !== '';
    }

    if (onChatPage) {
        if (!mismatchedAccount && started === 'true' && isValidId(storedConversationId)) {
            currentConversationId = storedConversationId;
            showChatScreen();
            // Reload messages from backend
            loadConversation(storedConversationId, null);
        } else {
            // Fallback: forcefully wipe dangling state completely
            localStorage.removeItem(CHAT_STARTED_KEY);
            localStorage.removeItem(CHAT_CONVERSATION_KEY);
            localStorage.removeItem(CHAT_OWNER_KEY);
        }
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
    const msgContainer  = document.getElementById('messages');
    const chatInputWrapper = document.getElementById('chatInputWrapper');
    const chatTopActions = document.getElementById('chatTopActions');
    const newChatActionBtn = document.getElementById('newChatActionBtn');

    if (landingScreen) landingScreen.style.display = 'none';
    if (msgContainer) {
        msgContainer.style.display = 'flex';
        msgContainer.style.flexDirection = 'column';
    }
    if (chatInputWrapper) chatInputWrapper.style.display = 'flex';
    if (chatTopActions) chatTopActions.style.display = 'flex';
    if (newChatActionBtn) newChatActionBtn.style.display = 'block';
}

function resetChat() {
    currentConversationId = null;
    localStorage.removeItem(CHAT_STARTED_KEY);
    localStorage.removeItem(CHAT_CONVERSATION_KEY);
    localStorage.removeItem(CHAT_OWNER_KEY);

    const landingScreen    = document.getElementById('landingScreen');
    const msgContainer     = document.getElementById('messages');
    const messageInput     = document.getElementById('messageInput');
    const chatInput        = document.getElementById('chatMessageInput');
    const chatInputWrapper = document.getElementById('chatInputWrapper');
    const newChatActionBtn = document.getElementById('newChatActionBtn');

    if (landingScreen)    landingScreen.style.display = 'flex';
    if (msgContainer) {
        msgContainer.style.display = 'none';
        msgContainer.innerHTML = '';
    }
    if (messageInput)     messageInput.value = '';
    if (chatInput)        chatInput.value = '';
    if (chatInputWrapper) chatInputWrapper.style.display = 'none';
    if (newChatActionBtn) newChatActionBtn.style.display = 'none';
    
    // Clear files
    selectedFiles = [];
    updateFilePreviews();
}

async function loadConversation(id, element) {
    if (!id || id === 'null' || id === 'undefined' || String(id).trim() === '') {
        resetChat();
        return;
    }

    currentConversationId = id;
    const userIdMeta = document.querySelector('meta[name="user-id"]');
    
    localStorage.setItem(CHAT_STARTED_KEY, 'true');
    localStorage.setItem(CHAT_CONVERSATION_KEY, id);
    if (userIdMeta && userIdMeta.content) {
        localStorage.setItem(CHAT_OWNER_KEY, userIdMeta.content);
    }

    showChatScreen();

    const msgContainer = document.getElementById('messages');
    msgContainer.innerHTML = '<div style="text-align:center; padding:2rem; color: rgba(255,255,255,0.4);"><i class="fa-solid fa-spinner fa-spin"></i> Loading conversation...</div>';

    try {
        const response = await fetch(`/ai/history/${id}/`);
        const data = await response.json();

        // Validate backend response safely
        if (!response.ok || data.error || !Array.isArray(data.messages)) {
            console.warn("Failed or invalid history loaded: ", data.error || "Missing messages array");
            resetChat();
            return;
        }

        msgContainer.innerHTML = '';
        
        // Handle gracefully if messages array is empty
        if (data.messages.length > 0) {
            data.messages.forEach(msg => {
                renderMessage(msg.text, msg.sender);
            });
        }
        
        scrollToBottom();
    } catch (error) {
        console.error("Error loading chat history:", error);
        resetChat(); // Failsafe fallback ensuring UX doesn't break
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
    
    // Clear files after sending
    selectedFiles = [];
    updateFilePreviews();
    
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
                
                const userIdMeta = document.querySelector('meta[name="user-id"]');
                localStorage.setItem(CHAT_CONVERSATION_KEY, currentConversationId);
                if (userIdMeta && userIdMeta.content) {
                    localStorage.setItem(CHAT_OWNER_KEY, userIdMeta.content);
                }
                
                addHistoryItem(data.conversation_id, data.conversation_title || text);
            }
            scrollToBottom();
        }
    } catch (err) {
        document.getElementById(typingId)?.remove();
        renderMessage("I'm sorry, I'm having trouble connecting right now. Please try again.", 'ai');
    }
}

function addHistoryItem(id, title) {
    const list = document.getElementById('modalHistoryList');
    if (!list) return;

    // Remove the "No history yet" message if it exists
    const noHistoryMsg = list.querySelector('.text-muted.text-center');
    if (noHistoryMsg) noHistoryMsg.remove();

    const itemDiv = document.createElement('div');
    itemDiv.className = 'modal-history-item';
    
    // Safely escape title for the string literal
    const safeTitle = title.replace(/'/g, "\\'");

    itemDiv.innerHTML = `
        <button class="history-item-btn" onclick="loadConversation(${id}, null); closeChatModalById('historyModal')">
            ${title}
        </button>
        <button class="delete-chat-btn" onclick="promptDeleteConversation(event, ${id}, this, '${safeTitle}')" title="Delete chat">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;
    
    // Add to the top of the list
    list.prepend(itemDiv);
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

// Global vars for custom delete modal
let conversationToDelete = null;
let elementToDelete = null;

function promptDeleteConversation(event, id, element, title) {
    event.stopPropagation();
    conversationToDelete = id;
    elementToDelete = element;
    
    const titleEl = document.getElementById('deleteChatTitleName');
    if (titleEl) {
        titleEl.textContent = title ? `"${title}"` : "this chat";
    }
    
    toggleChatModal('deleteConfirmModal');
}

async function confirmDeleteConversation() {
    if (!conversationToDelete) return;
    
    try {
        const response = await fetch(`/ai/delete/${conversationToDelete}/`, { method: 'POST' });
        if (response.ok) {
            elementToDelete.closest('.modal-history-item')?.remove();
            if (currentConversationId == conversationToDelete) resetChat();
        }
    } catch (err) {
        console.error('Failed to delete', err);
    } finally {
        closeChatModalById('deleteConfirmModal');
        conversationToDelete = null;
        elementToDelete = null;
    }
}

function fillInput(text) {
    const input = document.getElementById('messageInput') || document.getElementById('chatMessageInput');
    if (input) {
        input.value = text;
        input.focus();
    }
}

// Top Right Actions Modals
function toggleChatModal(modalId) {
    const target = document.getElementById(modalId);
    if (target) {
        target.classList.add('active');
        const input = target.querySelector('input');
        if (input && input.style.display !== 'none') input.focus();
    }
}

function closeChatModalById(modalId) {
    const target = document.getElementById(modalId);
    if (target) {
        target.classList.remove('active');
    }
}

function closeChatModal(event, modalId) {
    // If clicking directly on the overlay backdrop, close it
    if (event.target.id === modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
}

function toggleSearchInput() {
    const searchInput = document.getElementById('historySearch');
    const searchIcon = document.getElementById('searchToggleIcon');
    
    if (searchInput.style.display === 'none') {
        searchInput.style.display = 'block';
        searchIcon.style.color = 'var(--accent-neon)';
        searchInput.focus();
    } else {
        searchInput.style.display = 'none';
        searchIcon.style.color = 'var(--text-muted)';
        searchInput.value = '';
        filterChats(); // reset filter
    }
}

function filterChats() {
    const query = document.getElementById('historySearch').value.toLowerCase();
    const items = document.querySelectorAll('.modal-history-item');
    
    items.forEach(item => {
        const title = item.querySelector('.history-item-btn').innerText.toLowerCase();
        if (title.includes(query)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// File Upload Handling
let selectedFiles = [];

function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    
    selectedFiles = [...selectedFiles, ...files];
    updateFilePreviews();
    
    // Reset input so the same file can be selected again if needed
    event.target.value = '';
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFilePreviews();
}

function updateFilePreviews() {
    const containers = [
        document.getElementById('filePreviewContainerLanding'),
        document.getElementById('filePreviewContainerChat')
    ];
    
    containers.forEach(container => {
        if (!container) return;
        
        if (selectedFiles.length === 0) {
            container.style.display = 'none';
            container.innerHTML = '';
            return;
        }
        
        container.style.display = 'flex';
        container.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            const pill = document.createElement('div');
            pill.style.cssText = 'background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 0.3rem 0.6rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ececec; flex-shrink: 0;';
            
            // Icon based on type
            let icon = 'fa-file';
            if (file.type.startsWith('image/')) icon = 'fa-image';
            else if (file.type === 'application/pdf') icon = 'fa-file-pdf';
            else if (file.type.includes('spreadsheet') || file.type.includes('csv')) icon = 'fa-file-excel';
            
            // Shorten name
            let name = file.name;
            if (name.length > 20) name = name.substring(0, 10) + '...' + name.substring(name.length - 7);
            
            pill.innerHTML = `
                <i class="fa-solid ${icon}"></i>
                <span>${name}</span>
                <i class="fa-solid fa-xmark" style="cursor:pointer; color: #ff4a4a;" onclick="removeFile(${index})"></i>
            `;
            container.appendChild(pill);
        });
    });
}
