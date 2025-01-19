import express from 'express';
import { createServer } from 'http';
import { WebSocket as WS, WebSocketServer } from 'ws';
import { join } from 'path';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files
app.use(express.static('public'));

type Player = 'X' | 'O';

interface Room {
    id: string;
    players: WS[];
    currentPlayer: Player;
    board: string[];
}

interface GameMessage {
    type: string;
    roomId?: string;
    position?: number;
    player?: Player;
    message?: string;
}

type WSClient = WS & {
    on(event: 'message', cb: (data: Buffer) => void): void;
    on(event: 'close', cb: () => void): void;
}

const rooms = new Map<string, Room>();

function createRoom(): string {
    const roomId = Math.random().toString(36).substring(2, 8);
    rooms.set(roomId, {
        id: roomId,
        players: [],
        currentPlayer: 'X',
        board: Array(9).fill('')
    });
    return roomId;
}

function joinRoom(ws: WSClient, roomId: string): void {
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

function handleMove(room: Room, position: number, player: 'X' | 'O'): void {
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
    } else if (!room.board.includes('')) {
        broadcastToRoom(room, { type: 'game_over', winner: 'draw' });
        resetRoom(room);
    }
}

function resetRoom(room: Room): void {
    room.board = Array(9).fill('');
    room.currentPlayer = 'X';
    broadcastToRoom(room, {
        type: 'reset',
        board: room.board,
        currentPlayer: room.currentPlayer
    });
}

function broadcastToRoom(room: Room, message: any): void {
    room.players.forEach(player => {
        if (player.readyState === WS.OPEN) {
            player.send(JSON.stringify(message));
        }
    });
}

function checkWinner(board: string[]): string | null {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }

    return null;
}

wss.on('connection', (ws: WSClient) => {
    ws.on('message', (data: string) => {
        const message: GameMessage = JSON.parse(data.toString());

        switch (message.type) {
            case 'join':
                if (message.roomId) {
                    joinRoom(ws, message.roomId);
                } else {
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
                } else {
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
