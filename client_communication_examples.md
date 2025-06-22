# Client-to-Client Communication Patterns

Your updated `buffer2.py` now supports multiple client-to-client communication patterns:

## 1. **Broadcast Pattern** (All clients)
```javascript
// Frontend sends message to all clients
websocket.send(JSON.stringify({
  event: "send_to_all",
  data: {
    message: "Emergency alert: All units respond"
  }
}));

// All other clients receive:
{
  event: "client_message",
  data: {
    from: "192.168.1.100:54321",
    message: "Emergency alert: All units respond", 
    broadcast: true
  }
}
```

## 2. **Room/Channel Pattern** (Targeted groups)
```javascript
// Client joins a room
websocket.send(JSON.stringify({
  event: "join_room",
  data: {
    room_name: "dispatch_center"
  }
}));

// Send message to room
websocket.send(JSON.stringify({
  event: "send_to_room",
  data: {
    room_name: "dispatch_center",
    message: "Unit 23 is en route to location"
  }
}));

// Only clients in "dispatch_center" room receive:
{
  event: "client_message",
  data: {
    from: "192.168.1.101:12345",
    message: "Unit 23 is en route to location",
    room: "dispatch_center"
  }
}
```

## 3. **Management Commands**
```javascript
// List all rooms and their client counts
websocket.send(JSON.stringify({
  event: "list_rooms"
}));
// Response: { event: "rooms_list", data: { rooms: { "dispatch_center": 3, "field_ops": 5 } } }

// List all connected clients
websocket.send(JSON.stringify({
  event: "list_clients"  
}));
// Response: { event: "clients_list", data: { clients: [{ address: "...", room: "..." }] } }

// Leave current room
websocket.send(JSON.stringify({
  event: "leave_room"
}));
```

## 4. **Updated Frontend Hook**

Update your frontend to connect to the local server:

```typescript
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = 'ws://localhost:8765', // Updated to local server
    onMessage,
    onOpen,
    onClose,
    onError,
  } = options
  
  // ... rest of your hook code

  const joinRoom = (roomName: string) => {
    sendMessage({
      event: "join_room",
      data: { room_name: roomName }
    });
  };

  const sendToRoom = (roomName: string, message: any) => {
    sendMessage({
      event: "send_to_room", 
      data: { room_name: roomName, message }
    });
  };

  const sendToAll = (message: any) => {
    sendMessage({
      event: "send_to_all",
      data: { message }
    });
  };

  return {
    isConnected,
    error,
    sendMessage,
    joinRoom,
    sendToRoom, 
    sendToAll,
  }
}
```

## 5. **Usage Examples**

### Emergency Dispatch System
```javascript
// Dispatcher joins dispatch room
joinRoom("dispatch_center");

// Send status update to all dispatchers
sendToRoom("dispatch_center", {
  type: "status_update",
  unit: "Unit 23",
  status: "en_route",
  location: "Main St & 1st Ave"
});

// Emergency broadcast to all connected clients
sendToAll({
  type: "emergency_alert", 
  priority: "high",
  message: "Multi-vehicle accident on Highway 101"
});
```

### Field Operations
```javascript
// Field units join field operations room
joinRoom("field_ops");

// Share location updates within field ops
sendToRoom("field_ops", {
  type: "location_update",
  unit_id: "Unit_45",
  coordinates: [37.7749, -122.4194],
  timestamp: Date.now()
});
```

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend 1    │    │   Frontend 2    │    │   Frontend 3    │
│  (Dispatcher)   │    │  (Field Unit)   │    │   (Supervisor)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────────┐
                    │   buffer2.py        │
                    │   WebSocket Server  │
                    │                     │
                    │  ┌─────────────────┐│
                    │  │ Room Management ││
                    │  │ - dispatch_ctr  ││  
                    │  │ - field_ops     ││
                    │  │ - supervisors   ││
                    │  └─────────────────┘│
                    └─────────────────────┘
                                 │
                    ┌─────────────────────┐
                    │   Source WebSocket  │
                    │   (ngrok/external)  │ 
                    │  Audio Transcription│
                    └─────────────────────┘
```

The server now acts as a central hub that:
1. **Receives audio transcriptions** from external source
2. **Processes them** through your AI agent
3. **Broadcasts AI suggestions** to all/specific clients
4. **Facilitates client-to-client** communication via rooms
5. **Manages connections** and room membership

Start the server with: `python buffer2.py`
