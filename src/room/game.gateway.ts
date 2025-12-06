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
    console.log('Whiteboard Gateway Initialized.');
    server.use(WsMiddleWare(this.jwtService) as any);
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log('FROM CLIENT', client?.data?.user);
    console.log(
      `Client connected: ${client.id}. User: ${client.data?.user?.username}`,
    );

    client.on('disconnecting', (reason) => {
      // client.rooms is still populated here!

      console.log('DISCONNECTING. ROOMS TO LEAVE:', reason);

      // Now you can perform the room cleanup logic here
    });
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('startGame')
  async startGame(client: Socket, payload: { roomId: string; user: string }) {
    const { roomId, user } = payload;

    try {
      const room = await this.roomService.checkIfRoomExists(roomId);
      if (!room || room.length == 0) {
        client.emit('roomError', {
          message: 'The specified room ID is invalid or expired.',
        });
        return;
      }
      const roomData = room[0];

      const selectedWord = this.roomService.selectRandomWord();
      const maskedWord = selectedWord.replace(/[a-zA-Z]/g, '_');

      console.log('SELECTED WORD', selectedWord, maskedWord);

      client.emit('receiveStartGameForDrawer', {
        mode: 'playing',
        drawer: user,
        word: selectedWord,
        maskedWord: selectedWord,
      });

      client.broadcast.to(roomData.roomId).emit('receiveStartGame', {
        mode: 'playing',
        drawer: user,
        word: maskedWord, // Masked word: '_____'
        maskedWord: maskedWord,
      });
    } catch (error) {
      console.log(error);
    }
  }
}
