# test_api.py
import requests
import os
from dotenv import load_dotenv

load_dotenv()

# Test Groq
def test_groq():
    api_key = os.getenv("GROQ_API_KEY")
    print(f"Groq API Key: {api_key[:10]}..." if api_key else "NOT SET")
    
    if not api_key:
        print("❌ GROQ_API_KEY not set in .env file")
        return
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": "Say hello in 5 words"}],
        "max_tokens": 50
    }
    
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Response: {result['choices'][0]['message']['content']}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

# Test OpenRouter
def test_openrouter():
    api_key = os.getenv("OPENROUTER_API_KEY")
    print(f"OpenRouter API Key: {api_key[:10]}..." if api_key else "NOT SET")
    
    if not api_key:
        print("❌ OPENROUTER_API_KEY not set in .env file")
        return
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chat-hx.com",
        "X-Title": "Chat HX"
    }
    
    payload = {
        "model": "anthropic/claude-3.5-haiku",
        "messages": [{"role": "user", "content": "Say hello in 5 words"}],
        "max_tokens": 50
    }
    
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Response: {result['choices'][0]['message']['content']}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("Testing API Connections")
    print("=" * 50)
    
    print("\n🚀 Testing Groq (Llama 3.3 70B)")
    print("-" * 50)
    test_groq()
    
    print("\n🎨 Testing OpenRouter (Claude 3.5 Haiku)")
    print("-" * 50)
    test_openrouter()
    
    print("\n" + "=" * 50)
    print("Testing Complete!")
    print("=" * 50)