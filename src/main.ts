type Player = 'X' | 'O';
type Cell = Player | '';
type Board = Cell[];

class NoughtsAndCrosses {
    private board: Board;
    private currentPlayer: Player;
    private gameActive: boolean;
    private statusDisplay: HTMLElement | null;
    private boardElement: HTMLElement | null;
    private resetButton: HTMLElement | null;
    private pvpModeButton: HTMLElement | null;
    private pvcModeButton: HTMLElement | null;
    private isComputerTurn: boolean;
    private gameMode: 'pvp' | 'pvc';
    private scores: { X: number; O: number };
    private playerNames: { X: string; O: string };
    private playerXInput: HTMLInputElement | null;
    private playerOInput: HTMLInputElement | null;

    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.statusDisplay = document.querySelector('#status');
        this.boardElement = document.querySelector('#game-board');
        this.resetButton = document.querySelector('#reset');
        this.pvpModeButton = document.querySelector('#pvp-mode');
        this.pvcModeButton = document.querySelector('#pvc-mode');
        this.playerXInput = document.querySelector('#player-x');
        this.playerOInput = document.querySelector('#player-o');
        this.isComputerTurn = false;
        this.gameMode = 'pvp';
        this.scores = { X: 0, O: 0 };
        this.playerNames = { X: 'Player X', O: 'Player O' };
        
        this.initializeGame();
    }

    private initializeGame(): void {
        this.createBoard();
        this.setupEventListeners();
        this.updateStatus();
        this.updateScores();
    }

    private createBoard(): void {
        if (this.boardElement) {
            this.boardElement.innerHTML = '';
            this.board.forEach((_, index) => {
                const cell = document.createElement('div');
                cell.dataset.index = index.toString();
                this.boardElement?.appendChild(cell);
            });
        }
    }

    private setupEventListeners(): void {
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
        if (this.playerXInput) {
            this.playerXInput.addEventListener('input', () => {
                this.playerNames.X = this.playerXInput?.value || 'Player X';
            });
        }
        if (this.playerOInput) {
            this.playerOInput.addEventListener('input', () => {
                if (this.gameMode === 'pvp') {
                    this.playerNames.O = this.playerOInput?.value || 'Player O';
                }
            });
            // Hide player O input initially in PVC mode
            if (this.gameMode === 'pvc') {
                this.playerOInput.style.display = 'none';
            }
        }
    }

    private updateStatus(): void {
        if (this.statusDisplay) {
            let playerName = this.playerNames[this.currentPlayer];
            if (this.gameMode === 'pvc' && this.currentPlayer === 'O') {
                playerName = 'Computer';
            }
            this.statusDisplay.textContent = `It's ${playerName}'s turn`;
        }
    }

    private updateScores(): void {
        const scoreX = document.getElementById('score-x');
        const scoreO = document.getElementById('score-o');
        const nameX = document.getElementById('name-x');
        const nameO = document.getElementById('name-o');
        
        if (scoreX) scoreX.textContent = this.scores.X.toString();
        if (scoreO) scoreO.textContent = this.scores.O.toString();
        
        if (nameX) nameX.textContent = this.playerNames.X;
        if (nameO) {
            nameO.textContent = this.gameMode === 'pvc' ? 'Computer' : this.playerNames.O;
        }
    }

    private checkGameStatus(): void {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        const isWin = winningCombinations.some(combination => 
            combination.every(index => this.board[index] === this.currentPlayer)
        );

        if (isWin) {
            this.scores[this.currentPlayer]++;
            this.updateScores();
            let winnerName = this.playerNames[this.currentPlayer];
            if (this.gameMode === 'pvc' && this.currentPlayer === 'O') {
                winnerName = 'Computer';
            }
            this.endGame(`${winnerName} wins!`);
            return;
        }

        if (!this.board.includes('')) {
            this.endGame("It's a draw!");
            return;
        }

        this.switchPlayer();
    }

    private endGame(message: string): void {
        this.gameActive = false;
        if (this.statusDisplay) {
            this.statusDisplay.textContent = message;
        }
        
        setTimeout(() => this.resetGame(), 2000);
    }

    private switchPlayer(): void {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateStatus();
    }

    private resetGame(): void {
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

    private makeComputerMove(): void {
        if (!this.gameActive || !this.isComputerTurn) return;
        
        const bestMove = this.findBestMove();
        if (bestMove !== -1) {
            setTimeout(() => {
                this.board[bestMove] = this.currentPlayer;
                const cell = this.boardElement?.children[bestMove] as HTMLElement;
                if (cell) {
                    cell.textContent = this.currentPlayer;
                }
                this.checkGameStatus();
            }, 500);
        }
    }

    private findBestMove(): number {
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

    private minimax(board: Board, depth: number, isMaximizing: boolean): number {
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
        } else {
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

    private checkWinner(board: Board): number | null {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            const cellValue = board[a];
            if (cellValue !== '' && cellValue === board[b] && cellValue === board[c]) {
                if (cellValue === 'O') return 1;
                if (cellValue === 'X') return -1;
                return 0;
            }
        }

        if (!board.includes('')) {
            return 0;
        }

        return null;
    }

    private handleCellClick(event: Event): void {
        const target = event.target as HTMLElement;
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

    private setGameMode(mode: 'pvp' | 'pvc'): void {
        this.gameMode = mode;
        this.resetGame();
        
        if (this.pvpModeButton && this.pvcModeButton) {
            if (mode === 'pvp') {
                this.pvpModeButton.classList.add('active');
                this.pvcModeButton.classList.remove('active');
                if (this.playerOInput) {
                    this.playerOInput.style.display = 'block';
                }
                const playerOLabel = document.querySelector('label[for="player-o"]') as HTMLElement | null;
                if (playerOLabel) {
                    playerOLabel.style.display = 'block';
                }
            } else {
                this.pvcModeButton.classList.add('active');
                this.pvpModeButton.classList.remove('active');
                if (this.playerOInput) {
                    this.playerOInput.style.display = 'none';
                }
                const playerOLabel = document.querySelector('label[for="player-o"]') as HTMLElement | null;
                if (playerOLabel) {
                    playerOLabel.style.display = 'none';
                }
            }
        }
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NoughtsAndCrosses();
});
