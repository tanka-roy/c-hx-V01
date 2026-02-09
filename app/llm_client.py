# app/llm_client.py
import requests
import json
import os
from dotenv import load_dotenv
from typing import List, Dict, Optional

load_dotenv()

# Available models with their providers
MODELS = {
    "groq": {
        "model": "llama-3.3-70b-versatile",
        "provider": "groq",
        "display_name": "Groq Llama 3.3"
    },
    "openrouter": {
        "model": "anthropic/claude-3.5-haiku",
        "provider": "openrouter",
        "display_name": "Claude 3.5 Haiku"
    }
}

# API configurations
API_CONFIGS = {
    "groq": {
        "base_url": "https://api.groq.com/openai/v1/chat/completions",
        "api_key_env": "GROQ_API_KEY"
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1/chat/completions",
        "api_key_env": "OPENROUTER_API_KEY"
    }
}

def get_api_key(provider: str) -> Optional[str]:
    """Get API key for a provider"""
    config = API_CONFIGS.get(provider)
    if config:
        return os.getenv(config["api_key_env"])
    return None

def get_model_config(model_key: str) -> Dict:
    """Get the full model config from the key"""
    return MODELS.get(model_key.lower(), MODELS["groq"])

async def generate_response(
    prompt: str, 
    conversation_history: List[Dict] = None, 
    model: str = "groq"
) -> tuple[str, str]:
    """
    Generate response using the appropriate API based on model
    Returns: (response_text, model_used)
    """
    try:
        # Get model configuration
        model_config = get_model_config(model)
        provider = model_config["provider"]
        model_identifier = model_config["model"]
        
        # Get API configuration
        api_config = API_CONFIGS.get(provider)
        if not api_config:
            return f"Error: Unknown provider '{provider}'", model
        
        # Get API key
        api_key = get_api_key(provider)
        if not api_key:
            return f"Error: API key not configured for {provider}. Please set {api_config['api_key_env']} in your .env file.", model
        
        # Build messages array
        messages = []
        
        # Add system message with enhanced prompts for each model
        if provider == "groq":
            system_prompt = "You are an expert full-stack developer and coding assistant. You excel at writing clean, efficient code and explaining technical concepts clearly."
        else:  # openrouter (Claude)
            system_prompt = "You are an expert in modern UI/UX design and web development. You excel at creating beautiful, user-friendly interfaces and providing thoughtful design advice."
        
        messages.append({
            "role": "system",
            "content": system_prompt
        })
        
        # Add conversation history for context
        if conversation_history:
            recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
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
        
        # Prepare request payload
        payload = {
            "model": model_identifier,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 4096
        }
        
        # Make API request with provider-specific headers
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # OpenRouter requires additional headers
        if provider == "openrouter":
            headers["HTTP-Referer"] = "https://chat-hx.com"  # Optional but recommended
            headers["X-Title"] = "Chat HX"  # Optional but recommended
        
        print(f"[DEBUG] Calling {provider} API: {api_config['base_url']}")
        print(f"[DEBUG] Model: {model_identifier}")
        
        response = requests.post(
            api_config["base_url"],
            headers=headers,
            json=payload,
            timeout=120
        )
        
        # Log response status
        print(f"[DEBUG] Response status: {response.status_code}")
        
        # Try to parse error response before raising exception
        if response.status_code != 200:
            try:
                error_data = response.json()
                error_msg = error_data.get("error", {})
                if isinstance(error_msg, dict):
                    error_message = error_msg.get("message", str(error_msg))
                    error_type = error_msg.get("type", "unknown")
                    return f"API Error ({error_type}): {error_message}", model
                else:
                    return f"API Error: {error_msg}", model
            except:
                return f"API Error: HTTP {response.status_code} - {response.text[:200]}", model
        
        response.raise_for_status()
        result = response.json()
        
        # Extract response text
        response_text = result["choices"][0]["message"]["content"].strip()
        return response_text, model_identifier
        
    except requests.exceptions.Timeout:
        return "Error: Request timed out. Please try again.", model
    except requests.exceptions.ConnectionError as e:
        return f"Error: Could not connect to API. Check your internet connection.", model
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Request exception: {e}")
        return f"Error: Network error - {str(e)}", model
    except KeyError as e:
        print(f"[ERROR] Response parsing error: {e}")
        return f"Error: Unexpected response format from API", model
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return f"Error: {str(e)}", model

def format_conversation_history(messages: list) -> list:
    """Format messages for API context"""
    history = []
    for msg in messages:
        history.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    return history