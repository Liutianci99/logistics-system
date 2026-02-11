import {
  Controller, Get, Post, Put, Param, Body, Query, Request,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('订单管理')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: '顾客创建订单' })
  async create(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.sub, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: '获取订单列表（根据角色自动筛选）' })
  async findAll(@Request() req: any, @Query() query: any) {
    return this.ordersService.getOrders(req.user.sub, req.user.role, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订单详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOrderDetail(id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: '获取订单日志' })
  async getLogs(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOrderLogs(id);
  }

  @Put(':id/confirm')
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: '商家确认订单' })
  async confirm(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.confirmOrder(req.user.sub, id);
  }

  @Put(':id/pickup')
  @Roles(UserRole.DELIVERY)
  @ApiOperation({ summary: '配送员取件' })
  async pickUp(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.pickUpOrder(req.user.sub, id);
  }

  @Put(':id/start-delivery')
  @Roles(UserRole.DELIVERY)
  @ApiOperation({ summary: '配送员开始配送' })
  async startDelivery(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.startDelivery(req.user.sub, id);
  }

  @Put(':id/deliver')
  @Roles(UserRole.DELIVERY)
  @ApiOperation({ summary: '配送员确认送达' })
  async deliver(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.deliverOrder(req.user.sub, id);
  }

  @Put(':id/sign')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: '顾客签收' })
  async sign(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.signOrder(req.user.sub, id);
  }

  @Put(':id/cancel')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: '取消订单' })
  async cancel(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.cancelOrder(req.user.sub, id, req.user.role);
  }

  @Put(':id/abnormal')
  @Roles(UserRole.DELIVERY, UserRole.ADMIN)
  @ApiOperation({ summary: '标记异常' })
  async markAbnormal(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.markAbnormal(req.user.sub, id, reason);
  }
}
