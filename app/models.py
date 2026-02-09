# app/models.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Message(BaseModel):
    id: Optional[str] = None
    conversation_id: str
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = None

class Conversation(BaseModel):
    id: Optional[str] = None
    title: str
    created_at: datetime = None
    updated_at: datetime = None

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    model: Optional[str] = "groq"  # Default to Groq

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    message_id: str
    model_used: str