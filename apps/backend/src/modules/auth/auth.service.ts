import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma, AccountType, CycleStatus } from '@saving-money/database';
import { RegisterDto, LoginDto } from '@saving-money/shared-types';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create user and initialize their 2 core accounts & initial cycle
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          fullName: dto.fullName,
        },
      });

      // 1. Tạo 2 tài khoản cốt lõi
      await tx.account.createMany({
        data: [
          {
            userId: newUser.id,
            name: 'Tài khoản Chi tiêu Hằng ngày',
            type: AccountType.DAILY,
            currentBalance: 0,
          },
          {
            userId: newUser.id,
            name: 'Tài khoản Tiết kiệm 30K',
            type: AccountType.SAVINGS,
            currentBalance: 0,
          },
        ],
      });

      // 2. Tạo chu kỳ đầu tiên (Từ ngày 1 đến cuối tháng hiện tại)
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      await tx.cycle.create({
        data: {
          userId: newUser.id,
          name: `Chu kỳ Tháng ${now.getMonth() + 1}/${now.getFullYear()}`,
          startDate,
          endDate,
          dailySpendLimit: 150000,
          dailySavingTarget: 30000,
          status: CycleStatus.ACTIVE,
        },
      });

      return newUser;
    });

    return this.generateToken(user);
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateToken(user);
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        webhookSecretKey: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    return user;
  }

  private generateToken(user: { id: string; email: string; fullName: string; webhookSecretKey: string }) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        webhookSecretKey: user.webhookSecretKey,
      },
    };
  }
}
