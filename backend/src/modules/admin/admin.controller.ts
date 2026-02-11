import { Controller, Get, Put, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('管理员')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '获取管理仪表盘数据' })
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('logs')
  @ApiOperation({ summary: '获取所有操作日志' })
  async getAllLogs(@Query() query: any) {
    return this.adminService.getAllLogs(query);
  }

  @Get('users')
  @ApiOperation({ summary: '获取用户列表' })
  async getUsers(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.getUsers(+page, +limit);
  }

  @Put('users/:id/toggle')
  @ApiOperation({ summary: '切换用户启用/禁用状态' })
  async toggleUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.toggleUserActive(id);
  }
}
