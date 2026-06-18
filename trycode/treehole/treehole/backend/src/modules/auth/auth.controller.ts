import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, UpdateUserInfoDto } from '../../common/dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * 用户注册
   * POST /api/v1/auth/register
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() req: any) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    return await this.authService.register(registerDto, ipAddress);
  }

  /**
   * 用户登录
   * POST /api/v1/auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    return await this.authService.login(loginDto, ipAddress);
  }

  /**
   * 退出登录
   * POST /api/v1/auth/logout
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    await this.authService.logout(req.user.userId);
    return { message: '退出成功' };
  }

  /**
   * 获取当前用户信息
   * GET /api/v1/auth/user-info
   */
  @Get('user-info')
  @UseGuards(JwtAuthGuard)
  async getUserInfo(@Req() req: any) {
    return await this.authService.getUserInfo(req.user.userId);
  }

  /**
   * 更新用户信息
   * PUT /api/v1/auth/user-info
   */
  @Put('user-info')
  @UseGuards(JwtAuthGuard)
  async updateUserInfo(@Req() req: any, @Body() updateDto: UpdateUserInfoDto) {
    return await this.authService.updateUserInfo(req.user.userId, updateDto);
  }
}
