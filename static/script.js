// Chat HX V-01
class ChatApp {
    constructor() {
        this.currentConversationId = null;
        this.currentModel = 'groq';  // Default to Groq
        this.conversations = [];
        this.messages = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadConversations();
        this.initializeButtonState();
        this.setupQuickActions();
    }
    
    initializeElements() {
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.chatForm = document.getElementById('chat-form');
        this.chatMessages = document.getElementById('chat-messages');
        this.conversationsList = document.getElementById('conversations-list');
        this.newChatBtn = document.getElementById('new-chat-btn');
        this.searchToggleBtn = document.getElementById('search-toggle-btn');
        this.searchContainer = document.getElementById('search-container');
        this.searchInput = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search-btn');
        this.deleteAllBtn = document.getElementById('delete-all-btn');
    }
    
    initializeButtonState() {
        this.sendBtn.disabled = true;
    }
    
    setupEventListeners() {
        this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.newChatBtn.addEventListener('click', () => this.createNewChat());
        this.messageInput.addEventListener('input', () => this.handleInput());
        
        // Search functionality
        this.searchToggleBtn.addEventListener('click', () => this.toggleSearch());
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        
        // Delete all conversations
        this.deleteAllBtn.addEventListener('click', () => this.confirmDeleteAll());
        
        // Navigation items - model selection
        const navItems = document.querySelectorAll('.nav-main .nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const model = item.dataset.model;
                if (model) {
                    this.currentModel = model;
                    navItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    
                    // Show model selection feedback
                    this.showModelSwitch(item.dataset.label);
                }
            });
        });
    }
    
    setupQuickActions() {
        const quickActionBtns = document.querySelectorAll('.quick-action-btn');
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.dataset.prompt;
                if (prompt) {
                    this.messageInput.value = prompt;
                    this.handleInput();
                    this.messageInput.focus();
                }
            });
        });
    }
    
    handleInput() {
        this.sendBtn.disabled = !this.messageInput.value.trim();
    }
    
    showModelSwitch(modelName) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'model-switch-notification';
        notification.textContent = `Switched to ${modelName}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
    
    showMessage(content, role) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'timestamp';
        timestampDiv.textContent = new Date().toLocaleTimeString();
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timestampDiv);
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        this.messageInput.value = '';
        this.sendBtn.disabled = true;
        
        this.addMessageToUI(message, 'user');
        
        const typingIndicator = this.showTypingIndicator();
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    conversation_id: this.currentConversationId,
                    model: this.currentModel
                })
            });
            
            const data = await response.json();
            
            typingIndicator.remove();
            
            if (response.ok) {
                this.addMessageToUI(data.response, 'assistant');
                this.currentConversationId = data.conversation_id;
                this.loadConversations();
            } else {
                this.addMessageToUI(`Error: ${data.detail}`, 'assistant');
            }
        } catch (error) {
            typingIndicator.remove();
            this.addMessageToUI(`Error: ${error.message}`, 'assistant');
        }
        
        this.sendBtn.disabled = !this.messageInput.value.trim();
        this.messageInput.focus();
    }
    
    addMessageToUI(content, role) {
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'timestamp';
        timestampDiv.textContent = new Date().toLocaleTimeString();
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timestampDiv);
        this.chatMessages.appendChild(messageDiv);
        
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        requestAnimationFrame(() => {
            this.chatMessages.scrollTo({ 
                top: this.chatMessages.scrollHeight, 
                behavior: 'smooth' 
            });
        });
    }
    
    showTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = 'Thinking<span class="typing-indicator-container"><span class="typing-indicator"></span><span class="typing-indicator"></span><span class="typing-indicator"></span></span>';
        
        messageDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(messageDiv);
        
        this.scrollToBottom();
        
        return messageDiv;
    }
    
    async loadConversations() {
        try {
            const response = await fetch('/api/conversations');
            const conversations = await response.json();
            
            this.conversations = conversations;
            this.renderConversations();
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }
    
    renderConversations() {
        this.conversationsList.innerHTML = '';
        
        if (this.conversations.length === 0) {
            this.conversationsList.innerHTML = `
                <div class="empty-state">
                    <p>No conversations yet</p>
                </div>
            `;
            return;
        }
        
        this.conversations.forEach(conv => {
            const convElement = document.createElement('div');
            convElement.className = `conversation-item ${conv._id === this.currentConversationId ? 'active' : ''}`;
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'conversation-title';
            titleDiv.textContent = conv.title || 'New Conversation';
            
            const dateDiv = document.createElement('div');
            dateDiv.className = 'conversation-date';
            dateDiv.textContent = new Date(conv.updated_at).toLocaleDateString();
            
            // Add delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'conversation-delete-btn';
            deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
            deleteBtn.title = 'Delete conversation';
            deleteBtn.addEventListener('click', (e) => this.deleteConversation(conv._id, e));
            
            convElement.appendChild(titleDiv);
            convElement.appendChild(dateDiv);
            convElement.appendChild(deleteBtn);
            
            convElement.addEventListener('click', () => {
                this.currentConversationId = conv._id;
                this.loadConversationMessages();
                this.renderConversations();
            });
            
            this.conversationsList.appendChild(convElement);
        });
    }
    
    async loadConversationMessages() {
        if (!this.currentConversationId) return;
        
        try {
            const response = await fetch(`/api/conversations/${this.currentConversationId}/messages`);
            const messages = await response.json();
            
            this.chatMessages.innerHTML = '';
            
            messages.forEach(msg => {
                this.addMessageToUI(msg.content, msg.role);
            });
            
            this.scrollToBottom();
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }
    
    createNewChat() {
        this.currentConversationId = null;
        this.chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <span class="brackets">{ }</span>
                </div>
                <h2>Welcome to <span class="gradient-text">CHAT HX</span></h2>
                <p>Your intelligent conversation companion for coding and design.</p>
                <div class="quick-actions">
                    <button class="quick-action-btn" data-prompt="Help me build a responsive navbar with Tailwind CSS">
                        <i class="ri-layout-line"></i>
                        <span>Build UI component</span>
                    </button>
                    <button class="quick-action-btn" data-prompt="Explain the difference between React hooks and class components">
                        <i class="ri-code-line"></i>
                        <span>Explain code concept</span>
                    </button>
                    <button class="quick-action-btn" data-prompt="Design principles for a modern dashboard">
                        <i class="ri-palette-line"></i>
                        <span>Design advice</span>
                    </button>
                </div>
            </div>
        `;
        
        this.setupQuickActions();
        this.renderConversations();
        this.sendBtn.disabled = true;
        this.messageInput.focus();
    }
    
    // Search functionality
    toggleSearch() {
        const isVisible = this.searchContainer.style.display !== 'none';
        this.searchContainer.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            this.searchInput.focus();
        } else {
            this.clearSearch();
        }
    }
    
    async handleSearch(query) {
        if (!query.trim()) {
            this.clearSearchBtn.style.display = 'none';
            this.loadConversations();
            return;
        }
        
        this.clearSearchBtn.style.display = 'block';
        
        try {
            const response = await fetch(`/api/conversations/search/${encodeURIComponent(query)}`);
            const conversations = await response.json();
            
            this.conversations = conversations;
            this.renderConversations();
            
            if (conversations.length === 0) {
                this.conversationsList.innerHTML = `
                    <div class="search-no-results">
                        <i class="ri-search-line"></i>
                        <p>No conversations found for "${query}"</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error searching conversations:', error);
        }
    }
    
    clearSearch() {
        this.searchInput.value = '';
        this.clearSearchBtn.style.display = 'none';
        this.loadConversations();
    }
    
    // Delete functionality
    async deleteConversation(conversationId, event) {
        event.stopPropagation(); // Prevent opening the conversation
        
        const confirmed = await this.showConfirmModal(
            'Delete Conversation',
            'Are you sure you want to delete this conversation? This action cannot be undone.'
        );
        
        if (!confirmed) return;
        
        try {
            const response = await fetch(`/api/conversations/${conversationId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // If deleted conversation was current, clear chat
                if (this.currentConversationId === conversationId) {
                    this.createNewChat();
                }
                this.loadConversations();
            } else {
                console.error('Failed to delete conversation');
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    }
    
    async confirmDeleteAll() {
        const confirmed = await this.showConfirmModal(
            'Clear All History',
            'Are you sure you want to delete all conversations? This action cannot be undone.',
            'Clear All'
        );
        
        if (!confirmed) return;
        
        try {
            const response = await fetch('/api/conversations', {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.createNewChat();
                this.loadConversations();
            } else {
                console.error('Failed to delete all conversations');
            }
        } catch (error) {
            console.error('Error deleting all conversations:', error);
        }
    }
    
    // Confirmation modal
    showConfirmModal(title, message, confirmText = 'Delete') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-icon">
                            <i class="ri-alert-line"></i>
                        </div>
                        <h3>${title}</h3>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-actions">
                        <button class="modal-btn modal-btn-cancel" id="modal-cancel">Cancel</button>
                        <button class="modal-btn modal-btn-danger" id="modal-confirm">${confirmText}</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const cancelBtn = modal.querySelector('#modal-cancel');
            const confirmBtn = modal.querySelector('#modal-confirm');
            
            const closeModal = (result) => {
                modal.style.animation = 'fadeOut 0.2s ease-out';
                setTimeout(() => {
                    modal.remove();
                    resolve(result);
                }, 200);
            };
            
            cancelBtn.addEventListener('click', () => closeModal(false));
            confirmBtn.addEventListener('click', () => closeModal(true));
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(false);
            });
        });
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});