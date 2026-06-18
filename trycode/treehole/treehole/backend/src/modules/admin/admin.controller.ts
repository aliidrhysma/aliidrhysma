import { Controller, Post, Get, Put, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt.guard';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  /**
   * 管理员登录
   * POST /api/admin/auth/login
   */
  @Post('auth/login')
  async adminLogin(@Body() dto: { username: string; password: string }) {
    return await this.adminService.adminLogin(dto.username, dto.password);
  }

  /**
   * 获取统计数据
   * GET /api/admin/dashboard/stats
   */
  @Get('dashboard/stats')
  @UseGuards(AdminJwtAuthGuard)
  async getDashboardStats() {
    return await this.adminService.getDashboardStats();
  }

  /**
   * 获取用户列表
   * GET /api/admin/users
   */
  @Get('users')
  @UseGuards(AdminJwtAuthGuard)
  async getUsers(
    @Query('page') page: number = 1,
    @Query('size') size: number = 10,
    @Query('status') status?: number,
    @Query('keyword') keyword?: string,
  ) {
    return await this.adminService.getUsers({ page, size, status, keyword });
  }

  /**
   * 获取用户详情
   * GET /api/admin/users/:id
   */
  @Get('users/:id')
  @UseGuards(AdminJwtAuthGuard)
  async getUserDetail(@Param('id') id: string) {
    return await this.adminService.getUserDetail(id);
  }

  /**
   * 获取留言列表
   * GET /api/admin/messages
   */
  @Get('messages')
  @UseGuards(AdminJwtAuthGuard)
  async getMessages(
    @Query('page') page: number = 1,
    @Query('size') size: number = 10,
    @Query('status') status?: number,
    @Query('contentType') contentType?: number,
    @Query('keyword') keyword?: string,
  ) {
    return await this.adminService.getMessages({ page, size, status, contentType, keyword });
  }

  /**
   * 获取举报列表
   * GET /api/admin/reports
   */
  @Get('reports')
  @UseGuards(AdminJwtAuthGuard)
  async getReports(
    @Query('page') page: number = 1,
    @Query('size') size: number = 10,
    @Query('status') status?: number,
    @Query('keyword') keyword?: string,
  ) {
    return await this.adminService.getReports({ page, size, status, keyword });
  }

  /**
   * 处理举报
   * PUT /api/admin/reports/:id
   */
  @Put('reports/:id')
  @UseGuards(AdminJwtAuthGuard)
  async handleReport(@Param('id') id: string, @Body() dto: { result: string }) {
    await this.adminService.handleReport(id, dto.result);
    return { message: '处理成功' };
  }
}
