import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRoomDTO {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  readonly roomId: string;

  @IsNumber()
  @IsNotEmpty()
  readonly rounds: number;
}

export class JoinRoomDTO {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  readonly roomId: string;
}
