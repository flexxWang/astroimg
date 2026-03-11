import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { hashPassword, comparePassword } from '../../common/utils/crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userService.findByUsernameOrEmail(dto.username);
    if (exists) {
      throw new ConflictException('Username already exists');
    }

    const existsEmail = await this.userService.findByUsernameOrEmail(dto.email);
    if (existsEmail) {
      throw new ConflictException('Email already exists');
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
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await comparePassword(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user.id, user.username, user.email);
  }

  private signToken(id: string, username: string, email: string) {
    const payload = { sub: id, username, email };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }
}
