import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { IngestNotificationDto } from '@saving-money/shared-types';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('capture/:secretKey')
  @ApiOperation({
    summary: 'Webhook nhận thông báo biến động số dư từ iOS Shortcuts hoặc Android Notification Listener',
    description: 'Chỉ cần truyền rawMessage vào body, hệ thống tự động bóc tách số tiền và tạo giao dịch PENDING.',
  })
  handleIncoming(
    @Param('secretKey') secretKey: string,
    @Body() dto: IngestNotificationDto,
  ) {
    return this.webhooksService.processIncomingNotification(secretKey, dto);
  }

  @Get('instructions/:secretKey')
  @ApiOperation({ summary: 'Xem hướng dẫn cài đặt Apple Shortcuts và Android Listener' })
  getInstructions(@Param('secretKey') secretKey: string) {
    return {
      webhookUrl: `https://YOUR_DOMAIN/api/v1/webhooks/capture/${secretKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      sampleBody: {
        rawMessage: 'TK 123456 tai VCB -45,000 VND vao 12:30. ND: Com trua',
        sender: 'Vietcombank',
      },
      iosShortcutSteps: [
        '1. Mở ứng dụng Phím tắt (Shortcuts) trên iPhone -> Tab Tự động hóa (Automation).',
        '2. Chọn Tạo mục tự động hóa cá nhân -> Khi nhận được Tin nhắn (từ MB, Vietcombank, Momo...) hoặc Khi dùng Apple Pay.',
        '3. Thêm tác vụ: "Lấy nội dung của URL" (Get Contents of URL).',
        '4. Điền URL là webhookUrl ở trên, Method: POST, Body là JSON truyền Nội dung tin nhắn vào trường rawMessage.',
        '5. Tắt "Hỏi trước khi chạy" để phím tắt tự động kích hoạt ngầm 100%!',
      ],
    };
  }
}
