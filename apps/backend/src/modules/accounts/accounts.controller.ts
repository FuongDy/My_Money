import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QuickSave30kDto } from '@saving-money/shared-types';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách 2 tài khoản (Daily & Savings) của user' })
  getAccounts(@CurrentUser() user: { id: string }) {
    return this.accountsService.getAccounts(user.id);
  }

  @Post('quick-save-30k')
  @ApiOperation({ summary: '1 Chạm: Chuyển 30K (hoặc kèm tiền dư) từ Daily sang Savings' })
  quickSave30k(@CurrentUser() user: { id: string }, @Body() dto: QuickSave30kDto) {
    return this.accountsService.quickSave30k(user.id, dto);
  }

  @Patch(':id/balance')
  @ApiOperation({ summary: 'Điều chỉnh số dư tài khoản' })
  updateBalance(
    @CurrentUser() user: { id: string },
    @Param('id') accountId: string,
    @Body('balance') balance: number,
  ) {
    return this.accountsService.updateBalance(user.id, accountId, balance);
  }
}
