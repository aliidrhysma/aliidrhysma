import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateUserInfoDto } from '../../common/dto/auth.dto';

@Controller('v1/user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('info')
  async getUserInfo(@Request() req) {
    return this.userService.getUserInfo(req.user.userId);
  }

  @Put('info')
  async updateUserInfo(
    @Request() req,
    @Body() dto: UpdateUserInfoDto,
  ) {
    return this.userService.updateUserInfo(req.user.userId, dto);
  }

  /**
   * 获取个人主页
   * GET /api/v1/user/home
   */
  @Get('home')
  async getUserHome(@Request() req) {
    return await this.userService.getUserHome(req.user.userId);
  }
}
