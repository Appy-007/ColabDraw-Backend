import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type RoomDocument = Document & Room;

@Schema({ timestamps: true })
export class Room {
  @Prop({ required: true, index: true, unique: true })
  roomId: string;

  @Prop()
  ownerEmailId: string;

  @Prop({ required: true })
  ownerName: string;

  @Prop()
  joinedUsers: string[];

  @Prop()
  expiredTime: Date;

  @Prop()
  scoreBoard: [];
}

export const RoomSchema = SchemaFactory.createForClass(Room);
