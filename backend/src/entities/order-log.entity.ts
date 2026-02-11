import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';

@Entity('order_logs')
export class OrderLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @ManyToOne(() => Order, (order) => order.logs)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ nullable: true })
  operatorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operatorId' })
  operator: User;

  @Column({ length: 50 })
  action: string;

  @Column({ length: 500, nullable: true })
  detail: string;

  @Column({ length: 50, nullable: true })
  fromStatus: string;

  @Column({ length: 50, nullable: true })
  toStatus: string;

  @CreateDateColumn()
  createdAt: Date;
}
