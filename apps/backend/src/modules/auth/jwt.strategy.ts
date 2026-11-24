import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { prisma } from '@saving-money/database';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'saving-money-super-secret-key-2026',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        webhookSecretKey: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or session expired');
    }

    return user;
  }
}
