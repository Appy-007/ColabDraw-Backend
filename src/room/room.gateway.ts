import { UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsGuard } from './room.guard';
import { RoomService } from './room.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RoomGateway implements OnGatewayInit, OnGatewayConnection {
  constructor(private readonly roomService: RoomService) {}
  @WebSocketServer() server: Server;

  afterInit() {
    console.log('Whiteboard Gateway Initialized.');
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}. User: ${client.data?.user?.username}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const activeRooms = Array.from(client.rooms).filter(
      (room) => room !== client.id,
    );

    for (const roomId of activeRooms) {
      const email: string = client.data.email;
      try {
        await this.roomService.removeUserFromRoom(roomId, email);
        client.to(roomId).emit('userLeft', {
          userId: client.data.userId,
          message: `${client.data.userId} has left the room.`,
        });
      } catch (error) {
        console.log(error);
        throw new Error('Error occured in deleting data');
      }
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('createRoom')
  async handleCreateRoom(client: Socket, payload: { roomId: string }) {
    const { roomId } = payload;
    // console.log('IN SERVER', payload);
    try {
      const room = await this.roomService.checkIfRoomExists(roomId);
      console.log('ROOM DETAILS IN CREATE ROOM', room);
      if (!room || room.length == 0) {
        client.emit('roomError', {
          message: 'The specified room ID is invalid or expired.',
        });
        return;
      }
      const roomData = room[0];
      await client.join(roomData.roomId);

      client.emit('roomCreated', {
        roomId: roomData.roomId,
        users: roomData.joinedUsers.length,
        message: 'Successfully created & joined room.',
      });

      // console.log('EXECUTED A');
      return { event: 'roomCreated', data: { roomId } };
    } catch (error) {
      console.log(error);
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    client: Socket,
    payload: { roomId: string; user: string },
  ) {
    const { roomId, user } = payload;
    // console.log('IN SERVER', payload);
    try {
      const room = await this.roomService.checkIfRoomExists(roomId);
      if (!room || room.length == 0) {
        client.emit('roomError', {
          message: 'The specified room ID is invalid or expired.',
        });
        return;
      }
      const roomData = room[0];
      await client.join(roomData.roomId);

      //BROADCAST to *all other clients* in the room (notification of new user)
      client.to(roomData.roomId).emit('userJoined', {
        username: user,
        count: roomData.joinedUsers.length,
        message: `${user} has joined the room.`,
      });

      // console.log('EXECUTED B');

      return { event: 'userJoined', data: { roomId } };
    } catch (error) {
      console.log(error);
    }
  }
}
