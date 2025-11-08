/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

export const WsMiddleWare = (jwtService: JwtService): Function => {
  return async (client: Socket, next: (err?: Error) => void) => {
    const token =
      client.handshake.auth?.token?.replace('Bearer ', '') ||
      client.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      // Reject connection with error
      return next(
        new Error('Unauthorized: No token provided during handshake.'),
      );
    }

    try {
      const payload = await jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET_KEY,
      });
      client.data.user = payload;
      next();
    } catch (error) {
      return next(new Error('Unauthorized:Invalid token'));
    }
  };
};
