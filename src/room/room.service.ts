/* eslint-disable @typescript-eslint/no-unsafe-return */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Room } from './schemas/room.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRoomDTO } from './dto/create-room.dto';
import { UserService } from 'src/user/user.service';

const TEST_WORDS = [
  'APPLE',
  'BANANA',
  'CHAIR',
  'COMPUTER',
  'GUITAR',
  'ELEPHANT',
  'PIZZA',
  'OCEAN',
  'PENCIL',
  'TIGER',
];

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
    private userService: UserService,
  ) {}

  private currentWordsForActiveRooms = {};

  setCurrentWordForActiveRooms(roomId: string, word: string) {
    this.currentWordsForActiveRooms[roomId] = word;
  }

  getCurrentWordForActiveRooms(roomId: string): string | undefined {
    return this.currentWordsForActiveRooms[roomId];
  }

  deleteRoomEntry(roomId: string){
    delete this.currentWordsForActiveRooms[roomId];
  }

  async checkIfRoomExists(roomId: string) {
    const room = await this.roomModel.find({ roomId });
    if (!room || room.length == 0) {
      throw new HttpException(
        'This roomId does not exists or has been expired',
        HttpStatus.BAD_REQUEST,
      );
    }

    return room;
  }

  selectRandomWord(): string {
    // 1. Generate a random index based on the array length
    const randomIndex = Math.floor(Math.random() * TEST_WORDS.length);

    // 2. Return the word at that index
    return TEST_WORDS[randomIndex];
  }

  async createRoom(payload: CreateRoomDTO, email: string = '') {
    const user = await this.userService.checkIfUserExists(email);
    if (!user) {
      throw new HttpException(
        'User does not exists...Try Login Again',
        HttpStatus.BAD_REQUEST,
      );
    }

    const now = new Date();
    const expirationTimeMs = now.getTime() + 1000 * 60 * 20;
    const expiredTime = new Date(expirationTimeMs);
    const roomData = {
      roomId: payload.roomId,
      roundsLeft: 3,
      ownerName: payload.name,
      ownerEmailId: email,
      expiredTime,
      joinedUsers: [email],
      scoreBoard: [{ userId: email, username: payload.name, score: 0 }],
    };
    const response = await this.roomModel.create(roomData);
    return {
      message: 'Room Created successfully',
      data: response,
    };
  }

  async joinRoom(payload: CreateRoomDTO, email: string = '') {
    const roomInfo = await this.roomModel.find({ roomId: payload.roomId });
    if (!roomInfo) {
      throw new HttpException(
        'Room Id does not exists..Please check your roomId again',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userService.checkIfUserExists(email);
    if (!user) {
      throw new HttpException(
        'User does not exists...Try Login Again',
        HttpStatus.BAD_REQUEST,
      );
    }

    const response = await this.roomModel.findOneAndUpdate(
      { roomId: payload.roomId },
      {
        $addToSet: {
          joinedUsers: email,
          scoreBoard: { userId: email, username: payload.name, score: 0 },
        },
      },
      { new: true },
    );
    if (!response) {
      throw new HttpException(
        'Problem occured in database',
        HttpStatus.BAD_REQUEST,
      );
    }
    console.log('JOIN ROOM SOCKET COMPLETED');
    return {
      message: 'Room joined successfully',
      data: response,
    };
  }

  async removeUserFromRoom(roomId: string, email: string) {
    const roomData = await this.checkIfRoomExists(roomId);
    if (!roomData) {
      throw new HttpException(
        'Could not find any room with this Id',
        HttpStatus.BAD_REQUEST,
      );
    }

    const joinedUsersArr = roomData[0].joinedUsers;
    const updatedUsers = joinedUsersArr.filter((item) => item != email);
    console.log('EMAIL', email);
    console.log('UPDATED JOINED USER ARR AFTER DELETE', updatedUsers);
    const response = await this.roomModel.findOneAndUpdate(
      { roomId },
      { joinedUsers: updatedUsers },
      { new: true },
    );

    if (!response) {
      throw new HttpException(
        'Problem occured in updating database',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      message: 'User deleted successfully',
      data: response,
    };
  }

  async fetchRoomScoreBoard(roomId: string) {
    const roomData = await this.checkIfRoomExists(roomId);
    if (!roomData) {
      throw new HttpException(
        'Could not find any room with this Id',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      message: 'User deleted successfully',
      data: roomData[0].scoreBoard,
    };
  }

  async updateScoreBoard(
    roomId: string,
    scoreBoard: { userId: string; username: string; score: number }[],
  ) {
    const roomData = await this.checkIfRoomExists(roomId);
    if (!roomData) {
      throw new HttpException(
        'Could not find any room with this Id',
        HttpStatus.BAD_REQUEST,
      );
    }

    const response = await this.roomModel.findOneAndUpdate(
      { roomId },
      { scoreBoard: scoreBoard },
      { new: true },
    );

    if (!response) {
      throw new HttpException(
        'Problem occured in updating database',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      message: 'User updated successfully',
      data: response,
    };
  }

  async updateRoomRound(roomId: string, round: number) {
    const roomData = await this.checkIfRoomExists(roomId);
    if (!roomData) {
      throw new HttpException(
        'Could not find any room with this Id',
        HttpStatus.BAD_REQUEST,
      );
    }

    const response = await this.roomModel.findOneAndUpdate(
      { roomId },
      { roundsLeft: round },
    );

    if (!response) {
      throw new HttpException(
        'Problem occured in updating database',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      message: 'Round updated successfully',
    };
  }
}
