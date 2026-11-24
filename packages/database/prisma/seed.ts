import { PrismaClient, TransactionNature } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Ăn uống', icon: 'utensils', color: '#F97316', defaultNature: TransactionNature.ESSENTIAL, isSystem: true },
  { name: 'Cà phê & Trà sữa', icon: 'coffee', color: '#8B5CF6', defaultNature: TransactionNature.FLEXIBLE, isSystem: true },
  { name: 'Xăng xe & Đi lại', icon: 'car', color: '#3B82F6', defaultNature: TransactionNature.ESSENTIAL, isSystem: true },
  { name: 'Nhà ở & Tiện ích', icon: 'home', color: '#10B981', defaultNature: TransactionNature.ESSENTIAL, isSystem: true },
  { name: 'Mua sắm & Giải trí', icon: 'shopping-bag', color: '#EC4899', defaultNature: TransactionNature.FLEXIBLE, isSystem: true },
  { name: 'Phát sinh bất khả kháng', icon: 'alert-triangle', color: '#EF4444', defaultNature: TransactionNature.UNEXPECTED, isSystem: true },
  { name: 'Thu nhập & Thưởng', icon: 'trending-up', color: '#22C55E', defaultNature: TransactionNature.ESSENTIAL, isSystem: true },
  { name: 'Tiết kiệm mục tiêu', icon: 'piggy-bank', color: '#6366F1', defaultNature: TransactionNature.ESSENTIAL, isSystem: true }
];

async function main() {
  console.log('Seeding default categories for Neon DB...');
  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, isSystem: true }
    });
    if (!existing) {
      await prisma.category.create({ data: cat });
    }
  }
  console.log('Finished seeding system categories successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
