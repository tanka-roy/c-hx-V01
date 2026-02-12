// Chat HX — 2026 Redesign
// All original functionality preserved, adapted to new markup

class ChatApp {
    constructor() {
        this.currentConversationId = null;
        this.currentModel = 'groq';
        this.currentModelLabel = 'Groq Llama 3.3';
        this.currentModelIcon = '/static/icons/meta-color.svg';
        this.conversations = [];
        this.messages = [];
        this.MESSAGE_COLLAPSE_THRESHOLD = 300;
        this.isMobile = window.innerWidth <= 960;

        this.initializeElements();
        this.setupEventListeners();
        this.loadConversations();
        this.initializeButtonState();
        this.setupQuickActions();
        this.setupTextareaAutoResize();
    }

    initializeElements() {
        this.messageInput   = document.getElementById('message-input');
        this.sendBtn        = document.getElementById('send-btn');
        this.chatForm       = document.getElementById('chat-form');
        this.chatMessages   = document.getElementById('chat-messages');
        this.convList       = document.getElementById('conversations-list');
        this.newChatBtn     = document.getElementById('new-chat-btn');
        this.newChatBtnTop  = document.getElementById('new-chat-btn-top');
        this.searchToggleBtn= document.getElementById('search-toggle-btn');
        this.searchContainer= document.getElementById('search-container');
        this.searchInput    = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search-btn');
        this.deleteAllBtn   = document.getElementById('delete-all-btn');

        // UI indicator elements
        this.topbarModelIcon = document.getElementById('topbar-model-icon');
        this.topbarModelLabel= document.getElementById('topbar-model-label');
        this.chipIcon        = document.getElementById('chip-icon');
        this.chipLabel       = document.getElementById('chip-label');

        // Sidebar
        this.sidebar         = document.getElementById('sidebar');
        this.sidebarToggle   = document.getElementById('sidebar-toggle');
        this.sidebarCollapse = document.getElementById('sidebar-collapse-btn');
        this.sidebarOverlay  = document.getElementById('sidebar-overlay');

        // Model Dropdown
        this.modelDropdown     = document.getElementById('model-dropdown');
        this.modelDropdownTrigger = document.getElementById('model-dropdown-trigger');
        this.modelDropdownMenu = document.getElementById('model-dropdown-menu');
    }

    initializeButtonState() {
        if (this.sendBtn) this.sendBtn.disabled = true;
    }

