import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, TransactionType, TransactionNature, TransactionSource, TransactionStatus, AccountType } from '@saving-money/database';
import { CreateTransactionDto } from '@saving-money/shared-types';

@Injectable()
export class TransactionsService {
  async getTransactions(userId: string, query?: { categoryId?: string; type?: TransactionType; limit?: number }) {
    return prisma.transaction.findMany({
      where: {
        userId,
        status: TransactionStatus.CONFIRMED,
        ...(query?.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query?.type ? { type: query.type } : {}),
      },
      include: {
        category: true,
        account: true,
        toAccount: true,
      },
      orderBy: { occurredAt: 'desc' },
      take: query?.limit ? Number(query.limit) : 100,
    });
  }

  async createTransaction(userId: string, dto: CreateTransactionDto) {
    const account = await prisma.account.findFirst({
      where: { id: dto.accountId, userId },
    });
    if (!account) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    const amount = Number(dto.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Số tiền không hợp lệ');
    }

    return prisma.$transaction(async (tx) => {
      // Cập nhật số dư tài khoản
      if (dto.type === TransactionType.EXPENSE) {
        await tx.account.update({
          where: { id: account.id },
          data: { currentBalance: { decrement: amount } },
        });
      } else if (dto.type === TransactionType.INCOME) {
        await tx.account.update({
          where: { id: account.id },
          data: { currentBalance: { increment: amount } },
        });
      }

      return tx.transaction.create({
        data: {
          userId,
          accountId: account.id,
          categoryId: dto.categoryId || null,
          toAccountId: dto.toAccountId || null,
          type: dto.type,
          amount,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
          nature: dto.nature || TransactionNature.ESSENTIAL,
          note: dto.note || 'Chi tiêu',
          source: TransactionSource.MANUAL,
          status: TransactionStatus.CONFIRMED,
        },
        include: {
          category: true,
          account: true,
        },
      });
    });
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const txItem = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!txItem) {
      throw new NotFoundException('Không tìm thấy giao dịch');
    }

    return prisma.$transaction(async (tx) => {
      // Hoàn lại số dư tài khoản
      if (txItem.type === TransactionType.EXPENSE) {
        await tx.account.update({
          where: { id: txItem.accountId },
          data: { currentBalance: { increment: txItem.amount } },
        });
      } else if (txItem.type === TransactionType.INCOME) {
        await tx.account.update({
          where: { id: txItem.accountId },
          data: { currentBalance: { decrement: txItem.amount } },
        });
      } else if (txItem.type === TransactionType.TRANSFER && txItem.toAccountId) {
        // Hoàn lại chuyển khoản
        await tx.account.update({
          where: { id: txItem.accountId },
          data: { currentBalance: { increment: txItem.amount } },
        });
        await tx.account.update({
          where: { id: txItem.toAccountId },
          data: { currentBalance: { decrement: txItem.amount } },
        });
      }

      return tx.transaction.delete({
        where: { id: txItem.id },
      });
    });
  }

  // ================= CATEGORIES CRUD & STATS ================= //

  async getCategories(userId: string) {
    return prisma.category.findMany({
      where: {
        OR: [{ isSystem: true }, { userId }],
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  async createCategory(userId: string, data: { name: string; icon?: string; color?: string; defaultNature?: TransactionNature }) {
    return prisma.category.create({
      data: {
        userId,
        name: data.name,
        icon: data.icon || 'tag',
        color: data.color || '#6366f1',
        defaultNature: data.defaultNature || TransactionNature.ESSENTIAL,
        isSystem: false,
      },
    });
  }

  async updateCategory(userId: string, categoryId: string, data: { name?: string; icon?: string; color?: string; defaultNature?: TransactionNature }) {
    const cat = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!cat) {
      throw new NotFoundException('Không tìm thấy danh mục hoặc không có quyền sửa');
    }

    return prisma.category.update({
      where: { id: cat.id },
      data,
    });
  }

  async deleteCategory(userId: string, categoryId: string) {
    const cat = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!cat) {
      throw new NotFoundException('Không tìm thấy danh mục hoặc không có quyền xóa');
    }

    // Set categoryId to null for existing transactions before deleting
    await prisma.transaction.updateMany({
      where: { categoryId: cat.id },
      data: { categoryId: null },
    });

    return prisma.category.delete({
      where: { id: cat.id },
    });
  }

  async getCategoryReports(userId: string) {
    const categories = await this.getCategories(userId);
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.CONFIRMED,
      },
    });

    const totalExpense = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    const report = categories.map((cat) => {
      const catTransactions = transactions.filter((t) => t.categoryId === cat.id);
      const totalAmount = catTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const percentage = totalExpense > 0 ? Math.round((totalAmount / totalExpense) * 100) : 0;

      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isSystem: cat.isSystem,
        totalAmount,
        transactionCount: catTransactions.length,
        percentage,
      };
    });

    // Also include unclassified expenses if any
    const uncategorizedTx = transactions.filter((t) => !t.categoryId);
    const uncategorizedAmount = uncategorizedTx.reduce((sum, t) => sum + Number(t.amount), 0);
    if (uncategorizedAmount > 0) {
      report.push({
        id: 'uncategorized',
        name: 'Chưa phân loại',
        icon: 'help-circle',
        color: '#94a3b8',
        isSystem: true,
        totalAmount: uncategorizedAmount,
        transactionCount: uncategorizedTx.length,
        percentage: totalExpense > 0 ? Math.round((uncategorizedAmount / totalExpense) * 100) : 0,
      });
    }

    // Sắp xếp danh mục theo số tiền chi từ cao xuống thấp
    report.sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      totalExpense,
      report,
    };
  }
}
