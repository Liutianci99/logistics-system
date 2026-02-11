import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Order } from '../../entities/order.entity';
import { DeliveryStatus, UserRole } from '../../common/enums';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  // 更新配送员状态
  async updateStatus(deliveryPersonId: number, status: DeliveryStatus) {
    const user = await this.userRepository.findOne({ where: { id: deliveryPersonId } });
    if (!user) throw new NotFoundException('配送员不存在');
    user.deliveryStatus = status;
    await this.userRepository.save(user);
    return { message: '状态已更新', deliveryStatus: status };
  }

  // 获取配送员的当前任务
  async getMyTasks(deliveryPersonId: number) {
    const orders = await this.orderRepository.find({
      where: { deliveryPersonId },
      relations: ['customer', 'merchant'],
      order: { createdAt: 'DESC' },
    });
    return orders;
  }

  // 获取所有配送员列表（管理员用）
  async getAllDeliveryPersons() {
    return this.userRepository.find({
      where: { role: UserRole.DELIVERY },
      select: ['id', 'username', 'realName', 'phone', 'deliveryStatus', 'isActive'],
    });
  }

  // 获取配送统计
  async getDeliveryStats(deliveryPersonId: number) {
    const total = await this.orderRepository.count({ where: { deliveryPersonId } });
    const completed = await this.orderRepository.count({
      where: { deliveryPersonId, status: 'signed' as any },
    });
    const inProgress = await this.orderRepository.count({
      where: [
        { deliveryPersonId, status: 'assigned' as any },
        { deliveryPersonId, status: 'picked_up' as any },
        { deliveryPersonId, status: 'in_transit' as any },
        { deliveryPersonId, status: 'delivered' as any },
      ],
    });

    return { total, completed, inProgress };
  }
}
