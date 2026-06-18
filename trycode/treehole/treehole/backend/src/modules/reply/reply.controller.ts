import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ReplyService } from './reply.service';
import { SendMessageDto } from '../../common/dto/message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('v1/reply')
export class ReplyController {
  constructor(private replyService: ReplyService) {}

  /**
   * 发送回复
   * POST /api/v1/reply/send
   */
  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendReply(@Req() req: any, @Body() dto: SendMessageDto, @Body('msgId') msgId: string) {
    return await this.replyService.sendReply(req.user.userId, msgId, dto);
  }

  /**
   * 获取用户收到的回复
   * GET /api/v1/reply/received
   */
  @Get('received')
  @UseGuards(JwtAuthGuard)
  async getReceivedReplies(@Req() req: any) {
    return await this.replyService.getUserReplies(req.user.userId);
  }
}
