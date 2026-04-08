import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { hashPassword, comparePassword } from '../../common/utils/crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/exceptions/error-codes';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userService.findByUsernameOrEmail(dto.username);
    if (exists) {
      throw AppException.conflict(
        ErrorCode.USERNAME_ALREADY_EXISTS,
        'Username already exists',
      );
    }

    const existsEmail = await this.userService.findByUsernameOrEmail(dto.email);
    if (existsEmail) {
      throw AppException.conflict(
        ErrorCode.EMAIL_ALREADY_EXISTS,
        'Email already exists',
      );
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.userService.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
    });

    return this.signToken(user.id, user.username, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByUsernameOrEmail(
      dto.usernameOrEmail,
      true,
    );
    if (!user) {
      throw AppException.unauthorized(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid credentials',
      );
    }

    const isValid = await comparePassword(dto.password, user.passwordHash);
    if (!isValid) {
      throw AppException.unauthorized(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid credentials',
      );
    }

    return this.signToken(user.id, user.username, user.email);
  }

  private signToken(id: string, username: string, email: string) {
    const payload = { sub: id, username, email };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }
}
