// Chat HX V-01
class ChatApp {
    constructor() {
        this.currentConversationId = null;
        this.currentModel = 'glm'; // Changed default from 'qwen' to 'glm'
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
    }
    
    initializeButtonState() {
        this.sendBtn.disabled = true;
    }
    
    setupEventListeners() {
        this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.newChatBtn.addEventListener('click', () => this.createNewChat());
        this.messageInput.addEventListener('input', () => this.handleInput());
        
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
                    this.showMessage(`Switched to ${item.dataset.label} model`, 'system');
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
            
            convElement.appendChild(titleDiv);
            convElement.appendChild(dateDiv);
            
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
                <p>Your intelligent conversation companion awaits.</p>
                <div class="quick-actions">
                    <button class="quick-action-btn" data-prompt="Tell me a joke">
                        <i class="ri-emotion-laugh-line"></i>
                        <span>Tell me a joke</span>
                    </button>
                    <button class="quick-action-btn" data-prompt="Explain quantum computing">
                        <i class="ri-lightbulb-line"></i>
                        <span>Explain something</span>
                    </button>
                    <button class="quick-action-btn" data-prompt="Help me write code">
                        <i class="ri-code-line"></i>
                        <span>Help with code</span>
                    </button>
                </div>
            </div>
        `;
        
        this.setupQuickActions();
        this.renderConversations();
        this.sendBtn.disabled = true;
        this.messageInput.focus();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});