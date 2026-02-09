# app/openrouter_client.py
import requests
import json
import os
from dotenv import load_dotenv
from typing import List, Dict

load_dotenv()

# Available models
MODELS = {
    "glm": "z-ai/glm-4.5-air:free",  # Replaced Qwen with GLM
    "arcee": "arcee-ai/trinity-large-preview:free",
    "stepfun": "stepfun/step-3.5-flash:free"
}

# Configure OpenRouter
api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    raise ValueError("OPENROUTER_API_KEY not found in environment variables")

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

def get_model_name(model_key: str) -> str:
    """Get the full model name from the key"""
    return MODELS.get(model_key.lower(), MODELS["glm"])  # Changed default to GLM

async def generate_response(prompt: str, conversation_history: List[Dict] = None, model: str = "glm") -> tuple[str, str]:  # Changed default to GLM
    """
    Generate response using OpenRouter API
    Returns: (response_text, model_used)
    """
    try:
        # Build messages array
        messages = []
        
        # Add system message
        messages.append({
            "role": "system",
            "content": "You are a helpful AI assistant."
        })
        
        # Add conversation history for context
        if conversation_history:
            # Take last 5 messages for context
            recent_history = conversation_history[-5:] if len(conversation_history) > 5 else conversation_history
            for msg in recent_history:
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": prompt
        })
        
        # Get the actual model identifier
        model_identifier = get_model_name(model)
        
        # Prepare request payload
        payload = {
            "model": model_identifier,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 2048
        }
        
        # Make API request
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://localhost:8000",  # Optional
            "X-Title": "CHAT HX V01"  # Optional
        }
        
        response = requests.post(
            OPENROUTER_API_URL,
            headers=headers,
            data=json.dumps(payload),
            timeout=30
        )
        
        response.raise_for_status()
        result = response.json()
        
        # Extract response text
        response_text = result["choices"][0]["message"]["content"].strip()
        return response_text, model_identifier
        
    except requests.exceptions.RequestException as e:
        print(f"Error calling OpenRouter API: {e}")
        return "Sorry, I encountered an error while processing your request.", model
    except KeyError as e:
        print(f"Error parsing OpenRouter response: {e}")
        return "Sorry, I received an unexpected response format.", model
    except Exception as e:
        print(f"Unexpected error: {e}")
        return "Sorry, an unexpected error occurred.", model

def format_conversation_history(messages: list) -> list:
    """Format messages for OpenRouter context"""
    history = []
    for msg in messages:
        history.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    return history