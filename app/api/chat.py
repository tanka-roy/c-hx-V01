# app/api/chat.py
from fastapi import APIRouter, HTTPException
import uuid
from datetime import datetime
from bson import ObjectId

from app.models import ChatRequest, ChatResponse, Message, Conversation
from app.database import get_collection
from app.llm_client import generate_response, format_conversation_history

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        conversations_collection = get_collection("conversations")
        messages_collection = get_collection("messages")
        
        # Create or get conversation
        if request.conversation_id:
            conversation = conversations_collection.find_one(
                {"_id": ObjectId(request.conversation_id)}
            )
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
            conversation_id = request.conversation_id
        else:
            # Create new conversation
            conversation_data = {
                "title": request.message[:50] + "..." if len(request.message) > 50 else request.message,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = conversations_collection.insert_one(conversation_data)
            conversation_id = str(result.inserted_id)
        
        # Get conversation history
        history_messages = list(messages_collection.find(
            {"conversation_id": conversation_id}
        ).sort("timestamp", 1))
        
        # Generate AI response using selected model (default: groq)
        formatted_history = format_conversation_history(history_messages)
        ai_response, model_used = await generate_response(
            request.message, 
            formatted_history, 
            request.model or "groq"
        )
        
        # Save user message
        user_message = {
            "conversation_id": conversation_id,
            "role": "user",
            "content": request.message,
            "timestamp": datetime.utcnow()
        }
        messages_collection.insert_one(user_message)
        
        # Save AI response with model information
        ai_message = {
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": ai_response,
            "timestamp": datetime.utcnow(),
            "model_used": model_used  # Store which model was used
        }
        message_result = messages_collection.insert_one(ai_message)
        message_id = str(message_result.inserted_id)
        
        # Update conversation timestamp
        conversations_collection.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"updated_at": datetime.utcnow()}}
        )
        
        return ChatResponse(
            response=ai_response,
            conversation_id=conversation_id,
            message_id=message_id,
            model_used=model_used
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations")
async def get_conversations():
    try:
        conversations_collection = get_collection("conversations")
        conversations = list(conversations_collection.find().sort("updated_at", -1))
        
        # Convert ObjectId to string for JSON serialization
        for conv in conversations:
            conv["_id"] = str(conv["_id"])
        
        return conversations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str):
    try:
        messages_collection = get_collection("messages")
        messages = list(messages_collection.find(
            {"conversation_id": conversation_id}
        ).sort("timestamp", 1))
        
        # Convert ObjectId to string
        for msg in messages:
            msg["_id"] = str(msg["_id"])
        
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    try:
        conversations_collection = get_collection("conversations")
        messages_collection = get_collection("messages")
        
        # Delete conversation
        conv_result = conversations_collection.delete_one(
            {"_id": ObjectId(conversation_id)}
        )
        
        # Delete all messages in conversation
        messages_collection.delete_many(
            {"conversation_id": conversation_id}
        )
        
        if conv_result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
            
        return {"message": "Conversation deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/conversations")
async def delete_all_conversations():
    """Delete all conversations and their messages"""
    try:
        conversations_collection = get_collection("conversations")
        messages_collection = get_collection("messages")
        
        # Delete all conversations
        conv_result = conversations_collection.delete_many({})
        
        # Delete all messages
        messages_collection.delete_many({})
        
        return {
            "message": "All conversations deleted successfully",
            "deleted_count": conv_result.deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/search/{query}")
async def search_conversations(query: str):
    """Search conversations by title or content"""
    try:
        conversations_collection = get_collection("conversations")
        messages_collection = get_collection("messages")
        
        # Search in conversation titles
        title_matches = list(conversations_collection.find(
            {"title": {"$regex": query, "$options": "i"}}
        ).sort("updated_at", -1))
        
        # Search in message content
        message_matches = list(messages_collection.find(
            {"content": {"$regex": query, "$options": "i"}}
        ))
        
        # Get unique conversation IDs from message matches
        conv_ids_from_messages = list(set([
            msg["conversation_id"] for msg in message_matches
        ]))
        
        # Get conversations from message matches
        content_matches = []
        if conv_ids_from_messages:
            content_matches = list(conversations_collection.find(
                {"_id": {"$in": [ObjectId(cid) for cid in conv_ids_from_messages if ObjectId.is_valid(cid)]}}
            ).sort("updated_at", -1))
        
        # Combine and deduplicate results
        all_conversations = {str(conv["_id"]): conv for conv in title_matches}
        for conv in content_matches:
            all_conversations[str(conv["_id"])] = conv
        
        # Convert to list and format
        results = list(all_conversations.values())
        for conv in results:
            conv["_id"] = str(conv["_id"])
        
        # Sort by updated_at
        results.sort(key=lambda x: x.get("updated_at", datetime.min), reverse=True)
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))