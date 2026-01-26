/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { RoomService } from './room.service';
import { Server, Socket } from 'socket.io';
import { WsMiddleWare } from './room.middleware';
import { UseGuards } from '@nestjs/common';
import { WsGuard } from './room.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection {
  constructor(
    private readonly jwtService: JwtService,
    private readonly roomService: RoomService,
  ) {}

  @WebSocketServer() server: Server;

  afterInit(server: Server) {
    console.log('Game Logic Gateway Initialized.');
    server.use(WsMiddleWare(this.jwtService) as any);
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log('FROM CLIENT', client?.data?.user);
    console.log(
      `Client connected: ${client.id}. User: ${client.data?.user?.username}`,
    );

    client.on('disconnecting', (reason) => {
      console.log('DISCONNECTING. ROOMS TO LEAVE:', reason);
    });
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('startGame')
  async startGame(client: Socket, payload: { roomId: string; user: string }) {
    const { roomId, user } = payload;

    try {
      const room = await this.roomService.checkIfRoomExists(roomId);
      if (!room) {
        client.emit('roomError', {
          message: 'The specified room ID is invalid or expired.',
        });
        return;
      }
      const currentRound = room.roundsLeft;

      const selectedWord = this.roomService.selectRandomWord();
      const maskedWord = selectedWord.replace(/[a-zA-Z]/g, '_');

      console.log('SELECTED WORD', selectedWord, maskedWord);

      this.roomService.setCurrentWordForActiveRooms(roomId, selectedWord);

      await this.roomService.updateRoomRound(roomId, currentRound - 1);

      client.emit('receiveStartGameForDrawer', {
        mode: 'playing',
        drawer: user,
        word: selectedWord,
        maskedWord: selectedWord,
      });

      client.broadcast.to(room.roomId).emit('receiveStartGame', {
        mode: 'playing',
        drawer: user,
        word: maskedWord,
        maskedWord: maskedWord,
      });
    } catch (error) {
      console.log(error);
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('checkWord')
  async checkWord(
    client: Socket,
    payload: { roomId: string; userId: string; word: string },
  ) {
    const { roomId, userId, word } = payload;

    try {
      const room = await this.roomService.checkIfRoomExists(roomId);
      if (!room) {
        client.emit('roomError', {
          message: 'The specified room ID is invalid or expired.',
        });
        return;
      }
      const roomData = room;
      const selectedWord =
        this.roomService.getCurrentWordForActiveRooms(roomId);
      if (!selectedWord || !word?.trim()) {
        client.emit('wrongGuess', {
          message: 'Invalid answer...try again',
        });
        return;
      }

      if (
        selectedWord.trim().toLocaleLowerCase() ===
        word?.trim()?.toLocaleLowerCase()
      ) {
        const currentScoreBoard = roomData.scoreBoard;
        const updatedScoreBoard =
          currentScoreBoard &&
          currentScoreBoard.map(
            (item: { userId: string; username: string; score: number }) => {
              if (item.userId === userId) {
                return { ...item, score: item.score + 10 };
              } else {
                return item;
              }
            },
          );
        const response = await this.roomService.updateScoreBoard(
          roomId,
          updatedScoreBoard,
        );
        console.log('RESPONSE FROM DB', response);
        if (!response.data) {
          client.emit('wrongGuess', {
            message: 'error in db ..try again',
          });
          return;
        }
        client.emit('correctGuess', {
          message: 'You correctly guessed the word !!',
        });
        this.server.to(roomId).emit('updateScoreBoard', {
          scoreBoard: response.data.scoreBoard,
        });
        return;
      } else {
        client.emit('wrongGuess', {
          message: 'wrong answer...try again',
        });
        return;
      }
    } catch (error) {
      console.log(error);
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('roundEnd')
  async roundEnd(client: Socket, payload: { roomId: string }) {
    const { roomId } = payload;
    try {
      const room = await this.roomService.checkIfRoomExists(roomId);
      if (!room) {
        client.emit('roomError', {
          message: 'The specified room ID is invalid or expired.',
        });
        return;
      }
      if (room.roundsLeft == 0) {
        this.roomService.deleteRoomEntry(roomId);
        this.server.to(room.roomId).emit('endGame', {
          mode: 'finished',
          message: 'Game ended ',
          scoreBoard: room.scoreBoard,
        });
      } else {
        client.broadcast.to(room.roomId).emit('receiveRoundEnd', {
          message: 'Round ended',
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
}
