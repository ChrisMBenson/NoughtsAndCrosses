"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const ws_1 = require("ws");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server });
// Serve static files
app.use(express_1.default.static('public'));
const rooms = new Map();
function createRoom() {
    const roomId = Math.random().toString(36).substring(2, 8);
    rooms.set(roomId, {
        id: roomId,
        players: [],
        currentPlayer: 'X',
        board: Array(9).fill('')
    });
    return roomId;
}
function joinRoom(ws, roomId) {
    const room = rooms.get(roomId);
    if (!room) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
        return;
    }
    if (room.players.length > 2) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
        return;
    }
    room.players.push(ws);
    const player = room.players.length === 1 ? 'X' : 'O';
    ws.send(JSON.stringify({
        type: 'joined',
        player,
        roomId,
        board: room.board,
        currentPlayer: room.currentPlayer
    }));
    // Notify other player if room is now full
    if (room.players.length === 2) {
        broadcastToRoom(room, { type: 'game_start' });
    }
}
function handleMove(room, position, player) {
    if (room.currentPlayer !== player || position < 0 || position > 8 || room.board[position] !== '') {
        return;
    }
    room.board[position] = player;
    room.currentPlayer = player === 'X' ? 'O' : 'X';
    broadcastToRoom(room, {
        type: 'move',
        position,
        player,
        board: room.board,
        currentPlayer: room.currentPlayer
    });
    const winner = checkWinner(room.board);
    if (winner) {
        broadcastToRoom(room, { type: 'game_over', winner });
        resetRoom(room);
    }
    else if (!room.board.includes('')) {
        broadcastToRoom(room, { type: 'game_over', winner: 'draw' });
        resetRoom(room);
    }
}
function resetRoom(room) {
    room.board = Array(9).fill('');
    room.currentPlayer = 'X';
    broadcastToRoom(room, {
        type: 'reset',
        board: room.board,
        currentPlayer: room.currentPlayer
    });
}
function broadcastToRoom(room, message) {
    room.players.forEach(player => {
        if (player.readyState === ws_1.WebSocket.OPEN) {
            player.send(JSON.stringify(message));
        }
    });
}
function checkWinner(board) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];
    for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}
wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        switch (message.type) {
            case 'join':
                if (message.roomId) {
                    joinRoom(ws, message.roomId);
                }
                else {
                    const roomId = createRoom();
                    joinRoom(ws, roomId);
                }
                break;
            case 'move':
                if (message.roomId && typeof message.position === 'number' && message.player) {
                    const room = rooms.get(message.roomId);
                    if (room) {
                        handleMove(room, message.position, message.player);
                    }
                }
                break;
            case 'reset':
                if (message.roomId) {
                    const room = rooms.get(message.roomId);
                    if (room) {
                        resetRoom(room);
                    }
                }
                break;
            case 'chat':
                if (message.roomId && message.message) {
                    const room = rooms.get(message.roomId);
                    if (room) {
                        broadcastToRoom(room, {
                            type: 'chat',
                            message: message.message,
                            player: message.player
                        });
                    }
                }
                break;
        }
    });
    ws.on('close', () => {
        // Remove player from their room
        rooms.forEach((room, roomId) => {
            const index = room.players.indexOf(ws);
            if (index !== -1) {
                room.players.splice(index, 1);
                if (room.players.length === 0) {
                    rooms.delete(roomId);
                }
                else {
                    broadcastToRoom(room, {
                        type: 'player_disconnected',
                        message: 'Other player disconnected'
                    });
                }
            }
        });
    });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map