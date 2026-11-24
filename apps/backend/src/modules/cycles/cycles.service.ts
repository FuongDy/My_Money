import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, CycleStatus, TransactionType, TransactionNature, TransactionStatus } from '@saving-money/database';
import { CreateCycleDto } from '@saving-money/shared-types';

@Injectable()
export class CyclesService {
  async getActiveCycle(userId: string) {
    let cycle = await prisma.cycle.findFirst({
      where: { userId, status: CycleStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });

    if (!cycle) {
      // Auto-create active cycle for current month if none exists
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      cycle = await prisma.cycle.create({
        data: {
          userId,
          name: `Chu kỳ Tháng ${now.getMonth() + 1}/${now.getFullYear()}`,
          startDate,
          endDate,
          dailySpendLimit: 150000,
          dailySavingTarget: 30000,
          status: CycleStatus.ACTIVE,
        },
      });
    }

    return cycle;
  }

  async getAllCycles(userId: string) {
    return prisma.cycle.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  async updateActiveCycle(userId: string, dto: { dailySpendLimit?: number; dailySavingTarget?: number; name?: string }) {
    const cycle = await this.getActiveCycle(userId);
    return prisma.cycle.update({
      where: { id: cycle.id },
      data: {
        ...(dto.dailySpendLimit !== undefined ? { dailySpendLimit: Number(dto.dailySpendLimit) } : {}),
        ...(dto.dailySavingTarget !== undefined ? { dailySavingTarget: Number(dto.dailySavingTarget) } : {}),
        ...(dto.name ? { name: dto.name } : {}),
      },
    });
  }

  async createCycle(userId: string, dto: CreateCycleDto) {
    // If setting as active, archive previous ones
    await prisma.cycle.updateMany({
      where: { userId, status: CycleStatus.ACTIVE },
      data: { status: CycleStatus.COMPLETED },
    });

    return prisma.cycle.create({
      data: {
        userId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        dailySpendLimit: dto.dailySpendLimit || 150000,
        dailySavingTarget: dto.dailySavingTarget || 30000,
        status: CycleStatus.ACTIVE,
      },
    });
  }

  async getCycleStatistics(userId: string, cycleId?: string) {
    const cycle = cycleId
      ? await prisma.cycle.findUnique({ where: { id: cycleId } })
      : await this.getActiveCycle(userId);

    if (!cycle || cycle.userId !== userId) {
      throw new NotFoundException('Không tìm thấy chu kỳ');
    }

    const now = new Date();
    const startDate = new Date(cycle.startDate);
    const endDate = new Date(cycle.endDate);

    const msPerDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1);
    
    // Days passed calculation
    let daysPassed = Math.round((now.getTime() - startDate.getTime()) / msPerDay) + 1;
    if (daysPassed < 1) daysPassed = 1;
    if (daysPassed > totalDays) daysPassed = totalDays;

    const daysRemaining = Math.max(0, totalDays - daysPassed);

    // Get all transactions in this cycle
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        occurredAt: {
          gte: startDate,
          lte: new Date(endDate.getTime() + msPerDay),
        },
      },
    });

    const confirmedTx = transactions.filter((t) => t.status === TransactionStatus.CONFIRMED);
    const pendingCount = transactions.filter((t) => t.status === TransactionStatus.PENDING).length;

    // Spending metrics
    const expenses = confirmedTx.filter((t) => t.type === TransactionType.EXPENSE);
    const totalSpent = expenses.reduce((acc, t) => acc + Number(t.amount), 0);

    const essentialSpent = expenses
      .filter((t) => t.nature === TransactionNature.ESSENTIAL)
      .reduce((acc, t) => acc + Number(t.amount), 0);
    const flexibleSpent = expenses
      .filter((t) => t.nature === TransactionNature.FLEXIBLE)
      .reduce((acc, t) => acc + Number(t.amount), 0);
    const unexpectedSpent = expenses
      .filter((t) => t.nature === TransactionNature.UNEXPECTED)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    // Today's spending
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + msPerDay);
    const todayExpenses = expenses.filter((t) => {
      const d = new Date(t.occurredAt);
      return d >= todayStart && d < todayEnd;
    });
    const todaySpent = todayExpenses.reduce((acc, t) => acc + Number(t.amount), 0);

    const dailyLimit = Number(cycle.dailySpendLimit);
    const todayRemainingLimit = dailyLimit - todaySpent;
    const isTodayOverLimit = todaySpent > dailyLimit;

    // 30K Savings Target metrics
    const dailySavingTarget = Number(cycle.dailySavingTarget);
    const expectedSavingSoFar = daysPassed * dailySavingTarget;

    // Actual savings = transfers from daily to savings or income into savings
    const transfersToSavings = confirmedTx.filter((t) => t.type === TransactionType.TRANSFER && t.toAccountId != null);
    const actualSavedSoFar = transfersToSavings.reduce((acc, t) => acc + Number(t.amount), 0);

    const savingProgressPercent = expectedSavingSoFar > 0
      ? Math.min(100, Math.round((actualSavedSoFar / (totalDays * dailySavingTarget)) * 100))
      : 0;

    // Check if user has executed 30K saving today
    const hasSavedToday = transfersToSavings.some((t) => {
      const d = new Date(t.occurredAt);
      return d >= todayStart && d < todayEnd;
    });

    return {
      cycle,
      totalDays,
      daysPassed,
      daysRemaining,
      totalSpent,
      todaySpent,
      dailyLimit,
      todayRemainingLimit,
      isTodayOverLimit,
      essentialSpent,
      flexibleSpent,
      unexpectedSpent,
      dailySavingTarget,
      expectedSavingSoFar,
      actualSavedSoFar,
      totalTargetSaving: totalDays * dailySavingTarget,
      savingProgressPercent,
      hasSavedToday,
      pendingCount,
    };
  }
}
