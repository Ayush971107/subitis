# Client-Server Architecture for Emergency Dispatch

## ✅ Updated Architecture (Cleaner Approach)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend 1    │    │   Frontend 2    │    │   Frontend 3    │
│  (Dispatcher)   │    │  (Field Unit)   │    │   (Supervisor)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────────┐
                    │ main_websocket_server│
                    │     (port 8765)     │ ← Main distribution hub
                    │                     │
                    │ • Handles all clients│
                    │ • Distributes events │
                    │ • Client-to-client   │
                    └─────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
     ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
     │   buffer2.py    │ │ Audio Transcr.  │ │ Other Services  │
     │ (AI Processor)  │ │   Service       │ │                 │
     │                 │ │                 │ │                 │
     │ • Processes     │ │ • Sends interim │ │ • Status feeds  │
     │   transcriptions│ │   transcriptions│ │ • External APIs │
     │ • Generates AI  │ │ • Real-time ASR │ │                 │
     │   suggestions   │ │                 │ │                 │
     └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 🔄 Message Flow

### 1. **Audio Transcription → AI Processing**
```
Audio Service → main_websocket_server → buffer2.py
                     ↓
               (interim-transcription events)
```

### 2. **AI Suggestions → All Clients**
```
buffer2.py → main_websocket_server → All Frontend Clients
                     ↓
              (suggestions_update events)
```

### 3. **Client-to-Client Communication**
```
Frontend A → main_websocket_server → Frontend B, C, D...
                     ↓
               (client_message events)
```

## 🚀 Setup Instructions

### 1. Start the Main WebSocket Server
```bash
python main_websocket_server.py
```
**Serves on:** `ws://localhost:8765`

### 2. Update Your Frontend
Change your WebSocket URL to:
```typescript
const url = 'ws://localhost:8765'  // Connect to main server
```

### 3. Start the AI Buffer Processor
```bash
python buffer2.py
```
**Connects to:** Both `localhost:8765` (for output) and ngrok URL (for input)

### 4. Configure Audio Transcription Service
Point your audio service to also connect to:
```
ws://localhost:8765
```

## 📨 Event Types

### **From AI Buffer (buffer2.py)**
```json
{
  "event": "suggestions_update",
  "data": {
    "role": "assistant",
    "summary": ["Key point 1", "Key point 2"],
    "advice": "Recommended action...",
    "processed_dialogue": [["caller", "Help needed"], ["dispatcher", "Units dispatched"]],
    "worker_id": "worker-0",
    "source": "ai_buffer_processor"
  }
}
```

### **From Audio Service**
```json
{
  "event": "interim-transcription",
  "text": "Unit 23 is en route to...",
  "metadata": {
    "role": "dispatcher",
    "timestamp": "1234567890",
    "sequenceNumber": 42
  }
}
```

### **Client-to-Client Messages**
```json
{
  "event": "client_message", 
  "data": {
    "message": "Status update: All units deployed",
    "from": "192.168.1.100:54321",
    "timestamp": 1703123456.789
  }
}
```

### **Status Updates**
```json
{
  "event": "status_update",
  "data": {
    "unit_id": "Unit_23",
    "status": "en_route", 
    "location": "Main St & 1st Ave"
  }
}
```

## ✨ Benefits of This Architecture

1. **🎯 Single Source of Truth** - Main server handles all distribution
2. **🔄 Simple Event Flow** - Clear path: source → server → clients
3. **📡 Efficient Broadcasting** - Server handles all client management
4. **🛠️ Easy to Extend** - Add new services as clients
5. **🔌 Decoupled Services** - Each service has single responsibility
6. **🐛 Easier Debugging** - All traffic flows through one hub

## 🔧 Frontend Usage

```typescript
// Your existing useWebSocket hook works perfectly!
const { sendMessage } = useWebSocket({
  url: 'ws://localhost:8765',
  onMessage: (message) => {
    if (message.event === 'suggestions_update') {
      // Handle AI suggestions
      console.log('AI Advice:', message.data.advice);
    } else if (message.event === 'client_message') {
      // Handle messages from other clients
      console.log('Message from:', message.data.from);
    }
  }
});

// Send message to all other clients
sendMessage({
  event: "client_message",
  data: { message: "Emergency situation in progress" }
});

// Send status update
sendMessage({
  event: "status_update", 
  data: { unit: "Unit_45", status: "arrived_on_scene" }
});
```

The main server now acts as the central distribution hub that:
- ✅ **Receives AI suggestions** from buffer2.py
- ✅ **Distributes them** to all frontend clients  
- ✅ **Enables client-to-client** communication
- ✅ **Handles connection management** automatically
