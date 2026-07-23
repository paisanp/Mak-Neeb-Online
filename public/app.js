const $ = id => document.getElementById(id);
const service = SocketService;
const defaultTitle = 'หมากหนีบออนไลน์';
let room = null;
let myColor = null;
let pending = false;
let lastCaptured = [];
let previousTurn = null;
let toastTimer = null;
let waitingRooms = [];

const board = new GameBoard($('board'), (from, to) => {
  pending = true;
  render();
  service.send('make-move', { roomCode: room.roomCode, from, to });
});

function showToast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').classList.add('toast--visible');
  toastTimer = setTimeout(() => $('toast').classList.remove('toast--visible'), 2200);
}

function renderWaitingRooms() {
  $('waitingCount').textContent = `${waitingRooms.length} ห้อง`;
  $('waitingEmpty').classList.toggle('hidden', waitingRooms.length !== 0);
  $('waitingRooms').replaceChildren(...waitingRooms.map(waitingRoom => {
    const item = document.createElement('div');
    item.className = 'waiting-room';
    const info = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = waitingRoom.playerName;
    const code = document.createElement('small');
    code.textContent = `ห้อง ${waitingRoom.roomCode}`;
    info.append(name, code);
    const button = document.createElement('button');
    button.textContent = 'เข้าร่วม';
    button.onclick = () => {
      const playerName = $('playerName').value.trim();
      if (!playerName) {
        $('lobbyMessage').textContent = 'กรุณากรอกชื่อก่อนเข้าร่วมห้อง';
        $('playerName').focus();
        return;
      }
      service.send('join-room', { playerName, roomCode: waitingRoom.roomCode });
    };
    item.append(info, button);
    return item;
  }));
}

function currentPlayer() {
  return room?.players.find(player => player.color === myColor) || null;
}

function getGameStatusView(gameState, player) {
  if (!gameState || !player) return { type: 'loading', icon: '⌛', title: 'กำลังโหลดเกม', subtitle: 'กรุณารอสักครู่' };
  if (!player.connected) return { type: 'disconnected', icon: '!', title: 'การเชื่อมต่อมีปัญหา', subtitle: 'กำลังเชื่อมต่อใหม่' };
  const disconnectedOpponent = gameState.players.find(item => item.color !== player.color && !item.connected);
  if (disconnectedOpponent) return { type: 'disconnected', icon: '!', title: 'คู่แข่งหลุดการเชื่อมต่อ', subtitle: `กำลังรอ ${disconnectedOpponent.playerName} กลับเข้าสู่เกม` };
  if (gameState.status === 'waiting') return { type: 'waiting', icon: '⌛', title: 'กำลังรอผู้เล่นอีกคน', subtitle: 'ส่งรหัสห้องให้เพื่อนเพื่อเริ่มเกม' };
  if (gameState.status === 'finished') {
    const winnerColor = gameState.winner?.color;
    const won = winnerColor === player.color;
    return { type: won ? 'win' : 'finished', icon: won ? '★' : '■', title: won ? 'คุณชนะ!' : 'เกมจบแล้ว', subtitle: gameState.winner?.reason || 'กดขอเล่นใหม่เพื่อแข่งอีกครั้ง' };
  }
  if (gameState.currentTurn === player.color) return { type: 'my-turn', icon: '▶', title: 'ถึงตาคุณแล้ว', subtitle: pending ? 'กำลังตรวจสอบการเดิน…' : 'เลือกหมากเพื่อเดิน' };
  const activePlayer = gameState.players.find(item => item.color === gameState.currentTurn);
  return { type: 'opponent-turn', icon: 'spinner', title: 'รอคู่แข่งเดิน', subtitle: `กำลังเป็นตาของ ${activePlayer?.playerName || 'คู่แข่ง'}` };
}

function handleTurnChanged(player) {
  if (!room || !player || room.status !== 'playing') { previousTurn = room?.currentTurn || null; document.title = defaultTitle; return; }
  const isNowMyTurn = room.currentTurn === player.color;
  const wasMyTurn = previousTurn === player.color;
  if (isNowMyTurn && !wasMyTurn) { showToast('ถึงตาคุณแล้ว'); document.title = `ถึงตาคุณแล้ว — ${defaultTitle}`; }
  else if (!isNowMyTurn) document.title = defaultTitle;
  previousTurn = room.currentTurn;
}

function renderPlayers() {
  $('players').replaceChildren(...room.players.map(player => {
    const card = document.createElement('div');
    const isActive = room.status === 'playing' && player.color === room.currentTurn;
    card.className = `player player-card${isActive ? ' player-card--active' : ''}`;
    const icon = document.createElement('span');
    icon.className = `piece-mini player-piece ${player.color}`;
    const info = document.createElement('div');
    info.className = 'player-card__info';
    const name = document.createElement('strong');
    name.className = 'player-card__name';
    name.textContent = `${player.playerName}${player.color === myColor ? ' (คุณ)' : ''}`;
    const detail = document.createElement('small');
    detail.className = 'player-card__status';
    detail.textContent = !player.connected ? 'ออฟไลน์' : isActive ? 'กำลังเดิน' : player.color === 'black' ? 'หมากดำ' : 'หมากขาว';
    info.append(name, detail); card.append(icon, info); return card;
  }));
}

