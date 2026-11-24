import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, AccountType, TransactionType, TransactionNature, TransactionSource, TransactionStatus } from '@saving-money/database';
import { QuickSave30kDto } from '@saving-money/shared-types';

@Injectable()
export class AccountsService {
  async getAccounts(userId: string) {
    return prisma.account.findMany({
      where: { userId },
      orderBy: { type: 'asc' },
    });
  }

  async quickSave30k(userId: string, dto: QuickSave30kDto) {
    const amount = dto.amount || 30000;
    if (amount <= 0) {
      throw new BadRequestException('Số tiền tiết kiệm phải lớn hơn 0');
    }

    const dailyAccount = await prisma.account.findFirst({
      where: { id: dto.dailyAccountId, userId, type: AccountType.DAILY },
    });
    const savingsAccount = await prisma.account.findFirst({
      where: { id: dto.savingsAccountId, userId, type: AccountType.SAVINGS },
    });

    if (!dailyAccount || !savingsAccount) {
      throw new NotFoundException('Không tìm thấy tài khoản hợp lệ');
    }

    // Execute transfer inside atomic transaction
    return prisma.$transaction(async (tx) => {
      // 1. Trừ tiền TK Hằng ngày
      await tx.account.update({
        where: { id: dailyAccount.id },
        data: { currentBalance: { decrement: amount } },
      });

      // 2. Cộng tiền TK Tiết kiệm
      await tx.account.update({
        where: { id: savingsAccount.id },
        data: { currentBalance: { increment: amount } },
      });

      // 3. Tạo bản ghi giao dịch TRANSFER
      const transaction = await tx.transaction.create({
        data: {
          userId,
          accountId: dailyAccount.id,
          toAccountId: savingsAccount.id,
          type: TransactionType.TRANSFER,
          amount,
          nature: TransactionNature.ESSENTIAL,
          source: TransactionSource.MANUAL,
          status: TransactionStatus.CONFIRMED,
          note: dto.note || `Chốt tiết kiệm 30K (${amount.toLocaleString('vi-VN')} đ)`,
        },
      });

      return transaction;
    });
  }

  async updateBalance(userId: string, accountId: string, balance: number) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) throw new NotFoundException('Không tìm thấy tài khoản');

    return prisma.account.update({
      where: { id: account.id },
      data: { currentBalance: Number(balance) },
    });
  }
}
