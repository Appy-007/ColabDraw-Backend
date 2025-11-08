/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
import { JwtService } from '@nestjs/jwt';
import { WsMiddleWare } from './room.middleware';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RoomGateway implements OnGatewayInit, OnGatewayConnection {
  constructor(
    private readonly roomService: RoomService,
    private readonly jwtService: JwtService,
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

    client.on('disconnecting', async (reason) => {
      // client.rooms is still populated here!
      const roomsToLeave = Array.from(client.rooms).filter(
        (room) => room !== client.id,
      );

      console.log('DISCONNECTING. ROOMS TO LEAVE:', roomsToLeave);

      // Now you can perform the room cleanup logic here
      await this.processRoomCleanup(client, roomsToLeave);
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const activeRooms = Array.from(client.rooms).filter(
      (room) => room !== client.id,
    );

    console.log('ACTIVE ROOMS', activeRooms);
  }

  async processRoomCleanup(client: Socket, activeRooms: string[]) {
    for (const roomId of activeRooms) {
      const email: string = client.data.user.email;
      console.log('DISCONNECTING...', email, roomId);
      try {
        const response = await this.roomService.removeUserFromRoom(
          roomId,
          email,
        );
        client.to(roomId).emit('userLeft', {
          userId: client.data.user.email,
          message: `${client.data.user.username} has left the room.`,
          count: response.data.joinedUsers.length,
        });
      } catch (error) {
        console.error(`Error deleting user data for room ${roomId}:`, error);
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
        count: roomData.joinedUsers.length,
        message: 'Successfully created & joined room.',
      });

      console.log('EXECUTED CREATE ROOM SOCKET');
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

      client.emit('roomJoined', {
        count: roomData.joinedUsers.length,
        message: 'Successfully joined the room',
      });
    } catch (error) {
      console.log(error);
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(client: Socket, payload: { roomId: string }) {
    const { roomId } = payload;
    const email = client.data.user.email;
    const username = client.data.user?.username ?? '';
    console.log(`User ${username} has left the room`);

    if (!client.rooms.has(roomId)) {
      client.emit('roomError', {
        message: `You are not currently in room: ${roomId}.`,
      });
      return;
    }

    try {
      await client.leave(roomId);
      console.log('EMAIL IN LEAVE ROOM', email);
      const response = await this.roomService.removeUserFromRoom(roomId, email);
      console.log('CURRENT USERS', response.data);
      client.to(roomId).emit('userLeft', {
        userId: client.data.user.email,
        message: `${client.data.user.username} has left the room.`,
        count: response.data.joinedUsers.length,
      });
      client.emit('roomLeft', {
        roomId: roomId,
        message: 'Successfully left the room.',
      });
    } catch (error) {
      console.error(`Error deleting user data for room ${roomId}:`, error);
      client.emit('roomError', {
        message: 'An error occurred while trying to leave the room.',
      });
    }
  }
}