function renderStatus(view) {
  $('turnBanner').className = `turn-banner turn-banner--${view.type}`;
  $('turnIcon').replaceChildren();
  if (view.icon === 'spinner') { const spinner = document.createElement('span'); spinner.className = 'turn-banner__spinner'; $('turnIcon').append(spinner); }
  else $('turnIcon').textContent = view.icon;
  $('turnTitle').textContent = view.title;
  $('turnSubtitle').textContent = view.subtitle;
  $('status').textContent = view.title;
}

function render() {
  if (!room) return;
  const me = currentPlayer();
  const isMyTurn = room.status === 'playing' && room.currentTurn === myColor && me?.connected && !pending;
  $('roomCode').textContent = room.roomCode;
  renderPlayers();
  renderStatus(getGameStatusView(room, me));
  const blackPlayer = room.players.find(player => player.color === 'black');
  const whitePlayer = room.players.find(player => player.color === 'white');
  $('blackScoreName').textContent = blackPlayer?.playerName || 'ฝ่ายดำ';
  $('whiteScoreName').textContent = whitePlayer?.playerName || 'ฝ่ายขาว';
  $('blackScore').textContent = room.scores?.black || 0;
  $('whiteScore').textContent = room.scores?.white || 0;
  $('roundNumber').textContent = `รอบ ${room.round || 1}`;
  $('blackCount').textContent = room.board.flat().filter(cell => cell === 'black').length;
  $('whiteCount').textContent = room.board.flat().filter(cell => cell === 'white').length;
  $('rematchBtn').classList.toggle('hidden', room.status !== 'finished');
  $('resignBtn').disabled = room.status !== 'playing';
  $('board').classList.toggle('game-board--disabled', !isMyTurn);
  board.render(room, myColor, !isMyTurn, lastCaptured);
  lastCaptured = [];
  handleTurnChanged(me);
}

function store(code, token) { localStorage.setItem('makNeebSession', JSON.stringify({ roomCode: code, playerToken: token })); }
function enter(data, captured = []) { room = data.room || data; lastCaptured = captured; const me = room.players.find(player => player.socketId === service.socket.id); if (me) myColor = me.color; $('lobby').classList.add('hidden'); $('game').classList.remove('hidden'); render(); }
function showError(payload) { pending = false; $('message').textContent = payload.message; $('lobbyMessage').textContent = payload.message; showToast(payload.message); render(); }

$('boardWrap').addEventListener('click', event => { if ($('board').classList.contains('game-board--disabled') && event.target.closest('.board')) showToast(room?.status === 'playing' ? 'กรุณารอคู่แข่งเดิน' : 'เกมยังไม่พร้อมให้เดิน'); });
$('createBtn').onclick = () => service.send('create-room', { playerName: $('playerName').value });
$('joinBtn').onclick = () => service.send('join-room', { playerName: $('playerName').value, roomCode: $('roomInput').value.toUpperCase() });
$('copyBtn').onclick = async () => { await navigator.clipboard.writeText(room.roomCode); $('copyBtn').textContent = 'คัดลอกแล้ว'; setTimeout(() => { $('copyBtn').textContent = 'คัดลอกรหัส'; }, 1200); };
$('resignBtn').onclick = () => service.send('resign-game', { roomCode: room.roomCode });
function rematch() { service.send('request-rematch', { roomCode: room.roomCode }); $('resultModal').close(); }
$('rematchBtn').onclick = rematch; $('modalRematch').onclick = rematch;
$('leaveBtn').onclick = () => { service.send('leave-room', { roomCode: room.roomCode }); localStorage.removeItem('makNeebSession'); location.reload(); };
$('closeModal').onclick = () => $('resultModal').close();
service.on('connect', () => { $('connection').textContent = '● เชื่อมต่อแล้ว'; try { const saved = JSON.parse(localStorage.getItem('makNeebSession')); if (saved) service.send('reconnect-room', saved); } catch {} });
service.on('disconnect', () => { $('connection').textContent = '● ขาดการเชื่อมต่อ'; showToast('การเชื่อมต่อมีปัญหา'); });
service.on('waiting-rooms-updated', payload => {
  if (!payload.success) return;
  waitingRooms = payload.data.rooms || [];
  renderWaitingRooms();
});
['room-created', 'room-joined'].forEach(event => service.on(event, payload => { if (payload.success) { store(payload.data.room.roomCode, payload.data.playerToken); enter(payload.data); } }));
['game-started', 'room-updated', 'move-accepted', 'rematch-started', 'player-disconnected', 'player-reconnected'].forEach(event => service.on(event, payload => { pending = false; if (payload.success) enter(payload.data.room || payload.data, payload.data.captured || []); }));
['room-error', 'invalid-move'].forEach(event => service.on(event, showError));
service.on('game-over', payload => { pending = false; if (!payload.success) return; enter(payload.data, payload.data.captured || []); const winner = payload.data.winner || room.winner; const player = room.players.find(item => item.color === winner?.color); $('resultTitle').textContent = player ? `${player.playerName} ชนะ!` : 'เกมจบ'; $('resultReason').textContent = winner?.reason || ''; $('resultModal').showModal(); });
