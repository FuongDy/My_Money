import { Controller, Post, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegisterDeviceDto } from '@saving-money/shared-types';

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các thiết bị (Android/iOS/Web) đang đăng nhập' })
  getDevices(@CurrentUser() user: { id: string }) {
    return this.devicesService.getDevices(user.id);
  }

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký thiết bị và FCM Token để nhận thông báo đẩy' })
  registerDevice(@CurrentUser() user: { id: string }, @Body() dto: RegisterDeviceDto) {
    return this.devicesService.registerDevice(user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hủy đăng ký thiết bị' })
  removeDevice(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.devicesService.removeDevice(user.id, id);
  }
}
