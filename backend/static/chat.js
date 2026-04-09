let currentConversationId = null;
let pendingDeleteId = null;
let pendingDeleteElement = null;

// Initialize marked
marked.setOptions({
    breaks: true,
    gfm: true
});

document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    // Existing Chat Page Elements
    if (sendBtn) sendBtn.onclick = sendMessage;
    if (messageInput) {
        messageInput.onkeydown = (e) => {
            if (e.key === 'Enter') sendMessage();
        };
    }

    // Sidebar Dropdown Initialization
    const newChatActions = document.querySelectorAll('.new-chat-action');
    newChatActions.forEach(btn => {
        btn.onclick = (e) => {
            if (window.location.pathname.includes('/ai/chat/')) {
                e.preventDefault();
                resetChat();
                // Close dropdown if mobile
                document.getElementById('chatDropdown').style.display = 'none';
                setTimeout(() => document.getElementById('chatDropdown').removeAttribute('style'), 100);
            }
        };
    });

    // Handle Dropdown History Clicks (SPA behavior if on chat page)
    const historyLinks = document.querySelectorAll('.history-link');
    historyLinks.forEach(link => {
        link.onclick = (e) => {
            if (window.location.pathname.includes('/ai/chat/')) {
                e.preventDefault();
                const parent = link.closest('.dropdown-history-item');
                const id = parent.dataset.id;
                loadConversation(id, parent);
            }
        };
    });

    // Check for ID in URL on load
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    if (idParam && window.location.pathname.includes('/ai/chat/')) {
        loadConversation(idParam);
    }
    
    // Wire up Modal Delete Button
    const finalDeleteBtn = document.getElementById('finalDeleteBtn');
    if (finalDeleteBtn) {
        finalDeleteBtn.onclick = executeDelete;
    }
});

function fillInput(text) {
    const input = document.getElementById('messageInput');
    if (input) {
        input.value = text;
        input.focus();
    }
}

function resetChat() {
    currentConversationId = null;
    const msgContainer = document.getElementById('messages');
    const landing = document.getElementById('landingScreen');
    if (msgContainer && landing) {
        msgContainer.style.display = 'none';
        msgContainer.innerHTML = '';
        landing.style.display = 'flex';
        document.getElementById('messageInput').value = '';
    }
    // Update URL without reload
    window.history.pushState({}, '', window.location.pathname);
}

async function loadConversation(id, element = null) {
    currentConversationId = id;
    
    // UI Transitions
    const landing = document.getElementById('landingScreen');
    const msgContainer = document.getElementById('messages');
    
    if (landing) landing.style.display = 'none';
    if (msgContainer) {
        msgContainer.style.display = 'flex';
        msgContainer.innerHTML = '<div class="text-center p-5"><span class="typing"><span></span><span></span><span></span></span><br><span class="text-xs text-muted">Retrieving history...</span></div>';
    }

    // Update URL without reload
    window.history.pushState({}, '', `?id=${id}`);

    try {
        const response = await fetch(`/ai/history/${id}/`);
        const data = await response.json();
        
        if (msgContainer) {
            msgContainer.innerHTML = '';
            data.messages.forEach(msg => {
                renderMessage(msg.text, msg.sender);
            });
            scrollToBottom();
        }
    } catch (error) {
        if (msgContainer) msgContainer.innerHTML = '<div class="text-danger p-4">Error loading history.</div>';
    }
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text) return;

    const landing = document.getElementById('landingScreen');
    const msgContainer = document.getElementById('messages');

    if (landing) landing.style.display = 'none';
    if (msgContainer) msgContainer.style.display = 'flex';

    renderMessage(text, 'user');
    input.value = '';
    scrollToBottom();

    // Show typing
    const typingId = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = typingId;
    typingDiv.className = 'ai-msg ai';
    typingDiv.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
    if (msgContainer) {
        msgContainer.appendChild(typingDiv);
        scrollToBottom();
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
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();

        if (data.reply) {
            renderMessage(data.reply, 'ai');
            if (!currentConversationId && data.conversation_id) {
                currentConversationId = data.conversation_id;
                window.history.pushState({}, '', `?id=${data.conversation_id}`);
                // Note: The sidebar dropdown will update on next page refresh or we could live-inject it
            }
            scrollToBottom();
        }
    } catch (err) {
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        renderMessage("I'm sorry, I'm having trouble connecting right now. Please try again.", 'ai');
    }
}

function renderMessage(text, sender) {
    const container = document.getElementById('messages');
    if (!container) return;
    
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

// MODAL LOGIC
window.confirmDelete = function(event, id, element) {
    if (event) event.stopPropagation();
    pendingDeleteId = id;
    pendingDeleteElement = element;
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.classList.add('active');
}

window.closeDeleteModal = function() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.classList.remove('active');
    pendingDeleteId = null;
    pendingDeleteElement = null;
}

async function executeDelete() {
    if (!pendingDeleteId) return;
    
    const btn = document.getElementById('finalDeleteBtn');
    const originalText = btn.innerText;
    btn.innerText = "Deleting...";
    btn.disabled = true;

    try {
        const response = await fetch(`/ai/delete/${pendingDeleteId}/`, { method: 'POST' });
        if (response.ok) {
            if (pendingDeleteElement) {
                pendingDeleteElement.closest('.dropdown-history-item').remove();
            }
            if (currentConversationId == pendingDeleteId) {
                resetChat();
            }
            showToast("Conversation deleted successfully", "success");
        }
    } catch (err) {
        showToast("Error deleting conversation", "error");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
        closeDeleteModal();
    }
}
