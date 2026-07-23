window.GameBoard = class GameBoard {
  constructor(element, onMove) {
    this.element = element;
    this.onMove = onMove;
    this.selected = null;
    this.state = null;
    this.boardSize = 8;
    this.colorPlacedAtTop = 'black';
    this.lastOrientationDebugKey = null;
  }

  isRotated() {
    return this.myColor === this.colorPlacedAtTop;
  }

  debugOrientation() {
    const debugKey = `${this.myColor}:${this.isRotated()}:${this.boardSize}`;
    if (debugKey === this.lastOrientationDebugKey) return;
    this.lastOrientationDebugKey = debugKey;
    console.log({
      playerColor: this.myColor,
      shouldRotateBoard: this.isRotated(),
      topRow: this.state.board[0],
      bottomRow: this.state.board[this.boardSize - 1]
    });
  }

  toServerPosition(displayPosition) {
    if (!this.isRotated()) return { ...displayPosition };
    return {
      row: this.boardSize - 1 - displayPosition.row,
      col: this.boardSize - 1 - displayPosition.col
    };
  }

  toDisplayPosition(serverPosition) {
    if (!this.isRotated()) return { ...serverPosition };
    return {
      row: this.boardSize - 1 - serverPosition.row,
      col: this.boardSize - 1 - serverPosition.col
    };
  }

  render(state, myColor, locked, captured = []) {
    this.state = state;
    this.myColor = myColor;
    this.locked = locked;
    this.boardSize = state.board.length;
    this.debugOrientation();
    this.element.replaceChildren();

    for (let displayRow = 0; displayRow < this.boardSize; displayRow += 1) {
      for (let displayCol = 0; displayCol < this.boardSize; displayCol += 1) {
        const serverPosition = this.toServerPosition({ row: displayRow, col: displayCol });
        const color = state.board[serverPosition.row][serverPosition.col];
        const cell = document.createElement('button');
        cell.className = 'cell';
        cell.disabled = locked;
        cell.setAttribute('aria-label', `${displayRow + 1}, ${displayCol + 1}${color ? ` ${color}` : ''}`);
        if (this.samePosition(serverPosition, state.lastMove?.from)) cell.classList.add('last-move-from');
        if (this.samePosition(serverPosition, state.lastMove?.to)) {
          cell.classList.add('last-move-to');
          cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')} หมากที่เดินล่าสุด`);
        }

        if (color) {
          const piece = document.createElement('span');
          piece.className = `piece ${color}`;
          cell.append(piece);
        }

        cell.addEventListener('click', () => this.click(displayRow, displayCol));
        this.element.append(cell);
      }
    }

    this.paint();
    this.animateCaptures(captured);
  }

  samePosition(first, second) {
    return Boolean(first && second && first.row === second.row && first.col === second.col);
  }

  click(displayRow, displayCol) {
    if (this.locked || this.state.status !== 'playing' || this.state.currentTurn !== this.myColor) return;

    const serverPosition = this.toServerPosition({ row: displayRow, col: displayCol });
    const value = this.state.board[serverPosition.row][serverPosition.col];

    if (value === this.myColor) {
      this.selected = serverPosition;
      this.paint();
      return;
    }

    if (this.selected && this.targets().some(position => position.row === serverPosition.row && position.col === serverPosition.col)) {
      const from = this.selected;
      this.selected = null;
      this.onMove(from, serverPosition);
    }
  }

  targets() {
    if (!this.selected) return [];
    const targets = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [rowStep, colStep] of directions) {
      let row = this.selected.row + rowStep;
      let col = this.selected.col + colStep;
      while (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize && this.state.board[row][col] === null) {
        targets.push({ row, col });
        row += rowStep;
        col += colStep;
      }
    }
    return targets;
  }

  paint() {
    const targets = this.targets();
    const selectedDisplay = this.selected ? this.toDisplayPosition(this.selected) : null;
    const displayTargets = targets.map(position => this.toDisplayPosition(position));

    [...this.element.children].forEach((cell, index) => {
      const displayRow = Math.floor(index / this.boardSize);
      const displayCol = index % this.boardSize;
      cell.classList.toggle('selected', selectedDisplay?.row === displayRow && selectedDisplay?.col === displayCol);
      cell.classList.toggle('target', displayTargets.some(position => position.row === displayRow && position.col === displayCol));
    });
  }

  animateCaptures(captured) {
    const capturedColor = this.state.lastMove?.color === 'black' ? 'white' : 'black';
    captured.forEach(serverPosition => {
      const displayPosition = this.toDisplayPosition(serverPosition);
      const index = displayPosition.row * this.boardSize + displayPosition.col;
      const cell = this.element.children[index];
      if (!cell) return;
      cell.classList.add('captured-flash');
      const ghost = document.createElement('span');
      ghost.className = `piece ${capturedColor} captured-piece`;
      ghost.setAttribute('aria-hidden', 'true');
      cell.append(ghost);
    });
  }
};
