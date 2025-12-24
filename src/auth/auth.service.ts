import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RegisterUserDTO } from './dto/register-user.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { LoginUserDTO } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}
  async registerUser(payload: RegisterUserDTO) {
    const response = await this.userService.createUser(payload);
    if (!response?.data?.token) {
      throw new HttpException(
        'Error in generating access token',
        HttpStatus.BAD_REQUEST,
      );
    }
    return {
      message: 'User registered successfully',
      data: response.data,
    };
  }

  async loginUser(payload: LoginUserDTO) {
    const response = await this.userService.checkIfUserExists(payload.email);
    if (!response)
      throw new HttpException(
        'User does not exits..check your email',
        HttpStatus.BAD_REQUEST,
      );
    const hashedPassword = await bcrypt.compare(
      payload.password,
      response.password,
    );
    if (!hashedPassword) {
      throw new HttpException(
        'Incorrect password. check your password and try again',
        HttpStatus.BAD_REQUEST,
      );
    }

    const token = await this.userService.createToken(
      response._id.toString(),
      response.name,
      response.email,
    );

    const resData = {
      token: token.access_token,
      expires_in: process.env.JWT_EXPIRATION_TIME,
      user: {
        username: response.name,
        email: response.email,
      },
    };

    return {
      message: 'Logged in successfully',
      data: resData,
    };
  }
}