    setupTextareaAutoResize() {
        if (!this.messageInput) return;
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 200) + 'px';
        });
    }

    setupEventListeners() {
        if (this.chatForm)    this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        if (this.newChatBtn)  this.newChatBtn.addEventListener('click', () => this.createNewChat());
        if (this.newChatBtnTop) this.newChatBtnTop.addEventListener('click', () => this.createNewChat());
        if (this.messageInput) {
            this.messageInput.addEventListener('input', () => this.handleInput());
            this.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (this.messageInput.value.trim()) {
                        this.handleSubmit(e);
                    }
                }
            });
        }

        // Search
        if (this.searchToggleBtn) this.searchToggleBtn.addEventListener('click', () => this.toggleSearch());
        if (this.searchInput)     this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        if (this.clearSearchBtn)  this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        if (this.deleteAllBtn)    this.deleteAllBtn.addEventListener('click', () => this.confirmDeleteAll());

        // Model selection (handled by dropdown in topbar)
        // Sidebar model nav items removed - model selection now via dropdown only

        // Sidebar toggle (mobile: slide open, desktop: collapse)
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => {
                if (window.innerWidth <= 960) {
                    this.openMobileSidebar();
                } else {
                    this.toggleSidebarCollapse();
                }
            });
        }

        if (this.sidebarCollapse) {
            this.sidebarCollapse.addEventListener('click', () => this.toggleSidebarCollapse());
        }

        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => this.closeMobileSidebar());
        }

        // Model Dropdown
        if (this.modelDropdownTrigger) {
            this.modelDropdownTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleModelDropdown();
            });
        }

        // Dropdown option selection
        if (this.modelDropdownMenu) {
            const options = this.modelDropdownMenu.querySelectorAll('.dropdown-option');
            options.forEach(option => {
                option.addEventListener('click', () => {
                    const model = option.dataset.model;
                    const label = option.dataset.label;
                    const icon = option.dataset.icon;
                    this.selectModel(model, label, icon);
                });
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.modelDropdown && !this.modelDropdown.contains(e.target)) {
                this.closeModelDropdown();
            }
        });

        // Responsive
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 960;
        });
    }

    updateModelIndicators() {
        if (this.topbarModelIcon)  this.topbarModelIcon.src = this.currentModelIcon;
        if (this.topbarModelLabel) this.topbarModelLabel.textContent = this.currentModelLabel;
        if (this.chipIcon)         this.chipIcon.src = this.currentModelIcon;
        if (this.chipLabel)        this.chipLabel.textContent = this.currentModelLabel;
    }

    // ==================== MODEL DROPDOWN ====================

    toggleModelDropdown() {
        if (!this.modelDropdown) return;
        this.modelDropdown.classList.toggle('open');
    }

    closeModelDropdown() {
        if (!this.modelDropdown) return;
        this.modelDropdown.classList.remove('open');
    }

    selectModel(model, label, icon) {
        // Update current model
        this.currentModel = model;
        this.currentModelLabel = label;
        this.currentModelIcon = icon;

        // Update UI indicators
        this.updateModelIndicators();

        // Update dropdown options visual state
        const options = this.modelDropdownMenu?.querySelectorAll('.dropdown-option');
        options?.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.model === model);
        });

        // Close dropdown
        this.closeModelDropdown();

        // Show notification
        this.showModelSwitch(this.currentModelLabel);

        // On mobile, close sidebar after model selection
        if (this.isMobile) this.closeMobileSidebar();
    }

    openMobileSidebar() {
        this.sidebar.classList.add('mobile-open');
        this.sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeMobileSidebar() {
        this.sidebar.classList.remove('mobile-open');
        this.sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    toggleSidebarCollapse() {
        this.sidebar.classList.toggle('collapsed');
    }

    setupQuickActions() {
        const cards = document.querySelectorAll('.suggestion-card, .quick-action-btn');
        cards.forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.dataset.prompt;
                if (prompt && this.messageInput) {
                    this.messageInput.value = prompt;
                    this.messageInput.style.height = 'auto';
                    this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 200) + 'px';
                    this.handleInput();
                    this.messageInput.focus();
                }
            });
        });
    }

    handleInput() {
        if (this.sendBtn) {
            this.sendBtn.disabled = !this.messageInput.value.trim();
        }
    }

    showModelSwitch(modelName) {
        const notification = document.createElement('div');
        notification.className = 'model-switch-notification';
        notification.textContent = `Switched to ${modelName}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('out');
            setTimeout(() => notification.remove(), 400);
        }, 2200);
    }

    getModelIcon(modelKey) {
        const icons = {
            'groq':        '/static/icons/meta-color.svg',
            'openrouter':  '/static/icons/claude-color.svg',
            'gemini':      '/static/icons/gemini-color.svg',
            'stepfun':     '/static/icons/stepfun-color.svg',
            'arcee':       '/static/icons/arcee-color.svg'
        };
        const path = icons[modelKey] || icons['groq'];
        return `<img src="${path}" alt="${modelKey}" class="model-icon" style="width:18px;height:18px;object-fit:contain;">`;
    }

    shouldCollapse(content) {
        return content.length > this.MESSAGE_COLLAPSE_THRESHOLD;
    }

    createExpandableMessage(content, role, modelUsed = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;

        // Avatar
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';

        if (role === 'user') {
            avatar.textContent = 'U';
        } else {
            const key = modelUsed || this.currentModel;
            avatar.innerHTML = this.getModelIcon(key);
        }

        // Bubble
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';

        // Sender label
        const sender = document.createElement('div');
        sender.className = 'message-sender';
        sender.textContent = role === 'user' ? 'You' : (modelUsed ? this.getLabelForModel(modelUsed) : this.currentModelLabel);
        bubble.appendChild(sender);

        // Content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        const isCollapsible = this.shouldCollapse(content);
        if (isCollapsible) contentDiv.classList.add('collapsible');
        contentDiv.innerHTML = this.formatMessageContent(content);

        // Expand toggle
        if (isCollapsible) {
            const toggle = document.createElement('button');
            toggle.className = 'expand-toggle';
            toggle.innerHTML = '<span>Show more</span><i class="ri-arrow-down-s-line"></i>';
            toggle.addEventListener('click', () => {
                const expanded = contentDiv.classList.toggle('expanded');
                toggle.classList.toggle('expanded', expanded);
                toggle.innerHTML = expanded
                    ? '<span>Show less</span><i class="ri-arrow-down-s-line"></i>'
                    : '<span>Show more</span><i class="ri-arrow-down-s-line"></i>';
                if (!expanded) {
                    contentDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
            bubble.appendChild(contentDiv);
            bubble.appendChild(toggle);
        } else {
            bubble.appendChild(contentDiv);
        }

        // Timestamp
        const ts = document.createElement('div');
        ts.className = 'timestamp';
        ts.innerHTML = `<i class="ri-time-line"></i><span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
        bubble.appendChild(ts);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'message-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'message-action-btn copy-btn';
        copyBtn.title = 'Copy message';
        copyBtn.innerHTML = '<i class="ri-file-copy-line"></i>';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard?.writeText(content).catch(() => {});
        });
        actions.appendChild(copyBtn);

        if (role === 'user') {
            const editBtn = document.createElement('button');
            editBtn.className = 'message-action-btn edit-btn';
            editBtn.title = 'Edit message';
            editBtn.innerHTML = '<i class="ri-edit-line"></i>';
            editBtn.addEventListener('click', () => {
                if (this.messageInput) {
                    this.messageInput.value = content;
                    this.handleInput();
                    this.messageInput.focus();
                }
            });
            actions.appendChild(editBtn);
        }

        bubble.appendChild(actions);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        return messageDiv;
    }

    getLabelForModel(modelKey) {
        const labels = {
            'groq':       'Groq Llama 3.3',
            'openrouter': 'Claude Haiku',
            'gemini':     'Gemini Pro',
            'stepfun':    'StepFun',
            'arcee':      'Arcee'
        };
        return labels[modelKey] || modelKey;
    }

    formatMessageContent(content) {
        let formatted = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // Code blocks
        formatted = formatted.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
        // Inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Bold
        formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');

        return formatted;
    }

    async handleSubmit(e) {
        e.preventDefault();
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.sendBtn.disabled = true;

        // Ensure we have the messages wrapper
        this.ensureMessagesWrapper();

        this.addMessageToUI(message, 'user');
        const typingEl = this.showTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    conversation_id: this.currentConversationId,
                    model: this.currentModel
                })
            });

            const data = await response.json();
            typingEl.remove();

            if (response.ok) {
                this.addMessageToUI(data.response, 'assistant', data.model_used);
                this.currentConversationId = data.conversation_id;
                this.loadConversations();
            } else {
                this.addMessageToUI(`Error: ${data.detail}`, 'assistant');
            }
        } catch (error) {
            typingEl.remove();
            this.addMessageToUI(`Error: ${error.message}`, 'assistant');
        }

        this.sendBtn.disabled = !this.messageInput.value.trim();
        this.messageInput.focus();
    }

    // Ensure a .messages-inner container exists inside the viewport
    ensureMessagesWrapper() {
        if (!this.chatMessages.querySelector('.messages-inner')) {
            const inner = document.createElement('div');
            inner.className = 'messages-inner';
            this.chatMessages.appendChild(inner);
        }
    }

    getMessagesContainer() {
        return this.chatMessages.querySelector('.messages-inner') || this.chatMessages;
    }

    addMessageToUI(content, role, modelUsed = null) {
        // Remove welcome screen if present
        const welcome = this.chatMessages.querySelector('.welcome-screen');
        if (welcome) welcome.remove();

        this.ensureMessagesWrapper();

        // Remove edit btns from previous user messages on new user message
        if (role === 'user') {
            this.chatMessages.querySelectorAll('.edit-btn').forEach(b => b.remove());
        }

        const el = this.createExpandableMessage(content, role, modelUsed);
        this.getMessagesContainer().appendChild(el);
        this.scrollToBottom();
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            this.chatMessages.scrollTo({ top: this.chatMessages.scrollHeight, behavior: 'smooth' });
        });
    }

    showTypingIndicator() {
        this.ensureMessagesWrapper();

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant-message';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = this.getModelIcon(this.currentModel);

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';

        const sender = document.createElement('div');
        sender.className = 'message-sender';
        sender.textContent = this.currentModelLabel;
        bubble.appendChild(sender);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `<span style="color:var(--text-tertiary);font-style:italic;">Thinking</span>
            <span class="typing-indicator-container">
                <span class="typing-indicator"></span>
                <span class="typing-indicator"></span>
                <span class="typing-indicator"></span>
            </span>`;

        bubble.appendChild(contentDiv);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        this.getMessagesContainer().appendChild(messageDiv);
        this.scrollToBottom();
        return messageDiv;
    }

    async loadConversations() {
        try {
            const res = await fetch('/api/conversations');
            this.conversations = await res.json();
            this.renderConversations();
        } catch (err) {
            console.error('Error loading conversations:', err);
        }
    }

    renderConversations() {
        if (!this.convList) return;
        this.convList.innerHTML = '';

        if (this.conversations.length === 0) {
            this.convList.innerHTML = `<div class="empty-history">No conversations yet.<br>Start a new chat above.</div>`;
            return;
        }

        this.conversations.forEach(conv => {
            const item = document.createElement('div');
            item.className = 'conversation-item';
            if (conv._id === this.currentConversationId) item.classList.add('active');

            const content = document.createElement('div');
            content.className = 'conversation-item-content';

            const title = document.createElement('div');
            title.className = 'conversation-title';
            title.textContent = conv.title;

            const time = document.createElement('div');
            time.className = 'conversation-time';
            time.textContent = this.formatDate(conv.updated_at);

            content.appendChild(title);
            content.appendChild(time);

            const delBtn = document.createElement('button');
            delBtn.className = 'conversation-delete-btn';
            delBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
            delBtn.addEventListener('click', (e) => this.deleteConversation(conv._id, e));

            item.appendChild(content);
            item.appendChild(delBtn);
            item.addEventListener('click', () => {
                this.loadConversation(conv._id);
                if (this.isMobile) this.closeMobileSidebar();
            });

            this.convList.appendChild(item);
        });
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const diff = Date.now() - date;
        const days = Math.floor(diff / 86400000);
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7)  return `${days} days ago`;
        return date.toLocaleDateString();
    }

    async loadConversation(conversationId) {
        try {
            this.currentConversationId = conversationId;
            this.renderConversations();

            const res = await fetch(`/api/conversations/${conversationId}/messages`);
            const messages = await res.json();

            this.chatMessages.innerHTML = '';

            if (messages.length === 0) {
                this.showWelcomeScreen();
                return;
            }

            this.ensureMessagesWrapper();
            messages.forEach(msg => this.addMessageToUI(msg.content, msg.role, msg.model_used));
            this.scrollToBottom();
        } catch (err) {
            console.error('Error loading conversation:', err);
        }
    }

    showWelcomeScreen() {
        this.chatMessages.innerHTML = this.getWelcomeHTML();
        this.setupQuickActions();
    }

    getWelcomeHTML() {
        return `
        <div class="welcome-screen">
            <div class="welcome-glyph">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                    <circle cx="28" cy="28" r="27" stroke="#E5E7EB" stroke-width="1"/>
                    <circle cx="28" cy="28" r="20" stroke="#D1D5DB" stroke-width="0.75" stroke-dasharray="3 4"/>
                    <path d="M10 28C10 18.0589 18.0589 10 28 10C37.9411 10 46 18.0589 46 28" stroke="#374151" stroke-width="2.5" stroke-linecap="round"/>
                    <path d="M46 28C46 37.9411 37.9411 46 28 46C18.0589 46 10 37.9411 10 28" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 4"/>
                    <circle cx="28" cy="28" r="5" fill="#111827"/>
                    <circle cx="28" cy="28" r="2" fill="white"/>
                </svg>
            </div>
            <div class="welcome-copy">
                <h1>What can I help you with?</h1>
                <p>Select a model from the sidebar, then start your conversation.</p>
            </div>
            <div class="suggestion-grid">
                <button class="suggestion-card" data-prompt="Help me build a responsive navbar with Tailwind CSS">
                    <i class="ri-layout-line"></i>
                    <div>
                        <strong>Build UI component</strong>
                        <span>Responsive Tailwind navbar</span>
                    </div>
                </button>
                <button class="suggestion-card" data-prompt="Explain the difference between React hooks and class components">
                    <i class="ri-code-line"></i>
                    <div>
                        <strong>Explain code concepts</strong>
                        <span>React hooks vs classes</span>
                    </div>
                </button>
                <button class="suggestion-card" data-prompt="Design principles for a modern dashboard">
                    <i class="ri-palette-line"></i>
                    <div>
                        <strong>Design advice</strong>
                        <span>Modern dashboard principles</span>
                    </div>
                </button>
                <button class="suggestion-card" data-prompt="Review this code for performance improvements">
                    <i class="ri-speed-line"></i>
                    <div>
                        <strong>Code review</strong>
                        <span>Performance improvements</span>
                    </div>
                </button>
            </div>
        </div>`;
    }

    createNewChat() {
        this.currentConversationId = null;
        this.showWelcomeScreen();
        this.renderConversations();
        if (this.sendBtn) this.sendBtn.disabled = true;
        if (this.messageInput) {
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
            this.messageInput.focus();
        }
    }

    // ============ SEARCH ============

    toggleSearch() {
        const isVisible = this.searchContainer.style.display !== 'none';
        this.searchContainer.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            this.searchInput?.focus();
        } else {
            this.clearSearch();
        }
    }

    async handleSearch(query) {
        if (!query.trim()) {
            if (this.clearSearchBtn) this.clearSearchBtn.style.display = 'none';
            this.loadConversations();
            return;
        }
        if (this.clearSearchBtn) this.clearSearchBtn.style.display = 'block';

        try {
            const res = await fetch(`/api/conversations/search/${encodeURIComponent(query)}`);
            const conversations = await res.json();
            this.conversations = conversations;
            this.renderConversations();

            if (conversations.length === 0 && this.convList) {
                this.convList.innerHTML = `
                    <div class="search-no-results">
                        <i class="ri-search-line"></i>
                        <p>No results for "${query}"</p>
                    </div>`;
            }
        } catch (err) {
            console.error('Search error:', err);
        }
    }

    clearSearch() {
        if (this.searchInput)    this.searchInput.value = '';
        if (this.clearSearchBtn) this.clearSearchBtn.style.display = 'none';
        this.loadConversations();
    }

    // ============ DELETE ============

    async deleteConversation(conversationId, event) {
        event.stopPropagation();
        const confirmed = await this.showConfirmModal(
            'Delete Conversation',
            'Are you sure you want to delete this conversation? This action cannot be undone.'
        );
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/conversations/${conversationId}`, { method: 'DELETE' });
            if (res.ok) {
                if (this.currentConversationId === conversationId) this.createNewChat();
                this.loadConversations();
            }
        } catch (err) {
            console.error('Delete error:', err);
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
            const res = await fetch('/api/conversations', { method: 'DELETE' });
            if (res.ok) {
                this.createNewChat();
                this.loadConversations();
            }
        } catch (err) {
            console.error('Delete all error:', err);
        }
    }

    showConfirmModal(title, message, confirmText = 'Delete') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-icon"><i class="ri-alert-line"></i></div>
                        <h3>${title}</h3>
                    </div>
                    <div class="modal-body"><p>${message}</p></div>
                    <div class="modal-actions">
                        <button class="modal-btn modal-btn-cancel" id="modal-cancel">Cancel</button>
                        <button class="modal-btn modal-btn-danger" id="modal-confirm">${confirmText}</button>
                    </div>
                </div>`;

            document.body.appendChild(modal);

            const close = (result) => {
                modal.style.animation = 'fadeOut 0.2s ease-out';
                setTimeout(() => { modal.remove(); resolve(result); }, 200);
            };

            modal.querySelector('#modal-cancel').addEventListener('click', () => close(false));
            modal.querySelector('#modal-confirm').addEventListener('click', () => close(true));
            modal.addEventListener('click', (e) => { if (e.target === modal) close(false); });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new ChatApp());
