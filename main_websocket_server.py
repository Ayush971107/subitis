#!/usr/bin/env python3
"""
Main WebSocket Server for Emergency Dispatch System
Handles client connections and distributes AI-generated suggestions
"""

import asyncio
import json
import logging
import websockets
from typing import Set

# Configuration
SERVER_HOST = "localhost"
SERVER_PORT = 8765

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("main_server")

# Connected clients
connected_clients: Set[websockets.WebSocketServerProtocol] = set()

async def broadcast_to_all(message: str, exclude_client: websockets.WebSocketServerProtocol = None):
    """Send message to all connected clients"""
    if not connected_clients:
        logger.debug("No clients connected, dropping message")
        return
        
    disconnected = set()
    sent_count = 0
    
    for client in connected_clients:
        if client == exclude_client:
            continue
        try:
            await client.send(message)
            sent_count += 1
        except websockets.exceptions.ConnectionClosed:
            disconnected.add(client)
    
    # Clean up disconnected clients
    connected_clients -= disconnected
    
    if sent_count > 0:
        logger.info(f"📡 Broadcast sent to {sent_count} clients")

async def handle_client(websocket, path):
    """Handle individual client connections"""
    client_addr = websocket.remote_address
    connected_clients.add(websocket)
    logger.info(f"👤 Client connected: {client_addr} (Total: {len(connected_clients)})")
    
    try:
        # Send welcome message
        welcome = {
            "event": "connection_established",
            "data": {
                "message": "Connected to Emergency Dispatch Server",
                "client_id": f"{client_addr[0]}:{client_addr[1]}",
                "timestamp": asyncio.get_event_loop().time()
            }
        }
        await websocket.send(json.dumps(welcome))
        
        # Listen for messages from this client
        async for message in websocket:
            try:
                data = json.loads(message)
                event = data.get("event")
                payload = data.get("data", {})
                
                logger.info(f"📨 Received from {client_addr}: {event}")
                
                # Handle different event types
                if event == "suggestions_update":
                    # This comes from the AI buffer processor
                    source = payload.get("source")
                    if source == "ai_buffer_processor":
                        logger.info(f"🤖 AI suggestions received from buffer processor")
                        # Broadcast AI suggestions to all clients
                        await broadcast_to_all(message, exclude_client=websocket)
                    else:
                        logger.warning(f"Unknown suggestions_update source: {source}")
                
                elif event == "client_message":
                    # Client-to-client communication
                    relay_data = {
                        "event": "client_message",
                        "data": {
                            "from": f"{client_addr[0]}:{client_addr[1]}",
                            "message": payload.get("message"),
                            "timestamp": asyncio.get_event_loop().time()
                        }
                    }
                    await broadcast_to_all(json.dumps(relay_data), exclude_client=websocket)
                
                elif event == "status_update":
                    # Status updates (dispatcher actions, unit status, etc.)
                    status_data = {
                        "event": "status_update", 
                        "data": {
                            "from": f"{client_addr[0]}:{client_addr[1]}",
                            "status": payload,
                            "timestamp": asyncio.get_event_loop().time()
                        }
                    }
                    await broadcast_to_all(json.dumps(status_data), exclude_client=websocket)
                
                elif event == "ping":
                    # Heartbeat
                    pong = {"event": "pong", "data": {"timestamp": asyncio.get_event_loop().time()}}
                    await websocket.send(json.dumps(pong))
                
                else:
                    logger.warning(f"❓ Unknown event type: {event}")
                    
            except json.JSONDecodeError:
                logger.error(f"❌ Invalid JSON from {client_addr}: {message}")
                error_response = {
                    "event": "error",
                    "data": {"message": "Invalid JSON format"}
                }
                await websocket.send(json.dumps(error_response))
                
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"👤 Client disconnected: {client_addr}")
    except Exception as e:
        logger.error(f"❌ Error handling client {client_addr}: {e}")
    finally:
        connected_clients.discard(websocket)
        logger.info(f"👤 Client removed: {client_addr} (Total: {len(connected_clients)})")

async def main():
    """Start the WebSocket server"""
    logger.info(f"🚀 Starting Emergency Dispatch WebSocket Server on {SERVER_HOST}:{SERVER_PORT}")
    
    async with websockets.serve(handle_client, SERVER_HOST, SERVER_PORT):
        logger.info(f"✅ Server listening for connections...")
        logger.info(f"📋 Expected clients:")
        logger.info(f"   - Frontend clients (dispatchers, supervisors)")
        logger.info(f"   - AI Buffer Processor (buffer2.py)")
        logger.info(f"   - Audio transcription service")
        
        # Run forever
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Server error: {e}")
