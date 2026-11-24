import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RecurringService } from './recurring.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateRecurringRuleDto } from '@saving-money/shared-types';

@ApiTags('Recurring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recurring')
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các khoản cố định định kỳ' })
  getRules(@CurrentUser() user: { id: string }) {
    return this.recurringService.getRules(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo khoản cố định mới (Ngày, Tuần, Tháng, Năm)' })
  createRule(@CurrentUser() user: { id: string }, @Body() dto: CreateRecurringRuleDto) {
    return this.recurringService.createRule(user.id, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Bật / Tắt khoản định kỳ' })
  toggleRule(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.recurringService.toggleRule(user.id, id);
  }

  @Post(':id/run')
  @ApiOperation({ summary: 'Thực thi ngay lập tức khoản định kỳ này' })
  executeNow(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.recurringService.executeRuleNow(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa khoản định kỳ' })
  deleteRule(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.recurringService.deleteRule(user.id, id);
  }
}
