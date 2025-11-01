import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginUserDTO {
  @IsString()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @MinLength(6)
  readonly password: string;
}
