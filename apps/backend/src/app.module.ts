import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { CyclesModule } from './modules/cycles/cycles.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { RecurringModule } from './modules/recurring/recurring.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { DevicesModule } from './modules/devices/devices.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    AccountsModule,
    CyclesModule,
    TransactionsModule,
    RecurringModule,
    WebhooksModule,
    DevicesModule,
  ],
})
export class AppModule {}
