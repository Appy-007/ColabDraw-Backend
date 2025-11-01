/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  private extractTokenFromHandshake(client: Socket): string | undefined {
    return (
      client.handshake.auth?.token?.replace('Bearer ', '')  ||
      client.handshake.headers?.authorization?.split(' ')[1]
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'ws') return false;

    const client: Socket = context.switchToWs().getClient();

    const token = this.extractTokenFromHandshake(client);

    // Check if token already validated and user set (e.g., from a previous message or another hook)
    if (client?.data?.user) {
      return true;
    }

    if (!token) {
      throw new WsException('Unauthorized: Missing authentication token.');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET_KEY,
      });

      console.log('PAYLOAD IN WS AuthGuard', payload);
      client.data.user = payload; // Attach to the Socket data object
    } catch (error) {
      console.log(error);
      throw new WsException('Unauthorized: Invalid or expired token.');
    }

    return true;
  }
}
