import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { prisma, TransactionType, TransactionNature, TransactionSource, TransactionStatus, AccountType } from '@saving-money/database';
import { IngestNotificationDto } from '@saving-money/shared-types';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  // Phân tích tin nhắn biến động số dư từ các ngân hàng phổ biến tại VN
  parseBankMessage(rawMessage: string) {
    let amount = 0;
    let type: TransactionType = TransactionType.EXPENSE;
    let bankName = 'Ngân hàng';

    // 1. Nhận diện ngân hàng
    const upperMsg = rawMessage.toUpperCase();
    if (upperMsg.includes('MBBANK') || upperMsg.includes('MB BANK') || upperMsg.includes('MB:')) {
      bankName = 'MB Bank';
    } else if (upperMsg.includes('TECHCOMBANK') || upperMsg.includes('TCB')) {
      bankName = 'Techcombank';
    } else if (upperMsg.includes('VIETCOMBANK') || upperMsg.includes('VCB')) {
      bankName = 'Vietcombank';
    } else if (upperMsg.includes('TPBANK') || upperMsg.includes('TPB')) {
      bankName = 'TPBank';
    } else if (upperMsg.includes('ACB')) {
      bankName = 'ACB';
    } else if (upperMsg.includes('VPBANK') || upperMsg.includes('VPB')) {
      bankName = 'VPBank';
    } else if (upperMsg.includes('MOMO')) {
      bankName = 'MoMo';
    } else if (upperMsg.includes('APPLE PAY')) {
      bankName = 'Apple Pay';
    }

    // 2. Nhận diện loại giao dịch (Cộng tiền hay Trừ tiền)
    if (
      upperMsg.includes('+') ||
      upperMsg.includes('NHAN TIEN') ||
      upperMsg.includes('CONG TIEN') ||
      upperMsg.includes('CR:')
    ) {
      type = TransactionType.INCOME;
    } else {
      type = TransactionType.EXPENSE; // Mặc định trừ tiền
    }

    // 3. Regex bóc tách số tiền: Tìm chuỗi số có định dạng VNĐ (VD: -45,000VND, 150.000d, 50,000 VND)
    const amountRegex = /(?:[-+]?\s*)([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]+)\s*(?:VND|VNĐ|đ|d|dong)/i;
    const match = rawMessage.match(amountRegex);

    if (match && match[1]) {
      // Chuẩn hóa dấu chấm/phẩy ngăn cách hàng nghìn
      const cleanNumStr = match[1].replace(/[.,]/g, '');
      amount = parseFloat(cleanNumStr);
    }

    // Trích xuất nội dung giao dịch (ND: ...)
    const noteMatch = rawMessage.match(/(?:ND|Noi dung|NoiDung|Ref|Content):\s*([^.\n]+)/i);
    const note = noteMatch ? noteMatch[1].trim() : rawMessage.slice(0, 100);

    return {
      amount,
      type,
      bankName,
      note,
    };
  }

  async processIncomingNotification(secretKey: string, dto: IngestNotificationDto) {
    const user = await prisma.user.findUnique({
      where: { webhookSecretKey: secretKey },
      include: {
        accounts: {
          where: { type: AccountType.DAILY },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Webhook Secret Key không hợp lệ');
    }

    const dailyAccount = user.accounts[0];
    if (!dailyAccount) {
      throw new NotFoundException('Người dùng chưa có tài khoản chi tiêu hằng ngày');
    }

    const parsed = this.parseBankMessage(dto.rawMessage);
    const finalAmount = dto.detectedAmount || parsed.amount;

    if (finalAmount <= 0) {
      this.logger.warn(`Không bóc tách được số tiền từ tin nhắn: "${dto.rawMessage}"`);
    }

    // Tạo giao dịch PENDING chờ người dùng xác nhận
    const pendingTx = await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: dailyAccount.id,
        type: parsed.type,
        amount: finalAmount > 0 ? finalAmount : 0,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
        nature: TransactionNature.FLEXIBLE, // Mặc định là khoản linh hoạt, người dùng sẽ chọn lại
        note: `[Tự động từ ${dto.sender || parsed.bankName}] ${parsed.note}`,
        source: TransactionSource.AUTO_IOS_SHORTCUT,
        status: TransactionStatus.PENDING,
        rawPayload: dto.rawMessage,
      },
    });

    this.logger.log(`Đã tạo giao dịch PENDING cho User ${user.email}: ${finalAmount} đ`);
    return {
      success: true,
      transactionId: pendingTx.id,
      amount: finalAmount,
      type: parsed.type,
      status: TransactionStatus.PENDING,
      message: 'Giao dịch đã được ghi nhận vào mục Chờ duyệt',
    };
  }
}
