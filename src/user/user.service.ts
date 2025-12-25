import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { RegisterUserDTO } from 'src/auth/dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}
  private readonly saltRounds = 10;

  async checkIfUserExists(email: string) {
    const response = await this.userModel.findOne({ email });
    return response;
  }

  async createToken(userId: string, username: string, email: string) {
    if (!userId || !username || !email) return {};

    const payload = { sub: userId, username: username, email: email };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async createUser(payload: RegisterUserDTO) {
    try {
      const userExists = await this.checkIfUserExists(payload.email);

      if (userExists) {
        throw new ForbiddenException('User already exists with this email');
      }

      const hasedPassword = await bcrypt.hash(
        payload.password,
        this.saltRounds,
      );

      const response = await this.userModel.create({
        name: payload.name,
        email: payload.email,
        password: hasedPassword,
      });

      const token = await this.createToken(
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
      return { message: 'User inserted successfully', data: resData };
    } catch (error) {
      console.log(error);
      if (error instanceof ForbiddenException) throw error;

      throw new HttpException(
        'Error occured in registering user',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
