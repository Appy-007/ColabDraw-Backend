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
    try {
      const room = await this.roomService.checkIfRoomExists(roomId);
      if (!room) {
        client.emit('roomError', {
          message: 'The specified room ID is invalid or expired.',
        });
        return;
      }
      client.data.roomId = room.roomId;
      await client.join(room.roomId);

      client.emit('roomCreated', {
        message: 'Successfully created & joined room.',
      });
    } catch (error) {
      console.log(error);
      client.emit('roomError', {
        message:
          'Unexpected error occured...try creating or joining another room',
      });
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    client: Socket,
    payload: { roomId: string; user: string },
  ) {
    const { roomId, user } = payload;
    try {
      const room = await this.roomService.checkIfRoomExists(roomId);
      if (!room) {
        client.emit('roomError', {
          message: 'The specified room ID is invalid or expired.',
        });
        return;
      }
      client.data.roomId = room.roomId;
      await client.join(room.roomId);

      client.broadcast.to(room.roomId).emit('userJoined', {
        message: `${user} has joined the room.`,
      });

      client.emit('roomJoined', {
        message: 'Successfully joined the room',
      });
    } catch (error) {
      console.log(error);
      client.emit('roomError', {
        message:
          'Unexpected error occured...try creating or joining another room',
      });
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
      const response = await this.roomService.removeUserFromRoom(roomId, email);
      console.log('CURRENT USERS', response.data);
      client.broadcast.to(roomId).emit('userLeft', {
        message: `${client.data.user.username} has left the room.`,
      });
      client.emit('roomLeft', {
        message: 'Successfully left the room.',
      });
    } catch (error) {
      console.error(`Error deleting user data for room ${roomId}:`, error);
      client.emit('roomError', {
        message: 'An error occurred while trying to leave the room.',
      });
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('sendDrawingEvent')
  handleDrawingEvent(client: Socket, payload: { roomId: string; event: any }) {
    const { roomId, event } = payload;
    try {
      // const room = await this.roomService.checkIfRoomExists(roomId);
      const room = client?.data?.roomId;
      if (!room) {
        client.emit('roomError', {
          message: 'The specified room ID is invalid or expired.',
        });
        return;
      }
      client.broadcast.to(roomId).emit('receiveDrawingEvent', {
        event: event,
      });
    } catch (error) {
      console.error(
        `Error in sending drawing event for room ${roomId}:`,
        error,
      );
      client.emit('roomError', {
        message: 'An error occurred in sending drawing event to the room.',
      });
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('sendDrawingUpdate')
  handleDrawingUpdate(
    client: Socket,
    payload: {
      roomId: string;
      type: string;
      id: string;
      point: number[];
      currentX: number;
      currentY: number;
      shapeType: string;
    },
  ) {
    const {
      roomId,
      type,
      id,
      point,
      currentX,
      currentY,
      shapeType = 'pencil',
    } = payload;
    try {
      // const room = await this.roomService.checkIfRoomExists(roomId);
      const room = client?.data?.roomId;
      if (!room) {
        client.emit('roomError', {
          message: 'The specified room ID is invalid or expired.',
        });
        return;
      }
      if (type === 'pencil_event') {
        client.broadcast.to(roomId).emit('receiveDrawingUpdate', {
          id,
          type,
          point,
          shapeType,
        });
      } else if (type === 'shape_event') {
        client.broadcast.to(roomId).emit('receiveDrawingUpdate', {
          id,
          type,
          currentX,
          currentY,
          shapeType,
        });
      }
    } catch (error) {
      console.error(
        `Error in sending drawing event for room ${roomId}:`,
        error,
      );
      client.emit('roomError', {
        message: 'An error occurred in sending drawing event to the room.',
      });
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('sendUndoDrawingEvent')
  async handleUndoDrawingEvent(
    client: Socket,
    payload: { roomId: string; id: string },
  ) {
    const { roomId, id } = payload;
    try {
      const room = await this.roomService.checkIfRoomExists(roomId);
      if (!room) {
        client.emit('roomError', {
          message: 'The specified room ID is invalid or expired.',
        });
        return;
      }
      client.emit('receiveUndoDrawingEvent', { id });
    } catch (error) {
      console.log(error);
      client.emit('roomError', {
        message: 'An error occurred in sending undo drawing event to the room.',
      });
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('sendRedoDrawingEvent')
  async handleRedoDrawingEvent(
    client: Socket,
    payload: { roomId: string; id: string; event: any },
  ) {
    const { roomId, id, event } = payload;
    try {
      console.log('ID , EVENT', id, event);
      const room = await this.roomService.checkIfRoomExists(roomId);
      if (!room) {
        client.emit('roomError', {
          message: 'The specified room ID is invalid or expired.',
        });
        return;
      }
      client.emit('receiveRedoDrawingEvent', { event });
    } catch (error) {
      console.log(error);
      client.emit('roomError', {
        message: 'An error occurred in sending redo drawing event to the room.',
      });
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('clearCanvas')
  handleClearCanvas(client: Socket, payload: { roomId: string }) {
    const { roomId } = payload;
    try {
      // const room = await this.roomService.checkIfRoomExists(roomId);
      const room = client?.data?.roomId;
      if (!room) {
        client.emit('roomError', {
          message: 'The specified room ID is invalid or expired.',
        });
        return;
      }
      client.broadcast.to(roomId).emit('receiveClearCanvas');
    } catch (error) {
      console.log(error);
      client.emit('roomError', {
        message: 'An error occurred in sending clear canvas event to the room.',
      });
    }
  }
}
