import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole, DeliveryStatus } from '../common/enums';
import { Order } from './order.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  realName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ type: 'enum', enum: DeliveryStatus, nullable: true })
  deliveryStatus: DeliveryStatus;

  @Column({ default: true })
  isActive: boolean;

  @Column({ length: 500, nullable: true })
  address: string;

  // 商家名称（仅商家角色）
  @Column({ length: 200, nullable: true })
  shopName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 作为顾客的订单
  @OneToMany(() => Order, (order) => order.customer)
  customerOrders: Order[];

  // 作为商家的订单
  @OneToMany(() => Order, (order) => order.merchant)
  merchantOrders: Order[];

  // 作为配送员的订单
  @OneToMany(() => Order, (order) => order.deliveryPerson)
  deliveryOrders: Order[];
}
