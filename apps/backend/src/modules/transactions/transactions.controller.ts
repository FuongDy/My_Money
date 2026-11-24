import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTransactionDto } from '@saving-money/shared-types';
import { TransactionType, TransactionNature } from '@saving-money/database';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách lịch sử giao dịch (hỗ trợ lọc theo categoryId)' })
  getTransactions(
    @CurrentUser() user: { id: string },
    @Query('categoryId') categoryId?: string,
    @Query('type') type?: TransactionType,
    @Query('limit') limit?: number,
  ) {
    return this.transactionsService.getTransactions(user.id, { categoryId, type, limit });
  }

  @Post()
  @ApiOperation({ summary: 'Ghi chi tiêu thủ công nhanh' })
  createTransaction(@CurrentUser() user: { id: string }, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.createTransaction(user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa giao dịch và hoàn lại số dư tài khoản' })
  deleteTransaction(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.transactionsService.deleteTransaction(user.id, id);
  }

  // ================= CATEGORIES CRUD & REPORTS ================= //

  @Get('categories')
  @ApiOperation({ summary: 'Lấy danh sách tất cả danh mục chi tiêu' })
  getCategories(@CurrentUser() user: { id: string }) {
    return this.transactionsService.getCategories(user.id);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Tạo danh mục mới' })
  createCategory(
    @CurrentUser() user: { id: string },
    @Body() body: { name: string; icon?: string; color?: string; defaultNature?: TransactionNature },
  ) {
    return this.transactionsService.createCategory(user.id, body);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Cập nhật danh mục' })
  updateCategory(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: { name?: string; icon?: string; color?: string; defaultNature?: TransactionNature },
  ) {
    return this.transactionsService.updateCategory(user.id, id, body);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Xóa danh mục riêng của người dùng' })
  deleteCategory(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.transactionsService.deleteCategory(user.id, id);
  }

  @Get('category-reports')
  @ApiOperation({ summary: 'Báo cáo thống kê tổng tiền theo từng danh mục' })
  getCategoryReports(@CurrentUser() user: { id: string }) {
    return this.transactionsService.getCategoryReports(user.id);
  }
}
