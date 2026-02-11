import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { OrderLog } from '../../entities/order-log.entity';
import { User } from '../../entities/user.entity';
import { Product } from '../../entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, UserRole, DeliveryStatus } from '../../common/enums';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderLog)
    private readonly orderLogRepository: Repository<OrderLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // 生成订单号
  private generateOrderNo(): string {
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD${timestamp}${random}`;
  }

  // 记录订单日志
  private async addLog(orderId: number, operatorId: number, action: string, detail: string, fromStatus?: string, toStatus?: string) {
    const log = this.orderLogRepository.create({
      orderId,
      operatorId,
      action,
      detail,
      fromStatus,
      toStatus,
    });
    await this.orderLogRepository.save(log);
  }

  // 顾客创建订单
  async createOrder(customerId: number, createOrderDto: CreateOrderDto) {
    const { productId, quantity, shippingAddress, receiverName, receiverPhone, remark } = createOrderDto;

    // 查找商品
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('商品不存在');
    if (product.stock < quantity) throw new BadRequestException('库存不足');

    const totalPrice = Number(product.price) * quantity;

    // 获取商家的发货地址
    const merchant = await this.userRepository.findOne({ where: { id: product.merchantId } });

    const order = this.orderRepository.create({
      orderNo: this.generateOrderNo(),
      customerId,
      merchantId: product.merchantId,
      productName: product.name,
      quantity,
      totalPrice,
      shippingAddress,
      receiverName,
      receiverPhone,
      senderAddress: merchant?.address || '',
      remark,
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.orderRepository.save(order);

    // 减库存
    product.stock -= quantity;
    await this.productRepository.save(product);

    await this.addLog(savedOrder.id, customerId, '创建订单', `顾客下单，商品: ${product.name}，数量: ${quantity}`);

    return savedOrder;
  }

  // 商家确认订单
  async confirmOrder(merchantId: number, orderId: number) {
    const order = await this.orderRepository.findOne({ where: { id: orderId, merchantId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('订单状态不允许确认');
    }

    order.status = OrderStatus.CONFIRMED;
    order.confirmedAt = new Date();
    await this.orderRepository.save(order);

    // 自动分配配送员
    await this.autoAssignDelivery(order);

    await this.addLog(orderId, merchantId, '确认订单', '商家确认订单', OrderStatus.PENDING, OrderStatus.CONFIRMED);

    return order;
  }

  // 自动分配配送员
  private async autoAssignDelivery(order: Order) {
    const deliveryPerson = await this.userRepository.findOne({
      where: { role: UserRole.DELIVERY, deliveryStatus: DeliveryStatus.AVAILABLE, isActive: true },
    });

    if (deliveryPerson) {
      order.deliveryPersonId = deliveryPerson.id;
      order.status = OrderStatus.ASSIGNED;
      await this.orderRepository.save(order);

      deliveryPerson.deliveryStatus = DeliveryStatus.BUSY;
      await this.userRepository.save(deliveryPerson);

      await this.addLog(order.id, deliveryPerson.id, '分配配送员', `配送员 ${deliveryPerson.realName || deliveryPerson.username} 被分配`, OrderStatus.CONFIRMED, OrderStatus.ASSIGNED);
    }
  }

  // 配送员取件
  async pickUpOrder(deliveryPersonId: number, orderId: number) {
    const order = await this.orderRepository.findOne({ where: { id: orderId, deliveryPersonId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== OrderStatus.ASSIGNED) {
      throw new BadRequestException('订单状态不允许取件');
    }

    order.status = OrderStatus.PICKED_UP;
    await this.orderRepository.save(order);
    await this.addLog(orderId, deliveryPersonId, '已取件', '配送员已取件', OrderStatus.ASSIGNED, OrderStatus.PICKED_UP);
    return order;
  }

  // 配送员更新为配送中
  async startDelivery(deliveryPersonId: number, orderId: number) {
    const order = await this.orderRepository.findOne({ where: { id: orderId, deliveryPersonId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== OrderStatus.PICKED_UP) {
      throw new BadRequestException('订单状态不允许开始配送');
    }

    order.status = OrderStatus.IN_TRANSIT;
    await this.orderRepository.save(order);
    await this.addLog(orderId, deliveryPersonId, '配送中', '配送员开始配送', OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT);
    return order;
  }

  // 配送员确认送达
  async deliverOrder(deliveryPersonId: number, orderId: number) {
    const order = await this.orderRepository.findOne({ where: { id: orderId, deliveryPersonId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== OrderStatus.IN_TRANSIT) {
      throw new BadRequestException('订单状态不允许确认送达');
    }

    order.status = OrderStatus.DELIVERED;
    order.deliveredAt = new Date();
    await this.orderRepository.save(order);
    await this.addLog(orderId, deliveryPersonId, '已送达', '配送员确认送达', OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED);
    return order;
  }

  // 顾客签收
  async signOrder(customerId: number, orderId: number) {
    const order = await this.orderRepository.findOne({ where: { id: orderId, customerId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('订单状态不允许签收');
    }

    order.status = OrderStatus.SIGNED;
    order.signedAt = new Date();
    await this.orderRepository.save(order);

    // 释放配送员
    if (order.deliveryPersonId) {
      const deliveryPerson = await this.userRepository.findOne({ where: { id: order.deliveryPersonId } });
      if (deliveryPerson) {
        deliveryPerson.deliveryStatus = DeliveryStatus.AVAILABLE;
        await this.userRepository.save(deliveryPerson);
      }
    }

    await this.addLog(orderId, customerId, '已签收', '顾客确认签收', OrderStatus.DELIVERED, OrderStatus.SIGNED);
    return order;
  }

  // 标记异常
  async markAbnormal(operatorId: number, orderId: number, reason: string) {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');

    const fromStatus = order.status;
    order.status = OrderStatus.ABNORMAL;
    order.abnormalReason = reason;
    await this.orderRepository.save(order);

    await this.addLog(orderId, operatorId, '标记异常', reason, fromStatus, OrderStatus.ABNORMAL);
    return order;
  }

  // 取消订单
  async cancelOrder(userId: number, orderId: number, role: UserRole) {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');

    // 仅顾客本人或管理员可以取消
    if (role === UserRole.CUSTOMER && order.customerId !== userId) {
      throw new ForbiddenException('无权操作');
    }

    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new BadRequestException('当前状态不允许取消');
    }

    const fromStatus = order.status;
    order.status = OrderStatus.CANCELLED;
    await this.orderRepository.save(order);

    await this.addLog(orderId, userId, '取消订单', '订单已取消', fromStatus, OrderStatus.CANCELLED);
    return order;
  }

  // 获取订单列表（根据角色筛选）
  async getOrders(userId: number, role: UserRole, query: any) {
    const { page = 1, limit = 20, status } = query;
    const qb = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.merchant', 'merchant')
      .leftJoinAndSelect('order.deliveryPerson', 'deliveryPerson');

    switch (role) {
      case UserRole.CUSTOMER:
        qb.where('order.customerId = :userId', { userId });
        break;
      case UserRole.MERCHANT:
        qb.where('order.merchantId = :userId', { userId });
        break;
      case UserRole.DELIVERY:
        qb.where('order.deliveryPersonId = :userId', { userId });
        break;
      case UserRole.ADMIN:
        // 管理员可查看所有订单
        break;
    }

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    qb.orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [orders, total] = await qb.getManyAndCount();
    return { orders, total, page: +page, limit: +limit };
  }

  // 获取订单详情
  async getOrderDetail(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['customer', 'merchant', 'deliveryPerson', 'logs'],
    });
    if (!order) throw new NotFoundException('订单不存在');
    return order;
  }

  // 获取订单日志
  async getOrderLogs(orderId: number) {
    return this.orderLogRepository.find({
      where: { orderId },
      relations: ['operator'],
      order: { createdAt: 'ASC' },
    });
  }
}
