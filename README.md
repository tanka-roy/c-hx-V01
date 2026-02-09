# CHAT HX V-01 🚀

A modern, full-stack chat application powered by **Groq** (Llama 3.3 70B) for coding and **OpenRouter** (Claude 3.5 Haiku) for UI/UX design.

## ✨ Features

- **Dual AI Models**: 
  - 🚀 **Groq Llama 3.3 70B** - Lightning-fast responses, perfect for coding and development
  - 🎨 **Claude 3.5 Haiku** - Expert in UI/UX design and modern web interfaces
- **Real-time Chat**: Seamless conversation experience
- **Conversation History**: MongoDB-powered persistent storage
- **Search Conversations**: 🔍 Real-time search through all your conversations
- **Delete Management**: 🗑️ Delete individual conversations or clear all history
- **Modern UI**: Beautiful gradient design with glassmorphism effects
- **Model Switching**: Easy toggle between models for different tasks
- **Confirmation Modals**: Safe deletion with confirmation dialogs

## 🎯 Perfect For

- Full-stack development questions
- Code explanations and debugging
- UI/UX design principles
- Modern web design patterns
- React, Vue, Angular development
- Tailwind CSS and styling advice

## 📋 Prerequisites

- Python 3.8+
- MongoDB (local or cloud)
- Node.js (for frontend dependencies if needed)

## 🔑 Getting API Keys

### 1. Groq API Key (FREE)
1. Go to [https://console.groq.com/](https://console.groq.com/)
2. Sign up for a free account
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Copy your API key

**Benefits**: 
- ⚡ Extremely fast inference
- 🆓 Generous free tier
- 💪 Great for coding tasks

### 2. OpenRouter API Key (FREE TIER AVAILABLE)
1. Go to [https://openrouter.ai/](https://openrouter.ai/)
2. Sign in with Google/GitHub
3. Go to **Keys** section: [https://openrouter.ai/keys](https://openrouter.ai/keys)
4. Click **Create Key**
5. Copy your API key

**Benefits**:
- 🎨 Access to Claude 3.5 Haiku (free tier)
- 🧠 Excellent for design and UX questions
- 🆓 Free tier available

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd chat-hx
```

### 2. Set Up Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your API keys:
GROQ_API_KEY=your_groq_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB_NAME=chat_hx
```

### 5. Start MongoDB
```bash
# Make sure MongoDB is running
# On Windows (if installed as service):
net start MongoDB

# On macOS:
brew services start mongodb-community

# On Linux:
sudo systemctl start mongod
```

### 6. Test API Connections
```bash
python test_api.py
```

You should see:
```
✅ Success! Response: Hello! How can I help?
```

### 7. Run the Application
```bash
# From your project root (where main.py is located)
uvicorn main:app --reload
```

### 8. Open in Browser
Navigate to: `http://localhost:8000`

## 📁 Project Structure

```
chat-hx/
├── app/
│   ├── api/
│   │   └── chat.py          # Chat endpoints
│   ├── llm_client.py        # Groq & OpenRouter integration
│   ├── models.py            # Pydantic models
│   └── database.py          # MongoDB connection
├── static/
│   ├── style.css            # Styling
│   └── script.js            # Frontend logic
├── templates/
│   └── index.html           # Main UI
├── main.py                  # FastAPI app
├── test_api.py             # API testing script
├── .env.example            # Environment template
└── requirements.txt        # Python dependencies
```

## 🎨 Using the Chat

### Switch Between Models

Click the icons in the left sidebar:
- **Code Icon** (Groq) - For coding, debugging, technical questions
- **Design Icon** (Claude) - For UI/UX, design principles, styling

### Search Conversations 🔍

1. Click the search icon in the History panel
2. Type to search through conversation titles and messages
3. Click X to clear search

### Delete Conversations 🗑️

**Delete Individual:**
- Hover over a conversation in History
- Click the trash icon that appears
- Confirm deletion

**Clear All History:**
- Click the red trash icon in History header
- Confirm to delete all conversations

### Example Prompts

**For Groq (Coding)**:
- "Explain React hooks vs class components"
- "Help me debug this Python function"
- "Write a REST API endpoint in FastAPI"

**For Claude (Design)**:
- "Design principles for a modern dashboard"
- "Best practices for responsive navigation"
- "How to create a cohesive color palette"

## 🔧 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
# Windows:
tasklist | findstr mongod

# macOS/Linux:
ps aux | grep mongod
```

### API Key Issues
Run the test script:
```bash
python test_api.py
```

Check for:
- ✅ Valid API keys
- ✅ Correct .env file location
- ✅ No extra spaces in API keys

### Port Already in Use
```bash
# Change port in command:
uvicorn main:app --reload --port 8001
```

## 💡 Tips

1. **Groq is FAST** - Use it for quick code generation and debugging
2. **Claude is THOUGHTFUL** - Use it for design decisions and UX advice
3. **Mix & Match** - Start with Groq for code, then switch to Claude for styling
4. **Save Conversations** - All chats are saved automatically in MongoDB

## 📦 Dependencies

Main packages:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `pymongo` - MongoDB driver
- `python-dotenv` - Environment variables
- `requests` - HTTP requests
- `pydantic` - Data validation

## 🌟 Features Coming Soon

- [ ] Keyboard shortcuts (Ctrl+K for search)
- [ ] Export conversations to markdown/PDF
- [ ] Dark/Light theme toggle
- [ ] Code syntax highlighting in messages
- [ ] File upload support
- [ ] Markdown rendering in chat
- [ ] Favorite/pin important conversations
- [ ] Conversation tags and categories

## 📄 License

MIT License - feel free to use this for your projects!

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 📧 Support

If you encounter issues:
1. Check the troubleshooting section
2. Run `python test_api.py`
3. Check MongoDB connection
4. Verify API keys in .env file

---

Built with ❤️ using Groq, OpenRouter, FastAPI, and MongoDB