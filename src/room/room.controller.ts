/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDTO } from './dto/create-room.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import type { Request } from 'express';
import { CheckRoomIdDTO } from './dto/check-roomId.dto';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post('createRoom')
  @UseGuards(AuthGuard)
  createRoom(@Req() req: Request, @Body() payload: CreateRoomDTO) {
    const user = req['user'];
    console.log('USER IN CREATE ROOM', user);
    return this.roomService.createRoom(payload, user.email);
  }

  @Post('joinRoom')
  @UseGuards(AuthGuard)
  joinRoom(@Req() req: Request, @Body() payload: CreateRoomDTO) {
    console.log('USER IN JOIN ROOM', req['user']);
    const user = req['user'];
    return this.roomService.joinRoom(payload, user.email);
  }

  @Post('checkIfRoomExists')
  @UseGuards(AuthGuard)
  checkIfRoomExists(@Body() payload: CheckRoomIdDTO) {
    console.log('ROOM DETAILS', payload.roomId);
    return this.roomService.checkIfRoomExists(payload.roomId);
  }

  @Post('fetchRoomScoreBoard')
  @UseGuards(AuthGuard)
  fetchRoomScoreBoard(@Body() payload: CheckRoomIdDTO) {
    return this.roomService.fetchRoomScoreBoard(payload.roomId);
  }
}
