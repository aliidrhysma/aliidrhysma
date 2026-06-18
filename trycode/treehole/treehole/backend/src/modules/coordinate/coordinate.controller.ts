import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { CoordinateService } from './coordinate.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('v1/coordinate')
export class CoordinateController {
  constructor(private coordinateService: CoordinateService) {}

  /**
   * 获取当前坐标信息
   * GET /api/v1/coordinate/info
   */
  @Get('info')
  @UseGuards(JwtAuthGuard)
  async getCoordinateInfo(@Req() req: any) {
    return await this.coordinateService.getCoordinateInfo(req.user.userId);
  }

  /**
   * 获取可用坐标数量
   * GET /api/v1/coordinate/available-count
   */
  @Get('available-count')
  async getAvailableCount() {
    const count = await this.coordinateService.getAvailableCount();
    return { availableCount: count };
  }
}
