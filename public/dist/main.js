"use strict";
class NoughtsAndCrosses {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.statusDisplay = document.querySelector('#status');
        this.boardElement = document.querySelector('#game-board');
        this.resetButton = document.querySelector('#reset');
        this.pvpModeButton = document.querySelector('#pvp-mode');
        this.pvcModeButton = document.querySelector('#pvc-mode');
        this.isComputerTurn = false;
        this.gameMode = 'pvp';
        this.initializeGame();
    }
    initializeGame() {
        this.createBoard();
        this.setupEventListeners();
        this.updateStatus();
    }
    createBoard() {
        if (this.boardElement) {
            this.boardElement.innerHTML = '';
            this.board.forEach((_, index) => {
                var _a;
                const cell = document.createElement('div');
                cell.dataset.index = index.toString();
                (_a = this.boardElement) === null || _a === void 0 ? void 0 : _a.appendChild(cell);
            });
        }
    }
    setupEventListeners() {
        if (this.boardElement) {
            this.boardElement.addEventListener('click', this.handleCellClick.bind(this));
        }
        if (this.resetButton) {
            this.resetButton.addEventListener('click', this.resetGame.bind(this));
        }
        if (this.pvpModeButton) {
            this.pvpModeButton.addEventListener('click', () => this.setGameMode('pvp'));
        }
        if (this.pvcModeButton) {
            this.pvcModeButton.addEventListener('click', () => this.setGameMode('pvc'));
        }
    }
    updateStatus() {
        if (this.statusDisplay) {
            this.statusDisplay.textContent = `It's ${this.currentPlayer}'s turn`;
        }
    }
    checkGameStatus() {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];
        const isWin = winningCombinations.some(combination => combination.every(index => this.board[index] === this.currentPlayer));
        if (isWin) {
            this.endGame(`${this.currentPlayer} wins!`);
            return;
        }
        if (!this.board.includes('')) {
            this.endGame("It's a draw!");
            return;
        }
        this.switchPlayer();
    }
    endGame(message) {
        this.gameActive = false;
        if (this.statusDisplay) {
            this.statusDisplay.textContent = message;
        }
    }
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateStatus();
    }
    resetGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.isComputerTurn = false;
        this.createBoard();
        this.updateStatus();
        if (this.gameMode === 'pvc') {
            this.makeComputerMove();
        }
    }
    makeComputerMove() {
        if (!this.gameActive || !this.isComputerTurn)
            return;
        const bestMove = this.findBestMove();
        if (bestMove !== -1) {
            setTimeout(() => {
                var _a;
                this.board[bestMove] = this.currentPlayer;
                const cell = (_a = this.boardElement) === null || _a === void 0 ? void 0 : _a.children[bestMove];
                if (cell) {
                    cell.textContent = this.currentPlayer;
                }
                this.checkGameStatus();
            }, 500);
        }
    }
    findBestMove() {
        let bestScore = -Infinity;
        let bestMove = -1;
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = 'O';
                const score = this.minimax(this.board, 0, false);
                this.board[i] = '';
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        return bestMove;
    }
    minimax(board, depth, isMaximizing) {
        const result = this.checkWinner(board);
        if (result !== null) {
            return result;
        }
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    const score = this.minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        }
        else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    const score = this.minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }
    checkWinner(board) {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];
        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            const cellValue = board[a];
            if (cellValue !== '' && cellValue === board[b] && cellValue === board[c]) {
                // After the above checks, cellValue must be either 'X' or 'O'
                if (cellValue === 'O')
                    return 1;
                if (cellValue === 'X')
                    return -1;
                return 0;
            }
        }
        if (!board.includes('')) {
            return 0;
        }
        return null;
    }
    handleCellClick(event) {
        const target = event.target;
        const index = target.dataset.index;
        if (index && this.gameActive && !this.board[+index]) {
            this.board[+index] = this.currentPlayer;
            target.textContent = this.currentPlayer;
            this.checkGameStatus();
            if (this.gameMode === 'pvc' && this.gameActive) {
                this.isComputerTurn = true;
                this.makeComputerMove();
            }
        }
    }
    setGameMode(mode) {
        this.gameMode = mode;
        this.resetGame();
        if (this.pvpModeButton && this.pvcModeButton) {
            if (mode === 'pvp') {
                this.pvpModeButton.classList.add('active');
                this.pvcModeButton.classList.remove('active');
            }
            else {
                this.pvcModeButton.classList.add('active');
                this.pvpModeButton.classList.remove('active');
            }
        }
    }
}
// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NoughtsAndCrosses();
});
