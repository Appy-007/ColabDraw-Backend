import { IsNotEmpty, IsString } from 'class-validator';

export class CheckRoomIdDTO {
  @IsString()
  @IsNotEmpty()
  readonly roomId: string;
}
