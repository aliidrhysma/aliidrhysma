import { Controller, Post, Get, UseGuards, Body, Req } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('v1/report')
export class ReportController {
  constructor(private reportService: ReportService) {}

  /**
   * 提交举报
   * POST /api/v1/report
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async submitReport(@Req() req: any, @Body() dto: any) {
    return await this.reportService.submitReport(req.user.userId, dto);
  }

  /**
   * 获取可举报内容
   * GET /api/v1/report/reportable
   */
  @Get('reportable')
  @UseGuards(JwtAuthGuard)
  async getReportable(@Req() req: any) {
    return await this.reportService.getReportableContent(req.user.userId);
  }
}
