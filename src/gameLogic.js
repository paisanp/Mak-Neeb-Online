const SIZE = 8;
const COLORS = ['black', 'white'];
const DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function createInitialBoard() {
  return Array.from({ length: SIZE }, (_, row) => Array.from({ length: SIZE }, () => row === 0 ? 'black' : row === SIZE - 1 ? 'white' : null));
}
function isInsideBoard(row, col) { return Number.isInteger(row) && Number.isInteger(col) && row >= 0 && row < SIZE && col >= 0 && col < SIZE; }
function isPosition(value) { return Boolean(value) && isInsideBoard(value.row, value.col); }
function getOpponentColor(color) { return color === 'black' ? 'white' : 'black'; }

function isPathClear(board, from, to) {
  if (!isPosition(from) || !isPosition(to) || (from.row !== to.row && from.col !== to.col) || (from.row === to.row && from.col === to.col)) return false;
  const dr = Math.sign(to.row - from.row), dc = Math.sign(to.col - from.col);
  let row = from.row + dr, col = from.col + dc;
  while (row !== to.row || col !== to.col) {
    if (board[row][col] !== null) return false;
    row += dr; col += dc;
  }
  return true;
}

function validateMove(board, color, from, to) {
  if (!COLORS.includes(color) || !isPosition(from) || !isPosition(to)) return { valid: false, message: 'ตำแหน่งอยู่นอกกระดาน' };
  if (from.row === to.row && from.col === to.col) return { valid: false, message: 'ต้องเลือกช่องปลายทางอื่น' };
  if (board[from.row][from.col] !== color) return { valid: false, message: 'ต้องเลือกหมากของคุณเอง' };
  if (board[to.row][to.col] !== null) return { valid: false, message: 'ช่องปลายทางไม่ว่าง' };
  if (from.row !== to.row && from.col !== to.col) return { valid: false, message: 'เดินได้เฉพาะแนวตั้งหรือแนวนอน' };
  if (!isPathClear(board, from, to)) return { valid: false, message: 'ไม่สามารถเดินข้ามหมากได้' };
  return { valid: true };
}

function findSandwichCaptures(board, movedPosition, color) {
  const opponent = getOpponentColor(color), captures = [];
  for (const [dr, dc] of DIRECTIONS) {
    let row = movedPosition.row + dr, col = movedPosition.col + dc;
    const candidates = [];
    while (isInsideBoard(row, col) && board[row][col] === opponent) { candidates.push({ row, col }); row += dr; col += dc; }
    if (candidates.length && isInsideBoard(row, col) && board[row][col] === color) captures.push(...candidates);
  }
  return captures;
}

function findInsertCaptures(board, movedPosition, color) {
  const opponent = getOpponentColor(color), captures = [];
  const pairs = [[[0, -1], [0, 1]], [[-1, 0], [1, 0]]];
  for (const [[dr1, dc1], [dr2, dc2]] of pairs) {
    const first = { row: movedPosition.row + dr1, col: movedPosition.col + dc1 };
    const second = { row: movedPosition.row + dr2, col: movedPosition.col + dc2 };
    if (isPosition(first) && isPosition(second) && board[first.row][first.col] === opponent && board[second.row][second.col] === opponent) captures.push(first, second);
  }
  return captures;
}

function findOuterCaptures(board, movedPosition, color) {
  const opponent = getOpponentColor(color), captures = [];
  const axes = [[0, 1], [1, 0]];
  for (const [dr, dc] of axes) {
    let firstRow = movedPosition.row, firstCol = movedPosition.col;
    let lastRow = movedPosition.row, lastCol = movedPosition.col;
    while (isInsideBoard(firstRow - dr, firstCol - dc) && board[firstRow - dr][firstCol - dc] === color) {
      firstRow -= dr;
      firstCol -= dc;
    }
    while (isInsideBoard(lastRow + dr, lastCol + dc) && board[lastRow + dr][lastCol + dc] === color) {
      lastRow += dr;
      lastCol += dc;
    }
    const before = { row: firstRow - dr, col: firstCol - dc };
    const after = { row: lastRow + dr, col: lastCol + dc };
    if (isPosition(before) && isPosition(after)
      && board[before.row][before.col] === opponent
      && board[after.row][after.col] === opponent) {
      captures.push(before, after);
    }
  }
  return captures;
}

function calculateCapturedPieces(board, movedPosition, color) {
  const captures = [
    ...findSandwichCaptures(board, movedPosition, color),
    ...findInsertCaptures(board, movedPosition, color),
    ...findOuterCaptures(board, movedPosition, color)
  ];
  return [...new Map(captures.map(position => [`${position.row},${position.col}`, position])).values()];
}

function applyMove(board, color, from, to) {
  const validation = validateMove(board, color, from, to);
  if (!validation.valid) return validation;
  const next = board.map(row => row.slice());
  next[from.row][from.col] = null; next[to.row][to.col] = color;
  const captured = calculateCapturedPieces(next, to, color);
  captured.forEach(({ row, col }) => { next[row][col] = null; });
  return { valid: true, board: next, captured };
}
function countPieces(board, color) { return board.flat().filter(cell => cell === color).length; }
function hasAnyValidMove(board, color) {
  for (let row = 0; row < SIZE; row++) for (let col = 0; col < SIZE; col++) if (board[row][col] === color && DIRECTIONS.some(([dr, dc]) => isInsideBoard(row + dr, col + dc) && board[row + dr][col + dc] === null)) return true;
  return false;
}
function checkWinner(board, nextColor) {
  const winner = getOpponentColor(nextColor);
  if (countPieces(board, nextColor) === 0) return { color: winner, reason: 'กินหมากฝ่ายตรงข้ามหมด' };
  if (!hasAnyValidMove(board, nextColor)) return { color: winner, reason: 'ฝ่ายตรงข้ามไม่มีตาเดิน' };
  return null;
}
module.exports = { SIZE, createInitialBoard, isInsideBoard, isPathClear, validateMove, getOpponentColor, findSandwichCaptures, findInsertCaptures, findOuterCaptures, calculateCapturedPieces, applyMove, countPieces, hasAnyValidMove, hasValidMove: hasAnyValidMove, checkWinner, getWinner: checkWinner };
