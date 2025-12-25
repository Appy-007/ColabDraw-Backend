/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDTO } from './dto/register-user.dto';
import { LoginUserDTO } from './dto/login-user.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() payload: RegisterUserDTO) {
    return this.authService.registerUser(payload);
  }

  @Post('login')
  login(@Body() payload: LoginUserDTO) {
    return this.authService.loginUser(payload);
  }

  @Post('verifyUser')
  @UseGuards(AuthGuard)
  verifyUser(@Req() req: Request) {
    const user = req['user'];
    return user;
  }
}
