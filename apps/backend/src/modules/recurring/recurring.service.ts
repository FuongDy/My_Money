import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { prisma, RecurringFrequency, TransactionType, TransactionNature, TransactionSource, TransactionStatus, AccountType } from '@saving-money/database';
import { CreateRecurringRuleDto } from '@saving-money/shared-types';

@Injectable()
export class RecurringService {
  private readonly logger = new Logger(RecurringService.name);

  async getRules(userId: string) {
    return prisma.recurringRule.findMany({
      where: { userId },
      include: {
        account: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRule(userId: string, dto: CreateRecurringRuleDto) {
    const amount = Number(dto.amount);
    return prisma.recurringRule.create({
      data: {
        userId,
        accountId: dto.accountId,
        categoryId: dto.categoryId || null,
        title: dto.title,
        amount,
        type: dto.type || TransactionType.EXPENSE,
        nature: dto.nature || TransactionNature.ESSENTIAL,
        frequency: dto.frequency || RecurringFrequency.DAILY,
        dayOfMonth: dto.dayOfMonth || null,
        dayOfWeek: dto.dayOfWeek !== undefined ? dto.dayOfWeek : null,
        monthOfYear: dto.monthOfYear || null,
        isActive: true,
      },
      include: {
        category: true,
      },
    });
  }

  async toggleRule(userId: string, ruleId: string) {
    const rule = await prisma.recurringRule.findFirst({
      where: { id: ruleId, userId },
    });
    if (!rule) throw new NotFoundException('Không tìm thấy khoản định kỳ');

    return prisma.recurringRule.update({
      where: { id: rule.id },
      data: { isActive: !rule.isActive },
    });
  }

  async deleteRule(userId: string, ruleId: string) {
    const rule = await prisma.recurringRule.findFirst({
      where: { id: ruleId, userId },
    });
    if (!rule) throw new NotFoundException('Không tìm thấy khoản định kỳ');

    return prisma.recurringRule.delete({
      where: { id: rule.id },
    });
  }

  // Thực thi một quy tắc định kỳ ngay lập tức (1 chạm hoặc chạy tự động)
  async executeRule(rule: any) {
    const now = new Date();
    const amount = Number(rule.amount);

    return prisma.$transaction(async (tx) => {
      // 1. Cập nhật số dư
      let targetAccountId: string | null = null;
      if (rule.type === TransactionType.EXPENSE) {
        await tx.account.update({
          where: { id: rule.accountId },
          data: { currentBalance: { decrement: amount } },
        });
      } else if (rule.type === TransactionType.INCOME) {
        await tx.account.update({
          where: { id: rule.accountId },
          data: { currentBalance: { increment: amount } },
        });
      } else if (rule.type === TransactionType.TRANSFER) {
        // Chuyển tiền từ rule.accountId sang tài khoản còn lại
        const targetAccount = await tx.account.findFirst({
          where: { userId: rule.userId, id: { not: rule.accountId } },
        });
        if (targetAccount) {
          targetAccountId = targetAccount.id;
          await tx.account.update({
            where: { id: rule.accountId },
            data: { currentBalance: { decrement: amount } },
          });
          await tx.account.update({
            where: { id: targetAccount.id },
            data: { currentBalance: { increment: amount } },
          });
        }
      }

      // 2. Ghi nhật ký giao dịch
      const newTx = await tx.transaction.create({
        data: {
          userId: rule.userId,
          accountId: rule.accountId,
          toAccountId: targetAccountId,
          categoryId: rule.categoryId,
          type: rule.type,
          amount,
          nature: rule.nature,
          note: `[Cố định] ${rule.title}`,
          source: TransactionSource.RECURRING,
          status: TransactionStatus.CONFIRMED,
        },
      });

      // 3. Cập nhật thời gian chạy gần nhất
      await tx.recurringRule.update({
        where: { id: rule.id },
        data: { lastRunAt: now },
      });

      return newTx;
    });
  }

  async executeRuleNow(userId: string, ruleId: string) {
    const rule = await prisma.recurringRule.findFirst({
      where: { id: ruleId, userId },
    });
    if (!rule) throw new NotFoundException('Không tìm thấy khoản định kỳ');

    return this.executeRule(rule);
  }

  // Chạy tự động vào lúc 00:05 mỗi ngày
  @Cron('5 0 * * *')
  async handleDailyCron() {
    this.logger.log('Bắt đầu quét và thực thi các khoản định kỳ cố định...');
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0: CN, 1: T2, ..., 6: T7
    const dayOfMonth = now.getDate(); // 1 - 31
    const monthOfYear = now.getMonth() + 1; // 1 - 12

    const activeRules = await prisma.recurringRule.findMany({
      where: { isActive: true },
    });

    for (const rule of activeRules) {
      let shouldRun = false;

      if (rule.frequency === RecurringFrequency.DAILY) {
        shouldRun = true;
      } else if (rule.frequency === RecurringFrequency.WEEKDAY && dayOfWeek >= 1 && dayOfWeek <= 5) {
        shouldRun = true;
      } else if (rule.frequency === RecurringFrequency.WEEKEND && (dayOfWeek === 0 || dayOfWeek === 6)) {
        shouldRun = true;
      } else if (rule.frequency === RecurringFrequency.WEEKLY && rule.dayOfWeek === dayOfWeek) {
        shouldRun = true;
      } else if (rule.frequency === RecurringFrequency.MONTHLY && rule.dayOfMonth === dayOfMonth) {
        shouldRun = true;
      } else if (rule.frequency === RecurringFrequency.YEARLY && rule.dayOfMonth === dayOfMonth && rule.monthOfYear === monthOfYear) {
        shouldRun = true;
      }

      if (shouldRun) {
        try {
          await this.executeRule(rule);
          this.logger.log(`Đã thực thi thành công khoản "${rule.title}" cho user: ${rule.userId}`);
        } catch (err) {
          this.logger.error(`Lỗi thực thi khoản định kỳ id ${rule.id}:`, err);
        }
      }
    }
  }
}
