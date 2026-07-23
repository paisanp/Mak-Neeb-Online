const crypto = require('crypto');
const { createInitialBoard } = require('./gameLogic');

class RoomManager {
  constructor({ maxIdleMs = 30 * 60 * 1000 } = {}) { this.rooms = new Map(); this.maxIdleMs = maxIdleMs; }
  code() { let code; do { code = crypto.randomInt(0, 100000).toString().padStart(5, '0'); } while (this.rooms.has(code)); return code; }
  create(playerName, socketId) {
    const roomCode = this.code();
    const token = crypto.randomBytes(16).toString('hex');
    const room = { roomCode, players: [{ socketId, playerName, color: 'black', connected: true, token }], board: createInitialBoard(), currentTurn: 'black', status: 'waiting', winner: null, lastMove: null, scores: { black: 0, white: 0 }, round: 1, rematchVotes: new Set(), createdAt: Date.now(), updatedAt: Date.now() };
    this.rooms.set(roomCode, room); return { room, token };
  }
  join(roomCode, playerName, socketId) {
    const room = this.rooms.get(roomCode);
    if (!room) throw Object.assign(new Error('ไม่พบห้องนี้'), { code: 'ROOM_NOT_FOUND' });
    if (room.players.length >= 2) throw Object.assign(new Error('ห้องเต็มแล้ว'), { code: 'ROOM_FULL' });
    const token = crypto.randomBytes(16).toString('hex');
    room.players.push({ socketId, playerName, color: 'white', connected: true, token }); room.status = 'playing'; room.updatedAt = Date.now(); return { room, token };
  }
  reconnect(roomCode, token, socketId) { const room = this.rooms.get(roomCode); const player = room?.players.find(p => p.token === token); if (!player) return null; player.socketId = socketId; player.connected = true; room.updatedAt = Date.now(); return { room, player }; }
  player(room, socketId) { return room?.players.find(p => p.socketId === socketId); }
  public(room) { return { ...room, players: room.players.map(({ token, ...p }) => p), rematchVotes: room.rematchVotes.size }; }
  waiting() {
    return [...this.rooms.values()]
      .filter(room => room.status === 'waiting' && room.players.length === 1 && room.players[0].connected)
      .map(room => ({ roomCode: room.roomCode, playerName: room.players[0].playerName, createdAt: room.createdAt }))
      .sort((a, b) => a.createdAt - b.createdAt);
  }
  remove(roomCode, socketId) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    room.players = room.players.filter(p => p.socketId !== socketId);
    if (!room.players.length) this.rooms.delete(roomCode);
    else {
      room.players[0].color = 'black';
      room.board = createInitialBoard();
      room.currentTurn = 'black';
      room.status = 'waiting';
      room.winner = null;
      room.lastMove = null;
      room.scores = { black: 0, white: 0 };
      room.round = 1;
      room.rematchVotes.clear();
      room.updatedAt = Date.now();
    }
    return room;
  }
  cleanup(now = Date.now()) { for (const [code, room] of this.rooms) if (now - room.updatedAt > this.maxIdleMs) this.rooms.delete(code); }
}
module.exports = RoomManager;
