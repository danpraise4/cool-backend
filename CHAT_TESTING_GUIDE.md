# Socket.IO Chat Testing Guide

## Overview
This guide explains how to test the Socket.IO chat functionality using the updated test client.

## Test Client Features

The updated test client (`socket-test-client.html`) now includes:

1. **User ID Input**: Your user identifier
2. **Destination User ID**: The user you want to chat with
3. **Room ID**: Single field for room ID (generated or manual)
4. **Real-time State Display**: Shows current connection and room parameters
5. **Chat-specific Events**: Proper handling of chat join, message sending, etc.
6. **Flexible Room Testing**: Works with any room ID format

## How to Test Chat Functionality

### Step 1: Start Your Server
```bash
npm run dev
```

### Step 2: Open Test Client
Open `socket-test-client.html` in your browser.

### Step 3: Configure Room Parameters

#### Option 1: Generate Room ID
1. **Server URL**: `http://localhost:8080` (or your server URL)
2. **User ID**: Enter your user ID (e.g., `user123`)
3. **Destination User ID**: Enter the destination user ID (e.g., `user456`)
4. **Generate Room ID**: Click "Generate" to create a unique room ID

#### Option 2: Manual Room ID
1. **Server URL**: `http://localhost:8080` (or your server URL)
2. **Room ID**: Enter any room ID directly (e.g., `my-room`, `test-123`, `chat-room`)
3. **User ID**: Enter your user ID (optional)

### Step 4: Connect and Test
1. Click **"Connect"** to establish socket connection
2. Click **"Join Room"** to join the room
3. Type a message and click **"Send Message"**

## Room ID Generation

The room ID is generated using the same logic as your backend:
- Takes two user IDs (sorted alphabetically)
- Combines them with a pipe separator
- Generates a hash and takes the first 8 characters

Example:
- User IDs: `user123` and `user456`
- Sorted: `user123|user456`
- Generated Room ID: `a1b2c3d4`

## Testing Scenarios

### Scenario 1: Two Users Chatting
1. Open two browser tabs with the test client
2. Tab 1: User ID = `user1`, Destination = `user2`
3. Tab 2: User ID = `user2`, Destination = `user1`
4. Both generate the same Chat ID
5. Both connect and join the chat
6. Send messages between the two tabs

### Scenario 2: Anonymous Users
1. Leave User ID empty (will be auto-generated as `anonymous_socketId`)
2. Enter a destination user ID
3. Generate Chat ID and test messaging

### Scenario 3: Custom Room Testing
1. Open two browser tabs with the test client
2. Tab 1: Room ID = `test-room-1`
3. Tab 2: Room ID = `test-room-1` (same room)
4. Both connect and join the room
5. Send messages between the two tabs

### Scenario 4: External Client Testing
1. Use the test client from a different machine/network
2. Update the Server URL to your production server
3. Test connection and chat functionality

## Expected Events

When testing, you should see these events in the log:

- `📨 Connection message`: Initial connection confirmation
- `🚪 Room joined`: Successfully joined chat room
- `👤 User joined chat`: Another user joined the chat
- `💬 Chat message`: Received chat messages
- `🧪 Connection test`: Connection test responses

## Troubleshooting

### Connection Issues
- Check server URL is correct
- Ensure server is running
- Check browser console for errors
- Verify CORS settings

### Chat Issues
- Ensure Chat ID is generated/entered
- Check that both users have the same Chat ID
- Verify user IDs are valid
- Check server logs for errors

### Message Delivery Issues
- Ensure both users are connected
- Check that both users joined the same chat
- Verify socket events are being emitted correctly

## Server-Side Verification

Check your server logs for:
- Socket connection events
- Chat join events
- Message sending events
- Redis operations (user socket mapping)

## Production Considerations

For production deployment:
1. Update CORS origin to your specific domain
2. Implement proper authentication
3. Add rate limiting for chat messages
4. Monitor connection statistics
5. Set up proper error handling and logging

## API Endpoints for Chat

Your backend also has REST API endpoints for chat:
- `POST /api/v1/recycle/chats/initiate` - Initiate a chat
- `GET /api/v1/recycle/chats/:id` - Get chat by ID
- `POST /api/v1/recycle/admin/chats/initiate` - Admin initiate chat

These can be used in conjunction with the Socket.IO functionality for a complete chat system.
