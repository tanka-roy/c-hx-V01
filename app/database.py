# app/database.py
import pymongo
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "chatbot_db")

client = None
db = None

async def init_db():
    global client, db
    try:
        client = pymongo.MongoClient(MONGODB_URI)
        # Test the connection
        client.admin.command('ping')
        db = client[DATABASE_NAME]
        print("Connected to MongoDB successfully!")
        
        # Create collections if they don't exist
        if "conversations" not in db.list_collection_names():
            db.create_collection("conversations")
            db.conversations.create_index([("timestamp", pymongo.DESCENDING)])
        
        if "messages" not in db.list_collection_names():
            db.create_collection("messages")
            db.messages.create_index([("conversation_id", pymongo.ASCENDING)])
            db.messages.create_index([("timestamp", pymongo.DESCENDING)])
            
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        raise

def get_db():
    return db

def get_collection(collection_name):
    return db[collection_name]