import { Controller, Post, Get, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { MessageService } from './message.service';
import { SendMessageDto } from '../../common/dto/message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('v1/message')
export class MessageController {
  constructor(private messageService: MessageService) {}

  /**
   * 发送留言
   * POST /api/v1/message/send
   */
  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendMessage(@Req() req: any, @Body() dto: SendMessageDto) {
    return await this.messageService.sendMessage(req.user.userId, dto);
  }

  /**
   * 获取坐标留言列表
   * GET /api/v1/message/coordinate-messages
   */
  @Get('coordinate-messages')
  @UseGuards(JwtAuthGuard)
  async getCoordinateMessages(@Req() req: any) {
    return await this.messageService.getCoordinateMessages(req.user.userId);
  }

  /**
   * 获取留言详情
   * GET /api/v1/message/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getMessageDetail(@Req() req: any, @Param('id') id: string) {
    return await this.messageService.getMessageDetail(req.user.userId, id);
  }

  /**
   * 标记留言已读
   * PUT /api/v1/message/:id/read
   */
  @Put(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    await this.messageService.markAsRead(req.user.userId, id);
    return { message: '标记成功' };
  }

  /**
   * 获取用户发送的留言
   * GET /api/v1/message/sent
   */
  @Get('sent')
  @UseGuards(JwtAuthGuard)
  async getSentMessages(@Req() req: any) {
    return await this.messageService.getUserSentMessages(req.user.userId);
  }
}
