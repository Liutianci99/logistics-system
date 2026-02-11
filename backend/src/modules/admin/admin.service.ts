import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Order } from '../../entities/order.entity';
import { OrderLog } from '../../entities/order-log.entity';
import { OrderStatus, UserRole } from '../../common/enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderLog)
    private readonly orderLogRepository: Repository<OrderLog>,
  ) {}

  // 仪表盘统计
  async getDashboard() {
    const totalUsers = await this.userRepository.count();
    const totalOrders = await this.orderRepository.count();
    const pendingOrders = await this.orderRepository.count({ where: { status: OrderStatus.PENDING } });
    const abnormalOrders = await this.orderRepository.count({ where: { status: OrderStatus.ABNORMAL } });
    const completedOrders = await this.orderRepository.count({ where: { status: OrderStatus.SIGNED } });

    const usersByRole = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const ordersByStatus = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    return {
      totalUsers,
      totalOrders,
      pendingOrders,
      abnormalOrders,
      completedOrders,
      usersByRole,
      ordersByStatus,
    };
  }

  // 获取异常日志
  async getAbnormalLogs(page = 1, limit = 20) {
    const [logs, total] = await this.orderLogRepository.findAndCount({
      where: { action: '标记异常' },
      relations: ['order', 'operator'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { logs, total, page, limit };
  }

  // 获取所有日志
  async getAllLogs(query: any) {
    const { page = 1, limit = 50, action } = query;
    const qb = this.orderLogRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.order', 'order')
      .leftJoinAndSelect('log.operator', 'operator');

    if (action) {
      qb.where('log.action = :action', { action });
    }

    qb.orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [logs, total] = await qb.getManyAndCount();
    return { logs, total, page: +page, limit: +limit };
  }

  // 获取用户列表
  async getUsers(page = 1, limit = 20) {
    const [users, total] = await this.userRepository.findAndCount({
      select: ['id', 'username', 'email', 'phone', 'realName', 'role', 'isActive', 'shopName', 'deliveryStatus', 'createdAt'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { users, total, page, limit };
  }

  // 切换用户启用/禁用
  async toggleUserActive(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    user.isActive = !user.isActive;
    await this.userRepository.save(user);
    return { message: user.isActive ? '已启用' : '已禁用', isActive: user.isActive };
  }
}
