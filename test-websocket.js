const WebSocket = require('ws');

console.log('🔌 Testing WebSocket connection to Render...');

const ws = new WebSocket('wss://rpg-chat-mfru.onrender.com');

ws.on('open', () => {
  console.log('✅ WebSocket connected successfully!');
  console.log('🎉 Render DOES support WebSockets!');
  
  // Send a test message
  ws.send(JSON.stringify({
    type: 'joinGame',
    name: 'test-user',
    avatar: 'character_1',
    x: 100,
    y: 150,
    color: '#ff0000'
  }));
  
  // Close after 2 seconds
  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 2000);
});

ws.on('message', (data) => {
  console.log('📥 Received message:', data.toString());
});

ws.on('error', (error) => {
  console.log('❌ WebSocket error:', error.message);
  process.exit(1);
});

ws.on('close', (code) => {
  console.log('🔌 WebSocket closed with code:', code);
});
