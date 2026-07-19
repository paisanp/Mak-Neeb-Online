const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const RoomManager = require('./src/roomManager');
const registerSocketHandlers = require('./src/socketHandlers');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const rooms = new RoomManager();
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (req, res) => {
  res.json({ success: true });
});
registerSocketHandlers(io, rooms);
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));
}
module.exports = { app, server, io, rooms };
