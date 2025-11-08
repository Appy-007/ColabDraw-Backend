/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'ws') return false;

    const client: Socket = context.switchToWs().getClient();

    // Check if token already validated and user set (e.g., from a previous message or another hook)
    if (client?.data?.user) {
      console.log('IN WS GUARD', client?.data?.user);
      return true;
    }

    throw new WsException('Unauthorized: Missing authentication token.');
  }
}
