const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Allow Socket.IO connections from any origin (Amplify, Render, localhost)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory conversation store (per pair of users)
// NOTE: This is not permanent storage; data is lost if the server restarts.
// conversations: Map<conversationId, { id, participants: [userA, userB], messages: [{ sender, text, createdAt }] }>
const conversations = new Map();

function getConversationId(userA, userB) {
  const a = String(userA || '').trim().toLowerCase();
  const b = String(userB || '').trim().toLowerCase();
  if (!a || !b) return null;
  const sorted = [a, b].sort();
  return `${sorted[0]}::${sorted[1]}`;
}

function ensureConversation(currentUser, otherUser) {
  const id = getConversationId(currentUser, otherUser);
  if (!id) return null;
  if (!conversations.has(id)) {
    conversations.set(id, {
      id,
      participants: [currentUser, otherUser],
      messages: []
    });
  }
  return conversations.get(id);
}

// Serve all static files (HTML, CSS, JS, images) from this folder
app.use(express.static(__dirname));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join conversation', (payload) => {
    const { currentUser, otherUser } = payload || {};
    const convo = ensureConversation(currentUser, otherUser);
    if (!convo) {
      return;
    }

    socket.join(convo.id);
    socket.data.currentUser = currentUser;
    socket.data.currentConversationId = convo.id;

    socket.emit('conversation joined', {
      conversationId: convo.id,
      otherUser,
      messages: convo.messages
    });
  });

  socket.on('chat message', (data) => {
    const { conversationId, user, text } = data || {};
    if (!conversationId || !text || !user) return;

    const convo = conversations.get(conversationId);
    if (!convo) return;

    const message = {
      sender: user,
      text,
      createdAt: new Date().toISOString()
    };

    convo.messages.push(message);

    io.to(conversationId).emit('chat message', {
      conversationId,
      user: message.sender,
      text: message.text,
      createdAt: message.createdAt
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
});

