import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CyclesService } from './cycles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCycleDto } from '@saving-money/shared-types';

@ApiTags('Cycles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cycles')
export class CyclesController {
  constructor(private readonly cyclesService: CyclesService) {}

  @Get('active')
  @ApiOperation({ summary: 'Lấy chu kỳ đang kích hoạt' })
  getActiveCycle(@CurrentUser() user: { id: string }) {
    return this.cyclesService.getActiveCycle(user.id);
  }

  @Patch('active')
  @ApiOperation({ summary: 'Cập nhật hạn mức chi tiêu và mục tiêu tiết kiệm chu kỳ' })
  updateActiveCycle(
    @CurrentUser() user: { id: string },
    @Body() dto: { dailySpendLimit?: number; dailySavingTarget?: number; name?: string },
  ) {
    return this.cyclesService.updateActiveCycle(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy toàn bộ lịch sử các chu kỳ' })
  getAllCycles(@CurrentUser() user: { id: string }) {
    return this.cyclesService.getAllCycles(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo chu kỳ tùy chỉnh mới' })
  createCycle(@CurrentUser() user: { id: string }, @Body() dto: CreateCycleDto) {
    return this.cyclesService.createCycle(user.id, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê chuyên sâu: Tiến độ 30K/ngày, Hạn mức tiêu hôm nay, Cơ cấu dòng tiền' })
  getStats(@CurrentUser() user: { id: string }) {
    return this.cyclesService.getCycleStatistics(user.id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Lấy thống kê theo ID chu kỳ cụ thể' })
  getStatsByCycle(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.cyclesService.getCycleStatistics(user.id, id);
  }
}
