const crypto = require('crypto');
const { createInitialBoard } = require('./gameLogic');

class RoomManager {
  constructor({ maxIdleMs = 30 * 60 * 1000 } = {}) { this.rooms = new Map(); this.maxIdleMs = maxIdleMs; }
  code() { let code; do { code = crypto.randomBytes(5).toString('base64url').replace(/[-_]/g, '').slice(0, 6).toUpperCase(); } while (code.length !== 6 || this.rooms.has(code)); return code; }
  create(playerName, socketId) {
    const roomCode = this.code();
    const token = crypto.randomBytes(16).toString('hex');
    const room = { roomCode, players: [{ socketId, playerName, color: 'black', connected: true, token }], board: createInitialBoard(), currentTurn: 'black', status: 'waiting', winner: null, rematchVotes: new Set(), createdAt: Date.now(), updatedAt: Date.now() };
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
  remove(roomCode, socketId) { const room = this.rooms.get(roomCode); if (!room) return null; room.players = room.players.filter(p => p.socketId !== socketId); if (!room.players.length) this.rooms.delete(roomCode); else { room.status = 'waiting'; room.updatedAt = Date.now(); } return room; }
  cleanup(now = Date.now()) { for (const [code, room] of this.rooms) if (now - room.updatedAt > this.maxIdleMs) this.rooms.delete(code); }
}
module.exports = RoomManager;
