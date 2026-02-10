// Chat HX V-01
class ChatApp {
    constructor() {
        this.currentConversationId = null;
        this.currentModel = 'groq';  // Default to Groq
        this.conversations = [];
        this.messages = [];
        this.MESSAGE_COLLAPSE_THRESHOLD = 300; // Characters threshold for collapsing
        
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
        notification.innerHTML = `
            <span>Switched to ${modelName}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('out');
            setTimeout(() => notification.remove(), 500);
        }, 2500);
    }
    
    /**
     * Checks if content should be collapsible
     * @param {string} content - The message content
     * @returns {boolean}
     */
    shouldCollapse(content) {
        return content.length > this.MESSAGE_COLLAPSE_THRESHOLD;
    }
    
    /**
     * Creates an expandable message element
     * @param {string} content - The message content
     * @param {string} role - 'user' or 'assistant'
     * @returns {HTMLElement}
     */
    createExpandableMessage(content, role) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        // Create avatar
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = role === 'user' ? 
            '<i class="ri-user-line"></i>' : 
            '<i class="ri-cpu-line"></i>';
        
        // Create message bubble container
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        // Create content container
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Check if content should be collapsible
        const isCollapsible = this.shouldCollapse(content);
        
        if (isCollapsible) {
            contentDiv.classList.add('collapsible');
        }
        
        // Process content for code blocks and formatting
        contentDiv.innerHTML = this.formatMessageContent(content);
        
        // Create expand/collapse button if needed
        if (isCollapsible) {
            const expandToggle = document.createElement('button');
            expandToggle.className = 'expand-toggle';
            expandToggle.innerHTML = `
                <span>Show more</span>
                <i class="ri-arrow-down-s-line"></i>
            `;
            
            expandToggle.addEventListener('click', () => {
                const isExpanded = contentDiv.classList.toggle('expanded');
                expandToggle.classList.toggle('expanded', isExpanded);
                expandToggle.innerHTML = isExpanded ? 
                    '<span>Show less</span><i class="ri-arrow-down-s-line"></i>' :
                    '<span>Show more</span><i class="ri-arrow-down-s-line"></i>';
                
                // Smooth scroll to keep message in view
                setTimeout(() => {
                    if (!isExpanded) {
                        contentDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }, 100);
            });
            
            bubble.appendChild(contentDiv);
            bubble.appendChild(expandToggle);
        } else {
            bubble.appendChild(contentDiv);
        }
        
        // Create timestamp
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'timestamp';
        timestampDiv.innerHTML = `
            <i class="ri-time-line"></i>
            <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        `;
        
        bubble.appendChild(timestampDiv);
        
        // Assemble message
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        
        return messageDiv;
    }
    
    /**
     * Formats message content (handles code blocks, line breaks, etc.)
     * @param {string} content - Raw message content
     * @returns {string} - Formatted HTML
     */
    formatMessageContent(content) {
        // Escape HTML to prevent XSS
        let formatted = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        
        // Handle code blocks (```code```)
        formatted = formatted.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
        
        // Handle inline code (`code`)
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Handle line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
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
        
        const messageElement = this.createExpandableMessage(content, role);
        this.chatMessages.appendChild(messageElement);
        
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
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '<i class="ri-cpu-line"></i>';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `
            Thinking
            <span class="typing-indicator-container">
                <span class="typing-indicator"></span>
                <span class="typing-indicator"></span>
                <span class="typing-indicator"></span>
            </span>
        `;
        
        bubble.appendChild(contentDiv);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
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
                <div style="padding: 20px; text-align: center; color: var(--text-dim); font-size: 0.8rem;">
                    No conversations yet
                </div>
            `;
            return;
        }
        
        this.conversations.forEach(conv => {
            const convDiv = document.createElement('div');
            convDiv.className = 'conversation-item';
            if (conv._id === this.currentConversationId) {
                convDiv.classList.add('active');
            }
            
            const title = document.createElement('div');
            title.className = 'conversation-title';
            title.textContent = conv.title;
            
            const time = document.createElement('div');
            time.className = 'conversation-time';
            time.textContent = this.formatDate(conv.updated_at);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'conversation-delete-btn';
            deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
            deleteBtn.addEventListener('click', (e) => this.deleteConversation(conv._id, e));
            
            convDiv.appendChild(title);
            convDiv.appendChild(time);
            convDiv.appendChild(deleteBtn);
            
            convDiv.addEventListener('click', () => this.loadConversation(conv._id));
            
            this.conversationsList.appendChild(convDiv);
        });
    }
    
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return 'Today';
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
    
    async loadConversation(conversationId) {
        try {
            this.currentConversationId = conversationId;
            this.renderConversations();
            
            const response = await fetch(`/api/conversations/${conversationId}/messages`);
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

document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});