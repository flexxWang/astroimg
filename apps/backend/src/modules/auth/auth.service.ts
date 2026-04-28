import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JwtService } from '@nestjs/jwt';
import type { Cache } from 'cache-manager';
import { randomUUID } from 'crypto';
import { UserService } from '../user/user.service';
import { AppException, ErrorCode } from '@/common/exceptions';
import { hashPassword, comparePassword } from '@/common/utils/crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

type RevocableJwtPayload = {
  jti?: string;
  exp?: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userService.findByUsernameOrEmail(dto.username);
    if (exists) {
      throw AppException.conflict(ErrorCode.USERNAME_ALREADY_EXISTS);
    }

    const existsEmail = await this.userService.findByUsernameOrEmail(dto.email);
    if (existsEmail) {
      throw AppException.conflict(ErrorCode.EMAIL_ALREADY_EXISTS);
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
      throw AppException.unauthorized(ErrorCode.INVALID_CREDENTIALS);
    }

    const isValid = await comparePassword(dto.password, user.passwordHash);
    if (!isValid) {
      throw AppException.unauthorized(ErrorCode.INVALID_CREDENTIALS);
    }

    return this.signToken(user.id, user.username, user.email);
  }

  private signToken(id: string, username: string, email: string) {
    const payload = { sub: id, username, email, jti: randomUUID() };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }

  async revokeAccessToken(token?: string | null) {
    if (!token) {
      return;
    }

    try {
      const payload = this.jwtService.verify<RevocableJwtPayload>(token);
      if (!payload.jti || !payload.exp) {
        return;
      }

      const ttlMs = Math.max(payload.exp * 1000 - Date.now(), 1);
      await this.cacheManager.set(
        this.revokedTokenKey(payload.jti),
        true,
        ttlMs,
      );
    } catch {
      // Logout should still clear the browser cookie when the token is stale.
    }
  }

  async isTokenRevoked(jti: string) {
    return Boolean(await this.cacheManager.get(this.revokedTokenKey(jti)));
  }

  private revokedTokenKey(jti: string) {
    return `auth:revoked:${jti}`;
  }
}
