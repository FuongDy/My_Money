import { Injectable } from '@nestjs/common';
import { prisma, DevicePlatform } from '@saving-money/database';
import { RegisterDeviceDto } from '@saving-money/shared-types';

@Injectable()
export class DevicesService {
  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    return prisma.userDevice.upsert({
      where: { fcmToken: dto.fcmToken },
      update: {
        userId,
        platform: dto.platform,
        deviceName: dto.deviceName,
        isActive: true,
        lastActiveAt: new Date(),
      },
      create: {
        userId,
        platform: dto.platform,
        deviceName: dto.deviceName,
        fcmToken: dto.fcmToken,
        isActive: true,
      },
    });
  }

  async getDevices(userId: string) {
    return prisma.userDevice.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async removeDevice(userId: string, deviceId: string) {
    return prisma.userDevice.deleteMany({
      where: { id: deviceId, userId },
    });
  }
}
