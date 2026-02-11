import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { OrderStatus } from '../common/enums';
import { User } from './user.entity';
import { OrderLog } from './order-log.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  orderNo: string;

  // 顾客信息
  @Column()
  customerId: number;

  @ManyToOne(() => User, (user) => user.customerOrders)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  // 商家信息
  @Column()
  merchantId: number;

  @ManyToOne(() => User, (user) => user.merchantOrders)
  @JoinColumn({ name: 'merchantId' })
  merchant: User;

  // 配送员信息
  @Column({ nullable: true })
  deliveryPersonId: number;

  @ManyToOne(() => User, (user) => user.deliveryOrders)
  @JoinColumn({ name: 'deliveryPersonId' })
  deliveryPerson: User;

  // 订单状态
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  // 商品信息
  @Column({ length: 500 })
  productName: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  // 收货信息
  @Column({ length: 500 })
  shippingAddress: string;

  @Column({ length: 100 })
  receiverName: string;

  @Column({ length: 20 })
  receiverPhone: string;

  // 发货信息
  @Column({ length: 500, nullable: true })
  senderAddress: string;

  // 备注
  @Column({ type: 'text', nullable: true })
  remark: string;

  // 异常原因
  @Column({ length: 500, nullable: true })
  abnormalReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'datetime', nullable: true })
  signedAt: Date;

  // 订单日志
  @OneToMany(() => OrderLog, (log) => log.order)
  logs: OrderLog[];
}
