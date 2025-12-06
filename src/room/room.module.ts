import { Module } from '@nestjs/common';
import { RoomGateway } from './room.gateway';
import { RoomService } from './room.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from './schemas/room.schema';
import { AuthModule } from 'src/auth/auth.module';
import { RoomController } from './room.controller';
import { UserModule } from 'src/user/user.module';
import { GameGateway } from './game.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
    AuthModule,
    UserModule,
  ],
  providers: [RoomGateway, GameGateway, RoomService],
  controllers: [RoomController],
  exports: [RoomService],
})
export class RoomModule {}
