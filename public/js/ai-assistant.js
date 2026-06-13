const AIAssistant = {
  isOpen: false,
  initialized: false,
  container: null,

  init() {
    if (this.initialized) return;

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'ai-assistant-container';
    this.container.className = 'ai-assistant-wrapper';
    this.container.innerHTML = `
      <!-- Floating Action Button -->
      <button id="ai-assistant-trigger" class="ai-trigger-btn" title="Ask ShopLux AI">
        <span class="ai-trigger-icon">✨</span>
        <span class="ai-trigger-text">Ask AI</span>
      </button>

      <!-- Chat Window -->
      <div id="ai-chat-window" class="ai-chat-window hidden">
        <div class="ai-chat-header">
          <div class="ai-chat-header-info">
            <span class="ai-avatar">✨</span>
            <div>
              <h4>ShopLux AI</h4>
              <p>Personal Shopping Assistant</p>
            </div>
          </div>
          <button id="ai-chat-close" class="ai-close-btn">&times;</button>
        </div>
        <div id="ai-chat-messages" class="ai-chat-messages">
          <div class="ai-message assistant">
            <div class="ai-message-bubble">
              Hi! I'm your ShopLux AI assistant. 🛍️
              <br><br>
              I can help you find products, search within your budget, or give you personalized recommendations. What are you looking for today?
            </div>
          </div>
          <!-- Suggestion Chips -->
          <div class="ai-suggestions">
            <button class="ai-chip" onclick="AIAssistant.sendSuggestion('Laptops under ₹1,00,000')">💻 Laptops under 1 Lakh</button>
            <button class="ai-chip" onclick="AIAssistant.sendSuggestion('Recommend best books')">📚 Top Books</button>
            <button class="ai-chip" onclick="AIAssistant.sendSuggestion('Show running shoes')">👟 Running Shoes</button>
            <button class="ai-chip" onclick="AIAssistant.sendSuggestion('Featured products on sale')">🔥 Deals & Sales</button>
          </div>
        </div>
        <div class="ai-chat-input-area">
          <input type="text" id="ai-chat-input" placeholder="Ask ShopLux AI..." autocomplete="off" />
          <button id="ai-chat-send" class="ai-send-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    // Bind events
    document.getElementById('ai-assistant-trigger').addEventListener('click', () => this.toggle());
    document.getElementById('ai-chat-close').addEventListener('click', () => this.toggle());
    document.getElementById('ai-chat-send').addEventListener('click', () => this.sendMessage());
    document.getElementById('ai-chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    this.initialized = true;
  },

  toggle() {
    this.isOpen = !this.isOpen;
    const windowEl = document.getElementById('ai-chat-window');
    const triggerEl = document.getElementById('ai-assistant-trigger');
    
    if (this.isOpen) {
      windowEl.classList.remove('hidden');
      triggerEl.classList.add('active');
      document.getElementById('ai-chat-input').focus();
    } else {
      windowEl.classList.add('hidden');
      triggerEl.classList.remove('active');
    }
  },

  sendSuggestion(text) {
    document.getElementById('ai-chat-input').value = text;
    this.sendMessage();
  },

  appendMessage(text, sender, products = []) {
    const messagesEl = document.getElementById('ai-chat-messages');
    
    // Remove existing suggestions if any
    const suggestions = messagesEl.querySelector('.ai-suggestions');
    if (suggestions) suggestions.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-message ${sender}`;

    let productsHTML = '';
    if (products && products.length > 0) {
      productsHTML = `
        <div class="ai-products-list">
          ${products.map(p => `
            <div class="ai-product-card" onclick="AIAssistant.goToProduct(${p.id})">
              <img src="${p.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=150'}" alt="${p.name}">
              <div class="ai-product-info">
                <div class="ai-p-name">${p.name}</div>
                <div class="ai-p-price">₹${p.price.toLocaleString('en-IN')}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    msgDiv.innerHTML = `
      <div class="ai-message-bubble">
        ${text}
        ${productsHTML}
      </div>
    `;

    messagesEl.appendChild(msgDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  },

  appendTypingIndicator() {
    const messagesEl = document.getElementById('ai-chat-messages');
    const indicator = document.createElement('div');
    indicator.id = 'ai-typing-indicator';
    indicator.className = 'ai-message assistant typing';
    indicator.innerHTML = `
      <div class="ai-message-bubble">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    `;
    messagesEl.appendChild(indicator);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  },

  removeTypingIndicator() {
    const el = document.getElementById('ai-typing-indicator');
    if (el) el.remove();
  },

  async sendMessage() {
    const inputEl = document.getElementById('ai-chat-input');
    const message = inputEl.value.trim();
    if (!message) return;

    inputEl.value = '';
    this.appendMessage(message, 'user');
    this.appendTypingIndicator();

    try {
      const data = await API.post('/recommendations/chat', { message });
      this.removeTypingIndicator();
      this.appendMessage(data.reply, 'assistant', data.products);
    } catch (err) {
      this.removeTypingIndicator();
      this.appendMessage('Sorry, I encountered an error searching for products. Please try again.', 'assistant');
    }
  },

  goToProduct(id) {
    app.navigate('product', { id });
    this.toggle(); // Close assistant when navigating to product
  }
};

// Initialize after app.js loads
document.addEventListener('DOMContentLoaded', () => {
  // Give app setup a moment to complete
  setTimeout(() => {
    AIAssistant.init();
  }, 100);
});
