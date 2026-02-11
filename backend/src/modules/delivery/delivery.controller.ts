import { Controller, Get, Put, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, DeliveryStatus } from '../../common/enums';

@ApiTags('配送管理')
@Controller('delivery')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('tasks')
  @Roles(UserRole.DELIVERY)
  @ApiOperation({ summary: '获取我的配送任务' })
  async getMyTasks(@Request() req: any) {
    return this.deliveryService.getMyTasks(req.user.sub);
  }

  @Get('stats')
  @Roles(UserRole.DELIVERY)
  @ApiOperation({ summary: '获取配送统计' })
  async getMyStats(@Request() req: any) {
    return this.deliveryService.getDeliveryStats(req.user.sub);
  }

  @Put('status')
  @Roles(UserRole.DELIVERY)
  @ApiOperation({ summary: '更新配送员状态' })
  async updateStatus(@Request() req: any, @Body('status') status: DeliveryStatus) {
    return this.deliveryService.updateStatus(req.user.sub, status);
  }

  @Get('all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '获取所有配送员列表（管理员）' })
  async getAllDeliveryPersons() {
    return this.deliveryService.getAllDeliveryPersons();
  }
}
