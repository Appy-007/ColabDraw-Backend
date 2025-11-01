import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDTO } from './dto/register-user.dto';
import { LoginUserDTO } from './dto/login-user.dto';

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
}
