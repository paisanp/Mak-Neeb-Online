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
registerSocketHandlers(io, rooms);
const port = Number(process.env.PORT) || 3000;
if (require.main === module) server.listen(port, () => console.log(`Mak Neeb Online: http://localhost:${port}`));
module.exports = { app, server, io, rooms };
